import axios from "axios";
import os from "os";
import crypto from "crypto";
import { pool, withTransaction } from "../../db";
import { calculateFareAmount } from "./Calculatefareamount";
import { notifyAdmins } from "./notifyAdmins";
import { notifyDrivers } from "./notifyDrivers";

type CreateTripResponse = {
  status: boolean;
  msg: string;
  errorKey?: string;

  data?: any;
  scheduled_at_ist?: string | null;
  created_at_ist?: string | null;
  start_date?: string;
  end_date?: string;
  debug?: any;
};

/* ------------------------- Utils ------------------------- */
const isYYYYMMDD = (s: any) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isHHMM = (s: any) => typeof s === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(s);

const safeNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const makeRequestId = () => crypto.randomBytes(8).toString("hex");

const logError = (requestId: string, ...args: any[]) =>
  console.error(`[createTrip][${requestId}]`, ...args);

const logInfo = (requestId: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[createTrip][${requestId}]`, ...args);
  }
};

const formatToIST = (date: string | Date | null) => {
  if (!date) return null;
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const createTrip = async (payload: any): Promise<CreateTripResponse> => {
  const requestId = makeRequestId();
  const serverId = `${os.hostname()}-${process.pid}`;

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

    if (!ownerId || !originId || !destId || !carId || !start_date || !end_date || !pickup_time || !drop_time || !scheduled_at) {
      return { status: false, msg: "Missing required fields", errorKey: "BAD_REQUEST" };
    }

    if (!isYYYYMMDD(start_date) || !isYYYYMMDD(end_date))
      return { status: false, msg: "Invalid date format", errorKey: "BAD_REQUEST" };

    if (!isHHMM(pickup_time) || !isHHMM(drop_time))
      return { status: false, msg: "Invalid time format", errorKey: "BAD_REQUEST" };

    const scheduledAtUtc = new Date(scheduled_at).toISOString();

    /* ---------- Pre-checks outside TX ---------- */
    const [owner, car, origin, dest] = await Promise.all([
      pool.query("SELECT id FROM owner WHERE id = $1", [ownerId]),
      pool.query("SELECT id FROM car WHERE id = $1 AND owner_id = $2", [carId, ownerId]),
      pool.query("SELECT latitude, longitude FROM city WHERE id = $1", [originId]),
      pool.query("SELECT latitude, longitude FROM city WHERE id = $1", [destId]),
    ]);

    if (!owner.rowCount) return { status: false, msg: "Owner not found", errorKey: "BAD_REQUEST" };
    if (!car.rowCount) return { status: false, msg: "Invalid car", errorKey: "BAD_REQUEST" };
    if (!origin.rowCount || !dest.rowCount) return { status: false, msg: "Invalid city", errorKey: "BAD_REQUEST" };

    const { latitude: lat1, longitude: lon1 } = origin.rows[0];
    const { latitude: lat2, longitude: lon2 } = dest.rows[0];

    /* ---------- Distance API (outside TX) ---------- */
    const distRes = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
      params: { origins: `${lat1},${lon1}`, destinations: `${lat2},${lon2}`, key: process.env.GOOGLE_MAPS_KEY },
      timeout: 10000,
    });

    const element = distRes.data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK")
      return { status: false, msg: "Distance calculation failed", errorKey: "BAD_REQUEST" };

    const distance_km = element.distance.value / 1000;

    const { fare_amount, estimated_hours, duration_type } =
      calculateFareAmount(start_date, end_date, pickup_time, drop_time, distance_km);

    const newStart = new Date(`${start_date}T${pickup_time}:00`);
    const newEnd = new Date(`${end_date}T${drop_time}:00`);

    /* ================= TRANSACTION ================= */
    const trip = await withTransaction(async (client) => {
      const overlap = await client.query(
        `SELECT id FROM trip
         WHERE owner_id=$1 AND deleted_at IS NULL
         AND status IN ('ONGOING','CONFIRMED','PAYMENT_PENDING','TRIP_STARTED',
                        'OTP_VERIFIED','START_TRIP_CAR_PHOTOS','TRIP_ENDED','END_TRIP_CAR_PHOTOS')
         AND ((start_date + pickup_time)::timestamp < $3
         AND (end_date + drop_time)::timestamp > $2)`,
        [ownerId, newStart, newEnd]
      );

      if (overlap.rowCount > 0) throw new Error("TRIP_CONFLICT");

      const insert = await client.query(
        `INSERT INTO trip (
          owner_id, origin_id, dest_id,
          start_date, end_date, duration_type,
          pickup_time, drop_time, scheduled_at,
          car_id, fare_amount, estimated_hours, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
        RETURNING *`,
        [
          ownerId, originId, destId,
          start_date, end_date, duration_type,
          `${pickup_time}:00`, `${drop_time}:00`,
          scheduledAtUtc, carId, fare_amount, estimated_hours
        ]
      );

      return insert.rows[0];
    });

    /* ================= POST-COMMIT TASKS ================= */
    setImmediate(async () => {
      try {
        await notifyAdmins(trip);
        await notifyDrivers(trip, originId, duration_type, pickup_time);
      } catch (e) {
        logInfo(requestId, "Notification error:", e);
      }
    });

    return {
      status: true,
      msg: "Trip created successfully",
      data: trip,
      start_date: trip.start_date,
      end_date: trip.end_date,
      scheduled_at_ist: formatToIST(trip.scheduled_at),
      created_at_ist: formatToIST(trip.created_at),
      debug: process.env.NODE_ENV !== "production" ? { requestId, serverId } : undefined,
    };

  } catch (err: any) {
    if (err.message === "TRIP_CONFLICT")
      return { status: false, msg: "You already have a trip during this time.", errorKey: "CONFLICT" };

    logError(makeRequestId(), "Unhandled error:", err);
    return { status: false, msg: "Internal Server Error", errorKey: "INTERNAL_SERVER_ERROR" };
  }
};
