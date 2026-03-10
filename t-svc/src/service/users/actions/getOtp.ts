import { Request, Response } from "express";
import { pool } from "../../db";
import { createAndSendNotification } from "./notification";

const getOtp = async (owner_id: number) => {
  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const tripIdRes = await pool.query(
      `SELECT id FROM trip 
       WHERE owner_id = $1 
       AND status in ('CONFIRMED', 'TRIP_STARTED')
       AND driver_id IS NOT NULL 
       AND deleted_at IS NULL 
       LIMIT 1`,
      [owner_id]
    );
    const trip_id = tripIdRes.rows[0]?.id;
    console.log("Trip ID found:", trip_id);

    if (!trip_id) {
      return {
        status: false,
        msg: "No confirmed trip found for this owner",
      };
    }

    const result = await pool.query(
      `UPDATE trip SET otp = $1 WHERE id = $2 RETURNING id, otp`,
      [otp, trip_id]
    );

    // const user = await pool.query(
    //   `select users_id from owner where id = $1`,
    //   [owner_id]
    // );

    // console.log("UPDATE result:", user.rows[0].users_id);

    if (result.rows.length === 0) {
      return {
        status: false,
        msg: "Failed to save OTP. Trip not found or cannot update.",
      };
    }
    //   await createAndSendNotification({
    //   title: "Trip OTP Generated ",
    //   message: `Your trip verification OTP is ${otp}. Please share it with the driver.`,
    //   userIds: [user.rows[0].users_id],
    // });

    return {
      status: true,
      msg: "OTP generated and saved successfully",
      otp: result.rows[0].otp,
    };

  } catch (err) {
    console.error("Error saving OTP:", err);
    return {
      status: false,
      msg: "Server error",
    };
  }
};



export default getOtp;

