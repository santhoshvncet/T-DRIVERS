import { useEffect, useState, useRef, useContext } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import PageLayout from "../../common/layout/PageLayout";
import useApiCall from "../../../hooks/useApi";
import axiosInstance from "../../../api/axiosinstance";
import constants from "../../../lib/constants";
import { LoadingButton } from "../../../common/LoadingButton";
import { useToast } from "../../../hooks/useToast";
import { UserContext } from "../../../provider/UserProvider";
import useNavigationHistory from "../../../hooks/useNavigationHistory";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import ScanUploadSheet from "../../../common/ScanNupload";
import UploadCard from "../../../common/UploadCard";
import CarTypeToggleGroup from "../../../common/carTypeToggle";
import CarModelSelector from "../../../common/carModelSelector";
import { useLandingPage } from "../../../hooks/useLandingPage";
import { Capacitor } from "@capacitor/core";
import { useLocation } from "react-router-dom";

interface CarFormData {
  carModel: string;
  transmission: string;
  boardType: string;
  carInsurance: File | null;
  rcCard: File | null;
}

const CarDetailsForm = () => {
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const toast = useToast();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/";

  const { updateUserLandingPage } = useLandingPage();
  const { OWNER_PROFILE_FORM } = constants.USER_LANDING_PAGE;
  const {HOME} = constants.USER_LANDING_PAGE;
  const { getLast, pushLatest } = useNavigationHistory();

  const [searchCarModel] = useApiCall(axiosInstance.get);
  const [submitCarDetails, { loading }] = useApiCall(axiosInstance.post);

  const [carSuggestions, setCarSuggestions] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const carModelManuallySelectedRef = useRef(false);

  const [insurancePreview, setInsurancePreview] = useState<any>(null);
  const [rcPreview, setRcPreview] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sheetTypeRef = useRef<"insurance" | "rc" | null>(null);
  const [carInsuranceDoc, setCarInsuranceDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const [rcCardDoc, setRcCardDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const [uploadingType, setUploadingType] = useState<
  "insurance" | "rc" | null
  >(null);


const scanDocument = async (forField: "carInsurance" | "rcCard") => {
  const photo = await Camera.getPhoto({
    quality: 90,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
  });

  if (!photo.dataUrl) return;

  const preview = photo.dataUrl;

  const response = await fetch(photo.dataUrl);
  const blob = await response.blob();
  const file = new File([blob], `${forField}-${Date.now()}.jpg`, {
    type: blob.type,
  });

  if (forField === "carInsurance") {
    setInsurancePreview({ type: "image", preview });
    await uploadDocument(file, "insurance");
  } else {
    setRcPreview({ type: "image", preview });
    await uploadDocument(file, "rc");
  }
};


  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid },
  } = useForm<CarFormData>({
    defaultValues: {
      carModel: "",
      transmission: "",
      boardType: "",
      carInsurance: null,
      rcCard: null,
    },
    mode: "onChange",
  });

  const watchCarModel = watch("carModel");

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

  const fetchCarModels = async (val: string) => {
    await searchCarModel(
      [constants.GET_CAR_MODEL_SEARCH_API, { params: { query: val } }],
      {
        onCompleted: (res) => setCarSuggestions(res?.data?.data || []),
        onError: () => toast.error("Could not fetch car models."),
      }
    );
  };


  const uploadDocument = async (
  file: File,
  type: "insurance" | "rc"
) => {
  setUploadingType(type); 

  const form = new FormData();
  form.append("file", file);
  form.append("user_id", String(user.userId));
  form.append("file_type", type);
  form.append("file_name", file.name);

  try {
    await submitCarDetails(
      [constants.UPLOAD_DOCUMENT_API, form],
      {
        onCompleted: (res) => {
          const data = res?.data?.data;

          if (type === "insurance") {
            setCarInsuranceDoc({
              url: data.s3_url,
              name: file.name,
            });
          } else {
            setRcCardDoc({
              url: data.s3_url,
              name: file.name,
            });
          }

          toast.success("Document uploaded successfully");
        },
        onError: () => {
          toast.error("Upload image of lower resolution");
        },
      }
    );
  } finally {
    setUploadingType(null); 
  }
};

const onSubmit = async (data: CarFormData) => {

  if (!data.transmission) {
    toast.error("Select transmission");
    return;
  }

  if (!data.boardType) {
    toast.error("Select board type");
    return;
  }

  console.log("Submitting with selectedCarId:", user.owner_id);
  
  const payload:any = {
    user_id: user.userId,
    owner_id: user.owner_id,
    car_model_id: selectedCarId,
    transmission: data.transmission,
    board_type: data.boardType,
  };
   if (carInsuranceDoc) {
    payload.car_insurance_url = carInsuranceDoc.url;
    payload.car_insurance_name = carInsuranceDoc.name;
  }

  if (rcCardDoc) {
    payload.rc_card_url = rcCardDoc.url;
    payload.rc_card_name = rcCardDoc.name;
  }

  await submitCarDetails(
    [constants.SUBMIT_CAR_DETAILS_API, payload],
    {
      onCompleted: async () => {
        if (params.get("redirect")) {
          pushLatest(redirectTo);
          return;
        }
        await updateUserLandingPage(false,HOME);
        pushLatest(redirectTo);
        toast.success("Car details submitted!");
        // window.location.href="/";
      },
      onError: (error) => {
        console.log("here is the uploaded image", error)
        toast.error("Required car fields are missing.", error);
      }
    }
  );
  // window.location.href = "/";
};


  const disable = !isValid || loading || !selectedCarId;

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

const handleFileUpload = async (file: File) => {
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    toast.error("Only image or PDF files are allowed");
    return;
  }

  const preview = URL.createObjectURL(file);

  if (sheetTypeRef.current === "insurance") {
    setInsurancePreview({ type: "image", preview });
    await uploadDocument(file, "insurance");
  }

  if (sheetTypeRef.current === "rc") {
    setRcPreview({ type: "image", preview });
    await uploadDocument(file, "rc");
  }
};


  const handleBackClick = async () => {
    const prevRoute = getLast();

    if (prevRoute === "/rent-your-driver") {
      return pushLatest("/rent-your-driver");
    }

    if (prevRoute === "/manageCarDetails") {
      return pushLatest("/manageCarDetails");
    }

    await updateUserLandingPage(false, OWNER_PROFILE_FORM);
  };

  return (
    <PageLayout
      screenName={constants.ANALYTICS_SCREEN_NAME.PREFRENCE_PAGE}
      title={t("Car Details")}
      showBackButton
      backButtonClick={handleBackClick}
    >
      <div className="pb-20">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) =>
          e.target.files?.[0] && handleFileUpload(e.target.files[0])
        }
      />

      <CarModelSelector
        control={control}
        watch={watch}
        setValue={setValue}
        toast={toast}
        searchCarModel={searchCarModel}
        carSuggestions={carSuggestions}
        setCarSuggestions={setCarSuggestions}
        setSelectedCarId={setSelectedCarId}
        carModelManuallySelectedRef={carModelManuallySelectedRef}
        endpoint={constants.GET_CAR_MODEL_SEARCH_API}
      />

      <CarTypeToggleGroup watch={watch} setValue={setValue} editMode />

      <UploadCard
        mandatory={false} 
        label="Car Insurance"
        preview={insurancePreview}
        disabled={uploadingType !== null && uploadingType !== "insurance"}
        onClick={() => {
          sheetTypeRef.current = "insurance";
          openSheet();
        }}
      />

      <UploadCard
        mandatory={false}
        label="RC Card"
        preview={rcPreview}
        disabled={uploadingType !== null && uploadingType !== "rc"}
        onClick={() => {
          sheetTypeRef.current = "rc";
          openSheet();
        }}
      />

      <LoadingButton
        label={t("Submit")}
        type="submit"
        loading={loading}
        disable={disable}
        className="ion-button-custom w-full mt-6 mb-6 mx-4 pb-18"
        handleButtonClick={handleSubmit(onSubmit)}
      />
      </div>
    </PageLayout>
  );
};

export default CarDetailsForm;