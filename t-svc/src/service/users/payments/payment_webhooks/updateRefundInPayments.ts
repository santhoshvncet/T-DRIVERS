import { pool } from "../../../db";

export async function updateRefundInPayments(payment: any) {
  if (!payment?.refund_status) return;

  await pool.query(
    `
    UPDATE payment_details
    SET
      payment_status  = 'refunded',
      refund          = true,
      refund_status   = $1,
      refunded_amount = $2,
      updated_at      = NOW()
    WHERE razorpay_payment_id = $3;
    `,
    [
      payment.refund_status.toUpperCase(), // PARTIAL | FULL
      payment.amount_refunded || 0,        // paise
      payment.id,                          // razorpay_payment_id
    ]
  );
}
