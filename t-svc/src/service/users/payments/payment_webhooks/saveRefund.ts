import { pool, withTransaction } from "../../../db";

const GET_PAYMENT_DETAILS_ID = `
  SELECT id
  FROM payment_details
  WHERE razorpay_payment_id = $1
  LIMIT 1;
`;

export const UPSERT_REFUND = `
  INSERT INTO razorpay_refunds (
    razorpay_refund_id,
    razorpay_payment_id,
    payment_details_id,
    amount_paise,
    currency,
    status,
    refund_reason,
    refund_json,
    processed_at,
    created_at,
    updated_at
  )
  VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()
  )
  ON CONFLICT (razorpay_refund_id)
  DO UPDATE SET
    amount_paise  = EXCLUDED.amount_paise,
    currency      = EXCLUDED.currency,
    status        = EXCLUDED.status,
    refund_reason = EXCLUDED.refund_reason,
    refund_json   = EXCLUDED.refund_json,
    processed_at  = COALESCE(EXCLUDED.processed_at, razorpay_refunds.processed_at),
    updated_at    = NOW();
`;

export async function saveRefund(refund: any) {
  try {
    if (!refund?.id || !refund?.payment_id) {
      throw new Error("Invalid refund payload");
    }

    const processedAt =
      typeof refund.processed_at === "number"
        ? new Date(refund.processed_at * 1000)
        : null;

    await withTransaction(async (client) => {
      /* 1️⃣ Find related payment_details row */
      const paymentRes = await client.query(GET_PAYMENT_DETAILS_ID, [
        refund.payment_id,
      ]);

      if (!paymentRes.rowCount) {
        throw new Error(
          `Payment not found for razorpay_payment_id: ${refund.payment_id}`
        );
      }

      const paymentDetailsId = paymentRes.rows[0].id;

      /* 2️⃣ Upsert refund record */
      await client.query(UPSERT_REFUND, [
        refund.id,
        refund.payment_id,
        paymentDetailsId,
        Number(refund.amount) || 0,
        refund.currency || "INR",
        refund.status || null,
        refund.reason || null,
        safeJSONStringify(refund),
        processedAt,
      ]);
    });
  } catch (error: any) {
    console.error("❌ Error saving refund", {
      message: error.message,
      refund_id: refund?.id,
      payment_id: refund?.payment_id,
    });
    throw error;
  }
}

/* ---------- Safe JSON helper ---------- */
function safeJSONStringify(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch {
    return null;
  }
}
