import React, { useEffect, useState } from "react";
import {
  IonModal,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import useNavigationHistory from "../../../../../../hooks/useNavigationHistory";
import constants from "../../../../../../lib/constants";
import axiosInstance from "../../../../../../api/axiosinstance";
import { endPoints } from "../../../../../../lib/constants/endpoints";
import { LocationRow } from "../../../../../../common/LocationRowProps";
import { DateRangeCard } from "../../../../../../common/DateRangeCardProps";
import PageLayout from "../../../../../common/layout/PageLayout";
import OwnerCard from "../../../../../../common/OwnerCard";
import TripMap from "../../../../../../common/TripMap";
import { useShowHide } from "../../../../../../hooks/useShowHide";
import { refresh } from 'ionicons/icons';
import { useLocation } from "react-router";
import useApiCall from "../../../../../../hooks/useApi";

const BookingSummaryScreen: React.FC = () => {
  const { pushLatest } = useNavigationHistory();
  const location = useLocation();
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerAvatar, setOwnerAvatar] = useState("");
  const [booking, setBooking] = useState<any | null>(null);
  const [origin, setOrigin] = useState({ lat: 12.9716, lng: 77.5946 });
  const [destination, setDestination] = useState({ lat: 11.916064, lng: 79.812325 });
  const [counter, setCounter] = useState(600);
  const [get_trip_details] = useApiCall(axiosInstance.get);
  const [get_driver_booking] = useApiCall(axiosInstance.get);


  const { visible, onShow, onHide } = useShowHide({
    showSummaryModal: false,
  });


  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };


  useEffect(() => {
    if (location.pathname !== "/booking/accept") {
      onHide();
    }
  }, [location.pathname]);



  useEffect(() => {
    let timer: any;

    if (visible.showSummaryModal) {
      timer = setInterval(() => {
        setCounter((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [visible.showSummaryModal]);



  // useEffect(() => {
  //   if (!booking) return;
  //   fetchLatestTripStatus();
  // }, [booking]);


  useEffect(() => {
    if (!visible.showSummaryModal || !booking) return;

    const interval = setInterval(fetchLatestTripStatus, 5000);
    return () => clearInterval(interval);
  }, [visible.showSummaryModal, booking]);


  useEffect(() => {
    const stored = localStorage.getItem("acceptedBooking");
    if (stored) {
      const parsedBooking = JSON.parse(stored);
      setBooking({
        ...parsedBooking,
      });
      console.log("booking details", booking);
      console.log("parsed booking", parsedBooking);

      setOrigin({
        lat: parseFloat(parsedBooking.originLat),
        lng: parseFloat(parsedBooking.originLog),
      });

      setDestination({
        lat: parseFloat(parsedBooking.destLat),
        lng: parseFloat(parsedBooking.destLog),
      });


      get_driver_booking([`${endPoints.GET_DRIVER_BOOKING_OWNER_DETAILS}/${parsedBooking.ownerId}`], {
        onCompleted: (res: any) => {
          console.log("Owner Details Response:", res);

          setOwnerName(res.data.data?.owner_name);
          console.log("Owner Name:", res.data.data?.owner_name);
          setOwnerPhone(res.data.data?.owner_phone);
          setOwnerAvatar(res.data.data?.owner_avatar);
        },
        onError: (err: any) => {
          console.error("Failed to fetch owner details:", err);
        },
      });

      onShow("showSummaryModal");
    }
  }, []);

    const fetchLatestTripStatus = async () => {
    const tripId = booking?.tripId || booking?.id || booking?.trip_id;
    if (!tripId) return;

    try {
      const trip_id = tripId;
      const ownerId = booking?.ownerId || booking?.owner_id;
      console.log('owner id ', ownerId);
      

      const res: any = await new Promise((resolve, reject) => {
        get_trip_details(
          [`${constants.GET_TRIP_DETAILS}/${ownerId}`],
          {
            onCompleted: (res: any) => resolve(res),
            onError: (err: any) => reject(err),
          }
        );
      });

      if (!res.data?.trip) return;

      const latestTrip = res.data.trip;

      console.log("Latest trip status:", latestTrip.status);

      setBooking((prev: any) => ({
        ...prev,
        status: latestTrip.status,
      }));

      if (latestTrip.status === "CONFIRMED") {
        setTimeout(() => {
          localStorage.removeItem("acceptedBooking");
          pushLatest(constants.HOME_PAGE);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to fetch trip status", err);
    }
  };

  const { fromCity, toCity, startTime, endTime, originArea, destinationArea } = booking || {};


  const fromLocation = `${originArea},${fromCity}`


  const toLocation = `${destinationArea},${toCity}`

  return (
    <PageLayout screenName="booking-accept-page" title='Booking Summary'>
      {!booking ?
        <div className="flex justify-center items-center mt-40 mx-auto">
          <IonLabel className="text-center ">Loading...</IonLabel>
        </div>
        : <>
          <TripMap origin={origin} destination={destination} isModalOpen={visible.showSummaryModal} />
          <IonModal
            isOpen={visible.showSummaryModal}
            onDidDismiss={() => onHide()}
            initialBreakpoint={0.5}
            breakpoints={[0, 0.5, 0.65, 1]}
            backdropDismiss={true}
            canDismiss={true}
            mode="ios"
            className="rounded-t-2xl has-handle mb-[calc(env(safe-area-inset-bottom,0px)+56px)] [--padding-bottom:calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
          >
            <IonContent className="bg-white rounded-t-3xl pt-2">
              <div className="flex justify-center my-1">
                <div className="w-14 h-[4px] rounded-full bg-gray-300" />
              </div>

              <div className="px-5 pb-6">
                <div className="px-5 pb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold">
                      About Trip
                    </h2>

                    <IonIcon
                      icon={refresh}
                      onClick={fetchLatestTripStatus}
                      className="h-6 w-6 text-gray-600 cursor-pointer"
                    />
                  </div>
                </div>

                <IonCard className="rounded-2xl shadow-sm border bg-slate-150 shadow-2xl">
                  <IonCardContent className="px-4 py-3">
                    <LocationRow label="From" city={fromLocation} showTopDot />
                    <div className="my-3 border-t border-gray-200" />
                    <LocationRow label="To" city={toLocation} showBottomDot />
                  </IonCardContent>
                </IonCard>

                <DateRangeCard
                  startDate={startTime?.split(",")[0]}
                  startTime={startTime?.split(",")[1]}
                  endDate={endTime?.split(",")[0]}
                  endTime={endTime?.split(",")[1]}
                />

                <div className="h-15 w-full text-center mb-5">
                  <div className="h-15 w-full text-center mb-5">
                    {!booking?.status && (
                      <p className="text-gray-400">Loading trip status...</p>
                    )}

                    {booking?.status === "CREATED" && (
                      <p className="text-gray-600">
                        Waiting for response from owner {formatTime(counter)}
                      </p>
                    )}

                    {booking?.status === "CONFIRMED" && (
                      <p className="text-green-600 font-semibold">
                        Your trip is confirmed 🎉
                      </p>
                    )}
                  </div>
                </div>
                <OwnerCard
                  name={ownerName}
                  phone={ownerPhone}
                  avatarUrl={ownerAvatar}
                />

                <IonButton
                  expand="block"
                  className="mt-6 text-black font-semibold rounded-xl bg-[#FFD500] h-12 shadow-md hover:bg-[#F5C400]"
                  onClick={() => pushLatest("/booking")}
                >
                  Cancel
                </IonButton>
              </div>
            </IonContent>
          </IonModal>
        </>}
    </PageLayout>
  );
};

export default BookingSummaryScreen;
