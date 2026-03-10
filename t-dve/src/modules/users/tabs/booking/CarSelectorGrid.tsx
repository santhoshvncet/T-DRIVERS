import React from "react";
import { IonRow, IonCol, IonImg, IonIcon } from "@ionic/react";
import { addCircleOutline } from "ionicons/icons";
import useNavigationHistory from "../../../../hooks/useNavigationHistory";

interface CarSelectorGridProps {
  carList: any[];
  selectedCarId: number | null;
  setSelectedCarId: (id: number) => void;
   onAddCar: () => void;
}

const CarSelectorGrid: React.FC<CarSelectorGridProps> = ({
  carList,
  selectedCarId,
  setSelectedCarId,
  onAddCar,
}) => {
  const { pushLatest } = useNavigationHistory();

  const selectedCar = carList.find((car) => car.car_id === selectedCarId);

  const VehicleCard = ({ src, selected, addButton, onClick }: any) => (
    <IonCol>
      <div
        style={{
          width: "100%",
          height: "80px",
          borderRadius: "10px",
          border: selected ? "2px solid #FFD700" : "1px solid #ccc",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: addButton ? "#e9e9e9" : "transparent",
        }}
        onClick={onClick}
      >
        {addButton ? (
          <IonIcon
            icon={addCircleOutline}
            style={{ fontSize: "34px", color: "#FFC000" }}
          />
        ) : (
          <IonImg
            src={src}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    </IonCol>
  );

  return (
    <IonRow style={{ gap: 4, marginBottom: 20 }}>
      {carList.map((car) => (
        <VehicleCard
          key={car.car_id}
          src={car.front_image_url}
          selected={selectedCarId === car.car_id}
          onClick={() => setSelectedCarId(car.car_id)}
        />
      ))}

      {carList.length < 3 && (
        <VehicleCard addButton onClick={onAddCar} />

      )}
    </IonRow>
  );
};

export default CarSelectorGrid;
