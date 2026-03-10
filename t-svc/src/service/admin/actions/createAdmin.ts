import { withTransaction } from "../../db";

interface CreateAdmin {
  name: string;
  phone: string;
  role: string | string[];
}

export async function createAdmin({ name, phone, role }: CreateAdmin) {
  try {
    // 1) Insert into users table
    const userResult = await withTransaction(async (client) => {
      const userResultQuery = await client.query(
        `
      INSERT INTO users (
        name,
        phone,
        role,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, name, phone, role, created_at, updated_at
      `,
        [name, phone, role],
      );
      return userResultQuery;
    });

    const user = userResult.rows[0];

    // 2) Insert into admin table, using user.id as user_id
    // admin.role is an ARRAY column, so we store it as ARRAY[role]
    const adminResult = await withTransaction(async (client) => {
      const adminResultQuery = await client.query(
        `
      INSERT INTO admin (
        name,
        user_id,
        phone,
        role
      )
      VALUES ($1, $2, $3, ARRAY[$4])
      RETURNING id, name, user_id, phone, role
      `,
        [user.name, user.id, user.phone, role],
      );
      return adminResultQuery;
    });

    const admin = adminResult.rows[0];

    return admin;
  } catch (error) {
    console.error("Error creating admin (users + admin):", error);
    throw error;
  }
}