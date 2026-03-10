import React from "react";
import {
  IonModal,
  IonDatetime,
  IonButton,
} from "@ionic/react";

interface DateTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRef: React.RefObject<HTMLIonDatetimeElement>;
  pickupTime: number;
  dropTime: number;
  setPickupTime: (value: number) => void;
  setDropTime: (value: number) => void;
  confirmSelection: () => void;
  convertToTimeLabel: (time: number) => string;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  isOpen,
  onClose,
  dateRef,
  pickupTime,
  dropTime,
  setPickupTime,
  setDropTime,
  confirmSelection,
  convertToTimeLabel,
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <div className="p-4 bg-white h-full overflow-y-auto">
        {/* Date Picker */}
        <IonDatetime ref={dateRef} presentation="date" multiple className="rounded-xl" />

        {/* Pickup Time */}
        <div className="mt-6">
          <p className="font-medium">Pickup Time: {convertToTimeLabel(pickupTime)}</p>
          <input
            type="range"
            min={0}
            max={23.5}
            step={0.5}
            value={pickupTime}
            onChange={(e) => setPickupTime(parseFloat(e.target.value))}
            className="w-full accent-yellow-400 mt-2"
          />
        </div>

        {/* Drop Time */}
        <div className="mt-8">
          <p className="font-medium">Drop Time: {convertToTimeLabel(dropTime)}</p>
          <input
            type="range"
            min={0}
            max={23.5}
            step={0.5}
            value={dropTime}
            onChange={(e) => setDropTime(parseFloat(e.target.value))}
            className="w-full accent-yellow-400 mt-2"
          />
        </div>

        {/* Confirm Button */}
        <IonButton
          expand="block"
          className="mt-8 rounded-xl"
          style={{ background: "#FFD600", color: "#000" }}
          onClick={confirmSelection}
        >
          Find My Driver
        </IonButton>
      </div>
    </IonModal>
  );
};

export default DateTimePickerModal;
