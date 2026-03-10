import { AppError } from "../../../config/errorHandle";

export const extractPaymentInfo = (payment: any) => {
  if (!payment?.amount) {
    throw new AppError("Invalid payment", 400);
  }

  const totalAmountPaise = Number(payment.amount);

  if (!Number.isInteger(totalAmountPaise) || totalAmountPaise <= 0) {
    throw new AppError("Invalid payment amount", 400);
  }

  return {
    paymentId: payment.id,
    totalAmountPaise,
    currency: payment.currency,
  };
};
