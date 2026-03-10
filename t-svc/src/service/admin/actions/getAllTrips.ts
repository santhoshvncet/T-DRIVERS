import { pool } from "../../db";

export async function getAllTrips(limit: number, offset: number) {
  try {
    const query = `
      SELECT 
        trip.id,
        trip.start_date,
        trip.end_date,
        trip.fare_amount,
        trip.driver_allowance,
        trip.status AS trip_status,

        -- driver
        d.id AS driver_id,
        u.name AS driver_name,
        u.phone AS driver_phone,
        ds.name AS driver_status,

        -- locations
        origin.city_name AS from_place,
        origin.state     AS from_state,
        destination.city_name AS to_place,
        destination.state     AS to_state

      FROM trip
      JOIN driver d 
        ON trip.driver_id = d.id

      LEFT JOIN users u 
        ON d.user_id = u.id

      LEFT JOIN driver_status ds
        ON d.status_id = ds.id

      LEFT JOIN city AS origin 
        ON trip.origin_id = origin.id

      LEFT JOIN city AS destination 
        ON trip.dest_id = destination.id

      ORDER BY trip.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);    

    return {
      rows: result.rows,
      rowCount: result.rowCount,
    };
  } catch (error) {
    console.error(
      "Error fetching trips with driver and city details:",
      error
    );
    throw error;
  }
}