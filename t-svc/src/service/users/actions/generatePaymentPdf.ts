// service/users/actions/generateFarePdf.ts
import puppeteer from "puppeteer";
import { uploadBufferToS3 } from "../../../utils/uploadToS3";
import { FARE_PDF_EMAIL_TEMPLATE } from "../../email/EmailTemplates";
import { sendEmail } from "../../../config/emailConfig";


interface FareData {
  trip_id: number;
  actual_hours: number;
  estimated_hours: number;
  base_fare: number;
  extra_hour_charge: number;
  night_charge: number;
  driver_allowance: number;
  final_fare: number;
  distance_km: number;
  duration_type: "LOCAL" | "OUTSTATION";
}

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

// Convert hours to outstation base fare
const getOutstationBaseFare = (hours: number) => {
  if (hours <= 12) return 1500;
  if (hours <= 24) return 2000;
  return Math.ceil(hours / 24) * 2000;
};


export const generateAndUploadFarePdf = async (
  fare: FareData,
  ownerEmail?: string,
  ownerName?: string
) => {
  let browser;
  try {
    const extraHours = Math.max(fare.actual_hours - fare.estimated_hours, 0);
    // ---------- BASE FARE CALCULATION ----------
    let baseFareAmount = 0;
    let baseFareLabel = "";

    if (fare.duration_type === "LOCAL") {
      baseFareAmount = fare.base_fare;
      const extraLocalHours = Math.max(fare.estimated_hours - 2, 0);
baseFareAmount = 350 + extraLocalHours * 100; 
      baseFareLabel = `350 / 2h + 100 × ${extraLocalHours}`;
    } else {
      baseFareAmount = getOutstationBaseFare(fare.estimated_hours);

      if (fare.estimated_hours <= 12) {
        baseFareLabel = "≤ 12 hrs";
      } else if (fare.estimated_hours <= 24) {
        baseFareLabel = "≤ 24 hrs";
      } else {
        baseFareLabel = `${Math.ceil(fare.estimated_hours / 24)} Day(s)`;
      }
    }
  const nightChargeAmount = fare.night_charge;
const driverAllowanceAmount = fare.driver_allowance;
const extraHourChargeAmount = fare.extra_hour_charge;


console.log("night charge", nightChargeAmount)
console.log("fare", fare )

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #ffffff;
      padding: 30px;
      color: #333;
      font-size: 13px;
    }

    .container {
      max-width: 700px;
      margin: auto;
      border: 1px solid #ddd;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .logo {
      font-size: 22px;
      font-weight: bold;
    }

    .invoice-meta {
      text-align: right;
      font-size: 12px;
    }

    .section {
      margin-top: 15px;
    }

    .section-title {
      font-weight: bold;
      border-bottom: 1px dotted #999;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .row span:first-child {
      color: #555;
    }

    .total {
      font-weight: bold;
      font-size: 15px;
    }

    .note {
      font-size: 11px;
      color: #666;
      margin-top: 15px;
    }

    .footer {
      margin-top: 20px;
      font-size: 11px;
      text-align: center;
      color: #777;
    }
  </style>
</head>

<body>
  <div class="container">

    <!-- HEADER -->
    <div class="header">
      <div class="logo">TDrivers</div>
      <div class="invoice-meta">
        Invoice No: TD-${fare.trip_id}<br/>
        Date: ${new Date().toLocaleDateString()}
      </div>
    </div>

    <!-- RIDE DETAILS -->
    <div class="section">
      <div class="section-title">Ride Details</div>

      
      <div class="row">
        <span>Booked Hours</span>
        <span>${fare.estimated_hours} hrs</span>
      </div>

      <div class="row">
        <span>Exceeded Hours</span>
        <span>${Math.max(fare.actual_hours - fare.estimated_hours, 0)} hrs</span>
      </div>
    </div>
<div class="row">
        <span>Total Hours</span>
        <span>${fare.actual_hours} hrs</span>
      </div>

    <!-- FARE DETAILS -->
    <div class="section">
      <div class="section-title">Fare Details (₹)</div>

      <div class="row">
  <span>Base Fare</span>
  <span>${baseFareLabel} = ₹ ${baseFareAmount}</span>
</div>


      ${fare.extra_hour_charge > 0
        ? `
          <div class="row">
            <span>${fare.duration_type === "LOCAL" ? "Extra Hour Charge" : "Extra Day Charge"}</span>
            <span>${fare.extra_hour_charge}</span>
          </div>
        `
        : ""
      }

     <div class="row">
  <span>Night Charge</span>
  <span>₹ ${nightChargeAmount}</span>
</div>

      
      <div class="row">
        <span>Driver Allowance</span>
        <span>${fare.driver_allowance}</span>
      </div>

      <div class="row total">
        <span>Total Bill Payable</span>
        <span>₹ ${fare.final_fare}</span>
      </div>
    </div>

    <!-- PAYMENT DETAILS -->
    <div class="section">
      <div class="section-title">Payment Details (₹)</div>

      <div class="row">
        <span>Total Paid</span>
        <span>₹ ${fare.final_fare}</span>
      </div>

      <div class="row">
        <span>Balance Due</span>
        <span>₹ 0</span>
      </div>
    </div>

    <!-- BOOKING DETAILS -->
    <div class="section">
      <div class="section-title">Booking Details</div>

      <div class="row">
        <span>Service Type</span>
        <span>${fare.duration_type}</span>
      </div>

      <div class="row">
        <span>Booked By</span>
        <span>${ownerName ?? "Owner"}</span>
      </div>
    </div>

    <div class="note">
      * This is a system-generated invoice and does not require a signature.
    </div>
  </div>

      <p class="footer">
        39-40, 1st Floor, 2nd Cross, Govinda Reddy Layout, Bannerghatta Rd, opposite Arekere Mico Layout, Bengaluru, Karnataka 560076
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} TelliePact Global Tech Services LLP
    </div>

  </div>
</body>
</html>
`;



    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer: Buffer = Buffer.from(await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    }));

    const file: UploadFile = {
      buffer: pdfBuffer,
      originalname: `payment_${fare.trip_id}.pdf`,
      mimetype: "application/pdf",
    };

    // Upload PDF to S3
    const s3Url = await uploadBufferToS3(file, "TDriversDocuments");
    console.log("PDF uploaded to S3:", s3Url);

    if (ownerEmail && ownerName) {
      const emailHtml = FARE_PDF_EMAIL_TEMPLATE({
        ownerName,
        pdfUrl: s3Url,
      });

      await sendEmail({
        to: [{ email: ownerEmail, name: ownerName }],
        subject: "Your Trip Fare PDF",
        htmlContent: emailHtml,
        textContent: `Hi ${ownerName}, your fare PDF is ready: ${s3Url}`,
      });

      console.log("Fare PDF email sent to:", ownerEmail);


    } else {
      console.warn("Skipping email, ownerEmail or ownerName missing!");
    }

    return {
      Message: "Fare PDF uploaded successfully",
      data: s3Url,
      fileMime: file.mimetype,
      fileType: "pdf",
    };

  } catch (error) {
    console.error("Error generating/uploading fare PDF:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};
