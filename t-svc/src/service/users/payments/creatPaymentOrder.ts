import { pool, withTransaction } from "../../db";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const createPaymentOrder = async (payload: any) => {
  try {
    const { amount, trip_id, currency = "INR" } = payload;

    const tripId = Number(trip_id);
    const amt = Number(amount);

    if (!tripId || !amt || amt <= 0) {
      return { status: false, msg: "Valid amount and trip_id are required" };
    }

    /* ---------- Validate Trip Exists ---------- */
    const tripRes = await pool.query(
      `SELECT id, fare_amount FROM trip WHERE id = $1`,
      [tripId]
    );

    if (!tripRes.rowCount) {
      return { status: false, msg: "Trip not found" };
    }

    /* ---------- Create Razorpay Order FIRST ---------- */
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amt * 100), // convert to paise safely
      currency,
      receipt: `trip_${tripId}_${Date.now()}`,
    });

    /* ---------- Save Payment Records in ONE TX ---------- */
    const result = await withTransaction(async (client) => {
      const orderInsert = await client.query(
        `INSERT INTO payment_orders (
          trip_id,
          razorpay_order_id,
          amount,
          currency,
          status
        ) VALUES ($1,$2,$3,$4,'created')
        RETURNING id`,
        [tripId, razorpayOrder.id, amt, currency]
      );

      const paymentOrderId = orderInsert.rows[0].id;

      await client.query(
        `INSERT INTO payment_details (
          payment_order_id,
          trip_id,
          amount,
          currency,
          payment_status,
          created_at
        ) VALUES ($1,$2,$3,$4,'created',NOW())`,
        [paymentOrderId, tripId, amt, currency]
      );

      return paymentOrderId;
    });

    return {
      status: true,
      msg: "Payment order created successfully",
      data: {
        payment_order_id: result,
        razorpay_order: razorpayOrder,
      },
    };

  } catch (error: any) {
    console.error("Create Payment Order Error:", error?.response?.data || error.message);
    return {
      status: false,
      msg: error?.message || "Internal Server Error",
    };
  }
};
