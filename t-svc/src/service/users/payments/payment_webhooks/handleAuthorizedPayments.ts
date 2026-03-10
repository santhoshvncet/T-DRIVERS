import { updatePaymentFromWebhook } from "./updatePaymentFromWebhook";

export const handleAuthorizedPayments = async(payment: any) => {

  if (!payment?.order_id) {
    console.warn("⚠️ payment.captured without order_id");
    return;
  }
 

 await updatePaymentFromWebhook({
      razorpay_order_id: payment.order_id,
      razorpay_payment_id: payment.id,
      gateway_amount_paise: payment.amount,
      payment_json: payment,
      payment_status: "authorized",
    });

console.log("authorised ", payment)
}
   