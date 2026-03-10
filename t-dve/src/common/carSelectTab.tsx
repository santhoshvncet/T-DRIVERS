import React, { useState } from "react";
import { addCircleOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import axiosInstance from "../api/axiosinstance";
import { endPoints } from "../lib/constants/endpoints";
import useApiCall from "../hooks/useApi";

interface CarSelectTabsProps {
  cars: Array<{
    id: number;
    brand: string;
    model_name: string;
  }>;
  selectedCarId: number | null;
  setSelectedCarId: (id: number) => void;
  setEditMode?: (val: boolean) => void;
  onAddCar: () => void;
  isManage?: boolean;
  primaryCarId?: number | null;
  handleSetPrimary?: (carId: number) => void;
}

const CarSelectTabs: React.FC<CarSelectTabsProps> = ({
  cars,
  selectedCarId,
  setSelectedCarId,
  setEditMode,
  onAddCar,
  isManage,
  primaryCarId,
  handleSetPrimary
}) => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 const [get_status] = useApiCall(axiosInstance.put);
const handleSelectPrimary = async (carId: number) => {
  if (loading) return;

  try {
    setLoading(true);
    setError(null);

    await get_status(
      [`${endPoints.UPDATE_CAR_PRIMARY}/${carId}`],
      {
        onCompleted: (res: any) => {   // <-- type as 'any'
          if (res?.success) {
            handleSetPrimary?.(carId);
          }
        },
        onError: (err: any) => {
          console.error("Primary car update error:", err);
          setError("Failed to set car as primary.");
        },
      }
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex gap-3 p-3 overflow-x-auto mb-4">
      {cars.map((c) => {
        const isPrimary = c.id === primaryCarId;
        const isSelected = c.id === selectedCarId;

        return (
          <div key={c.id} className="relative">
            <button
              style={{ borderRadius: "6px" }}
              onClick={() => {
                setSelectedCarId(c.id);
                setEditMode?.(false);
              }}
              className={` w-34 p-3 rounded-xl flex justify-center items-center h-[56px] border-2 border border-yellow-500
                ${isSelected ? "border-yellow-400 bg-[#e9e9e9]" : "border-gray-300 bg-white/70"}
                ${isManage && isPrimary ? "border-yellow-500 bg-[#FFEB3B]" : ""}
              `}
            >
              <div className="flex items-center gap-2 mx-2">

                {/* ⭐ Yellow dot ALWAYS visible for primary cars */}
                {isPrimary && (
                  <span className="w-[10px] h-[10px] bg-yellow-500 rounded-full mx-1"></span>
                )}

                <p
                  className={`text-sm font-medium ${
                    isManage && isPrimary ? "text-black font-bold" : ""
                  }`}
                >
                  {c.brand + " " + c.model_name}
                </p>
              </div>
            </button>

            {/* Primary selector button only in Manage mode */}
            {isManage && isSelected && (
              <div className="w-full mt-2">
                <button
                  onClick={() => handleSelectPrimary(c.id)}
                  style={{ padding: "2px", borderRadius: "4px" }}
                  className={`w-full text-center text-white text-[12px]
                    ${isPrimary ? "bg-[#FFC000]" : "bg-[#FFC107]"}
                  `}
                  disabled={loading}
                >
                  {loading
                    ? "Setting Primary..."
                    : isPrimary
                    ? "Primary"
                    : "Select as Primary"}
                </button>

                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Car Button */}
      <button
        onClick={onAddCar}
        style={{ borderRadius: "6px" }}
        className="min-w-[140px] h-[56px] flex gap-2 items-center justify-center rounded-xl bg-[#e9e9e9]"
      >
        <IonIcon
          icon={addCircleOutline}
          style={{ fontSize: "22px", color: "#FFC000" }}
        />Add Car
      </button>
    </div>
  );
};

export default CarSelectTabs;
