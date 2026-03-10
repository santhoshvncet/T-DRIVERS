import { pool } from "../../../db";

const GET_PAYMENT_ORDER = `
SELECT id
FROM payment_orders
WHERE razorpay_order_id = $1
`;

export const UPDATE_VERIFY_PAYMENT = `
UPDATE payment_details
SET
  razorpay_payment_id = COALESCE(razorpay_payment_id, $1),
  razorpay_signature  = $2,
  payment_json        = $3,
  payment_status      = $4,
  updated_at          = NOW()
WHERE payment_order_id = $5
RETURNING id;
`;

type SaveArgs = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment: any;
  payment_status: string; 
};

export async function saveVerifiedPayment({
  razorpay_order_id,
  payment,
  razorpay_payment_id,
  razorpay_signature,
  payment_status,
}: SaveArgs) {

  const orderResult = await pool.query(GET_PAYMENT_ORDER, [
    razorpay_order_id,
  ]);

  if (orderResult.rowCount === 0) {
    throw new Error("Payment order not found for razorpay_order_id");
  }

  const { id: payment_order_id } = orderResult.rows[0];

  const updateResult = await pool.query(UPDATE_VERIFY_PAYMENT, [
    razorpay_payment_id,
    razorpay_signature,
    JSON.stringify(payment || {}),
    payment_status,
    payment_order_id,
  ]);



  if (updateResult.rowCount === 0) {
    // This should NEVER happen if createPaymentOrder is correct
    throw new Error(
      `payment_details row missing for payment_order_id=${payment_order_id}`
    );
  }


  return updateResult.rows[0];
}