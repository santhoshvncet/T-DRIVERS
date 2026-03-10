import { verifyRazorpayPayment } from "./payment_Validatior/verifyRazorPayment";
import { saveVerifiedPayment } from "./payment_Validatior/savedVerifyPayment";
import { constants } from "../../constants/constants";
import { verifyRazorPaySignature } from "./payment_Validatior/verifyRazorPaySignature";
import { insertLedger } from "./insertDriverLedger";
import { getDriverIdByTrip } from "./getDriverId";
import { getTripHoursAndRoute } from "./getTripHours";
import { extractPaymentInfo } from "./dividePayments";
import { calculateCompanyCommission } from "./calculateCompanyCommission";
import { pool } from "../../db";
import { createAndSendNotification } from "../actions/notification";
import { generateAndUploadFarePdf } from "../actions/generatePaymentPdf";
import { updateStatus } from "./updateStatus";

export const verifyPayment = async (payload: any) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      owner_id,
      trip_id,
      amount,
    } = payload;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !owner_id ||
      !trip_id ||
      !amount
    ) {
      return {
        status: false,
        msg: "Missing required fields",
        errorKey: "BAD_REQUEST",
      };
    }

    // 1) verify signature
    await verifyRazorPaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    // 2) verify payment with Razorpay
    const payment = await verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, amount);
    const paymentStatus = payment.status;

    // 3) Save verified payment
    const insertPayment = await saveVerifiedPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment,
      payment_status: paymentStatus,
    });

    const user_id = await getDriverIdByTrip(trip_id);
    const paymemtInfo = await extractPaymentInfo(payment);

    const { tripHours, origin_id, dest_id } = await getTripHoursAndRoute(trip_id);

    const company_comission = await calculateCompanyCommission(tripHours, origin_id, dest_id);
console.log("company commission",company_comission)
    const driver_amount = paymemtInfo?.totalAmountPaise - company_comission;

    // ---------------- CAPTURED ----------------
    if (payment.status === constants.PAYMENT.CAPTURED) {
      // insert driver ledger
      await insertLedger({
        driverUserId: Number(user_id),
        tripId: Number(trip_id),
        paymentInId: insertPayment?.id,
        direction: "CREDIT",
        purpose: "TRIP_CREDIT",
        amountPaise: driver_amount,
        meta: {
          razorpay_payment_id,
          order_id: razorpay_order_id,
          company_fee_paise: driver_amount,
        },
        wallet_owner: "DRIVER",
      });

      // update trip status
      await updateStatus(trip_id, "COMPLETED");

      // insert company ledger
      await insertLedger({
        driverUserId: null,
        tripId: Number(trip_id),
        paymentInId: insertPayment.id,
        direction: "CREDIT",
        purpose: "COMMISSION",
        amountPaise: company_comission,
        meta: {
          razorpay_payment_id,
          order_id: razorpay_order_id,
          tripHours,
        },
        wallet_owner: "COMPANY",
      });

      // Trip fetch
      const tripRes = await pool.query("SELECT * FROM trip WHERE id = $1", [trip_id]);
      if (tripRes.rowCount === 0) {
        return { status: false, msg: "Trip not found", errorKey: "NOT_FOUND" };
      }

      const trip = tripRes.rows[0];
      const finalFare = trip.fare_amount ?? 0;

      // Owner details
      const ownerRes = await pool.query(
        `
        SELECT 
          u.id AS owner_user_id,
          u.external_id,
          u.name,
          u.email
        FROM trip t
        JOIN owner o ON o.id = t.owner_id
        JOIN users u ON u.id = o.users_id
        WHERE t.id = $1
          AND u.external_id IS NOT NULL
        `,
        [trip_id]
      );

      // Driver user id
      let driverUserId: number | null = null;
      const driverRes = await pool.query(
        `
        SELECT u.id AS driver_user_id
        FROM trip t
        JOIN driver d ON d.id = t.driver_id
        JOIN users u ON u.id = d.user_id
        WHERE t.id = $1
          AND u.external_id IS NOT NULL
        `,
        [trip_id]
      );
      if (driverRes.rowCount) driverUserId = driverRes.rows[0].driver_user_id;

      if (ownerRes.rowCount) {
        const { owner_user_id, name: ownerName, email: ownerEmail } = ownerRes.rows[0];

        // PDF generation (non-blocking for response)
        const actualStart = new Date(trip.started_at);
        const actualEnd = new Date(trip.completed_at);
        const actualHours = Math.max(
          2,
          Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60))
        );

        const fareData = {
          trip_id: trip.id,
          actual_hours: actualHours,
          estimated_hours: trip.estimated_hours ?? actualHours,
          base_fare: trip.base_fare ?? 0,
          extra_hour_charge: trip.extra_hour_charge ?? 0,
          night_charge: trip.night_charge ?? 0,
          driver_allowance: trip.driver_allowance ?? 0,
          final_fare: finalFare,
          distance_km: 0,
          duration_type: trip.duration_type,
        };

        try {
          await generateAndUploadFarePdf(fareData, ownerEmail, ownerName);
        } catch (pdfErr) {
          console.log("Error generating pdf", pdfErr);
        }

        try {
          await createAndSendNotification({
            title: "Transaction Successful 💰",
            message: `Hi ${ownerName}, your payment of ₹${finalFare} for trip #${trip_id} is complete. Thank you for riding with us.`,
            userIds: [owner_user_id],
          });
        } catch (notifyErr) {
          console.error("Owner payment notification failed:", notifyErr);
        }
      }

      if (driverUserId) {
        try {
          await createAndSendNotification({
            title: "Payment Confirmed 💰 ",
            message: `The payment for trip #${trip_id} has been successfully received.`,
            userIds: [driverUserId],
          });
        } catch (notifyErr) {
          console.error("Driver notification failed:", notifyErr);
        }
      }

      // IMPORTANT: keep old response keys at top-level
      return {
        status: true,
        msg: "Payment captured successfully",
        data: {
          status: "success",
          payment,
        },
      };
    }

    // ---------------- AUTHORIZED ----------------
    if (payment.status === constants.PAYMENT.AUTHORIZED) {
      return {
        status: true,
        msg: "Payment authorized, awaiting capture",
        data: {
          status: "pending",
        },
      };
    }

    // ---------------- FAILED ----------------
    if (payment.status === constants.PAYMENT.FAILED) {
      return {
        status: false,
        msg: "Payment failed",
        errorKey: "BAD_REQUEST",
      };
    }

    // fallback
    return {
      status: false,
      msg: "Unknown payment status",
      errorKey: "INTERNAL_SERVER_ERROR",
    };
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return {
      status: false,
      msg: error.message || "Internal Server Error",
      error,
      // if error has statusCode you can map in router; here just mark as server error
      errorKey: "INTERNAL_SERVER_ERROR",
    };
  }
};