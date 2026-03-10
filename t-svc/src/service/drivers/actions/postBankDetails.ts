import { pool, withTransaction } from "../../db";

export const addBankAccount = async (payload: any) => {
  try {
    const {
      user_id,
      account_holder,
      bank_name,
      account_type = "SAVINGS",
      ifsc,
      account_number,
      upi_id = null,
      is_primary = false,
    } = payload;

    if (!user_id || !account_holder || !bank_name || !ifsc || !account_number) {
      return { status: false, msg: "Missing required fields", badRequest: true };
    }

    const cipherBuffer = Buffer.from(account_number, "utf8");
    const last4 = String(account_number).slice(-4);

    const query = `
      INSERT INTO bank_account (
        user_id, account_holder, bank_name, account_type,
        ifsc, account_no_cipher, account_last4,
        upi_id, is_primary,
        verified_at, created_at, updated_at, deleted_at
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9,
        NULL, NOW(), NOW(), NULL
      )
      RETURNING id, user_id, account_holder, bank_name, account_last4, is_primary;
    `;

    const values = [
      user_id,
      account_holder,
      bank_name,
      account_type,
      ifsc,
      cipherBuffer,
      last4,
      upi_id,
      is_primary,
    ];

    const result = await withTransaction(async (client) => {
    const result = await client.query(query, values);
    return result 
    });

    return {
      status: true,
      data: result.rows[0],
      msg: "Bank account created successfully",
    };
  } catch (error) {
    console.error("Error creating bank account:", error);
    return { status: false, msg: "Internal server error", error };
  }
};