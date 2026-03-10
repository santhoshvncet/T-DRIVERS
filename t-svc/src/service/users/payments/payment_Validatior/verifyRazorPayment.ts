import Razorpay from "razorpay";
import env from "../../../../config/env";
import { AppError } from "../../../../config/errorHandle";



const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'XGZ7gG91uXXS8xgKRy7gRHLp',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_RwDKpJOIkszq4g',
});



export const verifyRazorpayPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  amount: number
) => {
  let payment: any;
  try {
    payment = await rzp.payments.fetch(razorpay_payment_id);
    console.log("Razorpay Payment Fetch Result:", payment);
  } catch (error: any) {
    throw new AppError("Unable to verify with Razorpay payment_id", 502, );
  }
 if (payment?.order_id !== razorpay_order_id) {
    throw new AppError("Order mismatch", 400);
  }
  const gatewayPaise = Number(payment?.amount) || 0;
  const expectedPaise = Math.round(Number(amount) * 100);
  if (gatewayPaise !== expectedPaise) {
    throw new AppError("Amount mismatch", 400);
  }
 if (payment?.currency !== "INR") {
    throw new AppError(`Unsupported currency: ${payment?.currency}`, 400);
  }
return payment;
};
