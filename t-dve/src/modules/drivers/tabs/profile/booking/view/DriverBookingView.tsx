import React, { useContext, useEffect, useState } from "react";
import BookingCard from "../DriverBookingCard";
import PageLayout from "../../../../../common/layout/PageLayout";
import axiosInstance from "../../../../../../api/axiosinstance";
import { endPoints } from "../../../../../../lib/constants/endpoints";
import useApiCall from "../../../../../../hooks/useApi";

import {
  IonContent,
  IonInput,
  IonPage,
  IonSkeletonText,
} from "@ionic/react";
import { UserContext } from "../../../../../../provider/UserProvider";
import constants from "../../../../../../lib/constants";
import { useLocation } from "react-router";
import useNavigationHistory from "../../../../../../hooks/useNavigationHistory";
import { useToast } from "../../../../../../hooks/useToast";

interface Booking {
  id: number;
  ownerId: number;
  carName: string;
  carType: string;
  transmission: string;
  boardType: string;
  distance: string;
  price: number | string;
  fromCity: string;
  toCity: string;
  startTime: string;
  endTime: string;
  tripType: string;
  imageUrl: string;
  expireMinutes: number;
  onView: () => void;
  onAccept: () => void;
  onReject: () => void;
}

const HeaderSection = ({
  owner_profile,
  ownerName,
  dateJoined
}: any) => (
  <div className="w-full bg-white shadow-md rounded-b-3xl p-6 flex flex-col items-center relative">
    <div className="flex flex-col items-center mt-4">
      <img
        src={owner_profile || 'https://picsum.photos/200'}
        className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
        alt="test"
      />
      <div className="flex items-center gap-1 mt-2">
        <h3 className="text-lg font-semibold text-gray-800">
          {ownerName || "loading ..."}
        </h3>
        <span className="text-blue-500 text-lg">✔️</span>
      </div>
      <p className="text-gray-500 text-sm mt-1">
        Joined{" "}
        {dateJoined
          ? new Date(dateJoined).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "Sep 2020"}
      </p>
    </div>
  </div>
);

export const BookingDetailsCard = ({ bookings , fromHome }: any) => (
  <div className="w-full max-w-md px-4 mt-6 md:max-w-lg">
    {bookings.map((b: any) => (
      <BookingCard key={b.ownerId} {...b} hideActions={true} hideTime={fromHome} />
    ))}
  </div>
);




const DocumentCard = ({ title, value }: any) => (
  <div>
    <p className="text-sm font-semibold text-gray-800 mb-2">{title}</p>
    <div className="w-full bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-4">
      <div className="w-11 h-11 bg-yellow-100 rounded-lg flex items-center justify-center">
        📄
      </div>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  </div>
);







const View: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useContext(UserContext);
  const { pushLatest } = useNavigationHistory();
  const [timeLeft, setTimeLeft] = useState(600);
  const [isLoading,setIsLoading] = useState(true);
  const [dateJoined, setDateJoined] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [carInsurance, setCarInsurance] = useState<string | null>("No");
  const [rcCard, setRcCard] = useState<string | null>("No");
  const [profile, setProfile] = useState<string | null>(null);
  const { success, error } = useToast();
  const loc = useLocation();
  const mode = new URLSearchParams(loc.search).get("mode");

  const isFromTrip = mode === "trip_detail";

  const fetchOwnerDetailsApi = async (ownerId: number) =>
    axiosInstance.get(
      `${endPoints.GET_DRIVER_BOOKING_OWNER_DETAILS}/${ownerId}`
    );
  const [executeOwnerApi] = useApiCall(fetchOwnerDetailsApi);

  useEffect(() => {
    const saved = localStorage.getItem("selectedBooking");
    if (!saved) return;
    setIsLoading(true);
    const parsed = JSON.parse(saved);
    parsed.onView = parsed.onAccept = parsed.onReject = () => {};
    setBookings([parsed]);
    if (parsed.ownerId) {
      executeOwnerApi([parsed.ownerId], {
        onCompleted: (res: any) => {
          setOwnerName(res.data.data.owner_name);
          setAddress(res.data.data.address);
          setDateJoined(res.data.data.created_at);
          setCarInsurance(res.data.data.car_insurance ? "YES" : "NO");
          setRcCard(res.data.data.rc ? "YES" : "NO");
          setProfile(res?.data?.data?.owner_avatar);
          setIsLoading(false);
        },
      });
    }
  }, []);



  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`;

  const updateDriverRejectInterest = async (
    tripId: number,
    driverId: number,
    interestType: string
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
      pushLatest(`${constants.BOOKING_PAGE}`) ;    
      },
      onError: (err) => {
        console.error("Reject API Error:", err);
      },
    });
  };

const updateDriverConfirmInterest = async (
  tripId: number,
  driverId: number,
  interestType: string
) => {
  return axiosInstance.put(endPoints.UPDATE_DRIVER_CONFIRM_INTEREST, {
    trip_id: tripId,
    driver_id: driverId,
    driver_interest_type: interestType,
  });
};
const [executeAcceptedApi] = useApiCall(updateDriverConfirmInterest);
const handleAccept = (tripId: number , ownerId:number  ) => {
  
  executeAcceptedApi([tripId, user.driver_id, "ACCEPTED"], {
    onCompleted: (res) => {
   pushLatest(`${constants.DRIVER_BOOKING_ACCEPT_PAGE}?id=${ownerId}`)
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || "Could not accept booking");
      console.error("Accept API Error:", err);
    },
  });
};

  return (
<PageLayout
  screenName="view-card-detail"
  title="Booking Details"
  showBackButton
  showNotification
>  
<div className="flex flex-col items-center pt-4 pb-8 min-h-screen bg-[#F2F9FB]"> 
    {isLoading ? (
      <div className="w-full bg-white shadow-md rounded-b-3xl p-6 flex flex-col items-center relative">
    <IonSkeletonText animated style={{ width: "120px", height: "16px" }} />
     <div className="mt-4 flex flex-col items-center gap-3">
       <IonSkeletonText
         animated
         style={{ width: "80px", height: "80px", borderRadius: "50%" }}
       />
      <IonSkeletonText animated style={{ width: "140px", height: "18px" }} />
       <IonSkeletonText animated style={{ width: "100px", height: "14px" }} />
     </div>
   </div>
    ) : (
      <>
        <HeaderSection
          timeLeft={timeLeft}
          formatTime={formatTime}
          ownerName={ownerName}
          dateJoined={dateJoined}
          owner_profile={profile}
        />

        <BookingDetailsCard bookings={bookings} fromHome={isFromTrip}/>

        <div className="w-full max-w-md px-5 mt-10 flex flex-col gap-6 pb-6">
        <div className="w-full bg-gray-100 border border-gray-300 rounded-xl pl-4">
          <IonInput
            value={address}
            readonly
            className="w-full bg-transparent"
          />
        </div>
        <DocumentCard title="Car Insurance" value={carInsurance} />
        <DocumentCard title="RC Card" value={rcCard} />
      </div>
      </>
    )}
 

  {/* { isFromTrip || !isLoading && (
    <ActionButtons
      onAccept={() => handleAccept(bookings[0]?.id, bookings[0]?.ownerId ?? 0)}
      onReject={() => handleReject("NOT_INTERESTED", bookings[0]?.id ?? 0)}
    />
  )} */}
  </div>
</PageLayout>

  );
};

export default View;