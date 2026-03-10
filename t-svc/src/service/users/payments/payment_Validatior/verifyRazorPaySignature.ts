import crypto from "crypto";
import dotenv from "dotenv";
import { AppError } from "../../../../config/errorHandle";

dotenv.config();

export const verifyRazorPaySignature = (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): boolean => { 
      if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_SECRET environment variable is not defined");
  }

const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
    
  if (generatedSignature !== razorpay_signature) {
    throw new AppError("Signature mismatch", 400);
  }
   return true;
};
