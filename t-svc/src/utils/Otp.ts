import crypto from "crypto";
import axios from "axios";

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp: string): string {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

export function getOtpExpiry(minutes = 10): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

export function isSameDay(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}


export async function sendOtpSms(phone: string, otp: string) {
  const payload = {
    template_id: process.env.MSG91_TEMPLATE_ID,
    sender: process.env.MSG91_SENDER_ID,
    short_url: "0",
    mobiles: `91${phone}`,
    var: otp
  };

  return axios.post(
    "https://control.msg91.com/api/v5/flow/",
    payload,
    {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY!,
        "Content-Type": "application/json"
      }
    }
  );
}


export const TESTER_NUMBERS = new Set([
  '9876543210',
  '9999900000'
]);

export const TESTER_OTP = '987654';