import { pool } from "../../db";
import { landingPage } from "./landingPage";

interface InsertDriverBankPayload {
  account_holder: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  passbook_front_image_url: string;
}

const insertDriverBankDetails = async (
  user_id: number,
  payload: InsertDriverBankPayload
) => {
  try {
    console.log("Incoming driver bank data:", payload);

    if (!user_id) throw new Error("User ID is required.");

    if (
      !payload.account_holder?.trim() ||
      !payload.bank_name?.trim() ||
      !payload.account_number?.trim() ||
      !payload.ifsc?.trim() ||
      !payload.passbook_front_image_url
    ) {
      throw new Error("All fields are required.");
    }

    // Use URL directly (already uploaded)
    const passbook_url = payload.passbook_front_image_url;

    // Convert account number (existing logic)
    const cipherBuffer = Buffer.from(payload.account_number, "utf8");
    const last4 = payload.account_number.slice(-4);

    const query = `
      INSERT INTO bank_account (
        user_id,
        account_holder,
        bank_name,
        account_type,
        ifsc,
        account_no_cipher, 
        account_last4,
        upi_id,
        is_primary,
        passbook_front_image,
        verified_at,
        created_at,
        updated_at,
        deleted_at
      )
      VALUES (
        $1, $2, $3, 'SAVINGS', $4, $5, 
        $6, NULL, true, $7,
        NULL, NOW(), NOW(), NULL
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        account_holder       = EXCLUDED.account_holder,
        bank_name            = EXCLUDED.bank_name,
        ifsc                 = EXCLUDED.ifsc,
        account_no_cipher    = EXCLUDED.account_no_cipher,
        account_last4        = EXCLUDED.account_last4,
        passbook_front_image = EXCLUDED.passbook_front_image,
        updated_at           = NOW()
      RETURNING *;
    `;

    const values = [
      user_id,
      payload.account_holder,
      payload.bank_name,
      payload.ifsc,
      cipherBuffer,
      last4,
      passbook_url,
    ];

    const result = await pool.query(query, values);
    await landingPage("Home", user_id)

    return {
      status: true,
      message: "Driver bank details saved successfully!",
      bank: result.rows[0],
    };
  } catch (error: any) {
    console.error("Error inserting driver bank details:", error);
    throw error;
  }
};

export default insertDriverBankDetails;