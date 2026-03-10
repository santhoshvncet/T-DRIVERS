import { pool } from "../../db";

export const updateCarDetails = async (carId: number, payload: any) => {
  try {
    const {
      model_id,
      transmission,
      board_type,
      car_insurance,
      rc_card,
    } = payload;

    const query = `
      UPDATE car
      SET 
        model_id = $1,
        transmission = $2,
        board_type = $3,

        car_insurance = COALESCE($4, car_insurance),
        rc = COALESCE($5, rc),

        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;

    const values = [
      model_id,
      transmission,
      board_type,
      car_insurance,
      rc_card,
      carId,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error("Error updating car:", err);
    throw err;
  }
};