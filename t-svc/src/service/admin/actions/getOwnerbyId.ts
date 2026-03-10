// src/modules/owner/getOwnerById.ts
import { pool } from "../../db";

export async function getOwnerById(userId: any) {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        -- owner
        o.id AS owner_id,
        o.is_active,

        -- user
        u.id AS user_id,
        u.name,
        u.phone,
        u.email,
        u.address,
        u.profile_url,

        -- city (from users.city_id)
        c.city_name AS "cityName",
        c.state     AS "stateName",
        c.area,
        c.latitude,
        c.longitude

      FROM owner o
      LEFT JOIN users u
        ON o.users_id = u.id

      LEFT JOIN city c
        ON u.city_id = c.id

      WHERE u.id = $1
      `,
      [userId]
    );

    return rows[0] ?? null;
  } catch (error) {
    console.error("Error fetching owner:", error);
    throw error;
  }
}
