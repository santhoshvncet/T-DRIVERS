// actions/getDriverTransactions.service.ts
import { pool } from "../../db";

const driverTransactionDetail = async (driverId: number) => {
  const query = `
    SELECT
      t.id AS trip_id,
      c1.area AS origin_area,
      c2.area AS destination_area,
      MAX(w.amount) AS amount,
      MAX(w.direction) AS direction,
      JSON_AGG(w.meta) AS meta,
      t.completed_at
    FROM trip t
    JOIN wallet_ledger w ON w.trip_id = t.id
    LEFT JOIN city c1 ON t.origin_id = c1.id
    LEFT JOIN city c2 ON t.dest_id = c2.id
    WHERE t.driver_id = $1
      AND t.status = 'COMPLETED'
      AND w.wallet_owner = 'DRIVER'
    GROUP BY t.id, c1.area, c2.area, t.completed_at
    ORDER BY t.completed_at DESC;
  `;
  const result = await pool.query(query, [driverId]);
  return result.rows;
};

const getDriverTransactions = async (userIdParam: any) => {
  try {
    const userId = Number(userIdParam);
    if (isNaN(userId)) {
      return { status: false, msg: "Invalid user_id" };
    }

    const driverResult = await pool.query(
      `SELECT id FROM driver WHERE user_id = $1`,
      [userId],
    );

    if (driverResult.rows.length === 0) {
      return {
        status: false,
        msg: "Driver not found for this user_id",
        notFound: true,
      };
    }

    const driverId = driverResult.rows[0].id;
    const trips = await driverTransactionDetail(driverId);

    return { status: true, data: trips };
  } catch (error) {
    console.error("Error fetching trips:", error);
    return { status: false, msg: "Internal server error", error };
  }
};

export default getDriverTransactions;