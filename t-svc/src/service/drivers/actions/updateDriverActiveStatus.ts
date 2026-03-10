import { pool } from "../../db";

export const driverStatus = async (payload: any) => {
  try {
    const { driverId, status, driver_latitude, driver_longitude } = payload;

    if (!driverId || !status) {
      return { status: false, msg: "driverId and status are required", badRequest: true };
    }

    // GPS required only when ACTIVE
    if (
      status === "active" &&
      (typeof driver_latitude !== "number" || typeof driver_longitude !== "number")
    ) {
      return { status: false, msg: "Driver latitude & longitude required", badRequest: true };
    }

    const query = `
      UPDATE driver d
      SET
        status_id = ds.id,
        driver_latitude = CASE WHEN $2 = 'active' THEN $3 ELSE d.driver_latitude END,
        driver_longitude = CASE WHEN $2 = 'active' THEN $4 ELSE d.driver_longitude END,
        updated_at = NOW()
      FROM driver_status ds
      WHERE d.id = $1
        AND ds.name = $2
      RETURNING
        d.id AS driver_id,
        ds.name AS status,
        d.driver_latitude,
        d.driver_longitude;
    `;

    const result = await pool.query(query, [
      driverId,
      status,
      driver_latitude ?? null,
      driver_longitude ?? null,
    ]);

    return {
      status: true,
      msg: "Driver status updated successfully",
      data: result.rows[0],
    };
  } catch (err) {
    console.error("driverStatusService error:", err);
    return { status: false, msg: "Internal server error", error: err };
  }
};