/**
 * Handles refund webhooks: refund.created | refund.processed | refund.failed
 * Persists/updates the refunds table row using razorpay_refund_id as unique key.
 */

import { pool } from "../../../db";
import { sendRefundInitiatedEmail, sendRefundProcessedEmail } from "../../../email/sendMailFinal";
import { getUserDetailsForRefund } from "./getUserDetailsForRefund";
import { getUserDetails } from "./getUserForDetails";
import { saveRefund } from "./saveRefund";
import { updateRefundInPayments } from "./updateRefundInPayments";

export async function handleRefundEvent(event: string, payload: any) {
  const refund = payload?.refund?.entity ?? null
  const payment = payload?.payment?.entity ?? null

  if (!refund) {
    console.warn("⚠️ Refund webhook without refund entity");
    return;
  }

  //storing the refund_id 
  const razorpay_payment_id = refund.payment_id

  try {
    /*
    This function will save the refund details in refund table
    */
    await saveRefund(refund)

    //update in the payment_details table


    /*
    this getUserForRefund returns 
      id: rows[0].owner_id,
      name: rows[0].owner_name,
      email: rows[0].owner_email,
      phone: rows[0].owner_phone
    */
    const user = await getUserDetailsForRefund(refund.payment_id);

    switch (event) {
      case "refund.created":
        console.log("refund created")
        sendRefundInitiatedEmail(refund, user, razorpay_payment_id)
          .catch(err => console.error("Refund initiated email failed:", err));
        break;

      case "refund.processed":
        console.log("refund processed")

        if (payment) {
          await updateRefundInPayments(payment);
        } else {
          console.warn("⚠️ refund.processed without payment entity");
        }


       await sendRefundProcessedEmail(user, refund, razorpay_payment_id)
          .catch(err => console.error("Refund processed email failed:", err));
        break;

      case "refund.failed":
       console.log("Refund failed")
        break;
    }


  } catch (err) {
    console.error("❌ Error in handleRefundEvent:", err);
    throw err;
  }
}








