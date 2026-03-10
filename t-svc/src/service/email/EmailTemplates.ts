export const WELCOME_MAIL_TEMPLATE_TDRIVERS_OWNER = (ownerName: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to TDrivers</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 24px;">
      
      <h2 style="color: #0a1136; margin-top: 0;">
        Hi ${ownerName},
      </h2>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        Welcome to <strong style="color: #FFD700;">TDrivers</strong>!
      </p>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        Your registration has been completed successfully, and we are excited to have you onboard.
      </p>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        With TDrivers, you can easily manage trips, get real-time updates, and enjoy a reliable and convenient driving experience.
        Our goal is to make every journey smooth, safe, and stress-free for you.
      </p>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        If you need any help or have questions, our support team is always here to assist you.
      </p>

      <a href="https://tdrivers.in"
         style="display: inline-block; margin-top: 20px; background-color: #FFD700; color: #0a1136;
                padding: 12px 22px; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Visit TDrivers
      </a>

      <p style="margin-top: 30px; color: #0a1136; font-size: 15px;">
        Thank you for choosing TDrivers. We look forward to serving you!
      </p>

      <p style="margin-top: 20px; color: #0a1136; font-size: 15px;">
        Warm regards,<br />
        <strong>Team TDrivers</strong>
      </p>

    </div>
  </body>
</html>
`;
export const WELCOME_MAIL_TEMPLATE_TDRIVERS_DRIVER = (driverName: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to TDrivers</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 24px;">
      
      <h2 style="color: #0a1136; margin-top: 0;">
        Hi ${driverName},
      </h2>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        Welcome to <strong style="color: #FFD700;">TDrivers</strong>!
      </p>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        Your registration has been completed successfully, and we are excited to have you join our driver community.
      </p>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        You can now start accepting trips, managing your schedule, and earning with confidence on the TDrivers platform.
        We are committed to supporting you with reliable trip updates, smooth operations, and dedicated assistance whenever you need it.
      </p>

      <p style="color: #333; font-size: 15px; line-height: 1.6;">
        If you have any questions or require support, our team is always ready to help.
      </p>

      <a href="https://tdrivers.in"
         style="display: inline-block; margin-top: 20px; background-color: #FFD700; color: #0a1136;
                padding: 12px 22px; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Start Driving
      </a>

      <p style="margin-top: 30px; color: #0a1136; font-size: 15px;">
        Thank you for choosing TDrivers. We look forward to a great journey together!
      </p>

      <p style="margin-top: 20px; color: #0a1136; font-size: 15px;">
        Best regards,<br />
        <strong>Team TDrivers</strong>
      </p>

    </div>
  </body>
</html>
`;


export const ACCOUNT_DELETED_MAIL_TEMPLATE_TDRIVERS = (fullName: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Account Deleted - TDrivers</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 8px; padding: 20px;">
      <h2 style="color: #0a1136;">Hi ${fullName},</h2>

      <p style="color: #333;">
        This email is to confirm that your <strong style="color: #FFD700;">TDrivers</strong> account has been
        successfully deleted.
      </p>

      <p style="color: #333;">
        We're sorry to see you go. All your account data has been securely removed as per our policy.
      </p>

      <p style="color: #333;">
        If this action was not initiated by you or you believe this is a mistake, please contact our support team immediately.
      </p>

      <a href="https://tdrivers.in/support"
         style="display: inline-block; background: #FFD700; color: #0a1136; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: bold;">
        Contact Support
      </a>

      <p style="margin-top: 30px; color: #0a1136;">
        Thank you for being a part of TDrivers.<br />
        Team TDrivers
      </p>
    </div>
  </body>
</html>
`;

export const BOOKING_CONFIRMATION_MAIL_TDRIVERS = (
  ownerName: string,
  trip: {
    trip_id: number;
    pickup_location: string;
    drop_location: string;
    pickup_time: string;
    drop_time: string;
    duration_type: string;
    fare: number;
  },
  driver?: {
    name?: string;
    phone?: string;
    email?: string;
  }
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation - TDrivers</title>
</head>

<body style="margin:0;padding:0;background-color:#f2f4f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;
              border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;">

    <!-- Header -->
    <div style="background:#0a1136;padding:20px;text-align:center;">
      <h1 style="color:#FFD700;margin:0;">TDrivers</h1>
      <p style="color:#ffffff;margin:5px 0 0;">Trip Booking Confirmation</p>
    </div>

    <!-- Body -->
    <div style="padding:24px;color:#333;">
      <h2 style="color:#0a1136;">Hi ${ownerName}, 👋</h2>

      <p style="font-size:15px;line-height:1.6;">
        Your trip has been <strong style="color:#28a745;">successfully booked</strong>
        with <strong style="color:#FFD700;">TDrivers</strong>!
      </p>

      <!-- Trip ID -->
      <div style="margin:18px 0;padding:12px;background:#fef6d8;
                  border-left:5px solid #FFD700;border-radius:6px;">
        <strong>Trip ID:</strong> ${trip.trip_id}
      </div>

      <!-- Trip Details -->
      <h3 style="color:#0a1136;border-bottom:2px solid #FFD700;padding-bottom:6px;">
        🚗 Trip Details
      </h3>
<table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;">
<tr>
  <td><strong>Pickup Location:</strong></td>
  <td>${trip.pickup_location}</td>
</tr>
<tr>
  <td><strong>Drop Location:</strong></td>
  <td>${trip.drop_location}</td>
</tr>
<tr>
  <td><strong>Pickup Time:</strong></td>
  <td>${trip.pickup_time}</td>
</tr>
<tr>
  <td><strong>Drop Time:</strong></td>
  <td>${trip.drop_time}</td>
</tr>
<tr>
  <td><strong>Trip Type:</strong></td>
  <td>${trip.duration_type}</td>
</tr>
<tr>
  <td><strong>Fare:</strong></td>
  <td style="color:#28a745;font-weight:bold;">₹${trip.fare}</td>
</tr>
</table> <!-- <-- Make sure to close the table here -->

${driver
    ? `
<!-- Driver Details -->
<h3 style="color:#0a1136;border-bottom:2px solid #FFD700;
           padding-bottom:6px;margin-top:25px;">
  👤 Driver Details
</h3>

<div style="background:#f8f9fb;padding:15px;border-radius:8px;">
  <p><strong>Name:</strong> ${driver.name || "N/A"}</p>
  <p><strong>Phone:</strong> ${driver.phone || "N/A"}</p>
  <p><strong>Email:</strong> ${driver.email || "N/A"}</p>
</div>
`
    : `
<p style="margin-top:20px;font-size:15px;line-height:1.6;">
  A driver will be assigned shortly, and you will receive a notification
  once your driver accepts the trip.
</p>
`
  }


      <p style="margin-top:25px;font-size:15px;">
        If you have any questions or need to make changes, feel free to contact
        our support team anytime.
      </p>

      <p style="margin-top:25px;color:#0a1136;font-size:15px;">
        Thank you for choosing <strong>TDrivers</strong>.
        We wish you a safe and smooth journey! 🚘
      </p>

      <p style="margin-top:20px;color:#0a1136;">
        Best regards,<br />
        <strong>Team TDrivers</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f2f4f8;text-align:center;padding:12px;
                font-size:12px;color:#777;">
      © ${new Date().getFullYear()} TDrivers. All rights reserved.
    </div>

  </div>
</body>
</html>
`;


interface FarePdfEmailOptions {
  ownerName?: string;
  pdfUrl?: string;
  downloadLink?: string;
}

export const FARE_PDF_EMAIL_TEMPLATE = (opts: FarePdfEmailOptions = {}) => {
  const {
    ownerName = "",
    pdfUrl = "",
    downloadLink = pdfUrl,
  } = opts;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Fare PDF</title>
  </head>
  <body style="
    font-family: Arial, sans-serif;
    background-color: #f6f8fb;
    padding: 20px;
    color: #333333;
  ">

    <div style="
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    ">

      <h2 style="color:#1a73e8; text-align:center;">
        Trip Fare Invoice
      </h2>

      <p>Hello <strong>${ownerName}</strong>,</p>

      <p>
        Your trip has been successfully completed.  
        Please find your fare invoice below.
      </p>

      ${downloadLink
      ? `
          <div style="text-align:center; margin:25px 0;">
            <a href="${downloadLink}" target="_blank" style="
              display:inline-block;
              background-color:#1a73e8;
              color:#ffffff;
              text-decoration:none;
              padding:12px 25px;
              font-size:16px;
              font-weight:600;
              border-radius:6px;
            ">
              Download PDF
            </a>
          </div>
        `
      : `
          <p style="
            font-size:14px;
            color:#777777;
            text-align:center;
            margin:20px 0;
          ">
            Your fare PDF is attached to this email.
          </p>
        `
    }

      <p style="margin-top: 30px;">
        Thank you for choosing <strong>TDrivers</strong>.
      </p>

      <p style="font-size: 13px; color:#777777;">
        If you have any questions, feel free to contact our support team.
      </p>

      <hr style="margin:30px 0; border:none; border-top:1px solid #eeeeee;" />

      <p style="font-size:12px; color:#999999; text-align:center;">
        © ${new Date().getFullYear()} TDrivers. All rights reserved.
      </p>

    </div>
  </body>
</html>
`;
};

export function PAYEMNT_REFUND_INTIATED(
  razorpay_payment_id: string,
  heading: string,
  userName: string,
  refundId: string,
  amountStr: string,
  currency: string,
  bodyLines: string[],
  cta?: { text: string; href: string }
) {
  const year = new Date().getFullYear();
  const ctaBlock = cta
    ? `<div style="text-align:center;margin-top:18px;">
         <a href="${cta.href}" style="display:inline-block;padding:10px 16px;background:#0C1436;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">
           ${cta.text}
         </a>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>${heading}</title>
    <style>
      body{margin:0;padding:0;background:#f5f6f8;font-family:"Segoe UI",Arial,sans-serif;}
      .container{max-width:600px;margin:30px auto;background:#fff;border-radius:10px;border:1px solid #eaeaea;padding:28px;}
      h2{color:#0C1436;text-align:center;font-size:22px;margin:0 0 8px;}
      p{color:#333;font-size:14px;line-height:1.6;margin:8px 0;}
      .info-box{background:#fafafa;border:1px solid #eaeaea;border-radius:8px;padding:16px;margin:16px 0;}
      .row{margin:6px 0;font-size:14px;}
      .label{color:#555;font-weight:600;}
      .footer{margin-top:24px;text-align:center;color:#888;font-size:12px;border-top:1px solid #eaeaea;padding-top:14px;}
    </style>
  </head>
  <body>
    <div class="container">
      <h2>${heading}</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      ${bodyLines.map(l => `<p>${l}</p>`).join("")}

      <div class="info-box">
       <div class="row"><span class="label">Payment ID:</span> ${razorpay_payment_id}</div>
        <div class="row"><span class="label">Refund ID:</span> ${refundId}</div>
        <div class="row"><span class="label">Amount:</span> ${amountStr}</div>
        <div class="row"><span class="label">Currency:</span> ${currency}</div>
      </div>
      ${ctaBlock}
      <p>Refund is intiated.</p>
      <p>Need help? Write to <a href="mailto:support@tdrivers.in" style="color:#0C1436;text-decoration:none;">support@tdrivers.com</a>.</p>
      <div class="footer">© ${year} <strong>T - drivers</strong></div>
    </div>
  </body>
</html>`;
}

export function REFUND_EMAIL_PROCESSED_TEMPLATE(
  heading: string,            // "Refund Processed"
  userName: string,           // "First Last"
  refundId: string,           // rfnd_xxx
  paymentId: string,          // pay_xxx
  amountStr: string,          // preformatted "₹2,500.00"
  currency: string,           // "INR"
  bodyLines: string[] = [],   // extra lines (e.g. processed at ...)
  cta?: { text: string; href: string }
) {
  const year = new Date().getFullYear();
  const ctaBlock = cta
    ? `<div style="text-align:center;margin-top:18px;">
         <a href="${cta.href}" style="display:inline-block;padding:10px 16px;background:#0C1436;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">
           ${cta.text}
         </a>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>${heading} - CollegeRaasta</title>
    <style>
      body{margin:0;padding:0;background:#f5f6f8;font-family:"Segoe UI",Arial,sans-serif;}
      .container{max-width:600px;margin:30px auto;background:#fff;border-radius:10px;border:1px solid #eaeaea;padding:28px;}
      h2{color:#0C1436;text-align:center;font-size:22px;margin:0 0 8px;}
      p{color:#333;font-size:14px;line-height:1.6;margin:8px 0;}
      .info-box{background:#fafafa;border:1px solid #eaeaea;border-radius:8px;padding:16px;margin:16px 0;}
      .row{margin:6px 0;font-size:14px;}
      .label{color:#555;font-weight:600;}
      .footer{margin-top:24px;text-align:center;color:#888;font-size:12px;border-top:1px solid #eaeaea;padding-top:14px;}
      @media (max-width:600px){ .container{ width:90% !important; padding:18px !important; } }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>${heading}</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      ${bodyLines?.map(l => `<p>${l}</p>`).join("")}

      <div class="info-box">
        <div class="row"><span class="label">Refund ID:</span> ${refundId}</div>
        <div class="row"><span class="label">Payment ID:</span> ${paymentId}</div>
        <div class="row"><span class="label">Amount:</span> ${amountStr} ${currency}</div>
      </div>

      ${ctaBlock}

      <p>The amount should reflect in your bank within <strong>1–3 working days</strong> (depends on your bank).</p>
      <p>Need help? Write to <a href="mailto:support@tdrivers.in" style="color:#0C1436;text-decoration:none;">support@tdrivers.in</a>.</p>
      <div class="footer">© ${year} <strong>T drivers</strong></div>
    </div>
  </body>
</html>`;
}



export function PAYMENT_SUCCESS_HTML(
  ownerName: string,
  orderId: string | number,
  amountStr: string,
  currency: string
) {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);padding:36px;">

          <!-- Success Icon -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <img 
                src="https://collegeraasta-prod.s3.ap-south-1.amazonaws.com/userDocuments/profile-1767956481980.jpg"
                alt="Payment Successful"
                width="72"
                height="72"
                style="border-radius:50%;display:block;"
              />
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h1 style="margin:0;font-size:22px;color:#0C1436;">
                Payment Successful
              </h1>
              <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">
                Your transaction has been completed
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="font-size:15px;color:#111827;line-height:1.7;padding-bottom:20px;">
              Hi <strong>${ownerName}</strong>,<br /><br />
              We’re happy to inform you that your payment was completed successfully.
              Here are your transaction details:
            </td>
          </tr>

          <!-- Payment Details (Clean, No Border) -->
          <tr>
            <td style="padding:16px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;color:#6b7280;padding:6px 0;">
                    Order ID
                  </td>
                  <td align="right" style="font-size:14px;color:#111827;font-weight:500;">
                    ${orderId}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#6b7280;padding:6px 0;">
                    Amount Paid
                  </td>
                  <td align="right" style="font-size:16px;color:#0C1436;font-weight:600;">
                    ${amountStr} ${currency}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:20px 0;">
              <div style="height:1px;background:#e5e7eb;"></div>
            </td>
          </tr>

          <!-- Thank You -->
          <tr>
            <td style="font-size:15px;color:#111827;line-height:1.7;">
              Thank you for choosing <strong>T-Drivers</strong>.
              We appreciate your trust and look forward to serving you again.
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding-top:24px;font-size:13px;color:#6b7280;">
              Need help? Contact us at
              <a href="mailto:support@tdrivers.in" style="color:#2563eb;text-decoration:none;">
                support@tdrivers.in
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;font-size:12px;color:#9ca3af;">
              © ${year} T-Drivers. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}


export function PAYMENT_FAILED_HTML(
  ownerName: string,
  orderId: string | number,
  amountStr: string,
  currency: string,
  failedReason: string,
) {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Payment Failed</title>
    <style>
      body { margin:0; padding:0; background:#f5f6f8; font-family:"Segoe UI", Arial, sans-serif; }
      .container { max-width:600px; margin:30px auto; background:#ffffff; border-radius:10px; border:1px solid #eaeaea; padding:28px; }
      h2 { color:#b00020; text-align:center; font-size:22px; margin-top:0; }
      p { color:#333333; font-size:14px; line-height:1.6; margin:8px 0; }
      .info-box { background:#fafafa; border:1px solid #eaeaea; border-radius:8px; padding:16px; margin:20px 0; }
      .info-row { margin:6px 0; font-size:14px; }
      .info-label { color:#555555; font-weight:600; }
      .highlight { color:#b00020; font-weight:600; }
      .retry-button { display:inline-block; background:#0C1436; color:#ffffff; text-decoration:none; padding:10px 18px; border-radius:6px; margin-top:20px; font-size:14px; }
      .footer { text-align:center; font-size:12px; color:#888888; margin-top:30px; border-top:1px solid #eaeaea; padding-top:16px; }
      @media (max-width:600px){ .container{ width:90% !important; padding:18px !important; } }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Payment Failed</h2>

      <p>Hi <strong>${ownerName}</strong>,</p>
      <p>Unfortunately, your payment could not be completed successfully. Please find the details below:</p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">Order ID:</span> ${orderId}</div>
        <div class="info-row"><span class="info-label">Amount:</span> ${amountStr} ${currency}</div>
        <div class="info-row"><span class="info-label highlight">Reason:</span> ${failedReason}</div>
      </div>

      <p>If any amount has been <strong>debited from your account</strong>, it will be <strong>automatically refunded within 5 working days</strong>.</p>

      <p>Please check your bank statement after this period. If you still don’t receive a refund, contact our support team at
        <a href="mailto:support@tdrivers.in" style="color:#0C1436; text-decoration:none;">support@tdrivers.in</a>.
      </p>

      <div class="footer">© ${year} <strong>T drivers</strong> — A safe way to travel.</div>
    </div>
  </body>
</html>`;
}
