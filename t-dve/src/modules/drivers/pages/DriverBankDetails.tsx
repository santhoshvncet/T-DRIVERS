import { useState, useRef, useContext } from "react";
import PageLayout from "../../common/layout/PageLayout";
import { useForm } from "react-hook-form";
import { LoadingButton } from "../../../common/LoadingButton";
import useApiCall from "../../../hooks/useApi";
import axiosInstance from "../../../api/axiosinstance";
import constants from "../../../lib/constants";
import { useToast } from "../../../hooks/useToast";
import { UserContext } from "../../../provider/UserProvider";
import InputController from "../../../common/InputController";
import { IonLabel } from "@ionic/react";
import ScanUploadSheet from "../../../common/ScanNupload";
import UploadCard from "../../../common/UploadCard";
import useNavigationHistory from "../../../hooks/useNavigationHistory";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useLandingPage } from "../../../hooks/useLandingPage";
import util from "../../../utils";

interface BankFormData {
  fullName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  passbook: File | null;
}

const BankDetailsForm: React.FC = () => {
  const { user } = useContext(UserContext);
  const { pushLatest } = useNavigationHistory();
  const toast = useToast();
  const [submitBankDetails, { loading }] = useApiCall(axiosInstance.post);
  const { updateUserLandingPage } = useLandingPage();
  const { DRIVER_DETAIL_FORM } = constants.USER_LANDING_PAGE;


  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [passbookPreview, setPassbookPreview] = useState<any>(null);
  const passbookFileRef = useRef<File | null>(null);
  const sheetTypeRef = useRef<"passbook">(null);

  // keep showSheet state if you want to track sheet visibility (optional)
  const [showSheet, setShowSheet] = useState(false);
  const [passbookDoc, setPassbookDoc] = useState<{
  url: string;
  name: string;
} | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isValid },
    watch
  } = useForm<BankFormData>({
    defaultValues: {
      fullName: "",
      bankName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifsc: "",
      passbook: null,
    },
    mode: "onChange",
  });

  // const base64ToFile = (base64: string, filename: string) => {
  //   const arr = base64.split(",");
  //   const mimeMatch = arr[0].match(/:(.*?);/);
  //   const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  //   const bstr = atob(arr[1]);
  //   const u8arr = new Uint8Array(bstr.length);
  //   for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  //   return new File([u8arr], filename, { type: mime });
  // };

  const uriToObjectUrl = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
  };

  const uploadDocument = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  form.append("user_id", String(user.userId));
  form.append("file_type", "passbook");
  form.append("file_name", file.name);

  await submitBankDetails(
    [constants.UPLOAD_DOCUMENT_API, form],
    {
      onCompleted: (res) => {
        const data = res?.data?.data;
        setPassbookDoc({ url: data.s3_url, name: file.name });
        toast.success("Passbook uploaded successfully");
      },
      onError: () => toast.error("Passbook upload failed"),
    }
  );
};


  const scanDocument = async (forField: "passbook") => {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    // if (!photo.base64String) return;
    // const base64 = "data:image/jpeg;base64," + photo.base64String;
    // const file = base64ToFile(base64, `${forField}-${Date.now()}.jpg`);
    if (!photo.dataUrl) return;

    // ✅ create preview SAME AS upload
    const preview = await uriToObjectUrl(photo.dataUrl);

    // ✅ create File for upload
    const response = await fetch(photo.dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `${forField}-${Date.now()}.jpg`, {
      type: blob.type,
    });

    if (forField === "passbook") {
      // preview (same as driver)
      setPassbookPreview({ type: "image", preview });

      // set RHF value
      setValue("passbook", file);

      // 🔥 upload immediately (same pattern)
      await uploadDocument(file);
    }
  } catch (err) {
    console.error("Camera scan error", err);
    toast.error("Camera permission denied or action cancelled.");
  }
};

  // Validation for account number
  const validateAccountNumber = (value: string) => {
    if (!value) return "Account number is required";
    if (value.length<14) return "Account number must be 14 digits";
    if (!/^\d+$/.test(value)) return "Only numbers are allowed";
    // Check if there are more than 6 consecutive zeros and block further zeros
    if (/0{6,}/.test(value)) return "Account number cannot have more than 6 consecutive zero's";

    return true; 
  };

  // Validation for confirming account number
  const validateConfirmAccountNumber = (value: string, accountNumber: string) => {
    if (!value) return "Please confirm account number";
    if (value.length<14) return "Account number must be 14 digits";
    if (value !== accountNumber) return "Account numbers do not match";

    // Check if the original account number has more than 6 consecutive zeros
    if (/0{6,}/.test(accountNumber)) return "Account number cannot have more than 6 consecutive zero's";

    return true;
  };

  // const validateIFSC = (value: string) => {
  // if (!value) return "IFSC code is required";

  // if (value.length > 11) {
  //   return "IFSC code must be exactly 11 characters";
  // }
  // const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

  // if (!ifscRegex.test(value.toUpperCase())) {
  //   return "Enter a valid IFSC code (e.g. ABCD0001234)";
  // }
  // return true;
  // };

  const validateIFSC = (value: string) => {
  if (!value) return "IFSC code is required";
  const cleaned = value.toUpperCase();
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return "IFSC code can contain only letters and numbers";
  }
  if (cleaned.length !== 11) {
    return "IFSC code must be exactly 11 characters";
  }
  return true;
  };

  const handleFileUpload = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    toast.error("Only image files are allowed");
    return;
  }

  const preview = URL.createObjectURL(file);

  if (sheetTypeRef.current === "passbook") {
    // preview (same as driver)
    setPassbookPreview({ type: "image", preview });

    // set RHF value
    setValue("passbook", file);

    // 🔥 upload immediately (same pattern)
    await uploadDocument(file);
  }
};

  const onSubmit = async (data: BankFormData) => {
  if (data.accountNumber !== data.confirmAccountNumber) {
    toast.error("Account numbers do not match");
    return;
  }

  if (!passbookDoc) {
    toast.error("Please upload or scan your passbook.");
    return;
  }

  const payload = {
    user_id: user.userId,
    account_holder: data.fullName,
    bank_name: data.bankName,
    account_number: data.accountNumber,
    ifsc: data.ifsc,
    passbook_front_image_url: passbookDoc.url,
  };

  await submitBankDetails(
    [constants.SUBMIT_DRIVER_BANK_DETAILS, payload],
    {
      onCompleted: () => {
        toast.success("Bank details submitted!");
      },
      onError: () => toast.error("Failed to submit details"),
    }
  );
  window.location.href = "/";
};


  const disable = !isValid || loading;

  // initialize Ionic ActionSheet wrapper (ScanUploadSheet returns { openSheet })
  const { openSheet } = ScanUploadSheet({
    onScan: () => {
      if (sheetTypeRef.current === "passbook") {
        scanDocument("passbook");
      }
    },
    onUpload: () => fileInputRef.current?.click(),
  });

  const handleBackClick = async () => {
    await updateUserLandingPage(true, DRIVER_DETAIL_FORM);
  }

  return (
    <PageLayout
      screenName={constants.ANALYTICS_SCREEN_NAME.PREFRENCE_PAGE}
      title={"Bank Details"}
      showBackButton
      backButtonClick={handleBackClick}
      footer={
          <div
            style={{
              position: "sticky",
              bottom: 0,
              padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
              zIndex: 1000,
            }}
          > 
          {/* <div className="fixed bottom-0 left-0 right-0 bg-[#f2f9fb] border-t border-[#f2f9fb] z-50">
            <div className="py-2 px-2 w-full"> no max-w-md / mx-auto / flex needed */}
              <LoadingButton
                label="Submit"
                type="submit"
                loading={loading}
                disable={disable}
                className="ion-button-custom w-full pb-14"
                handleButtonClick={handleSubmit(onSubmit)}
              />
        </div>
      }
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
        }}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 p-6 text-sm max-w-md mx-auto pb-56 mx-auto"
      >
        {/* Full Name */}
        <IonLabel className="text-[#0C1A30] font-medium">
          Full Name (As Per Bank Account){" "}
          <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          control={control}
          name="fullName"
          placeholder="Enter account holder name"
          required
          validate={util.validateFullName}
        />

        {/* Bank Name */}
        <IonLabel className="text-[#0C1A30] font-medium">
          Bank Name <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          control={control}
          name="bankName"
          placeholder="Enter bank name"
          required
        />

        {/* Account Number */}
        <IonLabel className="text-[#0C1A30] font-medium">
          Account Number <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          control={control}
          name="accountNumber"
          placeholder="Enter account number"
          type="password"
          required
          maxlength={14}
          inputMode="numeric"
          validate={validateAccountNumber}
        />

        {/* Confirm Account Number */}
        <IonLabel className="text-[#0C1A30] font-medium">
          Confirm Account Number <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          control={control}
          name="confirmAccountNumber"
          placeholder="Re-enter account number"
          type="text"
          required
          maxlength={14}
          inputMode="numeric"
          validate={(value) => validateConfirmAccountNumber(value, watch("accountNumber"))}
        />

        {/* IFSC */}
        <IonLabel className="text-[#0C1A30] font-medium">
          IFSC Code <span className="text-red-500">*</span>
        </IonLabel>
        <InputController
          control={control}
          name="ifsc"
          placeholder="Enter IFSC code"
          required
          maxlength={11}
          validate={validateIFSC}
        />

        <UploadCard
          label="Passbook Front Page"
          preview={passbookPreview}
          onClick={() => {
            sheetTypeRef.current = "passbook";
            openSheet();
          }}
        />
        {/* <div className="fixed bottom-0 left-0 right-0 bg-[#f2f9fb] border-t border-[#f2f9fb] z-50">
          <div className="py-2 px-2 w-full"> no max-w-md / mx-auto / flex needed */}
            <LoadingButton
              label="Submit"
              type="submit"
              loading={loading}
              disable={disable}
              className="ion-button-custom w-full pb-14"
              handleButtonClick={handleSubmit(onSubmit)}
            />
      </form>
    </PageLayout>
  );
};

export default BankDetailsForm;