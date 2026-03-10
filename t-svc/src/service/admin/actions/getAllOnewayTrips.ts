import { pool } from "../../db";

export async function getAllOnewayTrips() {
  try {
    const result = await pool.query(`
      SELECT 
        trip.id,
        trip.start_date,
        trip.end_date,
        trip.fare_amount,
        trip.driver_allowance,  -- string in DB

        -- driver fields
        driver.id AS driver_id,
        users.name AS driver_name,
        users.phone AS driver_phone,
        ds.name AS driver_status,

        origin.city_name AS from_place,
        origin.state     AS from_state,

        destination.city_name AS to_place,
        destination.state     AS to_state

      FROM trip
      JOIN driver 
        ON trip.driver_id = driver.id

      LEFT JOIN driver_status ds
        ON driver.status_id = ds.id

      LEFT JOIN users 
        ON driver.user_id = users.id

      LEFT JOIN city AS origin 
        ON trip.origin_id = origin.id

      LEFT JOIN city AS destination 
        ON trip.dest_id = destination.id

      WHERE trip.trip_type = 'oneway'
        AND trip.status = 'PAYMENT_PENDING'
      ORDER BY trip.created_at DESC
    `);

    const formattedRows = result.rows.map(row => ({
      ...row,
      driver_allowance:
        row.driver_allowance !== null && row.driver_allowance !== undefined
          ? Number(parseFloat(row.driver_allowance).toFixed(2))
          : null,
    }));

    return formattedRows;
  } catch (error) {
    console.error(
      "Error fetching one-way trips with driver and city details:",
      error
    );
    throw error;
  }
}