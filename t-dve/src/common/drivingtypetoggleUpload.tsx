import { IonLabel, IonToggle } from "@ionic/react";

type FieldType = "transmission" | "boardType";

interface ToggleGroupProps {
  watch?: (field: FieldType) => string;
  setValue?: (field: FieldType, value: string) => void;

  values?: {
    transmission?: string;
    boardType?: string;
  };
  onChange?: (vals: { transmission: string; boardType: string }) => void;

  readOnly?: boolean;
}

const ToggleGroup: React.FC<ToggleGroupProps> = ({
  watch,
  setValue,
  values,
  onChange,
  readOnly = false,
}) => {

  const getValue = (field: FieldType) => {
    if (values) return values[field] || "";
    if (watch) return watch(field) || "";
    return "";
  };

  const update = (field: FieldType, val: string) => {
    if (readOnly) return;

    if (setValue) {
      setValue(field, val);
    }

    if (onChange && values) {
      onChange({
        transmission: field === "transmission" ? val : values.transmission || "",
        boardType: field === "boardType" ? val : values.boardType || "",
      });
    }
  };

  return (
    <div
      className="border rounded-xl p-4 bg-[#F8FAFC] mb-5 mt-4 mx-4"
      style={{ borderColor: "#E6EDF5" }}
    >
      <IonLabel className="text-[#7F8EA3] text-sm font-semibold mb-3 block">
        Driving Type <span className="text-red-500">*</span>
      </IonLabel>

      <div className="grid grid-cols-2 gap-y-4 gap-x-4">

        <IonLabel className="flex items-center justify-between">
          Manual
          <IonToggle
            disabled={readOnly}
            checked={getValue("transmission") === "manual"}
            onIonChange={() => update("transmission", "manual")}
          />
        </IonLabel>

        <IonLabel className="flex items-center justify-between">
          Automatic
          <IonToggle
            disabled={readOnly}
            checked={getValue("transmission") === "automatic"}
            onIonChange={() => update("transmission", "automatic")}
          />
        </IonLabel>

        <IonLabel className="flex items-center justify-between">
          Whiteboard
          <IonToggle
            disabled={readOnly}
            checked={getValue("boardType") === "whiteboard"}
            onIonChange={() => update("boardType", "whiteboard")}
          />
        </IonLabel>

        <IonLabel className="flex items-center justify-between">
          Yellowboard
          <IonToggle
            disabled={readOnly}
            checked={getValue("boardType") === "yellowboard"}
            onIonChange={() => update("boardType", "yellowboard")}
          />
        </IonLabel>
      </div>
    </div>
  );
};

export default ToggleGroup;