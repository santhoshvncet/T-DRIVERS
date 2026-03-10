import { pool } from "../../db";

export const getDriverFare = async (payload: any) => {
  try {
    const { driver_id, tripId } = payload;

    // keep same old behavior: missing -> 404 with {message:'tripId not found'}
    if (!driver_id || !tripId) {
      return { status: false, msg: "tripId not found", notFound: true };
    }

    const query = `select fare_amount from trip t where t.driver_id =$1 and t.id =$2`;
    const response = await pool.query(query, [driver_id, tripId]);

    // keep same old behavior: 400 with empty body {}
    if (response.rowCount === 0) {
      return { status: false, badRequest: true, emptyBody: true };
    }

    const commissionQuery = `
      SELECT (amount/100) AS amount
      FROM wallet_ledger
      WHERE trip_id = $1
        AND purpose = 'COMMISSION';
    `;
    const commissionResult = await pool.query(commissionQuery, [tripId]);

    // to avoid crash if commission row missing
    const commission = commissionResult.rows[0] ?? { amount: 0 };

    const driverAmount = Number(response.rows[0].fare_amount) - Number(commission.amount);

    return {
      status: true,
      data: {
        success: true,
        data: response.rows[0],
        fullAmount: response.rows[0],
        DriverAmount: driverAmount,
        CommissionAmount: commission,
      },
    };
  } catch (error) {
    console.log("Internal Server Error", error);
    return { status: false, msg: "Internal Server Error", error };
  }
};