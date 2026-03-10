import { pool } from "../../db";
import { createAndSendNotification } from "../../users/actions/notification";

export const updateTripStatus = async (payload: any) => {
  try {
    const { trip_id, status } = payload;

    if (!trip_id || !status) {
      return { status: false, msg: "trip_id and status are required.", badRequest: true };
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
      return {
        status: false,
        msg: `Invalid status. Allowed: ${allowedStatus.join(", ")}`,
        badRequest: true,
      };
    }

    const query = `
      UPDATE trip
      SET 
        status = $1::trip_status,
        updated_at = NOW(),
        started_at = CASE 
          WHEN $1::trip_status = 'OTP_VERIFIED' THEN NOW()
          ELSE started_at
        END,
        completed_at = CASE 
          WHEN $1::trip_status IN ('COMPLETED', 'PAYMENT_PENDING') THEN NOW()
          ELSE completed_at
        END
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [status, trip_id]);

    if (result.rowCount === 0) {
      return { status: false, msg: "Trip not found.", notFound: true };
    }

    const trip = result.rows[0];

    // notify owner when completed/payment pending
    if (["COMPLETED", "PAYMENT_PENDING"].includes(status)) {
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

      if (ownerRes?.rowCount) {
        const ownerId = ownerRes.rows[0].owner_user_id;

        // notification should not break the update flow
        try {
          await createAndSendNotification({
            userIds: [ownerId],
            title: "Trip Ended ✅",
            message: `Your trip #${trip.id} has ended successfully.`,
          });
        } catch (e) {
          console.error("Owner notification failed:", e);
        }
      }
    }

    // set driver to active again
    const updateQuery = `
      UPDATE driver
      SET status_id = (SELECT id FROM driver_status WHERE name = 'active')
      WHERE id = (
        SELECT driver_id 
        FROM trip
        WHERE id = $1
          AND driver_id IS NOT NULL
      )
    `;
    await pool.query(updateQuery, [trip_id]);

    return {
      status: true,
      msg: `Trip status updated to ${status}`,
      data: trip,
    };
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    return { status: false, msg: "Internal server error.", error };
  }
};