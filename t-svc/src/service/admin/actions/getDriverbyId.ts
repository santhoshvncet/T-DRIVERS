// src/modules/driver/getDriverById.ts
import { pool } from "../../db";

export async function getDriverById(userId: any) {
  try {
    const { rows } = await pool.query(
      `
      SELECT 
        -- driver
        d.id AS driver_id,
        d.user_id,
        d.age,
        d.status_id,
        ds.name AS driver_status,

        d.driving_license_url,
        d.aadhar_card_url,
        d.profile_photo_url,
        d.transmission,
        d.board_type,
        d.driver_latitude,
        d.driver_longitude,
        d.languages,

        -- user
        u.name AS full_name,
        u.email,
        u.phone,
        u.address,
        u.profile_url,

        -- city (from users.city_id)
        c.city_name AS "cityName",
        c.state     AS "stateName",
        c.area,
        c.latitude,
        c.longitude,

        -- bank (optional)
        b.account_holder       AS accountholdername,
        b.bank_name            AS bankname,
        b.ifsc                 AS ifsc,
        b.passbook_front_image AS passbookfrontimage

      FROM driver d
      LEFT JOIN users u
        ON d.user_id = u.id

      LEFT JOIN driver_status ds
        ON d.status_id = ds.id

      LEFT JOIN city c
        ON u.city_id = c.id   -- ✅ CORRECT city source

      LEFT JOIN bank_account b
        ON d.user_id = b.user_id

      WHERE d.user_id = $1
      `,
      [userId]
    );

    return rows[0] ?? null;
  } catch (error) {
    console.error("Error fetching driver:", error);
    throw error;
  }
}