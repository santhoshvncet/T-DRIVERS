import { pool } from "../../db";

const GET_DRIVER_BALANCE = `
  SELECT
    COALESCE(SUM(
      CASE
        WHEN direction = 'CREDIT' THEN amount
        WHEN direction = 'DEBIT' THEN -amount
      END
    ), 0) AS balance_paise
  FROM wallet_ledger
    WHERE wallet_owner = 'DRIVER'
  AND driver_user_id = $1;
`;

export const getDriverBalance = async (
  driverUserId: any
): Promise<number> => {
  const result = await pool.query(GET_DRIVER_BALANCE, [driverUserId]);
  return Number(result.rows[0].balance_paise || 0);
};
