// services/adminService.ts (example path)
import { pool, withTransaction } from "../../db";

interface UpdateAdminProps {
  id: number;
  role: string[];
}

export async function updateAdmin(input: UpdateAdminProps) {
  const { id, role } = input;

  const query = await withTransaction(async (client) => {
    const updateAdminQuery = await client.query(`
      UPDATE admin
      SET role = $1
      WHERE id = $2
      RETURNING *;
    `);
    return updateAdminQuery;
    });
  const values = [role, id];

  const result = await pool.query(query, values);
  return result.rows[0];
}