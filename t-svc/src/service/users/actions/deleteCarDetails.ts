import { pool } from "../../db";

export const deleteCarDetails = async (carId: number) => {
  try {
    const deleteQuery = `
      DELETE FROM car
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(deleteQuery, [carId]);

    // If no row deleted → car does not exist
    if (result.rowCount === 0) {
      throw new Error("Car not found");
    }

    return result.rows[0];
  } catch (err) {
    console.error("Error deleting car:", err);
    throw err;
  }
};
