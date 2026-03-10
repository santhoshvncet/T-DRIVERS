import { pool } from "../../db";

export const verifyTripOTP = async (payload: any) => {
  try {
    const { trip_id, owner_id, entered_otp } = payload;

    if (!trip_id || !owner_id || !entered_otp) {
      return {
        status: false,
        msg: "trip_id, owner_id, and entered_otp are required",
        badRequest: true,
      };
    }

    const query = `
      SELECT id, owner_id, otp 
      FROM trip
      WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [trip_id, owner_id]);

    if (result.rows.length === 0) {
      return {
        status: false,
        msg: "Trip not found or owner not matched",
        notFound: true,
      };
    }

    const trip = result.rows[0];

    if (String(trip.otp) !== String(entered_otp)) {
      return { status: false, msg: "Invalid OTP", unauthorized: true };
    }

    return {
      status: true,
      msg: "OTP verified successfully",
      data: { trip_id: trip.id, owner_id: trip.owner_id },
    };
  } catch (err: any) {
    console.error("OTP verification error:", err);
    return { status: false, msg: "Internal server error", error: err };
  }
};