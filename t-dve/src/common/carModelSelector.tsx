import React, { useEffect } from "react";
import InputController from "./InputController";
import { IonLabel, IonSkeletonText } from "@ionic/react";

interface Props {
  control: any;
  watch: any;
  setValue: any;
  toast: any;
  searchCarModel: any;
  carSuggestions: any[];
  setCarSuggestions: any;
  setSelectedCarId: any;
  carModelManuallySelectedRef: any;
  endpoint: string;
}

const CarModelSelector: React.FC<Props> = ({
  control,
  watch,
  setValue,
  toast,
  searchCarModel,
  carSuggestions,
  setCarSuggestions,
  setSelectedCarId,
  carModelManuallySelectedRef,
  endpoint,
}) => {
  const watchCarModel = watch("carModel");
  const [carLoading, setCarLoading] = React.useState(false);
  useEffect(() => {
    if (carModelManuallySelectedRef.current) {
      carModelManuallySelectedRef.current = false;
      return;
    }

    const delay = setTimeout(() => {
      if (watchCarModel?.length > 1) fetchCarModels(watchCarModel);
      else setCarSuggestions([]);
    }, 400);

    return () => clearTimeout(delay);
  }, [watchCarModel]);

  const fetchCarModels = async (query: string) => {
    setCarLoading(true);

    await searchCarModel([endpoint, { params: { query } }], {
      onCompleted: (res: any) => {
        setCarSuggestions(res?.data?.data || []);
        setCarLoading(false);
      },
      onError: () => {
        toast.error("Could not fetch car models");
        setCarLoading(false);
      },
    });
  };

  return (
    <div
      className="rounded-xl p-4 mb-4 bg-[#F8FAFC] mx-4"
      style={{ borderColor: "#E4EAF2" }}
    >
      <p className="text-[#7F8EA3] text-sm font-semibold mb-2">Car Model 
        <IonLabel className="text-[#0C1A30] font-medium">
         <span className="text-red-500"> *</span>
        </IonLabel>
      </p>

      <div className="relative">
        <InputController
          control={control}
          name="carModel"
          placeholder="Start typing your car model"
          required
        />

        {watchCarModel?.length >= 2 && !carModelManuallySelectedRef.current && (
          <ul className="absolute bg-white rounded-lg shadow-md max-h-40 overflow-y-auto z-50 w-full mt-1">
            {carLoading && (
              <>
                <li className="px-3 py-2">
                  <IonSkeletonText animated style={{ width: "75%" }} />
                </li>
                <li className="px-3 py-2">
                  <IonSkeletonText animated style={{ width: "65%" }} />
                </li>
                <li className="px-3 py-2">
                  <IonSkeletonText animated style={{ width: "80%" }} />
                </li>
              </>
            )}

            {!carLoading &&
              carSuggestions.length > 0 &&
              carSuggestions.map((car) => (
                <li
                  key={car.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setValue("carModel", car.model, { shouldValidate: true });
                    setSelectedCarId(car.id);
                    carModelManuallySelectedRef.current = true;
                    setCarSuggestions([]);
                  }}
                >
                  {car.model}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CarModelSelector;
