import React, { useEffect, useState } from "react";
import { IonContent, IonSkeletonText, IonGrid, useIonRouter } from "@ionic/react";
import PageLayout from "../../../modules/common/layout/PageLayout";
import OwnerBookingHistoryProps from "../../../common/OwnerBookingHistory";
import constants from "../../../lib/constants";
import axiosInstance from "../../../api/axiosinstance";
import useApiCall from "../../../hooks/useApi";

const OwnerBookingHistory: React.FC = () => {
  const [tripDetails, setTripDetails] = useState<any[]>([]);
  const [tripError, setTripError] = useState<string | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const[get_status]=useApiCall(axiosInstance.get);
  const router = useIonRouter();
  console.log('tripDetails', tripDetails);
  
  
  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const ownerData = localStorage.getItem("user");
        const parsedOwner = ownerData ? JSON.parse(ownerData) : null  ;

        const ownerId =
          parsedOwner?.owner_id ||
          parsedOwner?.id ||
          parsedOwner?.data?.owner_id ||
          parsedOwner?.data?.id ;

        if (!ownerId) {
          setTripError("Owner ID not found. Please log in again.");
          setTripLoading(false);
          return;
          }

        const url = `${constants.GET_PAYMENT_HISTORY}/${ownerId}` ;

        await get_status(
          [url],
          {
            onCompleted: (res: any) => {
              if (!res?.data?.status) {
                setTripError(res?.data?.msg || "No trip history found.");
              } else {
                const apiTrips = res.data.payments || []  ;

                if (apiTrips.length === 0) {
                  setTripError("No Booking history found.");
                  setTripLoading(false);
                  return;
                  }

                const mappedTrips = apiTrips.map((t: any) => ({
                  tripId: t.trip_id,
                  from: t.origin_city,
                  to: t.dest_city,
                  startDate: `${t.start_date.split("T")[0]}T${t.pickup_time}`,
                  endDate: `${t.end_date.split("T")[0]}T${t.drop_time}`,
                  fareAmount: t.fare_amount,
                  driverName: t.driver_name,
                  driverPhone: t.driver_phone,
                  driverId: t.driver_id,
                  driverProfileURL: t.driver_profile_photo_url,
                })) ;

                setTripDetails(mappedTrips);
              }
              setTripLoading(false);
            },
            onError: (err: any) => {
              console.error("Error fetching trip details:", err);
              setTripError("Failed to load booking history.");
              setTripLoading(false);
            },
          }
        );
      } catch (err) {
        console.error("Error fetching trip details:", err);
        setTripError("Failed to load booking history.");
        setTripLoading(false);
      }
    } ;

    fetchTripDetails();
  }, []);

  const renderSkeletonCard = () => (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">

      {/* Trip Success Title */}
      <IonSkeletonText animated style={{ width: "35%", height: "18px", borderRadius: 8 }} />

      {/* Main Trip Card */}
      <div className="bg-white rounded-xl p-4 shadow mt-3 space-y-4">

        {/* From / To section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <IonSkeletonText animated style={{ width: "12px", height: "12px", borderRadius: "50%" }} />
            <IonSkeletonText animated style={{ width: "40%", height: "16px" }} />
          </div>

          <div className="flex items-center space-x-3">
            <IonSkeletonText animated style={{ width: "12px", height: "12px", borderRadius: "50%" }} />
            <IonSkeletonText animated style={{ width: "40%", height: "16px" }} />
          </div>
        </div>

        {/* Date card */}
        <IonSkeletonText animated style={{ width: "100%", height: "50px", borderRadius: 14 }} />

      </div>

      {/* Paid Button */}
      <div className="mt-3">
        <IonSkeletonText animated style={{ width: "100%", height: "45px", borderRadius: 10 }} />
      </div>

      {/* Driver Card */}
      <div className="bg-white rounded-xl p-4 shadow mt-3">
        <div className="flex items-center space-x-4">

          {/* Driver Image */}
          <IonSkeletonText animated style={{ width: "50px", height: "50px", borderRadius: "50%" }} />

          <div className="flex-1 space-y-2">
            <IonSkeletonText animated style={{ width: "60%", height: "16px" }} />
            <IonSkeletonText animated style={{ width: "40%", height: "14px" }} />
          </div>

          {/* Icon */}
          <IonSkeletonText animated style={{ width: "30px", height: "30px", borderRadius: 8 }} />
        </div>

        {/* Track & View Profile buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <IonSkeletonText animated style={{ width: "100%", height: "40px", borderRadius: 12 }} />
          <IonSkeletonText animated style={{ width: "100%", height: "40px", borderRadius: 12 }} />
        </div>
      </div>

    </div>
  );

  return (
    <PageLayout
      screenName="Booking History"
      title="Booking History"
      className="shadow-md"
      showBackButton
    >
      <IonContent className="ion-padding">

        {/* Loading */}
        {tripLoading && (
          <IonGrid>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>{renderSkeletonCard()}</div>
            ))}
          </IonGrid>
        )}

        {/* Error */}
        {tripError && (
          <p className="text-center text-gray-500 mt-4">{tripError}</p>
        )}

        <div className="mb-20">
        {/* Trip Details */}
        {!tripLoading &&
          !tripError &&
          tripDetails.map((trip, index) => (
            <OwnerBookingHistoryProps
              key={index}
              tripId={trip.tripId}
              originCity={trip.from}
              destCity={trip.to}
              startDate={trip.startDate}
              endDate={trip.endDate}
              fareAmount={trip.fareAmount}
              driverName={trip.driverName}
              driverPhone={trip.driverPhone}
              driverLanguages={["Kannada", "English"]}
              driverStatus="Trip Completed"
              onViewDriverProfile={() =>
                router.push(`/driver-profile?driver_id=${trip.driverId}&trip_id=${trip.tripId}`, "forward")
              }
              driverImg={trip.driverProfileURL}
            />
          ))}
          </div>
      </IonContent>
    </PageLayout>
  );
};

export default OwnerBookingHistory;