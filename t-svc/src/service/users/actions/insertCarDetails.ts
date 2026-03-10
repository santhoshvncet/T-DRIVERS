import { pool, withTransaction } from "../../db";
import { landingPage } from "./landingPage";
import { createAndSendNotification } from "./notification";

interface InsertCarPayload {
  user_id: number;
  car_model_id: number;
  transmission: string;
  board_type: string;
  car_insurance_url?: string;
  rc_card_url?: string;
}

const insertCarDetails = async (payload: InsertCarPayload) => {
  try {
    console.log("Incoming car data:", payload);

    if (
      !payload.user_id ||
      !payload.car_model_id ||
      !payload.transmission?.trim() ||
      !payload.board_type?.trim()
    ) {
      throw new Error("Required car fields are missing.");
    }

    /* ---------- TRANSACTION START ---------- */
    const car = await withTransaction(async (client) => {
      const ownerResult = await client.query(
        "SELECT id FROM owner WHERE users_id = $1 LIMIT 1",
        [payload.user_id]
      );

      if (ownerResult.rowCount === 0) {
        throw new Error("Owner not found for this user.");
      }

      const owner_id = ownerResult.rows[0].id;

      const insertRes = await client.query(
        `INSERT INTO car (
            owner_id,
            model_id,
            transmission,
            board_type,
            car_insurance,
            rc,
            created_at,
            updated_at
         )
         VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
         RETURNING *`,
        [
          owner_id,
          payload.car_model_id,
          payload.transmission.trim(),
          payload.board_type.trim(),
          payload.car_insurance_url || null,
          payload.rc_card_url || null
        ]
      );

      return insertRes.rows[0];
    });
    /* ---------- TRANSACTION END ---------- */

    /* ---------- POST-COMMIT TASKS (NON-BLOCKING) ---------- */
    setImmediate(async () => {
      try {
        await createAndSendNotification({
          title: "Vehicle Registered",
          message: "Your car information has been added successfully.",
          userIds: [payload.user_id]
        });

        await landingPage("Home", payload.user_id);
      } catch (e) {
        console.error("[insertCarDetails] Post-commit task failed:", e);
      }
    });

    return {
      message: "Car details saved successfully!",
      car,
    };

  } catch (error) {
    console.error("Error inserting car details:", error);
    throw error;
  }
};

export default insertCarDetails;
