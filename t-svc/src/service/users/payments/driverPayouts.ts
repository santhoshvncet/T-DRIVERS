import { AppError } from "../../../config/errorHandle";
import { getDriverBalance } from "./getDriverBalance";
import { insertLedger } from "./insertDriverLedger";

export const driverPayouts = async (payload: any) => {
  try {
    const { driver_user_id, amount_rupees } = payload;

    const driverUserId = Number(driver_user_id);
    const amountRupees = Number(amount_rupees);

    if (!Number.isInteger(driverUserId)) {
      throw new AppError("Invalid driver_user_id", 400);
    }

    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
      throw new AppError("Invalid payout amount", 400);
    }

    const amountPaise = Math.round(amountRupees * 100);

    const currentBalancePaise = await getDriverBalance(driverUserId);

    if (amountPaise > currentBalancePaise) {
      throw new AppError(
        `Insufficient balance. Available: ₹${currentBalancePaise / 100}`,
        400
      );
    }

    await insertLedger({
      driverUserId,
      tripId: null,
      paymentInId: null,
      direction: "DEBIT",
      purpose: "WITHDRAWAL",
      amountPaise,
      meta: { source: "MANUAL_TEST_PAYOUT" },
      wallet_owner: "DRIVER",
    });

    const updatedBalancePaise = await getDriverBalance(driverUserId);

    // EXACT old response body
    return {
      ok: true,
      httpStatus: 200,
      body: {
        status: "success",
        message: "Payout marked successfully",
        data: {
          paid_rupees: amountRupees,
          balance_rupees: updatedBalancePaise / 100,
        },
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      httpStatus: error.statusCode || 500,
      body: {
        status: "failed",
        message: error.message || "Internal Server Error",
      },
      error,
    };
  }
};