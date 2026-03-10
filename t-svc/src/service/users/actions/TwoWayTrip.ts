import axios from "axios";
import { pool, withTransaction } from "../../db";
import { calculateFareAmount } from "./Calculatefareamount";
import { createAndSendNotification } from "./notification";

const isYYYYMMDD = (s: any) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isHHMM = (s: any) => typeof s === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(s);

const safeNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const createTwoWayTrip = async (payload: any) => {
  try {
    const {
      owner_id, origin_id, dest_id,
      start_date, end_date,
      pickup_time, drop_time,
      scheduled_at, car_id,
    } = payload;

    const ownerId = safeNumber(owner_id);
    const originId = safeNumber(origin_id);
    const destId = safeNumber(dest_id);
    const carId = safeNumber(car_id);

    if (!ownerId || !originId || !destId || !carId || !start_date || !end_date || !pickup_time || !drop_time || !scheduled_at)
      return { status: false, msg: "Missing required fields" };

    if (!isYYYYMMDD(start_date) || !isYYYYMMDD(end_date))
      return { status: false, msg: "Invalid date format" };

    if (!isHHMM(pickup_time) || !isHHMM(drop_time))
      return { status: false, msg: "Invalid time format" };

    const scheduledAtUtc = new Date(scheduled_at).toISOString();

    /* ---------- Pre-checks outside TX ---------- */
    const [owner, car, origin, dest] = await Promise.all([
      pool.query("SELECT id FROM owner WHERE id = $1", [ownerId]),
      pool.query("SELECT id FROM car WHERE id = $1 AND owner_id = $2", [carId, ownerId]),
      pool.query("SELECT latitude, longitude FROM city WHERE id = $1", [originId]),
      pool.query("SELECT latitude, longitude FROM city WHERE id = $1", [destId]),
    ]);

    if (!owner.rowCount) return { status: false, msg: "Owner not found" };
    if (!car.rowCount) return { status: false, msg: "Invalid car" };
    if (!origin.rowCount || !dest.rowCount) return { status: false, msg: "Invalid city" };

    const { latitude: lat1, longitude: lon1 } = origin.rows[0];
    const { latitude: lat2, longitude: lon2 } = dest.rows[0];

    /* ---------- Distance API ---------- */
    const distRes = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
      params: { origins: `${lat1},${lon1}`, destinations: `${lat2},${lon2}`, key: process.env.GOOGLE_MAPS_KEY },
      timeout: 10000,
    });

    const element = distRes.data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK")
      return { status: false, msg: "Distance calculation failed" };

    const distance_km = element.distance.value / 1000;

    const { fare_amount, estimated_hours, duration_type } =
      calculateFareAmount(start_date, end_date, pickup_time, drop_time, distance_km);

    const newStart = new Date(`${start_date}T${pickup_time}:00`);
    const newEnd = new Date(`${end_date}T${drop_time}:00`);

    /* ================= TRANSACTION ================= */
    const trip = await withTransaction(async (client) => {

      const overlap = await client.query(
        `SELECT id FROM trip
         WHERE owner_id = $1
           AND deleted_at IS NULL
           AND trip_type = 'twoway'
           AND ((start_date + pickup_time)::timestamp < $3
           AND (end_date + drop_time)::timestamp > $2)`,
        [ownerId, newStart, newEnd]
      );

      if (overlap.rowCount > 0) throw new Error("TRIP_CONFLICT");

      const insert = await client.query(
        `INSERT INTO trip (
          owner_id, origin_id, dest_id,
          start_date, end_date,
          duration_type,
          pickup_time, drop_time,
          scheduled_at, car_id,
          fare_amount, estimated_hours,
          trip_type, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'twoway',NOW())
        RETURNING *`,
        [
          ownerId, originId, destId,
          start_date, end_date,
          duration_type,
          `${pickup_time}:00`, `${drop_time}:00`,
          scheduledAtUtc, carId,
          fare_amount, estimated_hours
        ]
      );

      return insert.rows[0];
    });

    /* ================= POST-COMMIT NOTIFICATIONS ================= */
    setImmediate(async () => {
      try {
        const driverRes = await pool.query(
          `SELECT u.id AS user_id
           FROM driver d
           JOIN users u ON u.id = d.user_id
           JOIN city c ON c.id = $1
           WHERE LOWER(u.role) = 'driver'
             AND d.driver_latitude IS NOT NULL
             AND d.driver_longitude IS NOT NULL
             AND u.external_id IS NOT NULL`,
          [originId]
        );

        const driverIds = driverRes.rows.map(r => r.user_id).filter(Boolean);
        if (!driverIds.length) return;

        await createAndSendNotification({
          title: "🚕 New Two-Way Trip Available",
          message: `A two-way trip is scheduled at ${pickup_time}. Tap to accept!`,
          userIds: driverIds,
        });
      } catch (e: any) {
        console.error("TwoWayTrip notification error:", e.message);
      }
    });

    return {
      status: true,
      msg: "Two-way trip created successfully",
      data: trip,
    };

  } catch (err: any) {
    if (err.message === "TRIP_CONFLICT")
      return { status: false, msg: "You already have a two-way trip during this time." };

    console.error("createTwoWayTrip error:", err);
    return { status: false, msg: "Internal Server Error" };
  }
};
