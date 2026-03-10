import { pool } from "../../db";

export async function getAllAdmin() {
  try {
    const result = await pool.query(`
      SELECT * 
      FROM admin
      WHERE NOT 'Super Admin' = ANY(role)
    `);

    return result.rows;
  } catch (error) {
    console.error("Error fetching admin data:", error);
    throw error;
  }
}