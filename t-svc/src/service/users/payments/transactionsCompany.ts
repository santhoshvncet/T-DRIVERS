import { pool } from "../../db";

const GET_COMPANY_COMMISSIONS = `
  SELECT
    id,
    trip_id,
    payment_in_id,
    direction,
    purpose,
    amount,
    posted_at,
    meta
  FROM wallet_ledger
  WHERE wallet_owner = 'COMPANY'
    AND purpose = 'COMMISSION'
  ORDER BY posted_at DESC;
`;

export const transactionsCompany = async () => {
  try {
    const result = await pool.query(GET_COMPANY_COMMISSIONS);

    const commissions = result.rows.map((row: any) => ({
      id: row.id,
      trip_id: row.trip_id,
      payment_in_id: row.payment_in_id,
      direction: row.direction,
      purpose: row.purpose,
      amount_paise: Number(row.amount),
      amount_rupees: Number(row.amount) / 100,
      posted_at: row.posted_at,
      meta: row.meta,
    }));

    // EXACT old response body
    return {
      ok: true,
      httpStatus: 200,
      body: {
        status: "success",
        count: commissions.length,
        data: commissions,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      httpStatus: 500,
      body: {
        status: "failed",
        message: error.message || "Internal Server Error",
      },
      error,
    };
  }
};