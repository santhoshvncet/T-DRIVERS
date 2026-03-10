import { pool, withTransaction } from "../../db";

export const markNotInterested = async (payload: any) => {
  try {
    const { trip_id, driver_id } = payload;

    if (!trip_id || !driver_id) {
      return {
        status: false,
        msg: "trip_id and driver_id are required",
        missing: true,
      };
    }

    const updateQuery = `
      UPDATE driver_interest
      SET driver_interest_type = 'NOT_INTERESTED',
          updated_at = NOW(),
          deleted_at = NULL
      WHERE trip_id = $1 AND driver_id = $2
      RETURNING *;
    `;

    const updateResult = await pool.query(updateQuery, [trip_id, driver_id]);

    if (updateResult.rowCount && updateResult.rowCount > 0) {
      return {
        status: true,
        msg: "Updated to NOT_INTERESTED",
        data: updateResult.rows[0],
        updated: true,
      };
    }

    const insertQuery = `
      INSERT INTO driver_interest (trip_id, driver_id, driver_interest_type, created_at, updated_at)
      VALUES ($1, $2, 'NOT_INTERESTED', NOW(), NOW())
      RETURNING *;
    `;

    const insertResult = await withTransaction(async (client) => {
    const insertResult = await client.query(insertQuery, [trip_id, driver_id]);
    return insertResult
    });

    return {
      status: true,
      msg: "Marked as NOT_INTERESTED",
      data: insertResult.rows[0],
      updated: false,
    };
  } catch (error) {
    console.error("Error updating driver interest:", error);
    return { status: false, msg: "Internal server error", error };
  }
};