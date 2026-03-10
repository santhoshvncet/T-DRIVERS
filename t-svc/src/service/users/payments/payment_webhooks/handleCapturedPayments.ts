import { sendPaymentSuccessEmail } from "../../../email/sendMailFinal";
import { getUserDetails } from "./getUserForDetails";
import { updatePaymentFromWebhook } from "./updatePaymentFromWebhook";


export const handleCapturedPayments = async (payment: any) => {
   if (!payment?.order_id) {
    console.warn("⚠️ payment.captured without order_id");
    return;
  }
  try {

 //getting order details
 // const order = await getOrderByRazorpayOrderId(payment.order_id)

     /*
     this getUserForRefund returns 
       id: rows[0].owner_id,
       name: rows[0].owner_name,
       email: rows[0].owner_email,
       phone: rows[0].owner_phone
     */ 
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
    payment_status: "captured",
  });

  
  //send the mail
   await sendPaymentSuccessEmail(
      user,
      payment,
      payment.amount,
      payment.currency,
    ).catch(err => {
      console.error("Payment success email failed:", err);
    });

  } catch (error) {
    console.log("here the error in the saving payment details", error)
  }
  
}