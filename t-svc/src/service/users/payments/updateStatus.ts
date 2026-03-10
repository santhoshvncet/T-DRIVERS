import { Request, Response } from "express";
import { pool } from "../../db";
import { createAndSendNotification } from "../../users/actions/notification";
import { error } from "console";


export const updateStatus = async (trip_id: number, status: string) => {
  try {

    if (!trip_id || !status) {
     throw error("trip id us required")
    }
    const allowedStatus = [
      "ONGOING",
      "COMPLETED",
      "CANCELLED",
      "ACCEPTED",
      "CONFIRMED",
      "PAYMENT_PENDING",
      "PAYMENT_COMPLETED",
      "TRIP_STARTED",
      "OTP_VERIFIED",
      "START_TRIP_CAR_PHOTOS",
      "TRIP_ENDED",
      "END_TRIP_CAR_PHOTOS",
    ];

    if (!allowedStatus.includes(status)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Invalid status. Allowed: ${allowedStatus.join(", ")}`
    //   });
    }
    const query = `
UPDATE trip
SET 
  status = $1::trip_status,
  updated_at = NOW(),
  started_at = CASE 
    WHEN $1::trip_status IN ('ONGOING','TRIP_STARTED')
    THEN NOW()
    ELSE started_at
  END,

  completed_at = CASE 
    WHEN $1::trip_status IN ('COMPLETED', 'PAYMENT_PENDING')
    THEN NOW()
    ELSE completed_at
  END

WHERE id = $2
RETURNING *;

    `;


    
    const result = await pool.query(query, [status, trip_id]);
  
    const trip = result.rows[0];

    if (['COMPLETED', 'PAYMENT_PENDING'].includes(status)) {

      const ownerRes = await pool.query(
        `
    SELECT u.id AS owner_user_id
    FROM trip t
    JOIN owner o ON o.id = t.owner_id
    JOIN users u ON u.id = o.users_id
    WHERE t.id = $1
      AND u.external_id IS NOT NULL
    `,
        [trip_id]
      );

      if (ownerRes?.rowCount && ownerRes.rowCount > 0) {
        const ownerId = ownerRes.rows[0].owner_user_id;
        console.log("Owner user id for notification:", ownerId);

        await createAndSendNotification({
          userIds: [ownerId],
          title: "Trip Ended ✅",
          message: `Your trip #${trip.id} has ended successfully.`,


        });
      }
    }

    const updateQuery = `  
    UPDATE driver
    SET status_id=(
    select id from driver_status where name = 'active'
    )
    where id=(
    select driver_id 
    FROM trip where 
    id=$1
    AND driver_id IS NOT NULL
    )
  `
    const updateResponse = await pool.query(updateQuery, [trip_id]);
    console.log(updateResponse);
 
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    // return res.status(500).json({ success: false, message: "Internal server error.", error });
  }
};
