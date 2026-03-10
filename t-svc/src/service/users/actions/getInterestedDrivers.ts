import { pool } from "../../db";

export const getInterestedDrivers = async (tripId: number) => {
  try {
    const query = `
      SELECT 
        di.id AS interest_id,
        d.id AS driver_id,
        u.name,
        d.profile_photo_url,
        d.age,
        u.phone,
        di.created_at
      FROM driver_interest di
      JOIN driver d ON d.id = di.driver_id
      JOIN users u ON d.user_id = u.id
      WHERE di.trip_id = $1
        AND di.driver_interest_type = 'ACCEPTED'
      ORDER BY di.created_at DESC
    `;

    const result = await pool.query(query, [tripId]);
    return result;

  } catch (error) {
    console.error("DB error in getInterestedDrivers:", error);
    throw error; // 👈 IMPORTANT
  }
};