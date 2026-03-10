//src/service/auth/index.ts
import { Router, Request, Response } from "express";
import { generateToken } from "../../utils/jwt";
import { pool } from "../db";
import dotenv from "dotenv";
import { updateUserDocument } from "./action/updateUserDocument";
import upload from "../../config/multerconfig";
import {  hashOtp, sendOtpSms, TESTER_NUMBERS, TESTER_OTP } from "../../utils/Otp";
import {  sendResponse } from "../../utils/response";
import { STATUS_KEYS } from "../../utils/httpStatusCodes";

dotenv.config();

const router = Router();

  router.post("/send-otp", async (req: any, res: any) => {
    try {
      let { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'Mobile number required' });
      }

      // 🔹 Normalize only (no validation)
      phone = phone.toString().trim();
      if (phone.startsWith('91') && phone.length > 10) {
        phone = phone.slice(2);
      }

      // 🔹 Tester numbers
      const isTester = TESTER_NUMBERS.has(phone);

      // ==========================
      // 🧪 TESTER FLOW
      // ==========================
      if (isTester) {
        const otp = TESTER_OTP;
        const otpHash = hashOtp(otp);
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await pool.query(
          `
          INSERT INTO users (phone, otp_hash, otp_expires_at, otp_used)
          VALUES (?, ?, ?, 0)
          ON DUPLICATE KEY UPDATE
            otp_hash = VALUES(otp_hash),
            otp_expires_at = VALUES(otp_expires_at),
            otp_used = 0
          `,
          [phone, otpHash, expiry]
        );

        return res.json({
          status: 'success',
          message: `OTP sent successfully ${TESTER_OTP}`,
          tester: true
        });
      }

      // ==========================
      // 👤 NORMAL USER FLOW
      // ==========================

      const TEMP_OTP = '111111'; // TEMP ONLY for local 
      const otp = TEMP_OTP;
      // const otp = generateOtp(); // for production
      const otpHash = hashOtp(otp);
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      const result = await pool.query(
        `
        INSERT INTO users (
          phone,
          otp_hash,
          otp_expires_at,
          otp_used,
          otp_verify_attempts,
          otp_send_count,
          otp_send_date
        )
        VALUES (
          $1, $2, $3, false, 0, 1, CURRENT_DATE
        )
        ON CONFLICT (phone) DO UPDATE
        SET
          otp_hash = EXCLUDED.otp_hash,
          otp_expires_at = EXCLUDED.otp_expires_at,
          otp_used = false,
          otp_verify_attempts = 0,
          otp_send_count = CASE
            WHEN users.otp_send_date = CURRENT_DATE AND users.otp_send_count < 5
              THEN users.otp_send_count + 1
            WHEN users.otp_send_date <> CURRENT_DATE
              THEN 1
            ELSE users.otp_send_count
          END,
          otp_send_date = CASE
            WHEN users.otp_send_date <> CURRENT_DATE
              THEN CURRENT_DATE
            ELSE users.otp_send_date
            END
            RETURNING otp_send_count;
          `,
        [phone, otpHash, expiry]
        );


      // 🔒 OTP limit exceeded
      if (result.rowCount === 0) {
      return res.status(429).json({
      error: 'OTP send limit exceeded. Try again tomorrow.'
      });
      }


      await sendOtpSms(phone, otp);
      return res.json({
        status: 'success',
        message: 'OTP sent successfully'
      });


    } catch (err) {
      console.error('Send OTP error:', err);
      return res.status(500).json({ error: 'Failed to send OTP' });
    }
  });

 router.post("/verify-login", async (req: any, res: any) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP are required", status: false });
    }

    // 🔹 1. Fetch user once
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE phone = $1`,
      [mobile]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found", status: false });
    }

    const user = rows[0];

    // 🔹 2. OTP Validations
    if (user.otp_used) {
      return res.status(400).json({ message: "OTP already used. Request a new OTP.", status: false });
    }

    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired. Request a new OTP.", status: false });
    }

    if (user.otp_verify_attempts >= 5) {
      return res.status(429).json({ message: "Too many attempts. Request a new OTP.", status: false });
    }

    const incomingHash = hashOtp(otp);

    if (incomingHash !== user.otp_hash) {
      await pool.query(
        `UPDATE users SET otp_verify_attempts = otp_verify_attempts + 1 WHERE id = $1`,
        [user.id]
      );
      return res.status(400).json({ message: "Invalid OTP", status: false });
    }

    // 🔹 3. OTP success → clear OTP fields
    await pool.query(
      `UPDATE users
       SET otp_used = true,
           otp_hash = NULL,
           otp_expires_at = NULL,
           otp_verify_attempts = 0
       WHERE id = $1`,
      [user.id]
    );

    // 🔹 4. Deleted user → onboarding restart
    if (user.is_deleted) {
      return res.status(200).json({
        status: true,
        forceOnboarding: true,
        message: "Please complete your profile to continue",
        data: { userId: user.id, role: user.role },
      });
    }

    // 🔹 5. Common Profile Completion Check (FROM USERS TABLE)
    const isBasicProfileIncomplete =
      !user.name ||
      !user.email ||
      !user.address;

    let next_page = "Home";

    // ================= ROLE LOGIC =================

    if (user.role === "Owner") {
      if (isBasicProfileIncomplete) {
        next_page = "CarOwnerProfileForm";
      } else {
        const { rows: cars } = await pool.query(
          `
SELECT c.id
            FROM car c
            JOIN owner o ON c.owner_id = o.id
            WHERE o.users_id = $1
            LIMIT 1;
`,
          [user.id]
        );
        console.log("Cars for owner:", cars);
        
        next_page = cars.length ? "Home" : "carDetails";
      }
    }

    else if (user.role === "Driver") {
      if (
        isBasicProfileIncomplete ||
        !user.age ||
        !user.city_id ||
        !user.state
      ) {
        next_page = "DriverProfileForm";
      } else {
        const { rows: driverDocs } = await pool.query(
          `SELECT driving_license_url, aadhar_card_url, board_type, transmission
           FROM driver WHERE user_id = $1`,
          [user.id]
        );

        const docs = driverDocs[0];

        if (
          !docs ||
          !docs.driving_license_url ||
          !docs.aadhar_card_url ||
          !docs.board_type ||
          !docs.transmission
        ) {
          next_page = "driverRegDetails";
        } else {
          const { rows: bank } = await pool.query(
            `SELECT id FROM bank_account WHERE user_id = $1 LIMIT 1`,
            [user.id]
          );
          next_page = bank.length ? "Home" : "bankDetails";
        }
      }
    }

    else if (user.role === "User") {
      next_page = "LookingForPage";
    }

    // 🔹 6. Generate Token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    // 🔹 7. Save landing page
    await pool.query(
      `UPDATE users SET landing_page = $1 WHERE id = $2`,
      [next_page, user.id]
    );

    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      message: "OTP verified successfully",
      status: "success",
      data: { token, next_page },
    });

  } catch (error: any) {
    console.error("Verify Login Error:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: "Internal Server Error",
    });
  }
});


router.get("/healthDB", async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    // keep simple text response (health checks usually expect plain text)
    return res.status(200).send("OK FROM DB");
  } catch (e) {
    return res.status(500).send("DB DOWN");
  }
});

router.get("/health", async (req: Request, res: Response) => {
  try {
    return res.status(200).send("OK");
  } catch (e) {
    return res.status(500).send("service DOWN");
  }
});

router.post(
  "/upload_document",
  upload.single("file"),
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    try {
      console.log("Request Body:", req.body);

      const file = req.file;
      const { user_id, file_type, file_name } = req.body;

      if (!file) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "File missing",
        });
      }

      const s3Url = await updateUserDocument(
        Number(user_id),
        file_type,
        file_name,
        file
      );

      return sendResponse(res, STATUS_KEYS.FETCH_OK, {
        // keep old "success" + "data" shape, plus status/statusCode
        success: true,
        data: {
          s3_url: s3Url,
          file_type,
          file_name,
        },
      });
    } catch (error: any) {
      console.error("UPLOAD ERROR:", error);

      return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
        error: error?.message || "Error while uploading document",
        // success flag for error is not merged by current sendResponse (only `error` is used)
      });
    }
  }
);

export default router;