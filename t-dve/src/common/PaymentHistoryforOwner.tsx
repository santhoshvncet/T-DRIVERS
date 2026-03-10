import React from "react";
import { IonCard, IonCardContent, IonButton, IonIcon } from "@ionic/react";
import { ellipse, arrowDown } from "ionicons/icons";

export type PaymentStatus = "PAID" | "PENDING" | "REFUND" | "FAILED";

interface PaymentCardProps {
  tripId: number;
  originCity: string;
  destCity: string;
  endDate: string;
  fareAmount: number;
  status: PaymentStatus;
  handleClick?: () => void;
}

const STATUS_CONFIG = {
  PAID: {
    label: "Paid",
    bg: "#22c55e", // green-500
    text: "#ffffff",
  },
  PENDING: {
    label: "Pending",
    bg: "#facc15", // yellow-400
    text: "#000000",
  },
  REFUND: {
    label: "Refunded",
    bg: "#3b82f6", // blue-500
    text: "#ffffff",
  },
  FAILED: {
    label: "Failed",
    bg: "#ef4444", // red-500
    text: "#ffffff",
  },
} as const;

const PaymentCard: React.FC<PaymentCardProps> = ({
  tripId,
  originCity,
  destCity,
  endDate,
  fareAmount,
  status,
  handleClick
}) => {
  const formattedDate = new Date(endDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const { label, bg, text } = STATUS_CONFIG[status];

  return (
    <IonCard className="mx-4 my-3 rounded-2xl shadow-md">
      <IonCardContent className="p-4">
        <div className="flex justify-center mb-2">
  <span className="text-gray-500 text-sm font-medium">
    Trip ID: {tripId}
  </span>
</div>
        {/* Top */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className="flex items-center text-base font-medium">
              <IonIcon icon={ellipse} className="text-yellow-400 text-xs mr-3" />
              {originCity}
            </div>

            <div className="ml-[6px] h-4 w-px bg-gray-300 my-1" />

            <div className="flex items-center text-base font-medium">
              <IonIcon icon={arrowDown} className="text-green-500 text-xs mr-3" />
              {destCity}
            </div>
          </div>

          <div className="text-sm font-medium text-gray-700">
            {formattedDate}
          </div>
        </div>

        {/* Status Button */}
        <IonButton
          expand="block"
          style={
            {
              "--background": bg,
              "--color": text,
            } as React.CSSProperties
          }
          onClick={handleClick} 
          className="rounded-xl h-11 font-semibold"
        >
          {label} ₹
          {fareAmount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default PaymentCard;
