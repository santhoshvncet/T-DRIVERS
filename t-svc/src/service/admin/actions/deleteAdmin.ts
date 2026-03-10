import { pool } from "../../db";

export async function deleteAdminById(id: number) {
  const query = `
    DELETE FROM admin
    WHERE id = $1
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [id]);
    return result.rows[0]; 
  } catch (error) {
    console.error("Error deleting admin:", error);
    throw error;
  }
}