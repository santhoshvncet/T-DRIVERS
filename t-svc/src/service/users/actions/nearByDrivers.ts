import { pool } from "../../db";

export const getNearByDriver = async (cityId: any) => {
  try {
    const city_id = Number(cityId);
    const distance_km = 15;

    if (!city_id || isNaN(city_id)) {
      return { status: false, msg: "city_id is required" };
    }

    const cityQuery = `
      SELECT latitude, longitude, city_name
      FROM city
      WHERE id = $1
      LIMIT 1;
    `;

    const cityResult = await pool.query(cityQuery, [city_id]);

    if (cityResult.rows.length === 0) {
      return { status: false, msg: "City not found" };
    }

    const { latitude, longitude, city_name } = cityResult.rows[0];

    const driverQuery = `
      SELECT * 
      FROM (
        SELECT
          d.id AS driver_id,
          u.id AS user_id,
          u.name AS driver_name,
          u.phone,
          (
            6371 * acos(
              LEAST(
                1,
                GREATEST(
                  -1,
                  cos(radians($1)) * cos(radians(d.driver_latitude)) *
                  cos(radians(d.driver_longitude) - radians($2)) +
                  sin(radians($1)) * sin(radians(d.driver_latitude))
                )
              )
            )
          ) AS distance_km
        FROM driver d
        JOIN users u ON u.id = d.user_id
        WHERE u.role = 'Driver'
          AND d.driver_latitude IS NOT NULL
          AND d.driver_longitude IS NOT NULL
      ) t
      WHERE t.distance_km <= $3
      ORDER BY t.distance_km ASC;
    `;

    const result = await pool.query(driverQuery, [latitude, longitude, distance_km]);

    return {
      status: true,
      data: {
        source_city: city_name,
        count: result.rows.length,
        data: result.rows,
      },
      msg: "Nearby drivers fetched",
    };
  } catch (error) {
    console.error("getNearByDriverService error:", error);
    return { status: false, msg: "Internal server error", error };
  }
};