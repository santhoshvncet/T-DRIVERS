import { pool } from "../../db";
import { calculateFareAmount } from "./Calculatefareamount";
import { calculateDistanceKm } from "./calculateDistance";
import { generateAndUploadFarePdf } from "./generatePaymentPdf";
import { createAndSendNotification } from "./notification";

export const endTrip = async (tripId: any) => {
  try {
    const trip_id = Number(tripId);

    if (!trip_id || isNaN(trip_id)) {
      return { status: false, msg: "trip_id is required", errorKey: "BAD_REQUEST" };
    }

    /* ================= FETCH TRIP ================= */
    const tripRes = await pool.query(
      `
      SELECT 
        t.start_date,
        t.owner_id,
        t.end_date,
        t.pickup_time,
        t.drop_time,
        t.started_at,
        t.completed_at,
        t.duration_type,
        t.driver_allowance,
        t.origin_id,
        t.dest_id
      FROM trip t
      WHERE t.id = $1
      `,
      [trip_id]
    );

    if (!tripRes.rowCount) {
      return { status: false, msg: "Trip not found", errorKey: "NOT_FOUND" };
    }

    const trip = tripRes.rows[0];

    /* ================= VALIDATION ================= */
    if (!trip.started_at) {
      return { status: false, msg: "Trip has not been started yet", errorKey: "BAD_REQUEST" };
    }

    if (!trip.completed_at) {
      return { status: false, msg: "Trip not completed yet", errorKey: "BAD_REQUEST" };
    }

    const actualStart = new Date(trip.started_at);
    const actualEnd = new Date(trip.completed_at);

    if (isNaN(actualStart.getTime()) || isNaN(actualEnd.getTime())) {
      return { status: false, msg: "Invalid trip timing data", errorKey: "BAD_REQUEST" };
    }

    /* ================= TIME ================= */
    const actualHours = Math.max(
      2,
      Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60))
    );

    /* ================= OWNER USER (notification) ================= */
    const ownerRes = await pool.query(
      `
      SELECT 
        u.id AS owner_user_id,
        u.external_id
      FROM trip t
      JOIN owner o ON o.id = t.owner_id
      JOIN users u ON u.id = o.users_id
      WHERE t.id = $1
        AND u.external_id IS NOT NULL
      `,
      [trip_id]
    );

    let ownerUserId: number | null = null;
    let ownerEmail = "";
    let ownerName = "Owner";

    if (ownerRes.rowCount) {
      ownerUserId = ownerRes.rows[0].owner_user_id;
    }

    /* ================= BOOKING INPUT ================= */
    const pickup_time = trip.pickup_time?.slice(0, 5) ?? "00:00";
    const drop_time = trip.drop_time?.slice(0, 5) ?? "23:59";

    const start_date =
      typeof trip.start_date === "string"
        ? trip.start_date
        : trip.start_date.toISOString().split("T")[0];

    const end_date = trip.end_date
      ? typeof trip.end_date === "string"
        ? trip.end_date
        : trip.end_date.toISOString().split("T")[0]
      : start_date;

    /* ================= DISTANCE ================= */
    const distance_km = (await calculateDistanceKm(trip.origin_id, trip.dest_id)) ?? 0;

    /* ================= BASE FARE ================= */
    const fareResult = calculateFareAmount(
      start_date,
      end_date,
      pickup_time,
      drop_time,
      distance_km
    );

    const baseFare = fareResult.fare_amount;
    const estimatedHours = fareResult.estimated_hours;

    /* ================= EXTRA HOURS ================= */
    let extraHourCharge = 0;

    if (actualHours > estimatedHours) {
      const extraHours = actualHours - estimatedHours;

      if (fareResult.duration_type === "LOCAL") {
        extraHourCharge = extraHours * 100;
      }

      if (fareResult.duration_type === "OUTSTATION") {
        extraHourCharge = extraHours <= 12 ? 1500 : 2000;
      }
    }

    /* ================= NIGHT CHARGE ================= */
    const isNightHour = (d: Date) => d.getHours() >= 22 || d.getHours() < 5;

    let nightCharge = 0;

    if (fareResult.duration_type === "LOCAL") {
      const bookingStartedAtNight = isNightHour(actualStart);
      const hasExtraHours = actualHours > estimatedHours;

      if (!bookingStartedAtNight && hasExtraHours) {
        const extraEndTime = new Date(actualStart);
        extraEndTime.setHours(extraEndTime.getHours() + actualHours);

        if (isNightHour(extraEndTime)) nightCharge = 150;
      }
    }

    const driverAllowance = Number(trip.driver_allowance ?? 0);
    const finalFare = baseFare + extraHourCharge + nightCharge + driverAllowance;

    const fareDataForPdf = {
      trip_id,
      actual_hours: actualHours,
      estimated_hours: estimatedHours,
      base_fare: baseFare,
      extra_hour_charge: extraHourCharge,
      night_charge: nightCharge,
      driver_allowance: driverAllowance,
      final_fare: finalFare,
      distance_km,
      duration_type: fareResult.duration_type,
    };

    // PDF should not break API
    try {
      await generateAndUploadFarePdf(fareDataForPdf, ownerEmail, ownerName);
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr);
    }

    // Notification should not break API
    if (ownerUserId) {
      try {
        await createAndSendNotification({
          title: "Trip Completed – Payment Pending",
          message: `Hi ${ownerName}, your trip #${trip_id} is completed. Total fare is ₹${finalFare}. Please proceed with the payment.`,
          userIds: [ownerUserId],
        });
      } catch (notifErr) {
        console.error("Failed to send notification:", notifErr);
      }
    }

    /* ================= UPDATE FARE ================= */
    await pool.query(
      `
      UPDATE trip
      SET fare_amount = $1
      WHERE id = $2
      `,
      [finalFare, trip_id]
    );

    return {
      status: true,
      msg: "Trip completed and fare calculated",
      data: {
        trip_id,
        actual_hours: actualHours,
        estimated_hours: estimatedHours,
        duration_type: fareResult.duration_type,
        base_fare: baseFare,
        extra_hour_charge: extraHourCharge,
        night_charge: nightCharge,
        driver_allowance: driverAllowance,
        final_fare: finalFare,
        distance_km,
      },
    };
  } catch (err: any) {
    console.error("endTripService error:", err?.message || err);
    return { status: false, msg: "Internal server error", errorKey: "INTERNAL_SERVER_ERROR", error: err };
  }
};