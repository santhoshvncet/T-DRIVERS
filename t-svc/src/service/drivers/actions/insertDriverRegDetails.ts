import { pool, withTransaction } from "../../db";
import { uploadBufferToS3 } from "../../../utils/uploadToS3";
import { landingPage } from "./landingPage";

interface InsertDriverRegPayload {
  driving_license_url?: string;
  aadhar_card_url?: string;
  profile_photo_url?: string;

  transmission: string;
  board_type: string;
}

const insertDriverRegDetails = async (
  user_id: number,
  payload: InsertDriverRegPayload
) => {
  try {
    console.log("Incoming driver registration data:", payload);

    if (!user_id) {
      throw new Error("User ID is required.");
    }

    if (!payload.transmission?.trim() || !payload.board_type?.trim()) {
      throw new Error("Transmission and Board Type are required.");
    }

    // let driving_license_url = null;
    // let aadhar_card_url = null;
    // let profile_photo_url = null;

    // if (payload.driving_license) {
    //   driving_license_url = await uploadBufferToS3(
    //     payload.driving_license,
    //     "driver/driving_license"
    //   );
    // }

    // if (payload.aadhar_card) {
    //   aadhar_card_url = await uploadBufferToS3(
    //     payload.aadhar_card,
    //     "driver/aadhar"
    //   );
    // }

    // if (payload.profile_photo) {
    //   profile_photo_url = await uploadBufferToS3(
    //     payload.profile_photo,
    //     "driver/profile"
    //   );
    // }

    const driverResult = await pool.query(
      "SELECT id FROM driver WHERE user_id = $1 LIMIT 1",
      [user_id]
    );

    let finalQuery;
    let finalValues;

    if (driverResult.rowCount === 0) {
      finalQuery = `
        INSERT INTO driver (
          user_id,
          transmission,
          board_type,
          driving_license_url,
          aadhar_card_url,
          profile_photo_url,
          status_id,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 2, NOW(), NOW())
        RETURNING *;
      `;

      finalValues = [
        user_id,
        payload.transmission,
        payload.board_type,
        payload.driving_license_url || null,
        payload.aadhar_card_url || null,
        payload.profile_photo_url || null,
      ];
    } else {
      finalQuery = `
        UPDATE driver SET
          transmission        = $1,
          board_type          = $2,
          driving_license_url = COALESCE($3, driving_license_url),
          aadhar_card_url     = COALESCE($4, aadhar_card_url),
          profile_photo_url   = COALESCE($5, profile_photo_url),
          status_id=2,
          updated_at          = NOW()
        WHERE user_id = $6
        RETURNING *;
      `;

      finalValues = [
        payload.transmission,
        payload.board_type,
        payload.driving_license_url || null,
        payload.aadhar_card_url || null,
        payload.profile_photo_url || null,
        user_id,
      ];
    }

    const result = await withTransaction(async (client) => {
    const result = await client.query(finalQuery, finalValues);
    return result
    });

    
    await landingPage("DriverBankDetailPage", user_id)

    return {
      status: true,
      message: "Driver registration details saved successfully!",
      driver: result.rows[0],
    };
  } catch (error: any) {
    console.error("Error inserting driver registration details:", error);
    throw error;
  }
};

export default insertDriverRegDetails;
