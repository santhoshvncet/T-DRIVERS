import { pool } from "../../db";

const GET_COMPANY_BALANCE = `
  SELECT
    COALESCE(SUM(
      CASE
        WHEN direction = 'CREDIT' THEN amount
        WHEN direction = 'DEBIT' THEN -amount
      END
    ), 0) AS balance_paise
  FROM wallet_ledger
  WHERE wallet_owner = 'COMPANY';
`;

export const companyCommission = async () => {
  try {
    const result = await pool.query(GET_COMPANY_BALANCE);
    const balancePaise = Number(result.rows[0]?.balance_paise ?? 0);

    // return EXACT old body
    return {
      status: true,
      httpStatus: 200,
      body: {
        status: "success",
        data: {
          balance_paise: balancePaise,
          balance_rupees: balancePaise / 100,
        },
      },
    };
  } catch (error: any) {
    return {
      status: false,
      httpStatus: 500,
      body: {
        status: "failed",
        message: error.message || "Internal Server Error",
      },
      error,
    };
  }
};