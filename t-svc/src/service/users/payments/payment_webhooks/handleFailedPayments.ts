
import { sendPaymentFailedEmail } from "../../../email/sendMailFinal";
import { getUserDetails } from "./getUserForDetails";
import { updatePaymentFromWebhook } from "./updatePaymentFromWebhook";


/*
this function handles the failed payment response which is coming form the webhook response
*/ 
//now lets work on the payment failure
export const handleFailedPayments = async (payment: any) => {
 if (!payment) {
    console.warn("⚠️ payment failed function recieved without payload");
    return;
  }

const user = await getUserDetails(payment.order_id);
  

   if (!user) {
   console.warn("User Not found");
   return;   
   }



  await updatePaymentFromWebhook({
    razorpay_order_id: payment.order_id,
    razorpay_payment_id: payment.id,
    gateway_amount_paise: payment.amount,
    payment_json: payment,
    payment_status: "failed",
  });
//  if (!paymentContext) {
//   console.warn("No payment context found in failed payments ");
//   return;
//  }



//after saving trigger the mail 
await sendPaymentFailedEmail(
  user, 
  payment,
   payment.amount,
  payment.currency,
).catch(err => {
  console.error("Payment failed email error:", err);
});

}



