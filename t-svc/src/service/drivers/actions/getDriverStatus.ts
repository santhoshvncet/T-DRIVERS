import { pool } from "../../db";

export const getDriverStatus = async (driverIdParam: any) => {
  try {
    const driverId = Number(driverIdParam);

    // keep same behavior intention: missing param => "driver not found"
    if (!driverIdParam || !driverId || isNaN(driverId)) {
      return { status: false, msg: "driver not found", notFound: true };
    }

    const query = `SELECT status_id FROM driver WHERE id = $1`;

    const result = await pool.query(query, [driverId]);

    if (result.rowCount === 0) {
      // your old code returned 401 with only {success:false}
      return { status: false, unauthorized: true };
    }

    return { status: true, data: result.rows[0] };
  } catch (error) {
    console.log(error);
    return { status: false, msg: "internal server error", error };
  }
};