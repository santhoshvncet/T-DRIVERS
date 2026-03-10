import React from "react";
import { IonLabel } from "@ionic/react";
import InputController from "../common/InputController";

interface CarModelDisplayProps {
  control: any;
  editMode: boolean;
}

const CarModelDisplay: React.FC<CarModelDisplayProps> = ({
  control,
  editMode=false,
}) => {
  return (
    <div className="rounded-xl p-4 mb-4 bg-[#F8FAFC] w-full">
      <IonLabel className="text-sm font-semibold text-[#7F8EA3] mb-2 block">
        Car Model
      </IonLabel>

      <InputController
        control={control}
        name="carModel"
        placeholder="Car model"
        required
        disabled
      />
    </div>
  );
};

export default CarModelDisplay;
