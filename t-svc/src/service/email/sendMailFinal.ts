




import { sendEmail } from '../../config/emailConfig';
import { pool } from '../db';
import { ACCOUNT_DELETED_MAIL_TEMPLATE_TDRIVERS, BOOKING_CONFIRMATION_MAIL_TDRIVERS, FARE_PDF_EMAIL_TEMPLATE, PAYEMNT_REFUND_INTIATED, PAYMENT_FAILED_HTML, PAYMENT_SUCCESS_HTML, REFUND_EMAIL_PROCESSED_TEMPLATE, WELCOME_MAIL_TEMPLATE_TDRIVERS_DRIVER, WELCOME_MAIL_TEMPLATE_TDRIVERS_OWNER } from './EmailTemplates';

export const sendWelcomeEmailOwner = async (email: string, fullName: string) => {
  console.log("here is the email and full name ", email, fullName)
  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `Welcome to TDrivers, ${fullName}!`,
    htmlContent: WELCOME_MAIL_TEMPLATE_TDRIVERS_OWNER(fullName),
    textContent: `Welcome to TDrivers, ${fullName}! .`,
  })
}
export const sendWelcomeEmaildriver = async (email: string, fullName: string) => {
  console.log("here is the email and full name ", email, fullName)
  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `Welcome to TDrivers, ${fullName}!`,
    htmlContent: WELCOME_MAIL_TEMPLATE_TDRIVERS_DRIVER(fullName),
    textContent: `Welcome to TDrivers, ${fullName}! .`,
  })
}
export const sendAccountDeletedEmail = async (
  email: string,
  name: string
) => {
  console.log("sending account deleted email", email, name);

  return sendEmail({
    to: [{ email, name: name }],
    subject: 'Your TDrivers Account Has Been Deleted',
    htmlContent: ACCOUNT_DELETED_MAIL_TEMPLATE_TDRIVERS(name),
    textContent: `Hi ${name}, your TDrivers account has been successfully deleted.`,
  });
};

export const sendBookingEmailToOwner = async (
  owner_id: number,
  trip: { id: number },
  driver: any
) => {
  try {

    const ownerRes = await pool.query(
      `
      SELECT u.email, u.name
      FROM owner o
      JOIN users u ON u.id = o.users_id
      WHERE o.id = $1
      `,
      [owner_id]
    );

    if (ownerRes.rowCount === 0) return;

    const { email, name } = ownerRes.rows[0];


    const tripRes = await pool.query(
      `
SELECT
  t.id AS trip_id,
  c1.area AS pickup_location,
  c2.area AS drop_location,
  t.pickup_time,
  t.drop_time,
  t.duration_type,
  t.fare_amount AS fare
FROM trip t
JOIN city c1 ON c1.id = t.origin_id
JOIN city c2 ON c2.id = t.dest_id
WHERE t.id = $1;

      `,
      [trip.id]
    );

    if (tripRes.rowCount === 0) return;


    const tripForMail = tripRes.rows[0];


    const { trip_id, pickup_location, drop_location, pickup_time, drop_time, duration_type, fare } = tripForMail;

    const html = BOOKING_CONFIRMATION_MAIL_TDRIVERS(
      name,
      { trip_id, pickup_location, drop_location, pickup_time, drop_time, duration_type, fare },
      driver
    );

    await sendEmail({
      to: [{ email, name }],
      subject: "Your Trip Booking Details",
      htmlContent: html,
      textContent: `Hi ${name}, your trip is booked successfully!`,
    });

    console.log("Booking email sent to owner:", email);
  } catch (err) {
    console.error("Failed to send booking email:", err);
  }
};




function fmtAmount(paise?: number, rupeesFallback?: number): string {
  if (typeof paise === "number") {
    return `₹${(paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  if (typeof rupeesFallback === "number") {
    return `₹${rupeesFallback.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  return "₹0.00";
}

export async function sendRefundInitiatedEmail(
  refund: any,
  user: any,
  razorpay_payment_id: string
) {


  //const amountStr = fmtAmount(refund.amount, refund.currency || "INR");
  const amountStr = fmtAmount(Number(refund.amount), user.paymentAmountPaise);

  const heading = "Refund Initiated";

  const name = `${user.data.owner_name ?? ""}` || "there";

  const lines = [
    "We’ve initiated your refund request.",
    refund.speed ? `Speed: ${refund.speed}` : "",
  ].filter(Boolean);

  const htmlContent = PAYEMNT_REFUND_INTIATED(
    razorpay_payment_id,
    heading,
    name,
    refund.id,
    amountStr,
    refund.currency || "INR",
    lines
  );

  const textContent = `
${heading}

Hi ${name},

We’ve initiated your refund request.
${refund.speed ? `Speed: ${refund.speed}` : ""}

Refund ID: ${refund.id}
Amount: ${amountStr} ${refund.currency || "INR"}
– T-drivers Team
`;

  return sendEmail({
    to: [{ email: user?.data?.owner_email, name }],
    subject: `${heading} — ${refund.id}`,
    htmlContent,
    textContent,
  });
}


export async function sendRefundProcessedEmail(
  user: any,
  refund: any,
  razorpay_payment_id: any
) {

  const currency = refund.currency || "INR";

  const amountStr = fmtAmount(Number(refund.amount), Number(user.paymentAmountPaise) || 0);


  const heading = "Refund Processed";
  const when = refund.processed_at
    ? new Date(refund.processed_at * 1000).toLocaleString("en-GB", { hour12: false })
    : "Recently";
  const name = `${user?.data?.owner_name ?? ""}`.trim() || "there";

  const lines = [
    "Good news — your refund has been processed.",
    "It may take 1–3 working days to reflect in your bank (depends on your bank).",
    `Processed at: ${when}`,
  ];

  const htmlContent = REFUND_EMAIL_PROCESSED_TEMPLATE(
    heading,
    name,
    refund.id,
    refund.payment_id,
    amountStr,
    currency,
    lines,
  );

  const textContent = `${heading}

Hi ${name},

Good news — your refund has been processed.
It may take 1–3 working days to reflect in your bank (depends on your bank).
Processed at: ${when}

Refund ID: ${refund.id}
Payment ID: ${refund.payment_id}
Amount: ${amountStr} ${currency}

— College Raasta`;

  return sendEmail({
    to: [{ email: user?.data?.owner_email, name }],
    subject: `${heading} — ${refund.id}`,
    htmlContent,
    textContent,
  });
}


export async function sendPaymentSuccessEmail(
  user: any,
  payment: any,
  paymentAmountPaise: number,
  currency: string,

) {
  const ownerName = `${user?.data?.owner_name ?? ""}` || "there";

  console.log("here the user details", user?.data?.owner_email)
  const amountStr = fmtAmount(
    Number(payment.amount),
    Number(paymentAmountPaise)
  );

  const subject = `Payment Successful — ${payment.order_id}`;

  const htmlContent = PAYMENT_SUCCESS_HTML(
    ownerName,
    payment.order_id,
    amountStr,
    currency
  );

  const textContent = `Hi ${ownerName},

Your payment was successful

Order ID: ${payment.order_id}
Payment ID: ${payment.id}
Amount Paid: ${amountStr} ${currency}

Thank Yoyu for choosing T-drivers.

— T drivers Team`;


  return sendEmail({
    to: [{ email: user?.data?.owner_email, name: ownerName }],
    subject,
    htmlContent,
    textContent,
  });
}


export async function sendPaymentFailedEmail(
  user: any,
  payment: any,
  paymentAmountPaise: number,
  currency: string,
) {


  const OwnerName = `${user?.data?.owner_name ?? ""}` || "there";

  const amountStr = fmtAmount(payment.amount, paymentAmountPaise);
  const reason = payment.error_description || payment.failed_reason || "Payment failed";
  const subject = `Payment Failed — ${payment.order_id}`;
  const htmlContent = PAYMENT_FAILED_HTML(OwnerName, payment.order_id, amountStr, currency, reason);
  const textContent = `Hi ${OwnerName},


Order ID: ${payment.order_id}
Amount: ${amountStr} ${currency}
Reason: ${reason}
— T-drivers  Team`;
  return sendEmail({
    to: [{ email: user?.data?.owner_email, name: OwnerName }],
    subject,
    htmlContent,
    textContent,
  });
}



