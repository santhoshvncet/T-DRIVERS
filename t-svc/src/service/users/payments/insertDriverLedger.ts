
import { withTransaction } from "../../db";

const INSERT_LEDGER_ENTRY = `
  INSERT INTO wallet_ledger (
    driver_user_id,
    trip_id,
    payment_in_id,
    direction,
    purpose,
    amount,
    posted_at,
    meta,
    wallet_owner
  )
  VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7,$8)
  RETURNING id;
`;

type InsertDriverLedgerInput = {
  driverUserId: number | null;
  tripId: number | null;
  paymentInId: number | null;
  direction: "CREDIT" | "DEBIT";
  purpose: "TRIP_CREDIT" | "WITHDRAWAL" | "COMMISSION";
  amountPaise: number;
  meta?: any;
  wallet_owner : "COMPANY" | "DRIVER"
};

export async function insertLedger(input: InsertDriverLedgerInput) {
  const { driverUserId, tripId, paymentInId, direction, purpose, amountPaise, meta, wallet_owner } = input;
  
  try {
    const result = await withTransaction(async (client) => {
    const result = await client.query(INSERT_LEDGER_ENTRY, [
        driverUserId,
        tripId,
        paymentInId,
        direction,
        purpose,
        amountPaise,
        JSON.stringify(meta), 
       wallet_owner
      ])
      return result.rows[0];
    });

    return {
      success: true,
      ledger_id: result.id,
    };

  } catch (error: any) {
    console.error("insertLedger error:", error.message);
    throw error;
  }
}
