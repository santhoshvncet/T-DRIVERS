// import { pool } from "../../../db";

// export const updatePaymentStatus = async (
//   user_id: number,
//   course_id: number,
//   payment_status: string 
// ) => {
//   try {

//     await pool.query(
//       `
//       INSERT INTO enrolled_courses (user_id, course_id, payment_status, created_at, updated_at)
//       VALUES (?, ?, ?, NOW(), NOW())
//       ON DUPLICATE KEY UPDATE
//         payment_status = VALUES(payment_status),
//         updated_at = NOW()
//       `,
//       [user_id, course_id, payment_status]
//     );

//     const [rows]: any = await pool.query(
//       `
//       SELECT *
//       FROM enrolled_courses
//       WHERE user_id = ? AND course_id = ?
//       LIMIT 1
//       `,
//       [user_id, course_id]
//     );

//     if (!rows || rows.length === 0) {
//       throw new Error("Enrollment row not found after upsert");
//     }
//     return rows[0];
//   } catch (error) {
//     console.error("Error updating payment status:", error);
//     throw error;
//   }
// };
