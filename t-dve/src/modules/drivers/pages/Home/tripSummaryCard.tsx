import React from "react";
import {
  IonCard,
  IonCardContent,
  IonRow,
  IonCol,
  IonText,
  IonIcon,
  IonButton,
} from "@ionic/react";
import { locationOutline, arrowForwardOutline } from "ionicons/icons";

interface TripSummaryCardProps {
  brand: string;
  price: number;
  carType: string;
  transmission: string;
  boardType: string;
  fromCity: string;
  fromArea:string;
  fromState:string
  toCity: string;
  toArea:string;
  toState:string;
  startTime: string;
  endTime: string;
  onView?: () => void;
}

const TripSummaryCard: React.FC<TripSummaryCardProps> = ({
  brand,
  price,
  carType,
  transmission,
  boardType,
  fromCity,
  fromArea,
  fromState,
  toCity,
  toArea,
  toState,
  startTime,
  endTime,
  onView,
}) => {

  const originLine = [fromArea, fromCity, fromState].filter(Boolean).join(", ");
  const destinationLine = [toArea, toCity, toState].filter(Boolean).join(", ");
  return (
    <IonCard className="bg-[#FEF9E6] rounded-xl shadow-md w-full border border-gray-200">
      <IonCardContent className="p-4">

        {/* Title & Price */}
        <IonRow className="flex justify-between items-center mb-2">
          <IonText className="text-lg font-semibold">{brand}</IonText>
          <IonText className="text-lg font-semibold">₹ {price}</IonText>
        </IonRow>

        {/* Specs */}
        <IonText className="text-sm text-gray-700 mb-3 block">
          {carType} • {transmission} • {boardType} | For Trip
        </IonText>

        {/* Route */}
     {/* Route */}
<IonRow className="space-y-2">
  <IonCol size="12" className="flex items-center gap-2">
    <IonIcon icon={locationOutline} color="warning" />
    <IonText className="font-medium">{originLine}</IonText>
  </IonCol>

  <IonCol size="12" className="ml-5 border-l-2 border-gray-300 h-4" />

  <IonCol size="12" className="flex items-center gap-2">
    <IonIcon icon={locationOutline} color="success" />
    <IonText className="font-medium">{destinationLine}</IonText>
  </IonCol>
</IonRow>
        {/* Dates */}
        <IonRow className="flex justify-between items-center mt-4 text-center">
          <IonCol>
            <IonText className="font-semibold text-sm block">
              {startTime?.split(",")[0] || ""}
            </IonText>
            <IonText className="text-xs text-gray-500 block">
              {startTime?.split(",")[1] || ""}
            </IonText>
          </IonCol>

          <IonIcon icon={arrowForwardOutline} className="text-xl" />

          <IonCol>
            <IonText className="font-semibold text-sm block">
              {endTime?.split(",")[0] || ""}
            </IonText>
            <IonText className="text-xs text-gray-500 block">
              {endTime?.split(",")[1] || ""}
            </IonText>
          </IonCol>
        </IonRow>

        {/* View Details Button */}
        <IonButton
          expand="block"
          className="mt-4 h-12 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg"
          onClick={onView}
        >
          View Details
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default TripSummaryCard;
