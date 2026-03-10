import { pool } from "../../db";

export const getOwnerActiveTripId = async (ownerId: any) => {
  try {
    const owner_id = Number(ownerId);

    if (!owner_id || isNaN(owner_id)) {
      return { status: false, msg: "Owner Id required!" };
    }

    const query = `
      SELECT id
      FROM trip
      WHERE owner_id = $1
        AND status IN (
          'CONFIRMED',
          'ONGOING',
          'TRIP_STARTED',
          'OTP_VERIFIED',
          'START_TRIP_CAR_PHOTOS',
          'TRIP_ENDED',
          'END_TRIP_CAR_PHOTOS',
          'PAYMENT_PENDING'
        )
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [owner_id]);

    // keep same old behavior: if not found -> trip_id null (and it's still a success)
    if (!rows.length) {
      return { status: false, data: { trip_id: null }, message: "No active trip" };
    }

    return { status: true, data: { trip_id: rows[0].id }, message: "Active trip fetched" };
  } catch (error) {
    console.error("Error fetching active trip ID:", error);
    return { status: false, message: "Server error", error };
  }
};

export default getOwnerActiveTripId;