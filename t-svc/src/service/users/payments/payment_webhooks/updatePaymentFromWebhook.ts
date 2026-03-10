import { pool } from "../../../db";

const GET_PAYMENT_ORDER = `
SELECT id
FROM payment_orders
WHERE razorpay_order_id = $1
`;

const UPDATE_FROM_WEBHOOK = `
UPDATE payment_details
SET
  razorpay_payment_id    = COALESCE(razorpay_payment_id, $1),
  gateway_amount_paise   = $2,
  payment_json           = $3,
  payment_status         = $4,
  updated_at             = NOW()
WHERE payment_order_id   = $5
`;

export async function updatePaymentFromWebhook({
  razorpay_order_id,
  razorpay_payment_id,
  gateway_amount_paise,
  payment_json,
  payment_status,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  gateway_amount_paise: number;
  payment_json: any;
  payment_status: "captured" | "failed" | "authorized";
}) {

  const orderRes = await pool.query(GET_PAYMENT_ORDER, [
    razorpay_order_id,
  ]);

  if (orderRes.rowCount === 0) {
    throw new Error("Payment order not found for webhook");
  }

  const { id: payment_order_id } = orderRes.rows[0];

  const result = await pool.query(UPDATE_FROM_WEBHOOK, [
    razorpay_payment_id,
    gateway_amount_paise,
    JSON.stringify(payment_json),
    payment_status,
    payment_order_id,
  ]);

  if (result.rowCount === 0) {
    throw new Error(
      `payment_details missing for payment_order_id=${payment_order_id}`
    );
  }
}
