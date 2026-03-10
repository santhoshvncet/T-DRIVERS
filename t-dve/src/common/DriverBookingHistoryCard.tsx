import React from "react";
import {
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonButton,
} from "@ionic/react";

import TripCard from "./TripCard";

interface Props {
  tripId: number;
  originCity: string;
  destCity: string;
  startDate: string;
  endDate: string;
  fareAmount: number;
}

const DriverBookingCard: React.FC<Props> = ({
  tripId,
  originCity,
  destCity,
  startDate,
  endDate,
  fareAmount,
}) => {

  return (
    <IonCard mode="ios" className="rounded-2xl mx-4 mb-3 shadow-sm">
      <IonCardContent>
        <IonGrid>
          {/* ✅ Trip ID */}
      <IonRow className="justify-center mb-1">
        <IonText className="text-gray-500 text-sm font-medium">
          Trip ID: {tripId}
        </IonText>
      </IonRow>
          <IonRow className="justify-center mt-1">
            <IonText className="text-green-600 text-lg font-semibold tracking-wide">
              Trip Completed
            </IonText>
          </IonRow>

          <TripCard
            editable={false}
            trip={{
              from: originCity,
              to: destCity,
              startDate,
              endDate,
            }}
          />

          <IonRow className="mt-3">
            <IonCol>
              <IonButton expand="block" className="amount-btn">
                Paid ₹{fareAmount}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

export default DriverBookingCard;
