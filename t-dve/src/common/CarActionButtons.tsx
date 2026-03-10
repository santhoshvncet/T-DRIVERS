import React from "react";
import { LoadingButton } from "./LoadingButton";

interface CarActionButtonsProps {
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleSave: () => void;
  handleRemoveCar: () => void;
  isValid: boolean;
}

const CarActionButtons: React.FC<CarActionButtonsProps> = ({
  editMode,
  setEditMode,
  handleSave,
  handleRemoveCar,
  isValid,
}) => {
  return (
    <div className="flex gap-3 mt-6 mb-26 px-6 mx-4">
      {!editMode ? (
        <>
          <LoadingButton
            label="Edit"
            handleButtonClick={() => setEditMode(true)}
            fill="solid"
            color="dark"
            className="flex-1 h-12 rounded-xl bg-black text-white text-[15px] font-semibold"
            expand="block"
          />

          <LoadingButton
            label="Remove"
            handleButtonClick={handleRemoveCar}
            fill="solid"
            color="danger"
            className="flex-1 h-12 rounded-xl text-white text-[15px] font-semibold"
            expand="block"
          />
        </>
      ) : (
        <>
          <LoadingButton
            label="Save"
            type="button"
            disable={!isValid}
            handleButtonClick={handleSave}
            fill="solid"
            color="primary"
            className="flex-1 h-12 rounded-xl text-white text-[15px] font-semibold"
            expand="block"
          />

          <LoadingButton
            label="Cancel"
            handleButtonClick={() => setEditMode(false)}
            fill="solid"
            color="medium"
            className="flex-1 h-12 rounded-xl bg-gray-200 text-black text-[15px] font-semibold"
            expand="block"
          />
        </>
      )}
    </div>
  );
};

export default CarActionButtons;