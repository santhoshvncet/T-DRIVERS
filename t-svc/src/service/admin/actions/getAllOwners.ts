import { pool } from "../../db";

export async function getAllOwners() {
  try {
    const result = await pool.query(`
      SELECT owner.*, 
      users.phone AS phone_number,
      users.name AS full_name
      FROM owner 
      LEFT JOIN users ON owner.users_id = users.id
      ORDER BY created_at DESC
    `);

    const ownerRows = result.rows;
    return ownerRows;

  } catch (error) {
    console.error("Error fetching owners:", error);
    throw error;
  }
}
