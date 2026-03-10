import { pool } from "../../db";
import { uploadBufferToS3 } from "../../../utils/uploadToS3";

const updateUserProfileImage = async (user_id: number, file: Express.Multer.File | null) => {
  try {
    console.log("Incoming profile image for user:", user_id);

    if (!user_id) throw new Error("User ID is required.");

    let profile_url = null;

    if (file) {
      profile_url = await uploadBufferToS3(file, "user/profile");
    }

    const query = `
      UPDATE users
      SET 
        profile_url = COALESCE($2, profile_url),
        updated_at = NOW()
      WHERE id = $1
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

export default updateUserProfileImage;