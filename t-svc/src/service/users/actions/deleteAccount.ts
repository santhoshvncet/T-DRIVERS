import { pool } from "../../db";
import { sendAccountDeletedEmail } from "../../email/sendMailFinal";

export const deleteAccountByRole = async (userId: number) => {
  let userEmail: string | null = null;
  let userName: string | null = null;

  const deletedAt = new Date();

  try {
    
    const userInfo = await pool.query(
      "SELECT email, name FROM users WHERE id = $1",
      [userId]
    );

    if (!userInfo.rows.length) {
      throw new Error("User not found");
    }

    userEmail = userInfo.rows[0].email;
    userName = userInfo.rows[0].name;

 
const dummyEmail = `deleted_${userId}_${Date.now()}@dummy.app`;
const dummyPhone = `999${userId}${Date.now().toString().slice(-4)}`; // always unique
const dummyName = "Deleted User";
const deletedAt = new Date();

await pool.query(
  `
  UPDATE users
  SET
    name = $1,
    email = $2,
    phone = $3,
    address = NULL,
    is_deleted = true,
  
    deleted_at = $4
  WHERE id = $5
  `,
  [dummyName, dummyEmail, dummyPhone, deletedAt, userId]
);


  
if (userEmail && userName) {
  try {
    await sendAccountDeletedEmail(userEmail, userName);
    console.log("Account deleted email sent successfully");
  } catch (err: any) {
    console.error("Account delete email failed:", err?.message || err);
  }
}


    return {
      status: true,
      message: "Account deleted successfully"
    };

  } catch (error) {
    throw error;
  }
};
