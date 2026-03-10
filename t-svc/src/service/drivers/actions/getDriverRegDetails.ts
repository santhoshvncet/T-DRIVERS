import { pool } from "../../db";

const getDriverRegDetails = async (user_id: number) => {
  try {
    if (!user_id) {
      throw new Error("User ID is required.");
    }

    const query = `
      SELECT
        id,
        user_id,
        transmission,
        board_type,
        driving_license_url,
        aadhar_card_url,
        profile_photo_url,
        status_id,
        created_at,
        updated_at,
        languages
      FROM driver
      WHERE user_id = $1
      LIMIT 1;
    `;

    const result = await pool.query(query, [user_id]);

    if (result.rowCount === 0) {
      return {
        status: false,
        message: "Driver registration details not found.",
        driver: null,
      };
    }

    return {
      status: true,
      message: "Driver registration details retrieved successfully!",
      driver: result.rows[0],
    };
  } catch (error: any) {
    console.error("Error fetching driver registration details:", error);
    throw error;
  }
};

export default getDriverRegDetails;