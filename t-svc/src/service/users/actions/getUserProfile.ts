import { pool } from "../../db";

export const getUserProfile = async (phone?: number, email?: string) => {
  try {
    let query = "";
    let param: any;

    if (phone) {
      query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.address,
          u.landing_page,
          u.profile_url,
          u.role,
          TO_CHAR(u.joined_date, 'Mon YYYY') AS joined_date,

          -- owner / driver references
          o.id AS owner_id,
          d.id AS driver_id,

          -- driver-specific
          d.driving_license_url,
          d.transmission,
          d.board_type,
          ds.name AS driver_status,

          -- admin roles (array)
          COALESCE(a.role, ARRAY[]::text[]) AS access
        FROM users u
        LEFT JOIN owner o ON o.users_id = u.id
        LEFT JOIN driver d ON d.user_id = u.id
        LEFT JOIN driver_status ds ON d.status_id = ds.id
        LEFT JOIN admin a ON a.user_id = u.id
        WHERE u.phone = $1
        LIMIT 1
      `;
      param = phone;
    } else if (email) {
      query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.address,
          u.landing_page,
          u.profile_url,
          u.role,
          TO_CHAR(u.joined_date, 'Mon YYYY') AS joined_date,

          o.id AS owner_id,
          d.id AS driver_id,

          d.driving_license_url,
          d.transmission,
          d.board_type,
          ds.name AS driver_status,

          COALESCE(a.role, ARRAY[]::text[]) AS access
        FROM users u
        LEFT JOIN owner o ON o.users_id = u.id
        LEFT JOIN driver d ON d.user_id = u.id
        LEFT JOIN driver_status ds ON d.status_id = ds.id
        LEFT JOIN admin a ON a.user_id = u.id
        WHERE u.email = $1
        LIMIT 1
      `;
      param = email;
    } else {
      return { message: "Phone or email must be provided" };
    }

    const { rows } = await pool.query(query, [param]);

    if (!rows.length) {
      return { message: "User not found" };
    }

    const user = rows[0];
    user.joined_date = `Joined ${user.joined_date}`;

    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { message: "Internal Server Error" };
  }
};