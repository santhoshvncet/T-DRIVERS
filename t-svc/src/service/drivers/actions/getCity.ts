import { pool } from "../../db";

export async function getCity(query: string) {
  try {
    // PostgreSQL parameterized query (case-insensitive search)
    const result = await pool.query(
      `SELECT id, city_name, state, latitude, longitude
       FROM city
       WHERE city_name ILIKE $1
       ORDER BY city_name
       LIMIT 10;`,
      [`%${query}%`]
    );

    const cityRows = result.rows;

    if (cityRows.length > 0) {
      // Map rows to simplified response
      return cityRows.map((row: { id: any; city_name: any; state: any; latitude: any; longitude: any; }) => ({
        id: row.id,
        name: row.city_name,
        state: row.state,
        latitude: row.latitude,
        longitude: row.longitude,
      }));
    }

    // Return empty array if no matches found
    return [];
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
}
