import React, { useEffect } from "react";
import { IonGrid, IonRow, IonCol, IonButton, IonIcon } from "@ionic/react";
import { timeOutline, sunnyOutline } from "ionicons/icons";

interface DurationOptionSelectorProps {
  duration: string;
  setDuration: (value: string) => void;
  startDate: string | null;
  endDate: string | null;
}

const DurationOptionSelector: React.FC<DurationOptionSelectorProps> = ({
  duration,
  setDuration,
  startDate,
  endDate,
}) => {

  
  useEffect(() => {
    if (!startDate || !endDate) return;

    if (startDate === endDate) {
      setDuration("hours");   
    } else {
      setDuration("days");   
    }
  }, [startDate, endDate]);

  return (
    <div className="mt-4 border border-gray-100 rounded-xl p-3 bg-[#F7F8F9] shadow-sm">
      <p className="text-sm font-semibold text-gray-500 mb-3">Duration Option</p>

      <IonGrid>
        <IonRow>
          <IonCol size="6">
            <IonButton
              expand="block"
              fill="clear"
              onClick={() => setDuration("hours")}
              className={`rounded-xl h-12 font-semibold text-sm ${
                duration === "hours"
                  ? "bg-[#FFD700] text-black shadow"
                  : "bg-[#F5F5F5] text-gray-700"
              }`}
            >
              <IonIcon icon={timeOutline} className="mr-2 text-base" />
              Hours
            </IonButton>
          </IonCol>

          <IonCol size="6">
            <IonButton
              expand="block"
              fill="clear"
              onClick={() => setDuration("days")}
              className={`rounded-xl h-12 font-semibold text-sm ${
                duration === "days"
                  ? "bg-[#FFD700] text-black shadow"
                  : "bg-[#F5F5F5] text-gray-700"
              }`}
            >
              <IonIcon icon={sunnyOutline} className="mr-2 text-base" />
              Days
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default DurationOptionSelector;
