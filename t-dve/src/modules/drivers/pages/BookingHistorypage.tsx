import React, { useEffect, useState } from "react";
import { IonContent, IonGrid, IonSkeletonText } from "@ionic/react";
import PageLayout from "../../../modules/common/layout/PageLayout";
import DriverBookingHistoryCard from "../../../common/DriverBookingHistoryCard";
import constants from "../../../lib/constants";
import axiosInstance from "../../../api/axiosinstance";
import useApiCall from "../../../hooks/useApi";

const BookingHistoryPage: React.FC = () => {
  const [tripDetails, setTripDetails] = useState<any[]>([]);
  const [tripError, setTripError] = useState<string | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const[getdriverbookinghistory]=useApiCall(axiosInstance.get);



useEffect(() => {
  const fetchTripDetails = async () => {
    try {
      const driverData = JSON.parse(localStorage.getItem("user") || "{}");

      let driverId: any = null;

      if (driverData.driver_id) driverId = driverData.driver_id;
      else if (driverData.id) driverId = driverData.id;
      else if (driverData.data?.driver_id) driverId = driverData.data.driver_id;
      else if (driverData.data?.id) driverId = driverData.data.id;

      if (!driverId) {
        setTripError("Driver ID not found. Please log in again.");
        setTripLoading(false);
        return;
      }

      const response: any = await new Promise((resolve, reject) => {
        getdriverbookinghistory(
          [`${constants.GET_DRIVER_BOOKING_HISTORY}/${driverId}`],
          {
            onCompleted: (res: any) => resolve(res),
            onError: (err: any) => reject(err),
          }
        );
      });

      if (!response?.data?.status) {
        setTripError(response?.data?.msg || "No booking history found.");
        setTripLoading(false);
        return;
      }

      const apiTrips = response.data.payments || [];

      if (apiTrips.length === 0) {
        setTripError("No booking history found.");
        setTripLoading(false);
        return;
      }

      const mappedTrips = apiTrips.map((t: any) => ({
        tripId: t.trip_id,
        from: t.origin_city,
        to: t.dest_city,
        startDate: t.start_date
          ? `${t.start_date.split("T")[0]}T${t.pickup_time || "00:00"}`
          : "",
        endDate: t.end_date
          ? `${t.end_date.split("T")[0]}T${t.drop_time || "00:00"}`
          : "",
        fareAmount: t.fare_amount,
      }));

      setTripDetails(mappedTrips);
    } catch (err) {
      console.error("Error fetching booking history:", err);
      setTripError("Failed to load booking history.");
    } finally {
      setTripLoading(false);
    }
  };

  fetchTripDetails();
}, []);

  const renderSkeletonCard = () => (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">

      {/* Title: Trip Completed */}
      <div className="flex justify-center mb-3">
        <IonSkeletonText
          animated
          style={{ width: "40%", height: "20px", borderRadius: 8 }}
        />
      </div>

      {/* Main Trip Card */}
      <div className="bg-white rounded-xl p-4 shadow space-y-4">

        {/* From and To */}
        <div className="space-y-4">

          <div className="flex items-center space-x-3">
            <IonSkeletonText
              animated
              style={{ width: "12px", height: "12px", borderRadius: "50%" }}
            />
            <IonSkeletonText
              animated
              style={{ width: "120px", height: "16px" }}
            />
          </div>

          <div className="flex items-center space-x-3">
            <IonSkeletonText
              animated
              style={{ width: "12px", height: "12px", borderRadius: "50%" }}
            />
            <IonSkeletonText
              animated
              style={{ width: "120px", height: "16px" }}
            />
          </div>
        </div>

        {/* Date range  */}
        <IonSkeletonText
          animated
          style={{ width: "100%", height: "50px", borderRadius: 14 }}
        />
      </div>

      {/* Paid button */}
      <div className="mt-4">
        <IonSkeletonText
          animated
          style={{ width: "100%", height: "45px", borderRadius: 10 }}
        />
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

        {/* Loading → Skeleton Cards */}
        {tripLoading && (
          <IonGrid>
            {[1, 2, 3].map((id) => (
              <div key={id}>{renderSkeletonCard()}</div>
            ))}
          </IonGrid>
        )}

        {/* Error */}
        {!tripLoading && tripError && (
          <p className="text-center text-gray-500 mt-4">{tripError}</p>
        )}

        <div className="mb-20">
        {/* Actual Trip Data */}
        {!tripLoading &&
          !tripError &&
          tripDetails.length > 0 &&
          tripDetails.map((trip, index) => (
            <DriverBookingHistoryCard
              tripId={trip.tripId}
              key={index}
              originCity={trip.from}
              destCity={trip.to}
              startDate={trip.startDate}
              endDate={trip.endDate}
              fareAmount={trip.fareAmount}
            />
          ))}
          </div>
      </IonContent>
    </PageLayout>
  );
};

export default BookingHistoryPage;