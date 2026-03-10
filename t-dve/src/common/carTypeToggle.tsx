import { IonLabel, IonToggle } from "@ionic/react";

interface CarTypeToggleGroupProps {
  watch: any;
  setValue: any;
  editMode?: boolean;
}

const CarTypeToggleGroup: React.FC<CarTypeToggleGroupProps> = ({
  watch,
  setValue,
  editMode,
}) => {
  return (
    <div className=" rounded-xl p-4 mb-6 bg-white mx-4">
      <p className="text-sm font-semibold mb-4 text-[#7F8EA3]">Car Type
        <IonLabel className="text-[#0C1A30] font-medium">
                 <span className="text-red-500"> *</span>
        </IonLabel>
      </p>

      <div className="grid grid-cols-2 gap-y-4 gap-x-4">
        <div className="flex items-center justify-between">
          Manual
          <IonToggle
            checked={watch("transmission") === "manual"}
            disabled={!editMode}
            onIonChange={() => editMode && setValue("transmission", "manual")}
          />
        </div>

        <div className="flex items-center justify-between">
          Automatic
          <IonToggle
            checked={watch("transmission") === "automatic"}
            disabled={!editMode}
            onIonChange={() => editMode && setValue("transmission", "automatic")}
          />
        </div>

        <div className="flex items-center justify-between">
          Whiteboard
          <IonToggle
            checked={watch("boardType") === "whiteboard"}
            disabled={!editMode}
            onIonChange={() => editMode && setValue("boardType", "whiteboard")}
          />
        </div>

        <div className="flex items-center justify-between">
          Yellowboard
          <IonToggle
            checked={watch("boardType") === "yellowboard"}
            disabled={!editMode}
            onIonChange={() => editMode && setValue("boardType", "yellowboard")}
          />
        </div>
      </div>
    </div>
  );
};

export default CarTypeToggleGroup;