import { pool } from "../../db";
import { uploadBufferToS3 } from "../../../utils/uploadToS3";

const updateDriverProfileImage = async (user_id: number, file: Express.Multer.File | null) => {
  try {
    console.log("Incoming profile image for driver:", user_id);

    if (!user_id) throw new Error("User ID is required.");

    let profile_url = null;

    if (file) {
      profile_url = await uploadBufferToS3(file, "driver/profile");
    }

    const query = `
      UPDATE driver
      SET 
        profile_photo_url = COALESCE($2, profile_photo_url),
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING *;
    `;


    const values = [user_id, profile_url];

    const result = await pool.query(query, values);

    return {
      status: true,
      message: "Profile image updated successfully!",
      user: result.rows[0],
    };
  } catch (error: any) {
    console.error("Error updating profile image:", error);
    throw error;
  }
};

export default updateDriverProfileImage;