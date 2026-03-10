import { pool } from "../../db";

export const updateTripComplete = async (tripId: any) => {
  try {
    const trip_id = Number(tripId);

    if (!trip_id || isNaN(trip_id)) {
      return { status: false, msg: "trip_id is required" };
    }

    const query = `
      UPDATE trip
      SET completed_at = NOW()
      WHERE id = $1
        AND status = 'PAYMENT_PENDING'
      RETURNING id, completed_at, status;
    `;

    const result = await pool.query(query, [trip_id]);

    if (result.rowCount === 0) {
      return {
        status: false,
        msg: "Trip not found or not in PAYMENT_PENDING status",
      };
    }

    return {
      status: true,
      msg: "Trip marked as completed",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error updating trip status:", error);
    return { status: false, msg: "Server Error", error };
  }
};