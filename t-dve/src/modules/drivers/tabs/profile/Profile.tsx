import React, { useContext, useEffect, useRef, useState } from "react";
import {
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonImg,
  IonContent,
  IonIcon,
  IonModal,
  IonTextarea,
  IonInput,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import { addCircle, personRemove } from "ionicons/icons";

import axiosInstance from "../../../../api/axiosinstance";
import { useTranslation } from "react-i18next";
import constants from "../../../../lib/constants";
import { useShowHide } from "../../../../hooks/useShowHide";
import { UserContext } from "../../../../provider/UserProvider";
import PageLayout from "../../../common/layout/PageLayout";
import LogoutModal from "../../../../common/LogoutModal";
import useNavigationHistory from "../../../../hooks/useNavigationHistory";

import { endPoints } from "../../../../lib/constants/endpoints";
import { useToast } from "../../../../hooks/useToast";
import { useHistory } from "react-router";
import useApiCall from "../../../../hooks/useApi";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import ScanUploadSheet from "../../../../common/ScanNupload";
import AnnouncementModal from "../../../../common/AnnouncementModal";

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { pushLatest } = useNavigationHistory();
  const { visible, onHide, onShow } = useShowHide({
    showLogout: false,
    showContactUs: false,
    showAnnouncement: false 
  });
  const { user } = useContext(UserContext);
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const toast = useToast();
  const [profileImgUrl, setProfileImgUrl] = useState("/upload_area.png");
  const [isLoading, setIsLoading] = useState(true);
  const [post_mail_ticket] = useApiCall(axiosInstance.post);
  const [get_driver_reg_details] = useApiCall(axiosInstance.get);

  const nameRef = useRef(name);
  const emailRef = useRef(email);
  const messageRef = useRef(message);
  const contentRef = useRef<HTMLDivElement>(null);

  // Backend required fields
  const [transmission, setTransmission] = useState("");
  const [boardType, setBoardType] = useState("");
  const [breakpoints, setBreakpoints] = useState<number[]>([0, 0.6, 0.9]);
  const [initialBreakpoint, setInitialBreakpoint] = useState(0.6);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

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

  const fetchDriver = () => {
    setIsLoading(true);

    get_driver_reg_details(
      [`${constants.GET_DRIVER_REG_DETAILS}/${user.userId}`],
      {
        onCompleted: (res: any) => {
          try {
            const driver = res?.data?.driver;

            if (driver?.profile_photo_url) {
              setProfileImgUrl(driver.profile_photo_url);
            }

            setTransmission(driver?.transmission || "");
            setBoardType(driver?.board_type || "");
          } catch (err) {
            console.log("Error processing driver profile:", err);
          } finally {
            setIsLoading(false);
          }
        },
        onError: (err: any) => {
          console.log("Error fetching driver profile:", err);
          setIsLoading(false);
        },
      },
    );
  };

  useEffect(() => {
    fetchDriver();
  }, [user.userId]);


  const scanProfilePhoto = async () => {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    if (!photo.dataUrl) return;

    // preview
    setProfilePreview(photo.dataUrl);

    // file
    const blob = await (await fetch(photo.dataUrl)).blob();
    const file = new File([blob], `profile-${Date.now()}.jpg`, {
      type: blob.type,
    });

    await uploadProfileImage(file);
  };

  const uploadProfileImage = async (file: File) => {
    try {
      setUploadingProfile(true);

      const formData = new FormData();
      formData.append("profile_photo", file);
      formData.append("user_id", user.userId.toString());
      formData.append("transmission", transmission);
      formData.append("board_type", boardType);

      const res = await axiosInstance.post(
        constants.UPLOAD_DRIVER_PROFILE_IMAGE,
        formData,
      );

      const newUrl = res.data?.driver?.profile_photo_url;
      if (newUrl) {
        setProfileImgUrl(newUrl);
        setProfilePreview(null); // replace preview with server image
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

  const accountOptions = [
    {
      label: t("Account"),
      action: () => pushLatest(constants.ACCOUNT_DETAILS_PAGE),
    },
    {
      label: t("Booking History"),
      action: () => pushLatest(constants.DRIVER_BOOKING_HISTORY_PAGE),
    },
    { label: t("Contact Us"), action: () => onShow("showContactUs") },
    { label: t("Logout"), action: () => onShow("showLogout") },
    {
      label: t("Delete Account"),
      icon: <IonIcon className="w-6 h-6" icon={personRemove} />,
      action: () => pushLatest(constants.DELETE_ACCOUNT_PAGE),
      isNav: true,
    },
  ];

  const handleSendMessage = async () => {
    const currentName = nameRef.current;
    const currentEmail = emailRef.current;
    const currentMessage = messageRef.current;

    console.log("Message Details:", {
      currentName,
      currentEmail,
      currentMessage,
    });

    try {
      await post_mail_ticket(
        [
          endPoints.POST_MAIL_TICKET,
          {
            name: currentName,
            email: currentEmail,
            message: currentMessage,
            driverId: user.driver_id,
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
  const handleBackClick = () => {
    history.push("/home");
  };

  // Update refs whenever the state changes
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
      backButtonClick={handleBackClick}
      showNotification
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
      <IonContent className="ion-padding">
        {isLoading && (
          <div className="animate-pulse w-full">
            {/* Avatar skeleton */}
            <div className="flex flex-col items-center mt-4 mb-6">
              <div className="relative w-28 h-28 mb-3">
                <div className="w-28 h-28 bg-gray-200 rounded-full"></div>
                <div className="absolute bottom-0 right-0 bg-gray-300 rounded-full w-8 h-8"></div>
              </div>

              <div className="h-4 w-32 bg-gray-200 rounded-md mt-2"></div>
              <div className="h-3 w-24 bg-gray-200 rounded-md mt-1"></div>
            </div>

            {/* Skeleton list */}
            <div className="space-y-3 mt-4">
              <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------
            REAL UI (Shown only after loading finishes)
        --------------------------------------------------- */}
        {!isLoading && (
          <>
            <div className="flex flex-col items-center mt-4 mb-6">
              <div
                className="relative w-28 h-28 mb-3 cursor-pointer"
                onClick={openSheet}
              >
                <IonAvatar className="w-28 h-28 shadow-sm">
                  <IonImg
                    src={
                      profilePreview || profileImgUrl || "/default_avatar.png"
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

              <h2 className="text-lg font-semibold text-gray-900">
                {user.name}
              </h2>
              <p className="text-gray-500 text-sm">+91 {user.phone}</p>
            </div>

            <IonList lines="none" className="mt-2">
              {accountOptions.map(({ label, action }, idx) => (
                <IonItem
                  key={idx}
                  button
                  onClick={action}
                  className="rounded-xl transition-all duration-150 hover:bg-gray-100"
                >
                  <IonLabel className="text-base font-medium text-gray-700">
                    {label}
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

        {/* CONTACT US MODAL */}
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
            <div className="p-6 flex flex-col gap-2 h-full bg-white">
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
              <IonTextarea
                placeholder="Your Message"
                rows={4}
                className="border p-3 rounded-lg w-full text-center focus:outline-none"
                onIonChange={(e: any) =>
                  setMessage(e.target.value?.trim() || "")
                }
                onChange={(e: any) => setMessage(e.target.value?.trim() || "")}
              />

              <div className="flex justify-center gap-4 mt-2 mb-2">
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

        {/* LOGOUT MODAL */}
        {visible.showLogout && (
          <LogoutModal visible={visible.showLogout} onHide={onHide} />
        )}
      </IonContent>
    </PageLayout>
  );
};

export default ProfilePage;
