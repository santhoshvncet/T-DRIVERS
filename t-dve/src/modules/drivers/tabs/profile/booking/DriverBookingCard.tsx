import React, { useEffect, useState } from "react";
import { IonCard, IonCardContent } from "@ionic/react"; 
import ActionButtons from "./view/ActionButton";

interface BookingCardProps {
  id: number;
  ownerId: number;
  carName: string;
  carType: string;
  transmission: string;
  boardType: string;
  distance: string;
  price: number | string;
  fromCity: string;
  toCity: string;
  startTime: string;
  endTime: string;
  tripType: string;
  expiryDate: number;
  originArea?: string;
originState?: string;
destinationArea?: string;
destinationState?: string;
  onView?: (id: number) => void;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onExpire?: (id: number) => void;
  hideActions?: boolean;
  hideTime?: boolean
}

const BookingCard: React.FC<BookingCardProps> = ({
  id,
  ownerId,
  carName,
  carType,
  transmission,
  boardType,
  distance,
  price,
  fromCity,
  toCity,
  startTime,
  endTime,
  tripType,
  expiryDate,
  onView,
  onAccept,
  onReject,
  onExpire,
  originArea,
originState,
destinationArea,
destinationState,
  hideActions = false,
  hideTime=false
}) => {

  const calculateRemaining = () => {
    const expiry = new Date(expiryDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiry - now) / 1000));
  };

  const [timeLeft, setTimeLeft] = useState(calculateRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        onExpire?.(id);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  const originLine = [originArea, fromCity, originState].filter(Boolean).join(", ");
  const destinationLine = [destinationArea, toCity, destinationState].filter(Boolean).join(", ");

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d : ${String(hours).padStart(2, "0")}h : ${String(minutes).padStart(2, "0")}m : ${String(secs).padStart(2, "0")}s`;
  };

  const formattedPrice = Number(price).toLocaleString("en-IN");

  return (
    <IonCard className="rounded-2xl shadow-lg bg-[#FEF9E7] w-full max-w-sm mx-auto border border-gray-300">
      
      {/* Timer */}
      <p
  style={{
    marginTop: "8px",
    marginBottom: "4px",
    fontSize: "14px",
    color: "#6B7280",
    fontWeight: 500,
  }}
  className="ml-3"
>
  Trip ID:{" "}
  <span style={{ color: "#111827", fontWeight: 600 }}>
    {id}
  </span>
</p>
  { !hideTime &&
       <div className="text-center py-3">
        <p className="text-sm text-gray-700">Booking Expire in</p>
        <p className="font-bold text-base tracking-wide text-gray-900">
          {formatTime(timeLeft)}
        </p>
      </div>
}
      <IonCardContent className="px-5 pb-6">
        {/* Title & Price */}
        <div className="flex justify-between items-center mt-3">
          <h2 className="text-lg font-bold text-black">{carName}</h2>
          <p className="text-lg font-bold text-black">₹ {formattedPrice}</p>
        </div>

        {/* ✅ Specs – single line */}
        <div className="flex justify-between items-center mt-1 text-sm font-medium">
          <p className="text-gray-500 truncate">
            {carType} • {transmission} • {boardType}
          </p>
          <p className="text-black whitespace-nowrap ml-2">
            {distance}
          </p>
        </div>

        {/* Route */}
        {/* <div className="mt-4 flex justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-sm font-medium text-gray-700">{fromCity}</span>
            </div>
            <div className="ml-3 border-l-2 border-gray-400 h-5"></div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-600"></span>
              <span className="text-sm text-gray-800">{toCity}</span>
            </div>
          </div>

          {tripType === "TWO_WAY" && (
            <div className="flex items-center justify-center mx-3">
              <span className="text-xl font-semibold text-gray-600">⇄</span>
            </div>
          )}

          {tripType === "TWO_WAY" && (
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-sm font-medium text-gray-700">{originLine}</span>
              </div>
              <div className="ml-3 border-l-2 border-gray-400 h-5"></div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-600"></span>
              <span className="text-sm text-gray-800">{destinationLine}</span>
              </div>
            </div>
          )}
        </div> */}
        {/* Route */}
<div className="mt-4 flex justify-between">
  <div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
      <span className="text-sm font-medium text-gray-700">{originLine}</span>
    </div>

    <div className="ml-3 border-l-2 border-gray-400 h-5"></div>

    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-green-600"></span>
      <span className="text-sm text-gray-800">{destinationLine}</span>
    </div>
  </div>

  {tripType === "TWO_WAY" && (
    <div className="flex items-center justify-center mx-1">
      <span className="text-xl font-semibold text-gray-600">⇄</span>
    </div>
  )}

  {tripType === "TWO_WAY" && (
    <div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
        <span className="text-sm text-gray-800">{destinationLine}</span>
      </div>
      <div className="ml-3 border-l-2 border-gray-400 h-5"></div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-600"></span>
        <span className="text-sm font-medium text-gray-700">{originLine}</span>
      </div>
    </div>
  )}
</div>


        {/* Dates */}
        <div className="flex justify-between items-center mt-5">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">
              {startTime.split(",")[0]}
            </p>
            <p className="text-xs text-gray-400">
              {startTime.split(",")[1]}
            </p>
          </div>

          <div className="text-center text-black font-medium">
            {tripType === "TWO_WAY" ? "Two-Way-Trip" : "One-Way-Trip"}
            <p className="text-xl">{tripType === "TWO_WAY" ? '⇄' : '→' }</p>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">
              {endTime.split(",")[0]}
            </p>
            <p className="text-xs text-gray-400">
              {endTime.split(",")[1]}
            </p>
          </div>
        </div>

        {!hideActions && (
          <ActionButtons
            id={id}
            ownerId={ownerId}
            showView
            onView={onView}
            onAccept={onAccept}
            onReject={onReject}
          />
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default BookingCard;
