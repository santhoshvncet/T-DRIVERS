import { pool } from "../../db";

export const getCarsByUser = async (user_id: number) => {

  try {
    if (!user_id) throw new Error("user_id is required");

    await pool.query("BEGIN");

    const ownerRes = await pool.query(
      "SELECT id FROM owner WHERE users_id = $1 LIMIT 1",
      [user_id]
    );

    if (ownerRes.rowCount === 0) {
      return [];
    }

    const owner_id = ownerRes.rows[0].id;

    // Check if primary exists
    const primaryCheck = await pool.query(
      `SELECT id FROM car WHERE owner_id = $1 AND is_primary = true LIMIT 1`,
      [owner_id]
    );

    // If no primary → set first car as primary
    if (primaryCheck.rowCount === 0) {
      await pool.query(
        `
        UPDATE car
        SET is_primary = true
        WHERE id = (
          SELECT id FROM car
          WHERE owner_id = $1
          ORDER BY id DESC
          LIMIT 1
        )
        `,
        [owner_id]
      );
    }

    // Fetch cars
    const CAR_RES = await pool.query(
      `
      SELECT
        c.id,
        c.model_id,
        c.transmission,
        c.board_type,
        c.car_insurance,
        c.rc,
        c.is_primary,
        c.created_at,
        c.updated_at,
        m.brand,
        m.model_name
      FROM car c
      JOIN car_model m ON m.id = c.model_id
      WHERE c.owner_id = $1
      ORDER BY c.is_primary DESC, c.id DESC
      `,
      [owner_id]
    );

    return CAR_RES.rows.map((row: { id: any; model_id: any; brand: any; model_name: any; transmission: any; board_type: any; front_image_url: any; back_image_url: any; left_image_url: any; right_image_url: any; car_insurance: any; rc: any; is_primary: any; created_at: any; updated_at: any; }) => ({
      id: row.id,
      model_id: row.model_id,
      brand: row.brand,
      model_name: row.model_name,
      transmission: row.transmission,
      board_type: row.board_type,
      insurance: row.car_insurance,
      rc_card: row.rc,
      is_primary: row.is_primary,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

  } catch (err) {
    console.error("Error fetching car list:", err);
    throw err;
  }
};