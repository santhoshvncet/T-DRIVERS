import React from "react";
import { IonGrid, IonRow, IonButton, IonIcon, IonCol } from "@ionic/react";
import { arrowForwardOutline, swapHorizontalOutline } from "ionicons/icons";
export type TripType = "oneway" | "twoway";

interface TripTypeSelectorProps {
  tripType: string;
  setTripType: (type: TripType) => void;
}

const TripTypeSelector: React.FC<TripTypeSelectorProps> = ({ tripType, setTripType }) => {
  const ButtonOption = ({
    label,
    selected,
    icon,
    onClick,
  }: {
    label: string;
    selected: boolean;
    icon: any;
    onClick: () => void;
  }) => (
    <IonButton
      expand="block"
      fill="clear"
      onClick={onClick}
      className={`rounded-xl h-12 w-full mb-1 sm:w-1/2 font-semibold ${
        selected ? "bg-[#FFD700] text-black shadow-md" : "bg-[#F7F8F9] text-black"
      }`}
    >
      <IonIcon icon={icon} className="mr-2 text-lg" />
      {label}
    </IonButton>
  );

  return (
    <div className="w-full overflow-x-auto">
      <p className="text-sm font-semibold text-black mb-1">Starting Point</p>
      <IonGrid>
        <IonRow className="flex justify-between">
          <IonCol size="6" className="p-0">
            <ButtonOption
              label="One Way"
              selected={tripType === "oneway"}
              icon={arrowForwardOutline}
              onClick={() => setTripType("oneway")}
            />
          </IonCol>
          <IonCol size="6" className="p-0">
            <ButtonOption
              label="Two Way"
              selected={tripType === "twoway"}
              icon={swapHorizontalOutline}
              onClick={() => setTripType("twoway")}
            />
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default TripTypeSelector;
