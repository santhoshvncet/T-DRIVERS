import { pool } from "../../db";

export const getDriverProfile = async (driver_id: number) => {
  try {
    const query = `
     
SELECT 
    d.id AS driver_id,
    d.user_id,
    u.name as full_name,
    u.email,
    u.phone,
    d.age,
    u.address,
    d.status_id,
    u.state AS state_name,
    u.city_id,
    d.driving_license_url,
    d.aadhar_card_url,
    d.profile_photo_url,
    d.transmission,
    d.board_type,
    ds.name AS driver_status,
    TO_CHAR(d.created_at, 'Mon YYYY') AS joined_date,
    c.city_name AS city_name
FROM driver d
LEFT JOIN users u
    ON d.user_id = u.id
LEFT JOIN city c
    ON u.city_id = c.id
left join driver_status ds on d.status_id = ds.id 
WHERE d.id = $1
  AND d.deleted_at IS NULL;

    `;

    const { rows } = await pool.query(query, [driver_id]);

    if (!rows || rows.length === 0) {
      return { status: false, message: "Driver not found" };
    }

    return {
      status: true,
      data: rows[0]
    };
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    return { status: false, message: "Internal Server Error" };
  }
};
