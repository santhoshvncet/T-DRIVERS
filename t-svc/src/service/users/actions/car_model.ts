import { pool } from "../../db";

export async function getCarModels(query: string) {
  try {
    const result = await pool.query(
      `SELECT id, brand, model_name, model_variant, car_type
       FROM car_model
       WHERE 
          brand ILIKE $1
          OR model_name ILIKE $1
       ORDER BY brand, model_name
       LIMIT 10;`,
      [`%${query}%`]
    );

    const rows = result.rows;

    if (rows.length > 0) {
      return rows.map((row: { id: any; brand: any; model_name: any; car_type: any; model_variant: any; }) => ({
        id: row.id,
        brand: row.brand,
        model_name: row.model_name,
        model: `${row.brand}, ${row.model_name}, ${row.car_type}, ${row.model_variant}`,   // display text used in UI
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching car models:", error);
    throw error;
  }
}

