// src/modules/driver/updateDriverByIdWithFiles.ts
import { pool, withTransaction } from "../../db";
import { uploadBufferToS3 } from "../../../utils/uploadToS3";

export async function updateDriverById(driverId: any, data: any) {
  // Upload files to S3 in parallel
  const [
    driving_license_url,
    aadhar_card_url,
    profile_photo_url,
    passbook_front_image_url
  ] = await Promise.all([
    data.driving_license ? uploadBufferToS3(data.driving_license, "driver/driving_license") : undefined,
    data.aadhar_card ? uploadBufferToS3(data.aadhar_card, "driver/aadhar") : undefined,
    data.profile_photo ? uploadBufferToS3(data.profile_photo, "driver/profile") : undefined,
    data.passbook_front_image ? uploadBufferToS3(data.passbook_front_image, "driver/passbook") : undefined
  ]);

  // Map status
  let statusId: number | null = null;
  if (data.statusId !== undefined && data.statusId !== null && data.statusId !== "") {
    const parsed = Number(data.statusId);
    statusId = Number.isNaN(parsed) ? null : parsed;
  }
  if (!statusId && data.status) {
    const s = String(data.status).trim().toLowerCase();
    if (s === "verified") statusId = 2;
    else if (s === "rejected") statusId = 3;
  }
  let statusText: string | null = statusId === 2 ? "verified" : statusId === 3 ? "rejected" : null;

  // ----------------- Single Transaction -----------------
  return await withTransaction(async (client) => {
    // 1) Update driver table
    const driverUpdate = await client.query(
      `
      UPDATE driver SET
        age                 = COALESCE($1, age),
        address             = COALESCE($2, address),
        status_id           = COALESCE($3, status_id),
        status              = COALESCE($4, status),
        city_id             = COALESCE($5, city_id),
        driving_license_url = COALESCE($6, driving_license_url),
        aadhar_card_url     = COALESCE($7, aadhar_card_url),
        profile_photo_url   = COALESCE($8, profile_photo_url),
        transmission        = COALESCE($9, transmission),
        board_type          = COALESCE($10, board_type)
      WHERE user_id = $11
      `,
      [
        data.age ?? null,
        data.address ?? null,
        statusId,
        statusText,
        null, // city_id handled separately
        driving_license_url ?? null,
        aadhar_card_url ?? null,
        profile_photo_url ?? null,
        data.transmission ?? null,
        data.board_type ?? null,
        driverId,
      ]
    );
    if (driverUpdate.rowCount === 0) throw new Error("Driver not found for given user_id");

    // 2) Update bank account
    await client.query(
      `
      UPDATE bank_account SET
        account_holder       = COALESCE($1, account_holder),
        bank_name            = COALESCE($2, bank_name),
        ifsc                 = COALESCE($3, ifsc),
        passbook_front_image = COALESCE($4, passbook_front_image)
      WHERE user_id = $5
      `,
      [
        data.accountHolderName ?? data.accountholdername ?? null,
        data.bankName ?? data.bankname ?? null,
        data.ifsc ?? null,
        passbook_front_image_url ?? null,
        driverId,
      ]
    );

    // 3) Update city if provided
    if (data.cityName || data.stateName) {
      const cityResult = await client.query(
        `SELECT city_id FROM driver WHERE user_id = $1`,
        [driverId]
      );
      const cityId = cityResult.rows[0]?.city_id;
      if (cityId) {
        await client.query(
          `
          UPDATE city SET
            city_name = COALESCE($1, city_name),
            state     = COALESCE($2, state)
          WHERE id = $3
          `,
          [data.cityName ?? null, data.stateName ?? null, cityId]
        );
      }
    }

    // 4) Update users table for name/email
    if (data.full_name || data.email) {
      await client.query(
        `
        UPDATE users SET
          name  = COALESCE($1, name),
          email = COALESCE($2, email)
        WHERE id = $3
        `,
        [data.full_name ?? null, data.email ?? null, driverId]
      );
    }

    // 5) Fetch updated driver info
    const { rows } = await client.query(
      `
      SELECT 
        d.*, 
        u.name AS full_name,
        u.email AS email,
        b.account_holder       AS accountholdername,
        b.bank_name            AS bankname,
        b.ifsc                 AS ifsc,
        b.passbook_front_image AS passbookfrontimage,
        c.city_name            AS cityName,
        c.state                AS stateName
      FROM driver d
      LEFT JOIN users u
        ON d.user_id = u.id
      LEFT JOIN bank_account b
        ON d.user_id = b.user_id
      LEFT JOIN city c
        ON d.city_id = c.id
      WHERE d.user_id = $1
      `,
      [driverId]
    );

    return rows[0];
  });
}
