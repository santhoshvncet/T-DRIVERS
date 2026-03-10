import { pool } from "../../db";

export async function getAllDrivers() {
  try {
    const result = await pool.query(`
      SELECT 
        d.*, 
        u.phone AS phone_number,
        u.name AS full_name,
        ds.name AS status  -- fetch status name
      FROM driver d
      LEFT JOIN users u
        ON d.user_id = u.id
      LEFT JOIN driver_status ds
        ON d.status_id = ds.id  -- join with driver_status table
      ORDER BY d.created_at DESC
    `);

    return result.rows;
  } catch (error) {
    console.error("Error fetching drivers:", error);
    throw error;
  }
}