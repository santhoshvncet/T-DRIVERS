// actions/getDriverBookingHistory.service.ts
import { pool } from "../../db";
import { commissionAmount } from "./getDriverBookingdata";

export const getDriverBookingHistory = async (driverId: any) => {
  try {
    const driver_id = Number(driverId);
    if (!driver_id || isNaN(driver_id)) {
      return { status: false, msg: "Invalid driverId" };
    }

    const query = `
      SELECT
        t.id AS trip_id,
        t.origin_id,
        origin.area      AS origin_area,
        origin.city_name AS origin_city,
        origin.state     AS origin_state,
        t.dest_id,
        dest.area        AS dest_area,
        dest.city_name   AS dest_city,
        dest.state       AS dest_state,
        t.start_date,
        t.end_date,
        t.pickup_time,
        t.drop_time,
        t.fare_amount,
        t.estimated_hours 
      FROM trip t
      LEFT JOIN city origin ON origin.id = t.origin_id
      LEFT JOIN city dest   ON dest.id   = t.dest_id
      WHERE 
        t.driver_id = $1
        AND t.status = 'COMPLETED'
        AND t.deleted_at IS NULL
      ORDER BY t.end_date DESC;
    `;

    const result = await pool.query(query, [driver_id]);

  const payments = await Promise.all(
  result.rows.map(async (r: any) => ({
    ...r,
    fare_amount: await commissionAmount(
      r.fare_amount,
      r.estimated_hours,
      r.origin_id,
      r.dest_id
    ),
    origin_city: `${r.origin_area}, ${r.origin_city}, ${r.origin_state}`,
    dest_city: `${r.dest_area}, ${r.dest_city}, ${r.dest_state}`,
  }))
);

return { status: true, data: payments };

  } catch (err) {
    console.error("ERROR in getDriverBookingHistoryService:", err);
    return { status: false, msg: "Server error", error: err };
  }
};