import { pool } from "../../db";
import {  sendBookingEmailToOwner} from "../../email/sendMailFinal";
import { createAndSendNotification } from "./notification";

export const confirmDriver = async (trip_id: any, driver_id: any) => {
  const tripId = Number(trip_id);
  const driverId = Number(driver_id);

  if (!tripId || !driverId || isNaN(tripId) || isNaN(driverId)) {
    return { status: false, msg: "trip_id and driver_id are required" };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* ---------------- Lock driver row ---------------- */
    const driverLockRes = await client.query(
      `SELECT id, user_id, status_id FROM driver WHERE id = $1 FOR UPDATE`,
      [driverId]
    );

    if (driverLockRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { status: false, msg: "Driver not found" };
    }

    const driverStatusId = driverLockRes.rows[0].status_id;
    const driverUserId = driverLockRes.rows[0].user_id;

    if (driverStatusId !== 1) {
      await client.query("ROLLBACK");
      return { status: false, msg: "Driver is busy", conflict: true };
    }

    /* ---------------- Update trip ---------------- */
    await client.query(
      `
      UPDATE trip
      SET driver_id = $1, status = 'CONFIRMED', updated_at = NOW()
      WHERE id = $2
      `,
      [driverId, tripId]
    );

    /* ---------------- Update driver_interest ---------------- */
    await client.query(
      `
      UPDATE driver_interest
      SET driver_interest_type = 'CONFIRMED',
          updated_at = NOW(),
          deleted_at = NOW()
      WHERE driver_id = $1 AND trip_id = $2
      `,
      [driverId, tripId]
    );

    /* ---------------- Update driver status -> engaged ---------------- */
    await client.query(
      `
      UPDATE driver
      SET status_id = (SELECT id FROM driver_status WHERE name = 'engaged')
      WHERE id = $1
      `,
      [driverId]
    );

    /* ---------------- Fetch trip details + owner user details ---------------- */
    const tripRes = await client.query(
      `
      SELECT
        t.id AS trip_id,
        t.*,
        oc.city_name AS origin_city,
        dc.city_name AS destination_city,
        cm.brand,
        cm.model_name,
        cm.car_type,

        o.id AS owner_id,
        ou.id AS owner_user_id,
        ou.name AS owner_name,
        ou.email AS owner_email,
        ou.phone AS owner_phone
      FROM trip t
      LEFT JOIN city oc ON oc.id = t.origin_id
      LEFT JOIN city dc ON dc.id = t.dest_id
      LEFT JOIN car c ON c.id = t.car_id
      LEFT JOIN car_model cm ON cm.id = c.model_id
      LEFT JOIN owner o ON o.id = t.owner_id
      LEFT JOIN users ou ON ou.id = o.users_id
      WHERE t.id = $1
      `,
      [tripId]
    );

    if (!tripRes.rowCount) {
      await client.query("ROLLBACK");
      return { status: false, msg: "Trip not found" };
    }

    const trip = tripRes.rows[0];

    /* ---------------- Fetch driver details (driver + users) ---------------- */
    const driverRes = await client.query(
      `
      SELECT
        d.id AS driver_id,
        d.user_id,
        u.name,
        u.phone,
        u.email,
        u.address,
        u.state,
        u.profile_url,

        d.profile_photo_url,
        d.age,
        d.transmission,
        d.board_type,
        d.driver_latitude,
        d.driver_longitude,
        d.languages,
        d.status_id,
        d.driving_license_url,
        d.aadhar_card_url
      FROM driver d
      JOIN users u ON u.id = d.user_id
      WHERE d.id = $1
      `,
      [driverId]
    );

    const driver = driverRes.rows[0];

    await client.query("COMMIT");

    /* ---------------- Email + Notification OUTSIDE txn ---------------- */
    // Your mail function expects (owner_id, trip, driver). owner_id is trip.owner_id (owner table id).
    await sendBookingEmailToOwner(trip.owner_id, trip, driver);
    console.log("mail sent ")

    if (driverUserId) {
      try {
        await createAndSendNotification({
          title: "Ready to Start 🚗",
          message: "Your trip has been approved by the owner. Please check the trip details.",
          userIds: [driverUserId],
        });
      } catch (err) {
        console.error("Driver notification failed:", err);
      }
    }

    return {
      status: true,
      msg: "Driver assigned successfully and email sent to owner",
      data: { trip, driver },
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    console.error("Confirm Driver Error:", error);
    return { status: false, msg: "DB error", error };
  } finally {
    client.release();
  }
};