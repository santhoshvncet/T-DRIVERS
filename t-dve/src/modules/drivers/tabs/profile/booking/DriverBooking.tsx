/* eslint-disable no-constant-binary-expression */
import React, { useContext, useEffect, useState } from "react";
import PageLayout from "../../../../common/layout/PageLayout";
import BookingCard from "./DriverBookingCard";
import useNavigationHistory from "../../../../../hooks/useNavigationHistory";
import axiosInstance from "../../../../../api/axiosinstance";
import { UserContext } from "../../../../../provider/UserProvider";
import useApiCall from "../../../../../hooks/useApi"; // 🔹 Added
import { endPoints } from "../../../../../lib/constants/endpoints";
import constants from "../../../../../lib/constants";
import { socket } from "../../../../../utils/socket";
import {
  IonCard,
  IonSkeletonText,
  IonCardContent,
  IonContent,
} from "@ionic/react";
import { useHistory } from "react-router";

interface TripResponse {
  owner_Id: number;
  trip_id: number;
  owner_id: number;
  owner_avatar: number;
  origin_city: string;
  destination_city: string;
  origin_latitude: string;
  origin_longitude: string;
  destination_latitude: string;
  destination_longitude: string;
  pickup_time: string | null;
  drop_time: string | null;
  trip_type: string;
  fare_amount: number | null;
  brand: string | null;
  model_name: string | null;
  model_variant: string | null;
  car_type: string | null;
  transmission: string | null;
  board_type: string | null;
  distance_km: number | null;
  start_date: string;
  end_date: string;
  origin_area?: string;
  origin_state?: string;
  destination_area?: string;
  destination_state?: string;
}

interface BookingUI {
  id: number;
  ownerId: number;
  owner_avatar: string;
  carName: string;
  carType: string;
  transmission: string;
  boardType: string;
  distance: string;
  originLat: string;
  originLog: string;
  destLat: string;
  destLog: string;
  price: number;
  fromCity: string;
  toCity: string;
  startTime: string;
  endTime: string;
  tripType: string;
  expiryDate: number;
  originArea: string;
  originState: string;
  destinationArea: string;
  destinationState: string;
}

export const formatDate = (dateStr: string, timeStr?: string | null) => {
  if (!dateStr || !timeStr) return "N/A";

  const [year, month, day] = dateStr.split("-");
  const [hour, minute] = timeStr.split(":");

  const date = new Date(
    Number(year),
    Number(month) - 1, // month is 0-based
    Number(day),
    Number(hour),
    Number(minute),
  );

  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const Booking: React.FC = () => {
  const { pushLatest } = useNavigationHistory();
  const { user } = useContext(UserContext);
  const [bookingData, setBookingData] = useState<BookingUI[]>([]);
  const [page, setPage] = useState(1);
  const [tripId, setTripId] = useState();
  const pageSize = 5;
  const [allTrips] = useState<BookingUI[]>([]);
  const history = useHistory();
  const [driverBookingApi, {loading}] = useApiCall(axiosInstance.get);
  const mapTripToUI = (t: TripResponse): BookingUI => {
    const endDateTime = t.drop_time
      ? new Date(`${t.end_date}T${t.drop_time}`).getTime()
      : new Date(`${t.end_date}T23:59:59`).getTime(); // fallback

    return {
      id: t.trip_id,
      ownerId: t.owner_id ?? t.owner_Id,
      owner_avatar: String(t.owner_avatar) || "",
      carName: `${t.brand || ""} ${t.model_name || ""} ${
        t.model_variant || ""
      }`.trim(),
      carType: t.car_type || "Car",
      transmission: t.transmission || "Manual",
      boardType: t.board_type || "White Board",
      distance: t.distance_km ? `${t.distance_km.toFixed(0)} KM` : "N/A",
      price: Number(t.fare_amount) ?? 0,
      fromCity: t.origin_city,
      toCity: t.destination_city || "",
      originLat: t.origin_latitude?.trim(),
      originLog: t.origin_longitude?.trim(),
      destLat: t.destination_latitude?.trim(),
      destLog: t.destination_longitude?.trim(),
      startTime: formatDate(t.start_date, t.pickup_time),
      endTime: formatDate(t.end_date, t.drop_time),
      tripType: t?.trip_type === "oneway" ? "ONE_WAY" : "TWO_WAY",
      expiryDate: endDateTime,
      originArea: t.origin_area || "",
      originState: t.origin_state || "",
      destinationArea: t.destination_area || "",
      destinationState: t.destination_state || "",
    };
  };

  const driverBookingApiCall = async () => {
    driverBookingApi([`${endPoints.GET_DRIVER_BOOKING_DETAILS}/${user.userId}`], {
      onCompleted: (res: any) => {
        console.log("Res", res);
        
        if (Array.isArray(res.data.data)) {
          const mappedData = res.data.data.map(mapTripToUI);
          setBookingData(mappedData);

          if (mappedData.length > 0) {
            setTripId(mappedData[0].id);
          }
        }
      },
      onError: (err: any) => {
        console.error("Trips API Error:", err);
      },
    });
  }

  useEffect(() => {
    console.log(tripId);
    const handleLiveUpdate = () => {
      pushLatest(`${constants.BOOKING_PAGE}`);
    };
    socket.on("newTripCreated", handleLiveUpdate);

    return () => {
      socket.off("newTripCreated", handleLiveUpdate);
    };
  }, [tripId]);

  useEffect(()=>{
    driverBookingApiCall();
  }, [])

  const handleScroll = (e: any) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;

    if (bottom && !loading) {
      loadMore();
    }
  };

  const loadMore = () => {
    if (bookingData.length >= allTrips.length) return;


    setTimeout(() => {
      const nextPage = page + 1;
      const newData = allTrips.slice(0, nextPage * pageSize);

      setBookingData(newData);
      setPage(nextPage);
    }, 600); // delay just for skeleton feel
  };

  const updateDriverConfirmInterest = async (
    tripId: number,
    driverId: number,
    interestType: string,
  ) => {
    return axiosInstance.put(endPoints.UPDATE_DRIVER_CONFIRM_INTEREST, {
      trip_id: tripId,
      driver_id: driverId,
      driver_interest_type: interestType,
    });
  };

  const [executeAcceptedApi] = useApiCall(updateDriverConfirmInterest);
  const handleAccept = (tripId: number, ownerId: number) => {
    const selected = bookingData.find((b) => b.ownerId === ownerId);
    if (selected) {
      localStorage.setItem(
        "acceptedBooking",
        JSON.stringify({
          ...selected,
          originLat: parseFloat(selected.originLat),
          originLog: parseFloat(selected.originLog),
          destLat: parseFloat(selected.destLat),
          destLog: parseFloat(selected.destLog),
        }),
      );
    }
    executeAcceptedApi([tripId, user.driver_id, "ACCEPTED"], {
      onCompleted: () => {
        pushLatest(`${constants.DRIVER_BOOKING_ACCEPT_PAGE}?id=${ownerId}`);
        setBookingData((prev) => prev.filter((b) => b.id !== tripId));
      },
      onError: (err: any) => {
        console.error("Accept API Error:", err);
      },
    });
  };

  const BookingSkeleton = () => {
    return (
      <IonCard className="rounded-2xl shadow-lg bg-[#FEF9E7] w-full max-w-sm mx-auto border border-gray-300 overflow-hidden">
        {/* Trip ID line */}
        <div className="flex items-center ml-3 mt-3">
          <IonSkeletonText animated className="h-4 w-24 rounded-sm" />
          {/* <span className="mx-2">:</span>
          <IonSkeletonText animated className="h-5 w-32" /> */}
        </div>

        {/* Timer (Booking Expire in …) */}
        <div className="text-center py-2">
          <IonSkeletonText animated className="h-5 w-38 mx-auto rounded-sm" />
          <IonSkeletonText
            animated
            className="h-6 w-48 mx-auto mt-2 rounded-sm"
          />
        </div>

        <IonCardContent className="px-5 pb-6">
          {/* Title & Price */}
          <div className="flex justify-between items-center">
            <IonSkeletonText animated className="h-6 w-38 rounded-sm" />
            <IonSkeletonText animated className="h-6 w-20 rounded-sm" />
          </div>

          {/* Specs line */}
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2">
              <IonSkeletonText animated className="h-5 w-14 rounded" />
              <IonSkeletonText animated className="h-5 w-14 rounded" />
              <IonSkeletonText animated className="h-5 w-14 rounded" />
            </div>
            <IonSkeletonText animated className="h-5 w-20 rounded-sm" />
          </div>

          {/* Route */}
          <div className="mt-5 flex justify-between items-start">
            {/* Left side – always shown */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <IonSkeletonText animated className="w-3 h-3 rounded-full" />
                <IonSkeletonText animated className="h-4 w-52 rounded-sm" />
              </div>

              <div className="ml-1.5 border-l-2 border-gray-300 h-6 my-1" />

              <div className="flex items-center gap-2">
                <IonSkeletonText animated className="w-3 h-3 rounded-sm" />
                <IonSkeletonText animated className="h-4 w-52 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Dates row */}
          <div className="flex justify-between items-center mt-6">
            {/* Start date */}
            <div className="text-center">
              <IonSkeletonText
                animated
                className="h-5 w-10 mx-auto rounded-sm"
              />
              <IonSkeletonText
                animated
                className="h-3 w-16 mx-auto mt-2 rounded-sm"
              />
            </div>

            {/* Trip type indicator */}
            <div className="text-center">
              <IonSkeletonText
                animated
                className="h-4 w-26 mx-auto rounded-sm"
              />
              <IonSkeletonText
                animated
                className="h-3 w-8 mx-auto mt-2 rounded-sm"
              />
            </div>

            {/* End date */}
            <div className="text-center">
              <IonSkeletonText
                animated
                className="h-5 w-10 mx-auto rounded-sm"
              />
              <IonSkeletonText
                animated
                className="h-3 w-16 mx-auto mt-2 rounded-sm"
              />
            </div>
          </div>

          {/* Action buttons (3 buttons at the bottom) */}
          <div className="mt-6 flex gap-3">
            <IonSkeletonText animated className="h-9 w-full rounded-4xl" />
            <IonSkeletonText animated className="h-9 w-full rounded-4xl" />
            <IonSkeletonText animated className="h-9 w-full rounded-4xl" />
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  const updateDriverRejectInterest = async (
    tripId: number,
    driverId: number,
    interestType: string,
  ) => {
    return axiosInstance.put(endPoints.UPDATE_DRIVER_INTEREST, {
      trip_id: tripId,
      driver_id: driverId,
      driver_interest_type: interestType,
    });
  };

  const [executeRejectApi] = useApiCall(updateDriverRejectInterest);
  const handleReject = (p0: string, tripId: number) => {
    executeRejectApi([tripId, user.driver_id, "NOT_INTERESTED"], {
      onCompleted: () => {
        setBookingData((prev) => prev.filter((b) => b.id !== tripId));
      },
      onError: (err) => {
        console.error("Reject API Error:", err);
      },
    });
  };

  const handleView = (owner_id: number) => {
    const selected = bookingData.find((b) => b.ownerId === owner_id);
    if (selected) {
      localStorage.setItem("selectedBooking", JSON.stringify(selected));
    }
    if (bookingData) {
      pushLatest(`${constants.BOOKING_VIEW_PAGE}/${owner_id}`);
    }
  };

  const handleBackClick = () => {
    history.push("/home");
  };

  return (
    <PageLayout
      title="Booking"
      screenName="Booking"
      showBackButton
      reload
      refetch={driverBookingApiCall}
      backButtonClick={handleBackClick}
      
    >
      <IonContent className="flex-grow mb-14px">
        {/* Initial Loading */}
        {loading ? (
          <div className="flex flex-wrap justify-center gap-6 p-6">
            {[1, 2, 3, 4].map((i) => (
              <BookingSkeleton key={i} />
            ))}
          </div>
        ) : bookingData.length === 0 ? (
          <p className="text-center mt-80">No Booking Request yet</p>
        ) : (
          <div
            className="w-full flex flex-wrap justify-center gap-6 p-4 overflow-auto"
            style={{ maxHeight: "calc(100vh - 150px)", paddingBottom: "24px" }}
            onScroll={handleScroll}
          >
            {bookingData.map((booking: any) => (
              <div className="w-full sm:w-[360px] max-w-full">
                <BookingCard
                  {...booking}
                  id={booking.id}
                  originArea={booking.originArea}
                  originState={booking.originState}
                  destinationArea={booking.destinationArea}
                  destinationState={booking.destinationState}
                  onView={() => handleView(booking.ownerId)}
                  onAccept={() => handleAccept(booking.id, booking.ownerId)}
                  onReject={() => handleReject("Reject:", booking.id)}
                  onExpire={() => handleReject("Reject", booking.id)}
                />
              </div>
            ))}
            {/* Load More Skeleton */}
            {loading &&
              [1, 2, 3].map((i) => <BookingSkeleton key={"load" + i} />)}
          </div>
        )}
      </IonContent>
    </PageLayout>
  );
};

export default Booking;
