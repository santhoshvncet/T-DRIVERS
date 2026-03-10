import { pool } from "../../db";

export async function getAllReport() {
  try {
    const getDrivers = await pool.query(`
  SELECT 
    users.name AS full_name,
    users.phone,
    driver_status.name AS status,
    driver.id AS driver_id
  FROM driver
  LEFT JOIN users ON driver.user_id = users.id
  LEFT JOIN driver_status ON driver.status_id = driver_status.id
  WHERE driver.status_id = 1
  ORDER BY driver.created_at DESC;
`);

    const getOwners = await pool.query(`
  SELECT 
    users.name AS full_name,
    users.phone AS phone_number,
    owner.is_active ,
    owner.id AS owner_id
  FROM owner
  LEFT JOIN users ON owner.users_id = users.id
  ORDER BY owner.created_at DESC;
`);

    const getTrips = await pool.query(`
  SELECT 
    users.name AS driver_name,
    users.phone AS driver_phone,
    'active' AS status,
    driver.id AS driver_id,
    trip.id AS trip_id
  FROM trip
  LEFT JOIN driver ON trip.driver_id = driver.id
  LEFT JOIN users ON driver.user_id = users.id
  WHERE trip.driver_id IS NOT NULL
  ORDER BY trip.created_at DESC;
`);

    return {
      driverReport: getDrivers.rows,
      ownerReport: getOwners.rows,
      tripReport: getTrips.rows,
    };
  } catch (error) {
    console.error("Error fetching report data:", error);
    throw error;
  }
}
