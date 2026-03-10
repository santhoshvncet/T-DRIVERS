import { useEffect, useState, useRef, useContext } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import PageLayout from "../../common/layout/PageLayout";
import InputController from "../../../common/InputController";
import useApiCall from "../../../hooks/useApi";
import axiosInstance from "../../../api/axiosinstance";
import constants from "../../../lib/constants";
import { LoadingButton } from "../../../common/LoadingButton";
import { useToast } from "../../../hooks/useToast";
import { UserContext } from "../../../provider/UserProvider";
import CarSelectTabs from "../../../common/carSelectTab";
import CarModelDisplay from "../../../common/carModelDisplay";
import CarTypeToggleGroup from "../../../common/carTypeToggle";
import UploadCard from "../../../common/UploadCard";
import ScanUploadSheet from "../../../common/ScanNupload";
import CarActionButtons from "../../../common/CarActionButtons";
import { useConfirmDelete } from "../../../common/ConfirmDeleteSheet";
import useNavigationHistory from "../../../hooks/useNavigationHistory";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

import { IonSkeletonText } from "@ionic/react";
import { useHistory } from "react-router";

export interface CarData {
  id: number;
  car_model: number;
  model_id: number;
  brand: string;
  model_name: string;
  transmission?: "manual" | "automatic" | "";
  board_type?: "whiteboard" | "yellowboard" | "";
  insurance?: string | null;
  rc_card?: string | null;
  is_primary?: boolean;
}

interface ManageForm {
  carModel: string;
  transmission: string;
  boardType: string;
  carInsurance: File | null;
  rcCard: File | null;
}

const TabsSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto px-3 py-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <IonSkeletonText
        key={i}
        animated
        style={{ width: 100, height: 40, borderRadius: 10 }}
      />
    ))}
  </div>
);

const CarModelSkeleton = () => (
  <div className="px-4 py-3">
    <IonSkeletonText animated style={{ width: "40%", height: 16 }} />
    <IonSkeletonText
      animated
      style={{ width: "100%", height: 45, marginTop: 10, borderRadius: 8 }}
    />
  </div>
);

const CarTypeSkeleton = () => (
  <div className="px-4 py-4">
    <IonSkeletonText animated style={{ width: "30%", height: 16 }} />

    <div className="flex gap-5 mt-3">
      <IonSkeletonText animated style={{ width: 80, height: 30 }} />
      <IonSkeletonText animated style={{ width: 80, height: 30 }} />
    </div>

    <div className="flex gap-5 mt-4">
      <IonSkeletonText animated style={{ width: 80, height: 30 }} />
      <IonSkeletonText animated style={{ width: 80, height: 30 }} />
    </div>
  </div>
);

const UploadCardSkeleton = () => (
  <div className="px-4 py-4">
    <IonSkeletonText animated style={{ width: "35%", height: 16 }} />
    <IonSkeletonText
      animated
      style={{
        width: "100%",
        height: 140,
        borderRadius: 12,
        marginTop: 12,
      }}
    />
  </div>
);

const ActionButtonsSkeleton = () => (
  <div className="flex gap-4 px-4 py-4">
    <IonSkeletonText animated style={{ height: 45, width: "100%" }} />
    <IonSkeletonText animated style={{ height: 45, width: "100%" }} />
  </div>
);

const ManageCarDetails: React.FC = () => {
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const toast = useToast();
  const { pushLatest } = useNavigationHistory();

  const [fetchCars] = useApiCall(axiosInstance.get);
  const [fetchModels] = useApiCall(axiosInstance.get);
  const [updateCar] = useApiCall(axiosInstance.put);
  const [deleteCar] = useApiCall(axiosInstance.delete);

  const [cars, setCars] = useState<CarData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [editMode, setEditMode] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [primaryCarId, setPrimaryCarId] = useState<number | null>(null); // Track primary car

  const history = useHistory();
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSwitch, setLoadingSwitch] = useState(false);

  // const [carModelMap, setCarModelMap] = useState<Record<number, string>>({});

  const [insurancePreview, setInsurancePreview] = useState<any>(null);
  const [rcPreview, setRcPreview] = useState<any>(null);
  const sheetTypeRef = useRef<"insurance" | "rc" | null>(null);

  const carInsuranceFileRef = useRef<File | null>(null);
  const rcCardFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // const [sheetType, setSheetType] = useState<"insurance" | "rc" | null>(null);

  const base64ToFile = (base64: string, filename: string) => {
    const arr = base64.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const scanDocument = async (forField: "carInsurance" | "rcCard") => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (!photo.base64String) {
        toast.error("Scanning failed.");
        return;
      }

      const base64String = "data:image/jpeg;base64," + photo.base64String;
      const file = base64ToFile(base64String, `${forField}-${Date.now()}.jpg`);

      if (forField === "carInsurance") {
        carInsuranceFileRef.current = file;
        setValue("carInsurance", file);
        setInsurancePreview({ type: "image", preview: base64String });
      } else {
        rcCardFileRef.current = file;
        setValue("rcCard", file);
        setRcPreview({ type: "image", preview: base64String });
      }
    } catch (err) {
      console.error("Camera scan error", err);
      toast.error("Camera permission denied or action cancelled.");
    }
  };

  const { openSheet } = ScanUploadSheet({
    onScan: () => {
      if (sheetTypeRef.current === "insurance") {
        scanDocument("carInsurance");
      } else if (sheetTypeRef.current === "rc") {
        scanDocument("rcCard");
      }
    },
    onUpload: () => fileInputRef.current?.click(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isValid },
  } = useForm<ManageForm>({
    defaultValues: {
      carModel: "",
      transmission: "",
      boardType: "",
      carInsurance: null,
      rcCard: null,
    },
    mode: "onChange",
  });

  // useEffect(() => {
  //   fetchModels(
  //     [constants.GET_CAR_MODEL_SEARCH_API, { params: { query: " " } }],
  //     {
  //       onCompleted: (res) => {
  //         const list = res?.data?.data || [];
  //         const map: Record<number, string> = {};
  //         list.forEach((item: any) => (map[item.id] = item.model));
  //         setCarModelMap(map);
  //       },
  //       onError: () => toast.error("Could not load car models"),
  //     }
  //   );
  // }, []);

  useEffect(() => {
    fetchCars([`${constants.GET_OWNER_CARS_API}/${user.userId}`], {
      onCompleted: (res) => {
        const cars = res?.data?.data || [];
        setCars(cars);
        setLoadingPage(false);

        // Set the primary car (if it exists)
        const primaryCar = cars.find((car: any) => car.is_primary);
        setSelectedCarId(primaryCar?.id || cars[0]?.id);
        if (primaryCar) {
          setActiveIndex(cars.indexOf(primaryCar));
          setPrimaryCarId(primaryCar.id);
        }
      },
      onError: () => {
        toast.error("Could not fetch cars.");
        setLoadingPage(false);
      },
    });
  }, []);
  useEffect(() => {
    fetchCars([`${constants.GET_OWNER_CARS_API}/${user.userId}`], {
      onCompleted: (res) => {
        const cars = res?.data?.data || [];
        setCars(cars);

        // Set the primary car (if it exists)
        const primaryCar = cars.find((car: any) => car.is_primary);
        setSelectedCarId(primaryCar?.id || cars[0]?.id);
        if (primaryCar) {
          setActiveIndex(cars.indexOf(primaryCar));
          setPrimaryCarId(primaryCar.id);
        }
      },
      onError: () => toast.error("Could not fetch cars."),
    });
  }, [user?.userId]);

    useEffect(() => {
    if (!selectedCarId) return;

    const activeCar = cars.find((c) => c.id === selectedCarId);
    if (!activeCar) return;

    reset({
      carModel: activeCar.brand + " " + activeCar.model_name,
      transmission: activeCar.transmission || "",
      boardType: activeCar.board_type || "",
    });

      setInsurancePreview(
        activeCar.insurance
          ? { type: "image", preview: activeCar.insurance }
          : null
      );

      setRcPreview(
        activeCar.rc_card
          ? { type: "image", preview: activeCar.rc_card }
          : null
      );
      carInsuranceFileRef.current = null;
      rcCardFileRef.current = null;
    }, [selectedCarId,cars]);


  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    const preview = URL.createObjectURL(file);

    if (sheetTypeRef.current === "insurance") {
      carInsuranceFileRef.current = file;
      // setValue("carInsurance", file);
      setInsurancePreview({
        type: "image",
        preview,
      });
    } else if (sheetTypeRef.current === "rc") {
      rcCardFileRef.current = file;
      // setValue("rcCard", file);
      setRcPreview({
        type: "image",
        preview,
      });
    }
  };

  const onSubmit = async (data: ManageForm) => {
    if (!selectedCarId) return;
    const activeCar = cars.find((c) => c.id === selectedCarId);
    if (!activeCar) return;

    const form = new FormData();
    form.append("model_id", String(activeCar.model_id));
    form.append("transmission", data.transmission);
    form.append("board_type", data.boardType);

    if (carInsuranceFileRef.current)
      form.append("car_insurance", carInsuranceFileRef.current);

    if (rcCardFileRef.current) form.append("rc_card", rcCardFileRef.current);

    await updateCar([`${constants.UPDATE_CAR_API}/${selectedCarId}`, form], {
      onCompleted: () => {
      toast.success("Car updated");
      setEditMode(false);

      setCars((prev) =>
        prev.map((c) =>
          c.id === selectedCarId
            ? {
                ...c,
                transmission: data.transmission as any,
                board_type: data.boardType as any,
                insurance: insurancePreview?.preview
                  ? String(insurancePreview.preview)
                  : c.insurance,
                rc_card: rcPreview?.preview
                  ? String(rcPreview.preview)
                  : c.rc_card,
              }
            : c
        )
      );
    },
      onError: () => toast.error("Update failed"),
    });
  };

  const handleRemoveCar = async () => {

    if (cars.length === 1) {
    toast.error("At least one car is required");
    return;
    }

    if (!selectedCarId) return;

    await deleteCar([`${constants.DELETE_CAR_API}/${selectedCarId}`], {
      onCompleted: () => {
        toast.success("Deleted");
        setCars((prev) => prev.filter((c) => c.id !== selectedCarId));
        const remainingCars = cars.filter((c) => c.id !== selectedCarId);
        setSelectedCarId(remainingCars[0]?.id || null);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  const confirmDelete = useConfirmDelete();

  const handleSetPrimary = (carId: number) => {
    setPrimaryCarId(carId);

    // Update car list so UI refreshes
    setCars((prev) =>
      prev.map((c) => ({
        ...c,
        is_primary: c.id === carId,
      }))
    );
  };

  const handleBackClick = () => {
    history.push("/owner-profile");
  };

  const showSkeleton = loadingPage || loadingSwitch;

  return (
    <PageLayout
      screenName={constants.ANALYTICS_SCREEN_NAME.MANAGE_CAR_DETAILS_PAGE}
      title="Manage Car"
      showBackButton
      backButtonClick={handleBackClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) =>
          e.target.files?.[0] && handleFileUpload(e.target.files[0])
        }
      />

      {showSkeleton ? (
        <>
          <TabsSkeleton />
          <CarModelSkeleton />
          <CarTypeSkeleton />
          <UploadCardSkeleton />
          <UploadCardSkeleton />
          <ActionButtonsSkeleton />
        </>
      ) : (
        <>
          <CarSelectTabs
            cars={cars}
            selectedCarId={selectedCarId}
            setSelectedCarId={setSelectedCarId}
            setEditMode={setEditMode}
            onAddCar={() => {
              if (cars.length >= 3) {
                toast.error("Maximum allowed cars is 3");
                return;
              }

              pushLatest("/cardetails?redirect=/manageCarDetails");
            }}
            isManage={true}
            primaryCarId={primaryCarId} // Pass the primary car ID
            handleSetPrimary={handleSetPrimary} // ⬅ ADD THIS
          />
          <div className="flex flex-col overflow-y-auto h-[80vh]">

          <CarModelDisplay control={control} editMode={editMode} />

          <CarTypeToggleGroup
            watch={watch}
            setValue={setValue}
            editMode={editMode}
          />

          <UploadCard
            label="Car Insurance"
            preview={insurancePreview}
            onClick={() => {
              if (!editMode) {
                if (insurancePreview?.preview)
                  window.open(insurancePreview.preview, "_blank");
                return;
              }
              sheetTypeRef.current = "insurance";
              openSheet();
            }}
          />

          <UploadCard
            label="RC Card"
            preview={rcPreview}
            onClick={() => {
              if (!editMode) {
                if (rcPreview?.preview)
                  window.open(rcPreview.preview, "_blank");
                return;
              }
              sheetTypeRef.current = "rc";
              openSheet();
            }}
          />

          <CarActionButtons
            editMode={editMode}
            setEditMode={setEditMode}
            handleSave={handleSubmit(onSubmit)}
            handleRemoveCar={() => confirmDelete(() => handleRemoveCar())}
            isValid={isValid}
          />
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default ManageCarDetails;
