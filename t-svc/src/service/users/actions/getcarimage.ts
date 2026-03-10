import { pool } from "../../db";

export const getCarImages = async (owner_id: number) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT 
        id AS car_id,
        front_image_url
      FROM car
      WHERE owner_id = $1
      ORDER BY id DESC
      LIMIT 3
      `,
      [owner_id]
    );

    return rows;
  } catch (error) {
    console.error("Error fetching car images:", error);
    throw new Error("Database query failed");
  }
};
