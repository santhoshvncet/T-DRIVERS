import { pool } from "../../db";
import { createAndSendNotification } from "./notification";

export async function notifyDrivers(
  trip: any,
  originId: number,
  durationType: string,
  pickupTime: string
) {
  try {
    const driverQuery = `
      SELECT *
      FROM (
        SELECT
          d.id AS driver_id,
          u.id AS user_id,
          u.external_id,
          (
            6371 * acos(
              LEAST(
                1,
                GREATEST(
                  -1,
                  cos(radians(c.latitude)) * cos(radians(d.driver_latitude)) *
                  cos(radians(d.driver_longitude) - radians(c.longitude)) +
                  sin(radians(c.latitude)) * sin(radians(d.driver_latitude))
                )
              )
            )
          ) AS distance_km
        FROM driver d
        JOIN users u ON u.id = d.user_id
        JOIN city c ON c.id = $1
        WHERE u.role = 'Driver'
          AND d.driver_latitude IS NOT NULL
          AND d.driver_longitude IS NOT NULL
      ) t
      WHERE t.distance_km <= $2
        AND t.external_id IS NOT NULL
      ORDER BY t.distance_km ASC;
    `;

    const driverRes = await pool.query(driverQuery, [originId, 15]);
    const driverIds: number[] = driverRes.rows.map(r => r.user_id).filter(Boolean);

    if (!driverIds.length) return;

    await createAndSendNotification({
      title: `New ${durationType} Trip Available`,
      message: `A ${durationType} trip is scheduled at ${pickupTime}. Tap to accept.`,
      userIds: driverIds,
    });

  } catch (err) {
    console.error("[notifyDrivers] Failed:", err);
  }
}
