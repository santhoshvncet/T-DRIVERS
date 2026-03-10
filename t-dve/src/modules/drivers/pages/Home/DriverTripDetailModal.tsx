import React, { useContext, useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonCard,
  IonContent,
  IonIcon,
  IonImg,
  IonModal,
  IonText,
  IonSpinner,
} from "@ionic/react";
import TripSummaryCard from "./tripSummaryCard";
import { OwnerCard } from "../../../../common/OwnerCard";
import axiosInstance from "../../../../api/axiosinstance";
import { endPoints } from "../../../../lib/constants/endpoints";
import useApiCall from "../../../../hooks/useApi";
import { UserContext } from "../../../../provider/UserProvider";
import { informationCircleOutline, locationOutline, refresh } from "ionicons/icons";
import OtpInput from "./OtpInput";
import { useToast } from "../../../../hooks/useToast";
import useNavigationHistory from "../../../../hooks/useNavigationHistory";
import constants from "../../../../lib/constants";
import "./DriverTripDetail.css";
import { Geolocation } from "@capacitor/geolocation";
import { socket } from "../../../../utils/socket";
import { formatDate } from "../../tabs/profile/booking/DriverBooking";
import { dataUrlToBlob } from "../../../../utils/fileUtils";
import { Loading } from "../../../../common/Loading";
import { LoadingButton } from "../../../../common/LoadingButton";
import { set } from "lodash";
import CarPhotoUpload from "../../../common/CarPhotoUpload";
import { CarPhoto, createEmptyCarPhotos, CAR_PHOTO_CONFIG } from "../../../../types/carPhotoTypes";
import { getDateDifference } from "../../../../utils/getDateDifference";
import { formatToISO } from "../../../../utils/formatToISO";

interface DriverTripDetailModalProps {
  onModalClose: () => void;
  isOpen: boolean;
  onCoordinatesUpdate: (origin: any, destination: any) => void;
  onTripDataFetch: (data: any) => void;
}

const DriverTripDetailModal: React.FC<DriverTripDetailModalProps> = ({
  onModalClose,
  isOpen,
  onCoordinatesUpdate,
  onTripDataFetch,
}) => {
  const autoShareIntervalRef = useRef<number | null>(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  const [otpInput, setOtpInput] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [Ownerphone, setOwnerPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [color, setColor] = useState("primary");
  const [ownerId, setOwnerId] = useState("");
  const [paymentPending, setPaymentPending] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [carPhotos, setCarPhotos] = useState<CarPhoto[]>(createEmptyCarPhotos);
  const [btnValue, setBtnValue] = useState("Start Trip");
  const [currentValue, setCurrentValue] = useState("");
  const [noTrip, setNoTrip] = useState(false);
  const [intialBreakPoint, setIntialBreakPoint] = useState(0.8);
  const toast = useToast();
  const { user } = useContext(UserContext);
  const { pushLatest } = useNavigationHistory();
  const [getTripStatus] = useApiCall(axiosInstance.get);
  const [locationShared, setLocationShared] = useState(false);
  const [loadButton, setLoadButton] = useState(false)

  // "start" phase or "end" phase
  const [photoUploadType, setPhotoUploadType] = useState<"start" | "end">(
    "start"
  );

  const [socketLoading, setSocketLoading] = useState(false);
  const input = new Date();

  const currentDate = formatToISO(input);

  const getDriverConfirmedTripDetails = async (driverId: number) => {
    return axiosInstance.get(
      `${endPoints.GET_DRIVER_CONFIRMED_TRIP_DETAILS}/${driverId}`
    );
  };
  const [executeApi] = useApiCall(getDriverConfirmedTripDetails);

  // --------------------------------------------------
  // Fetch trip details
  // --------------------------------------------------

  useEffect(() => {
    if (user?.driver_id) {
      executeApi([user.driver_id], {
        onCompleted: (res) => {
          setIsLoading(false);
          if (res.data.success && res.data.trip?.length > 0) {
            const data = res.data.trip[0];
            setTripData(data);
            setGeneratedOtp(data.otp);
            setOwnerId(data.owner_id);
            onTripDataFetch(data);

            onCoordinatesUpdate(
              {
                lat: parseFloat(data.origin_latitude),
                lng: parseFloat(data.origin_longitude),
              },
              {
                lat: parseFloat(data.destination_latitude),
                lng: parseFloat(data.destination_longitude),
              }
            );
          } else {
            setTripData(undefined);
            setNoTrip(true);
            onTripDataFetch(false);
          }
        },
        onError: () => {
          setIsLoading(false);
          setNoTrip(true);
          onTripDataFetch(false);
        },
      });
    }
  }, [user?.driver_id]);

  // Handle photo upload submission from CarPhotoUpload component
  const handlePhotoSubmitSuccess = async () => {
    try {
      const endDate = tripData?.completed_at;
      const delayedTime = getDateDifference(endDate, currentDate);

      if (photoUploadType === "end" || currentValue === "end trip") {
        if (new Date(currentDate) > new Date(endDate)) {
          toast.error(
            `Trip Ending date has been ${delayedTime.days === 0 ? delayedTime.hours : delayedTime.days} ${delayedTime.days === 0 ? "hours" : "days"} delayed, Please Contact Support Team`,
            5000
          );
        }

        await updateTripStatus("END_TRIP_CAR_PHOTOS", tripData?.trip_id);
        await updateTripStatus("PAYMENT_PENDING", tripData?.trip_id);
        setPaymentPending(true);
        localStorage.setItem("tripFromHome", tripData?.trip_id);
        localStorage.setItem("tripFare", tripData?.trip_id);
        pushLatest(constants.DRIVER_TRIP_PAYMENT_SUMMARY_PAGE);
        setTripData(undefined);
        setNoTrip(true);
        onTripDataFetch(false);
      } else {
        await updateTripStatus("START_TRIP_CAR_PHOTOS", tripData?.trip_id);
        setOtpInput(false);
        setTripStarted(false);
        setIntialBreakPoint(0.8);
        setBtnValue("End Trip");
        setColor("myGreen");
      }
    } catch (error: any) {
      toast.error("Internal server error while uploading car photos.");
    }
  };

  const handleTripDataUpdate = (carImages: string[]) => {
    setTripData((prev: any) => (prev ? { ...prev, car_images: carImages } : prev));
  };

  const mapTripToUI = (t: any) => ({
    id: t.trip_id,
    ownerId: t.owner_id,
    carName: `${t.brand || ""} ${t.model_name || ""} ${t.model_variant || ""}`.trim(),
    carType: t.car_type,
    transmission: t.transmission,
    boardType: t.board_type,
    distance: t.distance_km ? `${t.distance_km.toFixed(0)} KM` : "N/A",
    price: Number(t.fare_amount) ?? 0,
    fromCity: t.origin_city,
    toCity: t.destination_city,
    startTime: formatDate(t.start_date, t.pickup_time),
    endTime: formatDate(t.end_date, t.drop_time),
    tripType: t.trip_type === "oneway" ? "ONE_WAY" : "TWO_WAY",
    originArea: t.origin_area || "",
    originState: t.origin_state || "",
    destinationArea: t.destination_area || "",
    destinationState: t.destination_state || "",
  });

  useEffect(() => {
    if (!tripData?.trip_id) return;

    getTripStatus([`${endPoints.GET_DRIVER_TRIP_STATUS}/${tripData.trip_id}`], {
      onCompleted: (res) => {
        const status = res.data.data.status;
        console.log("Current trip status:", status);

        setIsLoading(false);

        switch (status) {
          case "CONFIRMED":
          case "ACCEPTED":
            setBtnValue("Start Trip");
            setColor("primary");
            setTripStarted(false);
            setOtpInput(false);
            setCurrentValue("");
            setIntialBreakPoint(0.8);
            setPhotoUploadType("start");
            setCarPhotos(createEmptyCarPhotos());
            break;

          case "TRIP_STARTED":
            setBtnValue("Start Trip");
            setColor("primary");
            setTripStarted(true);
            setOtpInput(true);
            setCurrentValue("");
            setIntialBreakPoint(0.5);
            setPhotoUploadType("start");
            break;

          case "OTP_VERIFIED":
            setBtnValue("End Trip");
            setColor("myGreen");
            setTripStarted(true);
            setOtpInput(false);
            setCurrentValue("");
            setPhotoUploadType("start"); 
            setIntialBreakPoint(0.85);
            setCarPhotos(createEmptyCarPhotos());
            break;

          case "START_TRIP_CAR_PHOTOS":
          case "ONGOING":
            setBtnValue("End Trip");
            setColor("myGreen");
            setTripStarted(false); // show main trip content
            setOtpInput(false);
            setCurrentValue("");
            setPhotoUploadType("end"); // next phase is end-trip photos
            setIntialBreakPoint(0.8);
            setCarPhotos(createEmptyCarPhotos());
            break;

          case "TRIP_ENDED":
            // Show upload END trip car photos
            setBtnValue("End Trip");
            setColor("myGreen");
            setTripStarted(true);
            setOtpInput(false);
            setCurrentValue("end trip");
            setPhotoUploadType("end"); // end-trip photo phase
            setIntialBreakPoint(0.85);
            setCarPhotos(createEmptyCarPhotos());
            break;

          case "END_TRIP_CAR_PHOTOS":
          case "PAYMENT_PENDING":
            pushLatest(constants.DRIVER_TRIP_PAYMENT_SUMMARY_PAGE, {
              fare: tripData?.fare_amount ?? 0,
            });
            setTripData(undefined);
            setNoTrip(true);
            onTripDataFetch(false);
            break;

          case "COMPLETED":
          case "PAYMENT_COMPLETED":
            // Trip is done
            setTripData(undefined);
            setNoTrip(true);
            onTripDataFetch(false);
            break;

          default:
            console.log("Unknown status:", status);
            break;
        }
      },
      onError: () => setIsLoading(false),
    });
  }, [tripData?.trip_id]);

  useEffect(() => {
    const handleLiveUpdate = () => {
      pushLatest(constants.HOME_PAGE);
    };
    socket.on("newtTripConfirmed", handleLiveUpdate);
    return () => {
      socket.off("newtTripConfirmed", handleLiveUpdate);
    };
  }, []);

  const [ownerExecuteApi] = useApiCall(async (ownerId: number) => {
    return axiosInstance.get(
      `${endPoints.GET_DRIVER_BOOKING_OWNER_DETAILS}/${ownerId}`
    );
  });

  useEffect(() => {
    if (ownerId) {
      ownerExecuteApi([ownerId], {
        onCompleted: (res: any) => {
          setOwnerName(res?.data.data.owner_name === null ? "owner":res?.data.data.owner_name );
          setOwnerPhone(res?.data.data.owner_phone);
          setAvatarUrl(res?.data.data.owner_avatar || "");
        },
      });
    }
  }, [ownerId]);

  const verifyOtp = async () => {
    if(enteredOtp.length === 0){
      setLoadButton(false);
      return toast.error("Please enter OTP");
     
    }
    try {
      const response = await axiosInstance.post(endPoints.Validate_OTP, {
        trip_id: tripData?.trip_id,
        owner_id: ownerId,
        entered_otp: enteredOtp,
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: "Invalid OTP",
        error,
      };
    }
  };

  // --------------------------------------------------
  // Load existing photos for current phase from DB
  // --------------------------------------------------

  const loadExistingPhasePhotos = async () => {
    if (!tripData?.trip_id) return;

    try {
      const formData = new FormData();
      formData.append("trip_id", String(tripData.trip_id));
      formData.append(
        "tripType",
        photoUploadType === "start" ? "startTrip" : "endTrip"
      );

      const res = await axiosInstance.put(endPoints.UPLOAD_CAR_TRIPS, formData);

      if (!res.data?.success) return;

      const allImages: string[] = res.data.data || [];

      const baseIndex = photoUploadType === "start" ? 0 : 4;

      const phaseImages = [
        allImages[baseIndex] || "",
        allImages[baseIndex + 1] || "",
        allImages[baseIndex + 2] || "",
        allImages[baseIndex + 3] || "",
      ];

      setCarPhotos(
        createEmptyCarPhotos().map((slot, index) => {
          const url = phaseImages[index];
          if (!url) return slot;
          return {
            ...slot,
            localUrl: url,
            remoteUrl: url,
            isUploading: false,
            progress: 100,
          };
        })
      );
    } catch (err) {
      console.error("Failed to load existing car photos", err);
    }
  };

  useEffect(() => {
    // only when photo screen is visible
    if (!tripStarted || otpInput) return;
    if (!tripData?.trip_id) return;

    loadExistingPhasePhotos();
  }, [tripStarted, otpInput, photoUploadType, tripData?.trip_id]);

  // --------------------------------------------------
  // Loading / empty states
  // --------------------------------------------------

  // if ((isLoading || socketLoading) && tripData === null) {
  //   return <p className="text-lg text-center mt-20">Loading Trip details...</p>;
  // }

  if (noTrip || tripData === undefined) {
    return null;
  }

  const startTime = `${tripData?.start_date?.split("T")[0]} , ${tripData?.pickup_time}`;
  const endTime = `${tripData?.end_date?.split("T")[0]} , ${tripData?.drop_time}`;

  // --------------------------------------------------
  // API helpers
  // --------------------------------------------------

  const shareLiveLocation = async () => {
    setLoadButton(true);
    try {
      if (!tripData?.trip_id) {
        toast.error("Trip not found");
        setLoadButton(false);
        return;
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
      });

      await axiosInstance.post(
        `${endPoints.UPDATE_DRIVER_LIVE_LOCATION}/${tripData.trip_id}`,
        {
          driver_latitude: pos.coords.latitude,
          driver_longitude: pos.coords.longitude,
        }
      );

      toast.success("Live location shared");
      setLocationShared(true);
      setLoadButton(false);

    } catch (err) {
      console.error(err);
      setLoadButton(false);
      toast.error("Unable to share live location");
    }
  };

  const updateTripStatus = async (status: string, trip_id: number) => {
    const endDate = tripData?.end_date;
    console.log(endDate, currentDate);
    try {
      if (!status || !trip_id) {
        toast.error("failed updating trip status");
        return null;
      }
      const response = await axiosInstance.post(endPoints.POST_TRIP_STATUS, {
        status,
        trip_id,
      });
      if (!response) {
        toast.error("failed fetching response");
        return null;
      }

      if (response.data?.success) {
        setTripData((prev: any) => ({ ...prev, status }));
      }

      return response;
    } catch (error: any) {
      toast.error("internal server error");
      console.log(error);
      return null;
    }
  };

  // --------------------------------------------------
  // Per-image upload logic
  // --------------------------------------------------



  const handleStartTrip = async () => {
    if (!tripData?.trip_id) return;

    if (btnValue === "Start Trip") {
      setLoadButton(true);
      await updateTripStatus("TRIP_STARTED", tripData.trip_id);
      setTripStarted(true);
      setOtpInput(true);
      setLoadButton(false);
    } else {
      setLoadButton(true);
      await updateTripStatus("TRIP_ENDED", tripData.trip_id);
      setTripStarted(true);
      setOtpInput(false);
      setIntialBreakPoint(0.85);
      setCurrentValue("end trip");
      setPhotoUploadType("end");
      setCarPhotos(createEmptyCarPhotos());
      setLoadButton(false);
    }
  };



  const handleVerify = async () => {
    setLoadButton(true);
    const result = await verifyOtp();
    if (!result.success) {
      toast.error(result.message || "Invalid OTP");
      setLoadButton(false);
      return;
    }
    toast.success("OTP Verified! Please upload car photos.");
    await updateTripStatus("OTP_VERIFIED", tripData?.trip_id);
    setBtnValue("End Trip");
    setTripStarted(true);
    setOtpInput(false);
    setEnteredOtp("");
    setColor("myGreen");
    setIntialBreakPoint(0.85);
    setPhotoUploadType("start");
    setCarPhotos(createEmptyCarPhotos());
    setLoadButton(false);
  }; 

  const handleView = (owner_id: number) => {
    const mapped = mapTripToUI(tripData);
    localStorage.setItem("selectedBooking", JSON.stringify(mapped));
    pushLatest(`/booking/view/${owner_id}?mode=trip_detail`);
  };

  const handleCancel = () => {
    toast.error("Contact Admin");
  };

  return (
    <IonModal isOpen={isOpen} initialBreakpoint={0.8} breakpoints={[0, 0.5, 0.8, 1]} onDidDismiss={onModalClose} backdropDismiss={true} canDismiss={true} mode="ios"
      className="rounded-t-2xl has-handle mb-[calc(env(safe-area-inset-bottom,0px)+56px)] [--padding-bottom:calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
    >
      {/* Main trip info (before/after photos) */}
        <IonContent >
      {!tripStarted && (
        <div className="p-4 space-y-4">
          {/* Trip ID */}
          <div className="flex justify-between">
          <p style={{ marginTop: "8px", marginBottom: "4px", fontSize: "14px", color: "#6B7280", fontWeight: 500, }} >
            Trip ID:{" "}
            <span style={{ color: "#111827", fontWeight: 600 }}>{tripData?.trip_id}</span>
          </p>
          <IonIcon icon={refresh} onClick={() => window.location.reload()}
            className="h-6 w-6 text-gray-600 cursor-pointer mx-2"
          />
          </div>

          {tripData?.status === "CONFIRMED" && !locationShared && (
            <LoadingButton label="Share your live location" color="white" expand="block" className="rounded-xl border-white text-green-500 border-2 w-full py-2 font-medium" handleButtonClick={shareLiveLocation} loading={loadButton} disable={loadButton} />    
          )}

          {(tripData?.status !== "CONFIRMED" || locationShared) && (
            <div>
              {/* <IonButton
              expand="block"
              color={color}
              className="rounded-xl font-semibold"
              onClick={handleStartTrip}
            >
              {btnValue}
            </IonButton> */}
            <LoadingButton 
            label={btnValue}
            className="rounded-xl w-full font-semibold" 
            color={color}
            handleButtonClick={handleStartTrip}
            loading={loadButton}
            disable={loadButton}
             />

              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <IonIcon icon={informationCircleOutline} />
                <IonText className="text-sm">
                  Please reach the pickup point before clicking Start Trip
                </IonText>
              </div></div>
          )}

          <h6 style={{ color: "black", }} className="text-lg mt-1 font-semibold">About Trip</h6>
          
          <OwnerCard
            name={ownerName}
            phone={Ownerphone}
            avatarUrl={avatarUrl}
            origin_latitude={tripData?.origin_latitude}
            origin_longitude={tripData?.origin_longitude}
          />
          <TripSummaryCard
            brand={tripData?.brand}
            price={tripData?.fare_amount}
            carType={tripData?.car_type}
            transmission={tripData?.transmission}
            boardType={tripData?.board_type}
            fromCity={tripData?.origin_city}
            fromArea={tripData?.origin_area}
            fromState={tripData?.origin_state}
            toCity={tripData?.destination_city}
            toArea={tripData?.destination_area}
            toState={tripData?.destination_state}
            startTime={startTime}
            endTime={endTime}
            onView={() => handleView(tripData?.owner_id)}
          />
    
          <IonButton color='primary' expand="block" className="border-2 py-2 font-medium" onClick={handleCancel}>
            Cancel
          </IonButton>
        </div>
      )}
      {/* Photo upload screen (start or end) */}
      {tripStarted && !otpInput && (
        <CarPhotoUpload tripId={tripData?.trip_id} photoUploadType={photoUploadType} onSubmitSuccess={handlePhotoSubmitSuccess} onTripDataUpdate={handleTripDataUpdate} />
      )}

      {/* OTP screen */}
      {otpInput && (
  <div className="w-full">     
          <OtpInput
          
            enteredOtp={(code) => setEnteredOtp(code.trim())}
            loading={loadButton}
            disable={loadButton}
            onVerify={handleVerify}
          />
  </div>
      )}

      {/* Payment pending screen */}
      </IonContent>
    </IonModal>
  );
};

export default DriverTripDetailModal;