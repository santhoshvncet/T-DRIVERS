import { pool } from "../../db";

export async function getDriverConfig() {
  try {
    const result = await pool.query(`
      SELECT * 
      FROM config_pricing
      WHERE deleted_at IS NULL
      ORDER BY id
    `);

    return result.rows;
  } catch (error) {
    console.error("Error fetching config data:", error);
    throw error;
  }
}
