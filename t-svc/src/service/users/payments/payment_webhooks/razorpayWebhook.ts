import { pool, withTransaction } from "../../../db";
import Razorpay from "razorpay";
import { handleRefundEvent } from "./handleRefundEvent";
import { handleCapturedPayments } from "./handleCapturedPayments";
import { handleFailedPayments } from "./handleFailedPayments";
import { handleAuthorizedPayments } from "./handleAuthorizedPayments";

export const razorpayWebhook = async (req: any) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SCERECT;
  const signature = req.headers["x-razorpay-signature"] as string;
  const eventId = req.headers["x-razorpay-event-id"] as string | undefined;
  // NOTE: signature verification needs the exact raw body.
  // If your express.json() modifies body, verification can fail.
  // Keeping your current approach for now:
  if (!secret) {
    console.error("Razorpay webhook secret missing");
    return 
  }

  if (!signature) {
    console.warn("Missing Razorpay signature header");
    return 
  }

  let body: string;

  try {
    // IMPORTANT: req.rawBody must be enabled in Express middleware
    body = req.rawBody || JSON.stringify(req.body);
    Razorpay.validateWebhookSignature(body, signature, secret);
  } catch (err) {
    console.warn("Invalid Razorpay webhook signature");
    return 
  }

  const { event, payload } = req.body;

  // ACK IMMEDIATELY (Razorpay retries if slow)


  /* ---------------- PROCESS ASYNC ---------------- */
  setImmediate(async () => {
    try {
      if (!eventId) {
        console.warn("Missing x-razorpay-event-id header");
        return;
      }

      // Deduplicate
      const insertQuery = `
        INSERT INTO razorpay_webhook_events (event_id)
        VALUES ($1)
        ON CONFLICT (event_id) DO NOTHING
      `;
      const result =  await withTransaction(async (client) => {
      const result = await client.query(insertQuery, [eventId]);

      return result
      });

      if (result.rowCount === 0) {
        console.log("Duplicate webhook, skipping");
        return;
      }

      switch (event) {
        case "payment.authorized":
          await handleAuthorizedPayments(payload.payment.entity);
          break;

        case "payment.captured":
          await handleCapturedPayments(payload.payment.entity);
          break;

        case "payment.failed":
          await handleFailedPayments(payload.payment.entity);
          break;

        case "refund.created":
        case "refund.processed":
        case "refund.failed":
          await handleRefundEvent(event, payload);
          break;

        default:
          console.log("Unhandled Razorpay event:", event);
      }
    } catch (error) {
      console.error("Razorpay webhook processing error:", error);
    }
  });
};
