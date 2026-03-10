// Import necessary dependencies
import React, { useContext, useEffect, useRef, useState } from "react";
import PageLayout from "../modules/common/layout/PageLayout";
import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCol,
  IonGrid,
  IonIcon,
  IonImg,
  IonLabel,
  IonPopover,
  IonRow,
  IonSkeletonText,
  IonToggle,
} from "@ionic/react";
import {
  chevronBack,
  closeCircleOutline,
  createOutline,
  saveOutline,
} from "ionicons/icons";
import { LoadingButton } from "./LoadingButton";
import { t } from "i18next";
import InputController from "./InputController";
import { useForm } from "react-hook-form";
import UploadCard from "./UploadCard";
import { Redirect, useHistory, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosinstance";
import { endPoints } from "../lib/constants/endpoints";
import useApiCall from "../hooks/useApi";
import CarPhotoGrid from "./carPhotos";
import ScanUploadSheet from "./ScanNupload";
import { useToast } from "../hooks/useToast";
import CustomDropdown from "./selectDropdown";
import { UserContext } from "../provider/UserProvider";
import { hasPermission } from '../utils/permissions'; // Import the permission helper
import util from "../utils";
import constants from "../lib/constants";

type PhotoKeys = "front" | "left" | "back" | "right";
type DocumentKeys =
  | "driving_license"
  | "aadhar_card"
  | "profile_photo"
  | "passbook_front_page"
  | "car_insurance"
  | "rc";

const AdminDetailsView = () => {
  const location = useLocation();
  const path = location.pathname.split("/");
  const isDriver = path[2]?.startsWith("get-driver-details");
  const history = useHistory();
  const toast = useToast();
  const { user } = useContext(UserContext);

  // Check if the user has at least "User View" permission to access the page
  const canView = hasPermission(user, "User View");
  if (!canView) {
    return <Redirect to="/home" />;
  }

  // Check if the user has "User Edit" permission for editing actions
  const canEdit = hasPermission(user, "User Edit");

  const validateAge = (value: string) => {
    const num = Number(value);
    if (!value) return "Age is required";
    if (!Number.isInteger(num)) return "Age must be a whole number";
    if (num < 18 || num > 80) return "Age must be between 18 and 80";
    return true;
  };

  const [data, setData] = useState<any>({});
  const [showPopover, setShowPopover] = useState(false);
  const [modalImage, setModalImage] = useState("");
  const [sheetType, setSheetType] = useState<DocumentKeys | null>(null);
  const [documentPreviews, setDocumentPreviews] = useState<
    Record<DocumentKeys, any | null>
  >({
    driving_license: null,
    aadhar_card: null,
    profile_photo: null,
    passbook_front_page: null,
    car_insurance: null,
    rc: null,
  });
  
  const [carPhotos, setCarPhotos] = useState<
    Partial<Record<PhotoKeys, File | null>>
  >({ front: null, left: null, back: null, right: null });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileRefs = useRef<Record<DocumentKeys, File | null>>({
    driving_license: null,
    aadhar_card: null,
    profile_photo: null,
    passbook_front_page: null,
    car_insurance: null,
    rc: null,
  });

  const [getCity] = useApiCall(axiosInstance.get);

  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const cityManuallySelectedRef = useRef(false);

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const addressManuallySelectedRef = useRef(false);

  // --- INTERACTION TRACKERS (Ensures API only fires AFTER user starts typing/focusing) ---
  const [addressInteractionStarted, setAddressInteractionStarted] = useState(false);
  const [cityInteractionStarted, setCityInteractionStarted] = useState(false);

  const { control, reset, watch, setValue } = useForm({
    defaultValues: {
      profileImage: "",
      fullName: "",
      age: "",
      email: "",
      phoneNumber: "",
      area: "",
      city: "",
      state: "",
      drivingLicenseURL: "",
      aadhaarCardURL: "",
      transmission: "",
      boardType: "",
      accountHolderName: "",
      bankName: "",
      ifsc: "",
      passbookPage: "",
    },
    mode: 'onChange',
  });
  
  const watcharea = watch("area");
  const watchCity = watch("city");
  const fullName = watch("fullName")

  // --- Area Suggestion Logic ---
  useEffect(() => {
    // Requirement #4: Reset manual flag if input is cleared
    if (!watcharea || watcharea.length < 2) {
      addressManuallySelectedRef.current = false;
      setAddressSuggestions([]);
    }
  }, [watcharea]);

  useEffect(() => {
    // Fire API only if: (1) Editing, (2) Interaction started, (3) Length >= 2, (4) Not manually selected
    if (!isEditing || !addressInteractionStarted || addressManuallySelectedRef.current) return;

    if (watcharea && watcharea.length >= 2) {
      const timer = setTimeout(() => {
        fetchAddressSuggestions(watcharea.trim());
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setAddressSuggestions([]);
    }
  }, [watcharea, addressInteractionStarted, isEditing]);

  const fetchAddressSuggestions = async (val: string) => {
    setAddressLoading(true);
    await getCity([constants.GET_CITY_SEARCH_API, { params: { query: val } }], {
      onCompleted: (res) => {
        const data = res.data.data || [];
        if (data.length === 0) {
          setAddressSuggestions([
            {
              id: "manual",
              area: val,
              name: watchCity || "",
              state: watch("state") || "",
            },
          ]);
        } else {
          setAddressSuggestions(data);
        }
        setAddressLoading(false);
      },
      onError: () => {
        setAddressSuggestions([
          {
            id: "manual",
            area: val,
            name: watchCity || "",
            state: watch("state") || "",
          },
        ]);
        setAddressLoading(false);
      },
    });
  };

  // --- City Suggestion Logic ---
  useEffect(() => {
    // Reset manual flag if input is cleared (Requirement #4)
    if (!watchCity) {
      cityManuallySelectedRef.current = false;
      setCitySuggestions([]);
    }
  }, [watchCity]);

  useEffect(() => {
    // Fire API only if: (1) Editing, (2) Interaction started, (3) Length >= 2, (4) Not manually selected
    if (!isEditing || !cityInteractionStarted || cityManuallySelectedRef.current) return;

    if (watchCity && watchCity.length > 1) {
      const timer = setTimeout(() => {
        fetchCitySuggestions(watchCity.trim());
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setCitySuggestions([]);
    }
  }, [watchCity, cityInteractionStarted, isEditing]); 

  useEffect(() => {
    if (!watchCity) {
      setValue("state", "", { shouldValidate: true });
      setSelectedCityId(null);
      cityManuallySelectedRef.current = false;
    }
  }, [watchCity, setValue]);
  
  const fetchCitySuggestions = async (val: string) => {
    setCityLoading(true);
    await getCity([constants.GET_CITY_SEARCH_API, { params: { query: val } }], {
      onCompleted: (responseData) => {
        setCitySuggestions(responseData.data.data || []);
        setCityLoading(false);
      },
      onError: (error) => {
        console.error("City fetch failed:", error);
        setCityLoading(false);
      },
    });
  };

  const uniqueCitySuggestions = React.useMemo(() => {
    const map = new Map<string, any>();
    citySuggestions.forEach((c) => {
      const key = `${c.name}|${c.state}`;
      if (!map.has(key)) {
        map.set(key, c);
      }
    });
    return Array.from(map.values());
  }, [citySuggestions]);
  
  const driverCards = [
    {
      label: "Driving Licence",
      key: "driving_license",
      urlKey: "driving_license_url",
    },
    { label: "Aadhaar Card", key: "aadhar_card", urlKey: "aadhar_card_url" },
    {
      label: "Passbook Front Page",
      key: "passbook_front_page",
      urlKey: "passbookfrontimage",
    },
  ];

  const ownerDocs = [
    { label: "Car Insurance", key: "car_insurance", urlKey: "carInsurance" },
    { label: "RC Card", key: "rc", urlKey: "rc" },
  ];

  // Car model options for owners – label only model, value is car.id
  const carModelOptions = data?.cars?.length ? data.cars.map((car: any) => {
      return {
        label: `${car.brand} ${car.model_name}`,
        value: car.id.toString(),
      };
    })
  : [];
  
  const [car, setCar] = useState(""); // selected car.id as string
  const [selectedCar, setSelectedCar] = useState<any>(null);

  const openPopoverWithImage = (imgUrl: string) => {
    setModalImage(imgUrl);
    setShowPopover(true);
  };

  const fetchApi = async () =>
    axiosInstance.get(
      isDriver
        ? `${endPoints.GET_ADMIN_DRIVER_BY_ID}/${path[3]}`
        : `${endPoints.GET_ADMIN_OWNER_BY_ID}/${path[3]}`
    );
  const [apiCall] = useApiCall(fetchApi);

  const handleBackClick = () => {
    const tab = isDriver ? "driver" : "owner";
    history.push(`/approval?tab=${tab}`);
  };

  const handleCarPhotoUpload = (key: PhotoKeys, file: File) =>
    setCarPhotos((prev) => ({ ...prev, [key]: file }));

  const handleFileUpload = (file: File) => {
    if (!sheetType) return;
    fileRefs.current[sheetType] = file;
    setDocumentPreviews((prev) => ({
      ...prev,
      [sheetType!]: {
        type: file.type.includes("pdf") ? "pdf" : "image",
        preview: URL.createObjectURL(file),
      },
    }));
  };

  const scanDocument = async () => {
    if (!sheetType) return;
    // @ts-ignore
    const scanner = window.documentScanner;
    scanner.scanDoc(
      (res: any) => {
        const base64 = res?.image
          ? "data:image/jpeg;base64," + res.image
          : res?.scannedDocuments?.[0]?.base64
          ? "data:image/jpeg;base64," + res.scannedDocuments[0].base64
          : null;
        if (!base64) return toast.error("Scanning failed.");
        setDocumentPreviews((prev) => ({
          ...prev,
          [sheetType!]: { type: "image", preview: base64 },
        }));
      },
      { maxNumDocuments: 1, responseType: 0 }
    );
  };

  const { openSheet } = ScanUploadSheet({
    onScan: scanDocument,
    onUpload: () => fileInputRef.current?.click(),
  });

  const handleSave = async (status?: "verified" | "rejected") => {
    try {
      const values = watch();
      const formData = new FormData();

      if (isDriver) {
        const driverFields: Record<string, string> = {
  fullName: "full_name",
  age: "age",
  email: "email",
  phoneNumber: "phone",
  area: "address",
  city: "cityName",
  state: "stateName",
  transmission: "transmission",
  boardType: "board_type",
  accountHolderName: "accountHolderName",
  bankName: "bankName",
  ifsc: "ifsc",
};


        Object.entries(driverFields).forEach(([formKey, backendKey]) => {
          const value = values[formKey as keyof typeof values];
          if (value !== undefined && value !== null && value !== "") {
            formData.append(backendKey, value as string);
          }
        });
      } else {
        const ownerFields: Record<string, string> = {
  fullName: "full_name",
  email: "email",
  area: "address",
  phoneNumber: "phone",
  city: "cityName",
  state: "stateName",
  transmission: "transmission",
  boardType: "board_type",   // <-- was "boardType"
  age: "age",
};

Object.entries(ownerFields).forEach(([formKey, backendKey]) => {
  const value = values[formKey as keyof typeof values];
  if (value !== undefined && value !== null && value !== "") {
    formData.append(backendKey, value as string);
  }
});

if (car) {
  formData.append("car_id", car);

  // model_id from response: model_id / car_model
  const modelId = selectedCar?.model_id ?? selectedCar?.car_model;
  if (modelId) {
    formData.append("model_id", String(modelId));
  }
}
      }

      Object.entries(fileRefs.current).forEach(([key, file]) => {
  if (file instanceof File) {
    let backendKey = key;
    if (key === "passbook_front_page") {
      backendKey = "passbook_front_image"; // matches router
    }
    formData.append(backendKey, file);
  }
});

      if (!isDriver) {
        Object.entries(carPhotos).forEach(([key, file]) => {
          if (file) formData.append(key, file);
        });
      }

      if (status) {
        formData.append("status", status);
      }

      const endpoint = isDriver
        ? endPoints.UPDATE_DRIVER_BY_ID
        : endPoints.UPDATE_OWNER_BY_ID;

      const res = await axiosInstance.put(
        `${endpoint}/${path[3]}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res?.data?.status) {
  const updated = res.data.data;
  setData(updated);

  // refresh form values
  if (isDriver) {
    // ---------- DRIVER ----------
    reset({
      profileImage: updated.profile_photo_url || "",
      fullName: updated.full_name || "",
      age: updated.age || "",
      email: updated.email || "",
      phoneNumber: updated.phone || updated.mobile || "",
      area: updated.address || "",
      city: updated.cityName || updated.cityname || "",
      state: updated.stateName || updated.statename || "",
      drivingLicenseURL: updated.driving_license_url || "",
      aadhaarCardURL: updated.aadhar_card_url || "",
      transmission: updated.transmission || "manual",
      boardType: updated.board_type || "whiteboard",
      accountHolderName: updated.accountholdername || "",
      bankName: updated.bankname || "",
      ifsc: updated.ifsc || "",
      passbookPage:
        updated.passbookfrontimage || updated.passbook_front_image_url || "",
    });

    setDocumentPreviews((prev) => ({
      ...prev,
      driving_license: updated.driving_license_url
        ? { type: "image", preview: updated.driving_license_url }
        : null,
      aadhar_card: updated.aadhar_card_url
        ? { type: "image", preview: updated.aadhar_card_url }
        : null,
      profile_photo: updated.profile_photo_url
        ? { type: "image", preview: updated.profile_photo_url }
        : null,
      passbook_front_page: updated.passbookfrontimage
        ? { type: "image", preview: updated.passbookfrontimage }
        : null,
    }));
  } else {
    // ---------- OWNER ----------
    // pick the car to show (try to keep the same selected car, fallback to first)
    let newSelectedCar: any = null;

    if (updated?.cars && updated.cars.length > 0) {
      if (car) {
        newSelectedCar =
          updated.cars.find((c: any) => c.id.toString() === car) ||
          updated.cars[0];
      } else {
        newSelectedCar = updated.cars[0];
      }
    }

    setSelectedCar(newSelectedCar || null);
    setCar(newSelectedCar ? newSelectedCar.id.toString() : "");

    reset({
  profileImage: updated.profile_url || "",
  fullName: updated.name || "",
  age: updated.age || "",
  email: updated.email || "",
  phoneNumber: updated.phone || "",
  area: updated.address || "",
  city: updated.cityName || "",
  state: updated.stateName || "",
  transmission: newSelectedCar?.transmission || "",
  boardType: newSelectedCar?.board_type || "",   // <-- use board_type
  // owner form doesn't use bank fields / passbookPage
  drivingLicenseURL: "",
  aadhaarCardURL: "",
  accountHolderName: "",
  bankName: "",
  ifsc: "",
  passbookPage: "",
});

    setDocumentPreviews((prev) => ({
  ...prev,
  car_insurance: newSelectedCar?.insurance
    ? { type: "image", preview: newSelectedCar.insurance }
    : null,
  rc: newSelectedCar?.rc_card
    ? { type: "image", preview: newSelectedCar.rc_card }
    : null,
}));

    setCarPhotos({
      front: null,
      left: null,
      back: null,
      right: null,
    });
  }

  setIsEditing(false);
  if (status) handleBackClick();
  toast.success("Updated successfully!");
} else {
        toast.error(res?.data?.message || "Something went wrong.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something went wrong.");
    }
  };

  // OWNER: when car model changes in dropdown
  const handleCarModelChange = (selected: any) => {
  const selectedValue =
    typeof selected === "string"
      ? selected
      : selected?.value ?? selected?.target?.value;

  if (!selectedValue) return;

  setCar(selectedValue); // selected car.id

  if (!data?.cars || !data.cars.length) {
    setSelectedCar(null);
    return;
  }

  const newSelectedCar = data.cars.find(
    (c: any) => c.id.toString() === selectedValue
  );

  if (newSelectedCar) {
    setSelectedCar(newSelectedCar);

    // from response
    setValue("transmission", newSelectedCar.transmission || "");
    setValue("boardType", newSelectedCar.board_type || "");

    setDocumentPreviews((prev) => ({
      ...prev,
      car_insurance: newSelectedCar.insurance
        ? { type: "image", preview: newSelectedCar.insurance }
        : null,
      rc: newSelectedCar.rc_card
        ? { type: "image", preview: newSelectedCar.rc_card }
        : null,
    }));

    setCarPhotos({
      front: null,
      left: null,
      back: null,
      right: null,
    });
  }
};

  useEffect(() => {
    apiCall([], {
      onCompleted: (res) => {
        if (!res?.data?.status) return;
        const data = res.data.data;

        if (isDriver) {
          setData(data);
          reset({
            profileImage: data.profile_photo_url || "",
            fullName: data.full_name || "",
            age: data.age || "",
            email: data.email || "",
            phoneNumber: data.phone || data.mobile || "",
            area: data.address || "",
            city: data.cityName || data.cityname || "",
            state: data.stateName || data.statename || "",
            drivingLicenseURL: data.driving_license_url || "",
            aadhaarCardURL: data.aadhar_card_url || "",
            transmission: data.transmission || "manual",
            boardType: data.board_type || "whiteboard",
            accountHolderName: data.accountholdername || "",
  bankName: data.bankname || "",
  ifsc: data.ifsc || "",
  passbookPage:
    data.passbookfrontimage || data.passbook_front_image_url || "",
          });
          setDocumentPreviews({
            driving_license: data.driving_license_url
              ? { type: "image", preview: data.driving_license_url }
              : null,
            aadhar_card: data.aadhar_card_url
              ? { type: "image", preview: data.aadhar_card_url }
              : null,
            profile_photo: data.profile_photo_url
              ? { type: "image", preview: data.profile_photo_url }
              : null,
             passbook_front_page: data.passbookfrontimage
    ? { type: "image", preview: data.passbookfrontimage }
    : null,
            car_insurance: null,
            rc: null,
          });
          setCarPhotos({
            front: data.front_photo || null,
            left: data.left_photo || null,
            back: data.back_photo || null,
            right: data.right_photo || null,
          });
        } else {
  setData(data);

  const firstCar =
    data?.cars && data.cars.length > 0 ? data.cars[0] : null;

  if (firstCar) {
    setSelectedCar(firstCar);
    setCar(firstCar.id.toString());
  } else {
    setSelectedCar(null);
    setCar("");
  }

  reset({
    profileImage: data.profile_url || "",
    fullName: data.name || "",
    age: data.age || "",
    email: data.email || "",
    phoneNumber: data.phone || "",
    area: data.address || "",
    city: data.cityName || "",
    state: data.stateName || "",
    transmission: firstCar?.transmission || "",
    boardType: firstCar?.board_type || "", // <-- board_type
  });

  setDocumentPreviews((prev) => ({
    ...prev,
    car_insurance: firstCar?.insurance
      ? { type: "image", preview: firstCar.insurance }
      : null,
    rc: firstCar?.rc_card
      ? { type: "image", preview: firstCar.rc_card }
      : null,
  }));

  // optional: you can keep this as nulls; photos will be taken from selectedCar.photos in the UI
  setCarPhotos({
    front: null,
    left: null,
    back: null,
    right: null,
  });
}
      },
    });
  }, []);

  return (
    <PageLayout screenName={""}>
      <input type="file" ref={fileInputRef} accept="image/*,application/pdf" className="hidden"
        onChange={(e) =>
          e.target.files?.[0] && handleFileUpload(e.target.files[0])
        }
      />
      <IonGrid className="mx-3 mt-12">
        <IonRow className="flex justify-between items-center">
          <IonCol size="auto" className="flex justify-start">
            <LoadingButton type="button" icon={chevronBack} className="ion-button-transparent rounded-md w-8 h-8" handleButtonClick={handleBackClick} />
          </IonCol>
          <IonCol size="auto" className="flex justify-center">
            <IonAvatar className="h-24 w-24 ml-16"> {/* Adjusted for center avatar */}
              {(data?.profile_photo_url || data?.profile_url) ? <img
                src={data?.profile_photo_url || data?.profile_url || "https://ionicframework.com/docs/img/demos/avatar.svg"}
                className="object-cover w-full h-full" // Ensures image covers the fixed size
                alt={`${fullName} Profile`}
              />:
               (
                <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-900">
                  {fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </IonAvatar>
          </IonCol>
          <IonCol size="auto" className="flex justify-end">
            {/* Edit button is only shown if the user has "User Edit" permission */}
            {canEdit && (
              <LoadingButton  label={isEditing ? "Save" : "Edit"}  iconClassName="text-white"   type="button"   icon={isEditing ? saveOutline : createOutline}
                className="bg-[#0F172A] text-white w-24 h-10 flex items-center justify-center rounded-md normal-case bg-transparent"  // Tailwind fixed width and height for the Edit button
                handleButtonClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
              />
            )}
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Form fields */}
      <IonGrid className="m-3">
        {/* Name + Age */}
        <IonRow className="items-center gap-3">
          {[
            {
              name: "fullName",
              size: "8.5",
              placeholder: t("Enter your full name"),
            },
            {
              name: "age",
              size: "3",
              placeholder: t("Enter your age"),
              type: "number",
              maxlength: 3,
              inputMode: "numeric",
              validate: validateAge,
              className: "text-center",
            },
          ].map((field) => (
            <IonCol size={field.size} key={field.name}>
              <IonLabel className="text-sm font-medium text-gray-600">
                {field.name.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())} 
              </IonLabel>
              <InputController
                control={control}
                name={field.name}
                placeholder={field.placeholder}
                type={field.type as any}
                maxlength={field.maxlength}
                inputMode={field.inputMode as any}
                validate={field.validate || (() => true)}
                className={`px-4 py-2 ${field.className || ""}`}
                disabled={!isEditing}
              />
            </IonCol>
          ))}
        </IonRow>

        {/* Email + Phone */}
        <IonRow className="items-center gap-3 mt-2">
          {[
            {
              name: "email",
              size: "5.6",
              placeholder: t("Enter your email"),
              type: "email",
            },
            {
              name: "phoneNumber",
              size: "5.6",
              placeholder: t("Enter your phone number"),
              type: "tel",
              maxlength: 10,
            },
          ].map((field) => (
            <IonCol size={field.size} key={field.name}>
              <IonLabel className="text-sm font-medium text-gray-600">
                {field.name.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())} 
              </IonLabel>
              <InputController
                control={control}
                name={field.name}
                placeholder={field.placeholder}
                type={field.type as any}
                maxlength={field.maxlength}
                validate={() => true}
                className="px-4 py-2"
                disabled={!isEditing}
              />
            </IonCol>
          ))}
        </IonRow>

        {/* Area */}
        <IonRow className="items-center gap-3 mt-2">
          <IonLabel className="text-sm font-medium text-gray-600">
            Area
          </IonLabel>
          <IonCol size="12">
            <InputController
              control={control}
              name={'area'}
              placeholder={t(`Start typing area name`)}
              className="px-4 py-2"
              disabled={!isEditing}
              validate={util.validateAddress}
              handleFocus={() => setAddressInteractionStarted(true)} // Track interaction start
              handleBlur={() => setAddressInteractionStarted(false)} // Track interaction start
            />

            {watcharea?.length >= 2 && !addressManuallySelectedRef.current && addressInteractionStarted && (
                        <ul className="absolute bg-white rounded-lg shadow-md max-h-40 overflow-y-auto z-50 w-full mt-1">
                          {addressLoading && (
                            <li className="px-3 py-2">
                              <IonSkeletonText animated style={{ width: "80%" }} />
                            </li>
                          )}
            
                          {!addressLoading &&
                            addressSuggestions
                              .filter((item) => item.area && item.area.trim() !== "")
                              .map((item) => (
                                <li
                                  key={item.id}
                                  onClick={() => {
                                    setValue("area", item.area, {
                                      shouldValidate: true,
                                    });
            
                                    if (item.name) {
                                      setValue("city", item.name, { shouldValidate: true });
                                    }
                                    if (item.state) {
                                      setValue("state", item.state, {
                                        shouldValidate: true,
                                      });
                                    }
            
                                    if (item.id !== "manual") {
                                      setSelectedCityId(item.id);
                                    }
            
                                    cityManuallySelectedRef.current = true;
                                    setCitySuggestions([]);
            
                                    addressManuallySelectedRef.current = true;
                                    setAddressSuggestions([]);
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                  {[item.area, item.name, item.state]
                                    .filter(Boolean)
                                    .join(", ")}
                                </li>
                              ))}
                        </ul>
                      )}
          </IonCol>

         
        </IonRow>

        <IonRow className="items-center gap-3 mt-2">
           <IonCol size="5.6">
            <IonLabel className="text-sm font-medium text-gray-600">
              City 
            </IonLabel>
            <InputController
              control={control}
              name={'city'}
              placeholder={t(`Start typing city name`)}
              validate={util.validateName("City")}
              className="px-4 py-2"
              disabled={!isEditing}
              required
              handleFocus={() => setCityInteractionStarted(true)} // Track interaction start
              handleBlur={() => setCityInteractionStarted(false)} // Track interaction start
            />

             {watchCity?.length >= 2 && !cityManuallySelectedRef.current && cityInteractionStarted && (
                         <ul className="absolute bg-white  rounded-lg shadow-md max-h-40 overflow-y-auto z-50 w-full mt-1">
                           {cityLoading && (
                             <>
                               <li className="px-3 py-2">
                                 <IonSkeletonText animated style={{ width: "80%" }} />
                               </li>
                               <li className="px-3 py-2">
                                 <IonSkeletonText animated style={{ width: "70%" }} />
                               </li>
                               <li className="px-3 py-2">
                                 <IonSkeletonText animated style={{ width: "85%" }} />
                               </li>
                             </>
                           )}
             
                           {/* When not loading, show real suggestions */}
                           {!cityLoading &&
                             uniqueCitySuggestions.length > 0 &&
                             uniqueCitySuggestions.map((city) => (
                               <li
                                 key={`${city.name}-${city.state}`}
                                 onClick={() => {
                                   setValue("city", city.name, { shouldValidate: true });
                                   setValue("state", city.state, { shouldValidate: true });
                                   setSelectedCityId(city.id);
                                   setCitySuggestions([]);
                                   cityManuallySelectedRef.current = true;
                                 }}
                                 className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                               >
                                 {city.name}, {city.state}
                               </li>
                             ))}
                         </ul>
                       )}
          </IonCol>

          <IonCol size="5.6">
            <IonLabel className="text-sm font-medium text-gray-600">State</IonLabel>
            <InputController
              control={control}
              name={"state"}
              placeholder={t(`Start typing state name`)}
              validate={util.validateName("State")}
              className="px-4 py-2"
              disabled={!isEditing || !selectedCityId}
            />
          </IonCol>
        </IonRow>

        {/* Car Model Dropdown for Owner */}
        {!isDriver && (
          <IonRow>
            <div className="rounded-xl p-4 mb-4 bg-[#F8FAFC] w-full">
              <IonLabel className="text-sm font-semibold text-[#7F8EA3] mb-2 block">
                Car Model
              </IonLabel>
              <CustomDropdown
                options={carModelOptions}
                value={car} // use car id string
                onChange={handleCarModelChange}
                className="w-full"
                disabled={!isEditing || !carModelOptions.length}
                placeholder={
                  carModelOptions.length ? "Select car model" : "No car models"
                }
                truncateValue={50}
              />
            </div>
          </IonRow>
        )}

        {/* Car Photos Grid for Owner */}
        {!isDriver && (
  <IonRow>
    <div className="rounded-xl p-4 mb-4 bg-[#F8FAFC] w-full">
      <IonLabel className="text-sm font-semibold text-[#7F8EA3] mb-2 block">
        Car Type
      </IonLabel>
      <CarPhotoGrid
        carPhotos={{
          front: selectedCar?.photos?.front,
          back: selectedCar?.photos?.back,
          left: selectedCar?.photos?.left,
          right: selectedCar?.photos?.right,
        }}
        onUpload={handleCarPhotoUpload}
        editMode={isEditing}
        disabled={isEditing}
      />
    </div>
  </IonRow>
)}
      </IonGrid>

      {/* Document Cards */}
{isDriver
  ? driverCards.map((doc) => {
      const preview = documentPreviews[doc.key as DocumentKeys];
      const hasPreview = !!preview?.preview;

      return (
        <UploadCard
          key={doc.key}
          label={doc.label}
          preview={preview}
          // Disable only when there's nothing to click (no preview and not editing)
          disabled={!isEditing && !hasPreview}
          onClick={() => {
            if (hasPreview) {
              // Always open preview in new tab/window, edit or not
              window.open(preview.preview, "_blank");
              return;
            }

            // No preview: only allow upload when editing
            if (isEditing) {
              setSheetType(doc.key as DocumentKeys);
              openSheet();
            }
          }}
        />
      );
    })
  : ownerDocs.map((doc) => {
      const preview = documentPreviews[doc.key as DocumentKeys];
      const hasPreview = !!preview?.preview;

      return (
        <UploadCard
          key={doc.key}
          label={doc.label}
          preview={preview}
          disabled={!isEditing && !hasPreview}
          onClick={() => {
            if (hasPreview) {
              window.open(preview.preview, "_blank");
              return;
            }

            if (isEditing) {
              setSheetType(doc.key as DocumentKeys);
              openSheet();
            }
          }}
        />
      );
    })}

      {/* Transmission / Board toggles */}
      <IonGrid className="mx-8 my-2">
        <IonRow className="grid grid-cols-2 gap-y-2 gap-x-6">
          {["manual", "automatic"].map((tr) => (
            <IonLabel key={tr} className="flex items-center justify-between">
              {tr.charAt(0).toUpperCase() + tr.slice(1)}
              <IonToggle
                disabled={!isEditing}
                checked={watch("transmission") === tr}
                onIonChange={() => setValue("transmission", tr)}
              />
            </IonLabel>
          ))}
          {["whiteboard", "yellowboard"].map((bt) => (
            <IonLabel key={bt} className="flex items-center justify-between">
              {bt.charAt(0).toUpperCase() + bt.slice(1)}
              <IonToggle
                disabled={!isEditing}
                checked={watch("boardType") === bt}
                onIonChange={() => setValue("boardType", bt)}
              />
            </IonLabel>
          ))}
        </IonRow>
      </IonGrid>

      {/* Bank Details – driver only */}
      {isDriver && (
        <IonGrid className="my-3 mx-4">
          {["accountHolderName", "bankName", "ifsc"].map((field) => (
            <>
            <IonLabel className="text-sm font-medium text-gray-600">
                {field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())} 
              </IonLabel>
            <InputController
              key={field}
              control={control}
              name={field}
              placeholder={`Enter ${field}`}
              disabled={!isEditing}
              className="mb-2 px-4 py-2"
            />
            </>
          ))}
        </IonGrid>
      )}

      {/* Accept / Reject Buttons - only shown if the user has "User Edit" permission */}
      {canEdit && (
        <IonGrid className="mx-3 my-3">
          <IonRow className="flex gap-3">
            {["Reject", "Accept"].map((label) => (
              <IonCol key={label}>
                <LoadingButton
                  type="button"
                  className="bg-[#0F172A] text.white h-10 w-full flex items-center justify-center rounded-md normal-case bg-white"
                  iconClassName="text-white"
                  label={label}
                  handleButtonClick={() =>
                    handleSave(label === "Accept" ? "verified" : "rejected")
                  }
                />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      )}

      {/* Popover */}
      <IonPopover
        isOpen={showPopover}
        onDidDismiss={() => setShowPopover(false)}
        className="p-0"
      >
        <IonCard className="relative p-4 flex justify-center items-center max-w-lg max-h-[80vh]">
          <IonButton
            fill="clear"
            onClick={() => setShowPopover(false)}
            className="absolute top-1 right-0 text-gray-500 hover:text-gray-700"
          >
            <IonIcon icon={closeCircleOutline} size="large" />
          </IonButton>
          <IonImg src={modalImage} />
        </IonCard>
      </IonPopover>
    </PageLayout>
  );
};

export default AdminDetailsView;