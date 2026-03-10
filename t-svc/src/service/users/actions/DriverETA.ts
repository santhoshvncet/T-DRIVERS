// actions/DriverETA/getDriverArrivalInfo.ts (service)
import { pool } from "../../db";
import { getDistanceInKm } from "../../../utils/haversine";
import { createAndSendNotification } from "./notification";

const lastNotifiedMap = new Map<number, number>();
const ARRIVAL_THRESHOLD_MINUTES = 10;
const NOTIFY_COOLDOWN_MS = 5 * 60 * 1000;
const THRESHOLD_KM = 0.1;
const driversArrivedMap = new Map<number, boolean>();

export const getDriverArrivalInfo = async (tripId: any) => {
  try {
    const trip_id = Number(tripId);

    if (isNaN(trip_id)) {
      return { status: false, msg: "Invalid tripId", data: null };
    }

    const query = `
      SELECT
        t.id AS trip_id,
        t.owner_id,
        t.driver_latitude,
        t.driver_longitude,
        oc.latitude  AS origin_latitude,
        oc.longitude AS origin_longitude
      FROM trip t
      LEFT JOIN city oc ON oc.id = t.origin_id
      WHERE t.id = $1
        AND t.deleted_at IS NULL
      LIMIT 1;
    `;

    const { rows, rowCount } = await pool.query(query, [trip_id]);

    if (rowCount === 0) {
      return { status: false, msg: "Trip not found", data: null };
    }

    const r = rows[0];

    // already arrived
    if (driversArrivedMap.get(r.trip_id)) {
      return {
        status: true,
        msg: "Driver already arrived",
        data: {
          status: true,
          distanceKm: 0,
          etaMinutes: 0,
          freezeLocation: true,
          message: "✅ Driver has already arrived at pickup",
        },
      };
    }

    // live location missing
    if (
      r.driver_latitude == null ||
      r.driver_longitude == null ||
      r.origin_latitude == null ||
      r.origin_longitude == null
    ) {
      return { status: false, msg: "Live location not available yet", data: null };
    }

    const distanceKm = getDistanceInKm(
      r.driver_latitude,
      r.driver_longitude,
      r.origin_latitude,
      r.origin_longitude
    );

    // reached pickup
    if (distanceKm <= THRESHOLD_KM) {
      driversArrivedMap.set(r.trip_id, true);

      try {
        const ownerRes = await pool.query(
          `
            SELECT owner.users_id
            FROM owner
            JOIN users u ON u.id = owner.users_id
            WHERE owner.id = $1 AND u.external_id IS NOT NULL
          `,
          [r.owner_id]
        );

        const ownerUserId = ownerRes.rows[0]?.users_id;
        if (ownerUserId) {
          await createAndSendNotification({
            title: "👨‍✈️ Driver has arrived",
            message: "Your driver has reached the pickup location.",
            userIds: [ownerUserId],
          });
        }
      } catch (notifyErr) {
        console.error("Arrival notification failed:", notifyErr);
      }

      return {
        status: true,
        msg: "Driver reached pickup",
        data: {
          status: true,
          distanceKm: Number(distanceKm.toFixed(2)),
          etaMinutes: 0,
          freezeLocation: true,
          message: "✅ Driver has reached pickup",
        },
      };
    }

    // compute ETA
    const AVERAGE_SPEED_KMPH = 30;
    const etaMinutes = Math.ceil((distanceKm / AVERAGE_SPEED_KMPH) * 60);

    // notify if within threshold + cooldown
    const now = Date.now();
    const lastNotified = lastNotifiedMap.get(r.trip_id) || 0;

    if (etaMinutes <= ARRIVAL_THRESHOLD_MINUTES && now - lastNotified > NOTIFY_COOLDOWN_MS) {
      try {
        const ownerRes = await pool.query(
          `
            SELECT owner.users_id
            FROM owner
            JOIN users u ON u.id = owner.users_id
            WHERE owner.id = $1 AND u.external_id IS NOT NULL
          `,
          [r.owner_id]
        );

        const ownerUserId = ownerRes.rows[0]?.users_id;

        if (ownerUserId) {
          await createAndSendNotification({
            title: "👨‍✈️ Driver is arriving",
            message: "Your driver is on the way and will arrive soon.",
            userIds: [ownerUserId],
          });

          lastNotifiedMap.set(r.trip_id, now);
        }
      } catch (notifyErr) {
        console.error("Arrival notification failed:", notifyErr);
      }
    }

    return {
      status: true,
      msg: "ETA fetched",
      data: {
        status: true,
        distanceKm: Number(distanceKm.toFixed(2)),
        etaMinutes,
        freezeLocation: false,
        driver_latitude: r.driver_latitude,
        driver_longitude: r.driver_longitude,
      },
    };
  } catch (err) {
    console.error("ERROR in getDriverArrivalInfo:", err);
    return { status: false, msg: "Server error", error: err, data: null };
  }
};