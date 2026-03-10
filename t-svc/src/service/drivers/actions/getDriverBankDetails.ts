import { pool } from "../../db";

export const getBankAccountsByUserId = async (userIdParam: any) => {
  try {
    const userId = Number(userIdParam);

    if (!userId || isNaN(userId)) {
      return { status: false, msg: "Invalid user_id", badRequest: true };
    }

    const query = `
      SELECT 
        id,
        account_holder,
        bank_name,
        account_last4
      FROM bank_account
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return { status: true, data: rows };
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return { status: false, msg: "Internal server error", error };
  }
};