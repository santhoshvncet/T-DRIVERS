import React, { useContext, useEffect, useRef, useState } from "react";
import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonImg,
  IonSpinner,
  IonContent,
  IonIcon,
  IonModal,
  IonInput,
  IonTextarea,
  IonButton,
} from "@ionic/react";
import { addCircle, personRemove } from "ionicons/icons";

import useApiCall from "../../../../hooks/useApi";
import axiosInstance from "../../../../api/axiosinstance";

import { useTranslation } from "react-i18next";
import { useGallery } from "../../../../hooks/useGallery";
import constants from "../../../../lib/constants";
import { useShowHide } from "../../../../hooks/useShowHide";
import { UserContext } from "../../../../provider/UserProvider";
import PageLayout from "../../../common/layout/PageLayout";
import LogoutModal from "../../../../common/LogoutModal";
import useNavigationHistory from "../../../../hooks/useNavigationHistory";
import { useHistory } from "react-router";
import { useToast } from "../../../../hooks/useToast";
import { endPoints } from "../../../../lib/constants/endpoints";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import ScanUploadSheet from "../../../../common/ScanNupload";
import AnnouncementModal from "../../../../common/AnnouncementModal";
import { values } from "lodash";


const OwnerProfilePage: React.FC =  () => {
  const [upload_user_document] = useApiCall(axiosInstance.post);
  const[get_status]=useApiCall(axiosInstance.get);
  const[post_status]=useApiCall(axiosInstance.get);
  const [details, setDetails] = useState<any>(null);
  const { t } = useTranslation();
  const { pushLatest } = useNavigationHistory();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [profileImgUrl, setProfileImgUrl] = useState<string>("/upload_area.png");
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();
  const [post_mail_ticket] = useApiCall(axiosInstance.post);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { visible, onHide, onShow } = useShowHide({
    showAnnouncement: false ,
    showLogout: false,
  });
  const { user } = useContext(UserContext);
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true); // SKELETON LOADING STATE
  const contentRef = useRef<HTMLDivElement>(null);

  const [breakpoints, setBreakpoints] = useState<number[]>([0, 0.6, 0.9]);
  const [initialBreakpoint, setInitialBreakpoint] = useState(0.6);
  const [bottomPadding, setBottomPadding] = useState("env(safe-area-inset-bottom)");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
   const nameRef = useRef(name);
    const emailRef = useRef(email);
    const messageRef = useRef(message);


  // Calculate breakpoints based on content height and screen height
  const calculateBreakpoints = () => {
    if (!contentRef.current) return;

    const contentHeight = contentRef.current.scrollHeight;
    const screenHeight = window.innerHeight;

    let ratio = contentHeight / screenHeight;

    // Clamp ratio between 0.35 and 0.9 for good UX
    ratio = Math.min(Math.max(ratio, 0.35), 0.9);

    // Adjust for tablets / large screens
    if (screenHeight >= 768) {
      ratio = Math.min(ratio + 0.1, 0.9);
    }

    setInitialBreakpoint(ratio);
    setBreakpoints([0, ratio, 0.9]);
  };

  const uriToFile = async (uri: string, filename: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
  };

  const scanProfilePhoto = async () => {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl, // 🔥 FIX
      source: CameraSource.Camera,
    });

    if (!photo.dataUrl) return;

    // ✅ Preview (same as BankDetailsForm)
    setProfilePreview(photo.dataUrl);

    // ✅ Convert to File for upload
    const response = await fetch(photo.dataUrl);
    const blob = await response.blob();

    const file = new File(
      [blob],
      `profile-${Date.now()}.jpg`,
      { type: blob.type }
    );

    await uploadProfileImage(file);
  } catch (err) {
    console.error("Scan failed", err);
    toast.error("Camera permission denied or cancelled");
  }
};

  const uploadProfileImage = async (file: File) => {
  try {
    setUploadingProfile(true);

    const formData = new FormData();
    formData.append("profile_image", file);
    formData.append("user_id", details.id.toString());

    const res = await upload_user_document([
      constants.UPLOAD_PROFILE_IMAGE,
      formData,
    ]);

    const newUrl = res?.data?.user?.profile_url;
    if (newUrl) {
      setProfileImgUrl(newUrl);
      setProfilePreview(null); // server image replaces preview
    }
  } catch {
    toast.error("Profile upload failed");
  } finally {
    setUploadingProfile(false);
  }
};


const handleFileUpload = async (file: File) => {
  const preview = URL.createObjectURL(file);
  setProfilePreview(preview);
  await uploadProfileImage(file);
};

const { openSheet } = ScanUploadSheet({
  onScan: scanProfilePhoto,
  onUpload: () => fileInputRef.current?.click(),
});

  const handleAfterPhotoSelected = async (updatedPhotos: any) => {
    if (!updatedPhotos.length || !updatedPhotos[0].base64) return;
    await uploadImage(updatedPhotos[0]);
  };

  const accessGallery = useGallery({ onPhotoUpdate: handleAfterPhotoSelected });



  const handlePickProfileImage = async () => {
    await accessGallery.picker();
  };




const fetchDetails = async () => {
  setIsLoading(true);

  await get_status(
    [
      constants.GET_USER_INITIAL_DATA,
      {params:{ phone: user.phone }},
    ],
    {
      onCompleted: (res: any) => {
        const data = res?.data?.data || res?.data;
        setDetails(data);

        if (data?.profile_url) {
          setProfileImgUrl(data.profile_url);
        }

        setIsLoading(false);
      },
      onError: (e: any) => {
        console.log("Error fetching profile details", e);
        setIsLoading(false);
      },
    }
  );
};


useEffect(() => {
  fetchDetails();
}, []);

const handleSendMessage = async () => {

    const currentName = nameRef.current;
    const currentEmail = emailRef.current;
    const currentMessage = messageRef.current;
    

    console.log("Message Details:", {
      name,
      email,
      message,
    });

    try {
      await post_mail_ticket(
        [
          endPoints.POST_MAIL_TICKET,
          {
            name: currentName,
            email: currentEmail,
            message: currentMessage,
            user_id: user.userId,
          },
        ],
        {
          onCompleted: (res: any) => {
            if (res.data?.success) {
              toast.success("Ticket raised successfully!", 3000);
            }
            onHide();
          },
          onError: (err: any) => {
            console.error(
              "Error sending message:",
              err?.response?.data || err?.message,
            );
          },
        },
      );
    } catch (error: any) {
      console.error(
        "Error sending message:",
        error?.response?.data || error?.message,
      );
    }
  };

  const uploadImage = async (photo: any) => {
    try {
      setIsUploading(true);
      setUploadError(null);

      const base64Data = photo.base64!.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = Array.from(byteCharacters, (char) => char.charCodeAt(0));

      const blob = new Blob([new Uint8Array(byteArrays)], { type: "image/jpeg" });
      const file = new File([blob], `profile-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      if (!details?.id) {
        console.error("User ID missing");
        return;
      }

      const formData = new FormData();
      formData.append("profile_image", file);
      formData.append("user_id", details.id.toString());

      const response = await upload_user_document([
        constants.UPLOAD_PROFILE_IMAGE,
        formData,
      ]);

      const newUrl = response?.data?.user?.profile_url;

      if (newUrl) {
        setProfileImgUrl(newUrl);
      }

      // fetchDetails();
      setIsUploading(false);
    } catch (err) {
      console.error("Error uploading image:", err);
      setIsUploading(false);
      setUploadError("Something went wrong!");
    }
  };

  

  const accountOptions = [
    {
      label: t("Account"),
      action: () => pushLatest(constants.OWNER_ACCOUNT_DETAILS_PAGE),
      isNav: true,
    },
    {
      label: t("Manage car details"),
      action: () => pushLatest(constants.MANAGE_CAR_DETAILS),
      isNav: true,
    },
    {
      label: t("Booking History"),
      action: () => pushLatest(constants.BOOKING_HISTORY_PAGE),
      isNav: true,
    },
    {
      label: t("Payment History"),
      action: () => pushLatest(constants.OWNER_PAYMENT_HISTORY_PAGE),
      isNav: true,
    },
    { label: t("Contact Us"),
      action: () => onShow("showContactUs") ,
     },

    {
      label: t("Logout"),
      action: () => onShow("showLogout"),
    },
       {
      label: t("Delete Account"),
      icon: <IonIcon className="w-6 h-6" icon={personRemove} />,
      action: () => pushLatest(constants.DELETE_ACCOUNT_PAGE),
      isNav: true
    },
  ];

  const handleBackClick = () => {
    history.push("/home");
  };

    // Handle bottom padding for Android navigation bar or iOS safe area + keyboard height
  useEffect(() => {
    function updatePadding() {
      const screenHeight = window.innerHeight;
      const windowInnerHeight = window.visualViewport?.height || screenHeight;
      const navBarHeight = screenHeight - windowInnerHeight;

      if (navBarHeight > 0) {
        setBottomPadding(`${navBarHeight}px`);
      } else {
        setBottomPadding("env(safe-area-inset-bottom)");
      }
    }

    updatePadding();
    window.addEventListener("resize", updatePadding);
    window.addEventListener("orientationchange", updatePadding);

    return () => {
      window.removeEventListener("resize", updatePadding);
      window.removeEventListener("orientationchange", updatePadding);
    };
  }, []);

  // Listen to keyboard events to adjust bottom padding dynamically
useEffect(() => {
  if (Capacitor.getPlatform() === "web") return;

  let showListener: any;
  let hideListener: any;

  const setupListeners = async () => {
    const { Keyboard } = await import("@capacitor/keyboard");

    showListener = await Keyboard.addListener(
      "keyboardWillShow",
      (info) => {
        setBottomPadding(`${info.keyboardHeight}px`);
      }
    );

    hideListener = await Keyboard.addListener(
      "keyboardWillHide",
      () => {
        setBottomPadding("env(safe-area-inset-bottom)");
      }
    );
  };

  setupListeners();

  return () => {
    showListener?.remove();
    hideListener?.remove();
  };
}, []);

 useEffect(() => {
    nameRef.current = name;
    emailRef.current = email;
    messageRef.current = message;
  }, [name, email, message]);


  // Recalculate breakpoints when modal opens or window resizes
  useEffect(() => {
    if (!visible.showContactUs) return;

    const timeout = setTimeout(calculateBreakpoints, 60);

    window.addEventListener("resize", calculateBreakpoints);
    window.addEventListener("orientationchange", calculateBreakpoints);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", calculateBreakpoints);
      window.removeEventListener("orientationchange", calculateBreakpoints);
    };
  }, [visible.showContactUs]);


  return (
    <PageLayout
      screenName={constants.ANALYTICS_SCREEN_NAME.PROFILE}
      title={t("Profile")}
      showBackButton
      showNotification
      backButtonClick={handleBackClick}
      onNotificationClick={() => onShow("showAnnouncement")}
    >
      <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] && handleFileUpload(e.target.files[0])
          }
      />

      <IonContent className="ion-padding" style={{ backgroundColor: "#f8f9fc" }}>
        {isLoading && (
          <div className="w-full animate-pulse">
            <div className="flex flex-col items-center mt-4 mb-6">
              <div className="relative w-28 h-28 mb-3">
                <div className="w-28 h-28 bg-gray-300 rounded-full"></div>
                <div className="absolute bottom-0 right-0 bg-gray-300 rounded-full w-8 h-8"></div>
              </div>

              <div className="h-4 w-32 bg-gray-300 rounded-md mt-2"></div>
              <div className="h-3 w-24 bg-gray-300 rounded-md mt-1"></div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="w-full h-12 bg-gray-300 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-300 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-300 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-300 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-300 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-300 rounded-xl"></div>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="mb-18">
            <div className="flex flex-col items-center my-2">
              <div
                className="relative w-28 h-28 mb-3 cursor-pointer"
                onClick={openSheet}
              >
                <IonAvatar className="w-28 h-28 shadow-sm relative overflow-hidden">
                  <IonImg
                    src={
                      profilePreview ||
                      profileImgUrl ||
                      "/default_avatar.png"
                    }
                    className="w-full h-full object-cover rounded-full"
                  />

                  {uploadingProfile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
                      <IonSpinner name="crescent" />
                    </div>
                  )}
                </IonAvatar>

                <IonIcon
                  icon={addCircle}
                  className="absolute bottom-0 right-0 text-yellow-500 text-3xl bg-white rounded-full p-1 shadow-sm"
                />
              </div>

              <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-500 text-sm">+91 {user.phone}</p>
            </div>

            <IonList lines="none" className="">
              {accountOptions.map(({ label, action }, idx) => (
                <IonItem
                  key={idx}
                  button
                  onClick={action}
                  className=" rounded-xl transition-all duration-150 hover:bg-gray-100"
                >
                  <IonLabel className="text-base font-medium text-gray-700">
                    {label}
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </div>
        )}

               {visible.showContactUs && (
        <IonModal
          isOpen={visible.showContactUs}
          onDidDismiss={() => onHide()}
          initialBreakpoint={initialBreakpoint}
          breakpoints={breakpoints}
          handleBehavior="cycle"
          backdropBreakpoint={0}
          keyboardClose={false} // prevent auto close on keyboard to keep control
          mode="ios" // nicer sheet style on iOS
        >
          <div
            ref={contentRef}
            className="p-6 flex flex-col gap-4 bg-white max-h-[90vh] h-auto flex-shrink-0 min-h-0"
            style={{ paddingBottom: bottomPadding }}
          >
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              Contact Us
            </h2>
            <p className="text-gray-500 text-center text-sm">
              Feel free to reach out. We're happy to assist you!
            </p>

              <IonInput
                           type="text"
                           placeholder="Your Name"
                           className="border p-3 rounded-lg w-full text-center focus:outline-none"
                           onIonChange={(e: any) => setName(e.detail.value!)}
                           onChange={(e: any) => setName(e.detail.value!)}
                         />
                         <IonInput
                           type="email"
                           placeholder="Your Email"
                           className="border p-3 rounded-lg w-full text-center focus:outline-none"
                           onIonChange={(e: any) => setEmail(e.detail.value!)}
                           onChange={(e: any) => setEmail(e.detail.value!)}
                         />
                         <IonInput
                           placeholder="Your Message"
                           className="border p-3 rounded-lg w-full h-32 text-center focus:outline-none"
                           onIonChange={(e: any) =>
                             setMessage(e.detail.value|| "")
                           }
                           onChange={(e: any) => setMessage(e.target.value?.trim() || "")}
                         />

            <div className="flex justify-center gap-4 my-4d">
              <IonButton color="light" onClick={() => onHide()}>
                Cancel
              </IonButton>
              <IonButton
                color="primary"
                className="h-12 w-65"
                  onClick={() => {
                    handleSendMessage();
                  }}
              >
                Send
              </IonButton>
            </div>
          </div>
        </IonModal>
      )}

      {visible.showAnnouncement && (
          <AnnouncementModal
            isOpen={visible.showAnnouncement}
            onClose={onHide}
          />
        )}
        


        {visible.showLogout && (
          <LogoutModal visible={visible.showLogout} onHide={onHide} />
        )}
      </IonContent>
    </PageLayout>
  );
};

export default OwnerProfilePage;
