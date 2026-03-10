/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useRef, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import PageLayout from "../../common/layout/PageLayout";
import useApiCall from "../../../hooks/useApi";
import axiosInstance from "../../../api/axiosinstance";
import constants from "../../../lib/constants";
import { LoadingButton } from "../../../common/LoadingButton";
import { useToast } from "../../../hooks/useToast";
import { UserContext } from "../../../provider/UserProvider";
import useNavigationHistory from "../../../hooks/useNavigationHistory";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import ToggleGroup from "../../../common/drivingtypetoggleUpload";
import UploadCard from "../../../common/UploadCard";
import ScanUploadSheet from "../../../common/ScanNupload";
import { useLandingPage } from "../../../hooks/useLandingPage";

interface DriverFormData {
  transmission: string;
  boardType: string;
  drivingLicense: File | null;
  aadharCard: File | null;
  profilePhoto: File | null;
}

const DriverRegistrationForm = () => {
  const { user } = useContext(UserContext);
  const toast = useToast();
  const { pushLatest } = useNavigationHistory();
  const { updateUserLandingPage } = useLandingPage();
  const { DRIVER_PROFILE_FORM } = constants.USER_LANDING_PAGE;

  const [submitDriverDetails, { loading }] = useApiCall(axiosInstance.post);

  /* -------------------- PREVIEWS -------------------- */
  const [licPreview, setLicPreview] = useState<any>(null);
  const [aadharPreview, setAadharPreview] = useState<any>(null);
  const [profilePreview, setProfilePreview] = useState<any>(null);

 
  const [drivingLicenseDoc, setDrivingLicenseDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const [aadharCardDoc, setAadharCardDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const [profilePhotoDoc, setProfilePhotoDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sheetTypeRef = useRef<"license" | "aadhar" | "profile" | null>(null);
  
  const [uploadingType, setUploadingType] = useState<
  "license" | "aadhar" | "profile" | null
  >(null);

  /* -------------------- FORM -------------------- */
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<DriverFormData>({
    defaultValues: {
      transmission: "",
      boardType: "",
      drivingLicense: null,
      aadharCard: null,
      profilePhoto: null,
    },
    mode: "onChange",
  });


  const uriToFile = async (uri: string, filename: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const uriToPreviewUrl = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };


 
  const uploadDocument = async (
    file: File,
    type: "license" | "aadhar" | "profile"
  ) => {
    setUploadingType(type); // 🔒 lock others

    const form = new FormData();
    form.append("file", file);
    form.append("user_id", String(user.userId));
    form.append("file_type", type);
    form.append("file_name", file.name);

    try {
    await submitDriverDetails(
      [constants.UPLOAD_DOCUMENT_API, form],
      {
        onCompleted: (res) => {
          const data = res?.data?.data;

          if (type === "license") {
            setDrivingLicenseDoc({ url: data.s3_url, name: file.name });
          } else if (type === "aadhar") {
            setAadharCardDoc({ url: data.s3_url, name: file.name });
          } else {
            setProfilePhotoDoc({ url: data.s3_url, name: file.name });
          }

          toast.success("Document uploaded successfully");
        },
        onError: () => toast.error("Document upload failed"),
      }
    );
  } finally {
    setUploadingType(null); // 🔓 unlock all
  }
  };

  const scanDocument = async (
    forField: "drivingLicense" | "aadharCard" | "profilePhoto"
  ) => {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    if (!photo.dataUrl) return;

    // const base64 = "data:image/jpeg;base64," + photo.base64String;
    // const file = base64ToFile(base64, `${forField}-${Date.now()}.jpg`);

    // const preview = await uriToPreviewUrl(photo.webPath);
    const preview = photo.dataUrl;

    const response = await fetch(photo.dataUrl);
    const blob = await response.blob();
    const file = new File(
      [blob],
      `${forField}-${Date.now()}.jpg`,
      { type: blob.type }
    );

    if (forField === "drivingLicense") {
      setLicPreview({ type: "image", preview });
      setValue("drivingLicense", file);
      await uploadDocument(file, "license");
    } else if (forField === "aadharCard") {
      setAadharPreview({ type: "image", preview });
      setValue("aadharCard", file);
      await uploadDocument(file, "aadhar");
    } else {
      setProfilePreview({ type: "image", preview });
      setValue("profilePhoto", file);
      await uploadDocument(file, "profile");
    }
  };


  const handleFileUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);

    if (sheetTypeRef.current === "license") {
      setLicPreview({ type: "image", preview });
      setValue("drivingLicense", file);
      await uploadDocument(file, "license");
    } else if (sheetTypeRef.current === "aadhar") {
      setAadharPreview({ type: "image", preview });
      setValue("aadharCard", file);
      await uploadDocument(file, "aadhar");
    } else if (sheetTypeRef.current === "profile") {
      setProfilePreview({ type: "image", preview });
      setValue("profilePhoto", file);
      await uploadDocument(file, "profile");
    }
  };

  useEffect(() => {
    return () => {
      licPreview?.preview && URL.revokeObjectURL(licPreview.preview);
      aadharPreview?.preview && URL.revokeObjectURL(aadharPreview.preview);
      profilePreview?.preview && URL.revokeObjectURL(profilePreview.preview);
    };
  }, []);

  /* -------------------- SUBMIT -------------------- */
  const onSubmit = async (data: DriverFormData) => {
    if (!drivingLicenseDoc || !aadharCardDoc || !profilePhotoDoc) {
      toast.error("Upload all required documents");
      return;
    }

    const payload = {
      user_id: user.userId,
      transmission: data.transmission,
      board_type: data.boardType,

      driving_license_url: drivingLicenseDoc.url,
      driving_license_name: drivingLicenseDoc.name,

      aadhar_card_url: aadharCardDoc.url,
      aadhar_card_name: aadharCardDoc.name,

      profile_photo_url: profilePhotoDoc.url,
      profile_photo_name: profilePhotoDoc.name,
    };

    await submitDriverDetails(
      [constants.SUBMIT_DRIVING_DETAILS_API, payload],
      {
        onCompleted: () => {
          toast.success("Submitted successfully!");
          pushLatest("/");
          window.location.reload();
        },
        onError: () => toast.error("All fields are required."),
      }
    );
  };

  /* -------------------- ACTION SHEET -------------------- */
  const { openSheet } = ScanUploadSheet({
    onScan: () => {
      if (sheetTypeRef.current === "license") {
        scanDocument("drivingLicense");
      } else if (sheetTypeRef.current === "aadhar") {
        scanDocument("aadharCard");
      } else if (sheetTypeRef.current === "profile") {
        scanDocument("profilePhoto");
      }
    },
    onUpload: () => fileInputRef.current?.click(),
  });

  const handleBackClick = async () => {
    await updateUserLandingPage(true, DRIVER_PROFILE_FORM);
  };

  return (
    <PageLayout
      screenName={constants.ANALYTICS_SCREEN_NAME.PREFRENCE_PAGE}
      title="Registration"
      showBackButton
      backButtonClick={handleBackClick}
    >
      <div
        className="pb-24"
        style={{
          paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
        }}
      >

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] && handleFileUpload(e.target.files[0])
          }
        />

        <ToggleGroup watch={watch} setValue={setValue} />

        <UploadCard
          label="Upload Driving Licence"
          preview={licPreview}
          disabled={uploadingType !== null && uploadingType !== "license"}
          onClick={() => {
            sheetTypeRef.current = "license";
            openSheet();
          }}
        />

        <UploadCard
          label="Upload Aadhar Card"
          preview={aadharPreview}
          disabled={uploadingType !== null && uploadingType !== "aadhar"}
          onClick={() => {
            sheetTypeRef.current = "aadhar";
            openSheet();
          }}
        />

        <UploadCard
          label="Upload Profile Photo"
          preview={profilePreview}
          disabled={uploadingType !== null && uploadingType !== "profile"}
          onClick={() => {
            sheetTypeRef.current = "profile";
            openSheet();
          }}
        />

        <LoadingButton
          label="Register"
          type="submit"
          loading={loading}
          disable={!isValid || loading}
          className="ion-button-custom w-full mt-4 mx-4 pb-22"
          handleButtonClick={handleSubmit(onSubmit)}
        />
      </div>
    </PageLayout>
  );
};

export default DriverRegistrationForm;
