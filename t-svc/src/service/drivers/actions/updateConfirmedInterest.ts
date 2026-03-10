import { pool, withTransaction } from "../../db";

export const markConfirmed = async (payload: any) => {
  try {
    const { trip_id, driver_id } = payload;

    if (!trip_id || !driver_id) {
      return { status: false, msg: "trip_id and driver_id are required", badRequest: true };
    }

    const updateResult = await pool.query(
      `
      UPDATE driver_interest
      SET driver_interest_type = 'ACCEPTED',
          updated_at = NOW(),
          deleted_at = NULL
      WHERE trip_id = $1 AND driver_id = $2
      RETURNING *;
      `,
      [trip_id, driver_id]
    );

    let resultRow;

    if (updateResult.rowCount && updateResult.rowCount > 0) {
      resultRow = updateResult.rows[0];
    } else {
    const insertResult = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `
        INSERT INTO driver_interest (
          trip_id,
          driver_id,
          driver_interest_type,
          created_at,
          updated_at
        )
        VALUES ($1, $2, 'ACCEPTED', NOW(), NOW())
        RETURNING *;
        `,
        [trip_id, driver_id]
      );
      return insertResult
    });

    
      resultRow = insertResult.rows[0];
    }

    // fetch owner user id for notification (service returns it, router sends notification)
    const ownerRes = await pool.query(
      `
      SELECT u.id AS owner_user_id
      FROM trip t
      JOIN owner o ON o.id = t.owner_id
      JOIN users u ON u.id = o.users_id
      WHERE t.id = $1
        AND u.external_id IS NOT NULL
      `,
      [trip_id]
    );

    const ownerUserId = ownerRes.rowCount ? ownerRes.rows[0].owner_user_id : null;

    return {
      status: true,
      msg: "Driver accepted successfully",
      data: resultRow,
      ownerUserId,
      trip_id,
    };
  } catch (error) {
    console.error("Error updating driver interest:", error);
    return { status: false, msg: "Internal server error", error };
  }
};