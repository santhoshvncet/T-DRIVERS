import React from "react";
import {
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonText,
} from "@ionic/react";

import DriverCard from "./DriverCard";
import TripCard from "./TripCard";

interface OwnerBookingHistoryProps {
  tripId?: number;
  originCity?: string;
  destCity?: string;
  startDate?: string;
  endDate?: string;
  fareAmount?: number;

  driverName?: string;
  driverPhone?: string;
  driverLanguages?: string[];
  driverStatus?: string;
  driverImg?: string;

  loading?: boolean;
  error?: string | null;
  empty?: boolean;

  onDriverCall?: () => void;
  onDriverMessage?: () => void;
  onDriverTrack?: () => void;
  onViewDriverProfile?: () => void;
}

const OwnerBookingHistory: React.FC<OwnerBookingHistoryProps> = ({
  tripId,
  originCity,
  destCity,
  startDate,
  endDate,
  fareAmount,

  driverName,
  driverPhone,
  driverLanguages,
  driverStatus = "Completed Trip",
  driverImg,

  loading,
  error,
  empty,

  onDriverCall,
  onDriverMessage,
  onDriverTrack,
  onViewDriverProfile,
}) => {

  if (loading) {
    return (
      <IonCard mode="ios">
        <IonCardContent style={{ textAlign: "center" }}>
          Loading booking...
        </IonCardContent>
      </IonCard>
    );
  }

  if (error) {
    return (
      <IonCard mode="ios">
        <IonCardContent style={{ textAlign: "center", color: "red" }}>
          {error}
        </IonCardContent>
      </IonCard>
    );
  }

  if (empty) {
    return (
      <IonCard mode="ios">
        <IonCardContent style={{ textAlign: "center" }}>
          No booking found.
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard mode="ios" className="rounded-2xl mb-2 shadow">
      <IonCardContent>
        <IonGrid>

          <IonRow className="justify-center mb-1">
  <IonText className="text-gray-500 text-sm font-medium">
    Trip ID: {tripId}
  </IonText>
</IonRow>

          {/* Title */}
          <IonRow className="justify-center mt-2">
            <IonText className="text-green-600 text-lg font-semibold tracking-wide">
              Trip Success
            </IonText>
          </IonRow>

          {/* ✅ REPLACED LOCATION + DATE/TIME WITH TRIPCARD */}
          <IonRow className="mt-3">
            <IonCol>
              <TripCard
                editable={false}
                trip={{
                  from: originCity!,
                  to: destCity!,
                  startDate: startDate!,
                  endDate: endDate!,
                }}
              />
            </IonCol>
          </IonRow>

          {/* Payment */}
          <IonRow className="mt-2">
            <IonCol>
              <IonButton expand="block" className="amount-btn">
                Paid ₹{fareAmount}
              </IonButton>
            </IonCol>
          </IonRow>

          {/* Driver Card */}
          <IonRow className="mt-3">
            <IonCol>
              <DriverCard
                name={driverName || "Unknown Driver"}
                phone={driverPhone ? Number(driverPhone) : undefined}
                avatarUrl={driverImg}
                languages={driverLanguages}
                statusText={driverStatus}
                onCall={onDriverCall}
                onMessage={onDriverMessage}
                onTrack={onDriverTrack}
                onViewProfile={onViewDriverProfile}
              />
            </IonCol>
          </IonRow>

        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

export default OwnerBookingHistory;
