import { pool } from "../../db";

export const updateDriverLiveLocation = async (
  tripId: any,
  payload: any
) => {
  try {
    const trip_id = Number(tripId);
    if (isNaN(trip_id)) {
      return { status: false, msg: "Invalid tripId" };
    }

    const driver_latitude = Number(payload?.driver_latitude);
    const driver_longitude = Number(payload?.driver_longitude);

    if (!Number.isFinite(driver_latitude) || !Number.isFinite(driver_longitude)) {
      return { status: false, msg: "Driver latitude & longitude required" };
    }

    const result = await pool.query(
      `
      UPDATE trip
      SET
        driver_latitude = $1,
        driver_longitude = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id
      `,
      [driver_latitude, driver_longitude, trip_id]
    );

    if (result.rowCount === 0) {
      return { status: false, msg: "Trip not found" };
    }

    return { status: true, msg: "Driver location updated" };
  } catch (err) {
    return { status: false, msg: "Internal Server Error", error: err };
  }
};