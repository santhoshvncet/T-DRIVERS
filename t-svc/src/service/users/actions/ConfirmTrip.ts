import { pool } from "../../db";

export const confirmTrip= async (tripId: any) => {
  try {
    const trip_id = Number(tripId);

    if (!trip_id || isNaN(trip_id)) {
      return { status: false, msg: "trip_id is required" };
    }

    const result = await pool.query(
      `
      UPDATE trip
      SET status = 'CONFIRMED',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
      `,
      [trip_id]
    );

    if (result.rowCount === 0) {
      return { status: false, msg: "Trip not found" };
    }

    return { status: true, msg: "Trip confirmed successfully" };
  } catch (error) {
    console.error("Confirm Trip Error:", error);
    return { status: false, msg: "DB error", error };
  }
};