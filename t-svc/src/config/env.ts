// config/env.ts
import dotenv from "dotenv";
dotenv.config();

const dev = {
  NODE_ENV: "dev",
  PORT: process.env.PORT || 3000,
  DB_CLIENT: "pg",
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  RAZORPAY_KEY_SECRET:process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_KEY_ID:process.env.RAZORPAY_KEY_ID,
  RAZORPAY_WEBHOOK_SCERECT: process.env.RAZORPAY_WEBHOOK_SCERECT

};

const prod = {
  NODE_ENV: "prod",
  PORT: process.env.PORT || 3000,
  DB_CLIENT: "pg",
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  RAZORPAY_KEY_SECRET:process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_KEY_ID:process.env.RAZORPAY_KEY_ID,
  RAZORPAY_WEBHOOK_SCERECT: process.env.RAZORPAY_WEBHOOK_SCERECT
};

let env = dev;
if (process.env.NODE_ENV === "prod") {
  env = prod;
}


export const emailCredentials = {
  BREVO_API_KEY: process.env.BREVO_API_KEY,
};

console.log('api key',emailCredentials.BREVO_API_KEY)

console.log("Loaded Environment:", env.NODE_ENV);
console.log("DB_USER:", env.DB_USER);
console.log("DB_NAME:", env.DB_NAME);

export default env;
