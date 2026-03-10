import { pool } from "../../db";

export const getDriverTripStatus = async (tripIdParam: any) => {
  try {
    // validate presence
    if (!tripIdParam) {
      return { status: false, msg: "tripId is required", badRequest: true };
    }

    const tripIdNum = Number(tripIdParam);

    // validate number
    if (Number.isNaN(tripIdNum) || tripIdNum <= 0) {
      return { status: false, msg: "Invalid tripId", badRequest: true };
    }

    const query = `SELECT status FROM trip WHERE id = $1 `;

    const result = await pool.query(query, [tripIdNum]);

    if (result.rowCount === 0) {
      return { status: false, msg: "Trip not found", notFound: true };
    }

    return { status: true, data: result.rows[0], msg: "Status found" };
  } catch (error) {
    console.error("getDriverTripStatusService error:", error);
    return { status: false, msg: "Internal Server Error", error };
  }
};