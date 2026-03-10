import { pool, withTransaction } from "../../db";
import { uploadBufferToS3 } from "../../../utils/uploadToS3";

interface UpdateDriverPayload {
  name: string;
  email: string;
  address: string;
  transmission: string;
  board_type: string;
  languages?: string[] | null;
  licenseFile?: Express.Multer.File | null;
}

export const updateDriverAccountDetails = async (
  user_id: number,
  payload: UpdateDriverPayload
) => {
  try {
    if (!user_id) throw new Error("User ID missing");


    // 1️⃣ Fetch current user data (for existing licence_url & phone)
    const userRes = await pool.query(
      `SELECT phone FROM users WHERE id = $1`,
      [user_id]
    );

    if (userRes.rowCount === 0) {
      throw new Error(`User not found for id=${user_id}`);
    }

    const existingLicenceUrl: string | null =
      userRes.rows[0]?.licence_url ?? null;
    const userPhone: string | null = userRes.rows[0]?.phone ?? null;

    // 2️⃣ Decide which license URL to save
    let licenseUrlToSave: string | null = existingLicenceUrl;

    if (payload.licenseFile) {
      licenseUrlToSave = await uploadBufferToS3(
        payload.licenseFile,
        "driver/driving_license"
      );
      console.log("New S3 URL to store in DB:", licenseUrlToSave);
    }

    /*  Normalize languages (TEXT[]) */
    const languagesToSave =
      payload.languages && payload.languages.length > 0
        ? payload.languages
        : null; // EMPTY → NULL

    // 3️⃣ Update users table
    await pool.query(
      `
      UPDATE users SET
        name         = $1,
        email        = $2,
        address      = $3,
        updated_at   = NOW()
      WHERE id = $4
      `,
      [
        payload.name,
        payload.email,
        payload.address,
        user_id,
      ]
    );

    // 4️⃣ Try to update driver row for this user
    const driverUpdateRes = await pool.query(
      `
      UPDATE driver SET
        transmission        = $1,
        board_type          = $2,
        languages           = $3,
        driving_license_url = COALESCE($4, driving_license_url),
        updated_at          = NOW()
      WHERE user_id = $5
      RETURNING *;
      `,
      [
        payload.transmission,
        payload.board_type,
        languagesToSave,
        licenseUrlToSave,
        user_id,
      ]
    );

    let driverRow = driverUpdateRes.rows[0];

    // 5️⃣ If no driver row was updated, create one (optional but solves your "not found" case)
    if (driverUpdateRes.rowCount === 0) {
       const driverInsertRes = await withTransaction(async (client) => {
      const driverInsertRes = await client.query(
        `
        INSERT INTO driver (
          user_id,
          transmission,
          board_type,
          languages,
          driving_license_url,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
        RETURNING *;
        `,
        [
          user_id,
          payload.transmission,
          payload.board_type,
          languagesToSave,
          licenseUrlToSave,
        ]
      );
      return driverInsertRes;
    });
    driverRow = driverInsertRes.rows[0];
      console.log("Inserted new driver record:", driverRow);
    } else {
      console.log("Updated existing driver record:", driverRow);
    }

    return {
      status: true,
      message: "Driver account updated successfully",
      driver: driverRow,
    };
  } catch (error: any) {
    console.log("Driver update error:", error);

    if (error.code === "23505" || error.constraint === "email_unique") {
      return {
        status: false,
        error: "Email already exists",
      };
    }

    return {
      status: false,
      error: error.message || "Something went wrong",
    };
  }
};