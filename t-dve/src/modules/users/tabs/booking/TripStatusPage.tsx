import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  IonContent,
  IonButton,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  useIonRouter,
} from "@ionic/react";

import TripCard from "../../../../common/TripCard";
import DriverCard from "../../../../common/DriverCard";

import axiosInstance from "../../../../api/axiosinstance";
import constants from "../../../../lib/constants";
import { UserContext } from "../../../../provider/UserProvider";
import PageLayout from "../../../common/layout/PageLayout";
import useNavigationHistory from "../../../../hooks/useNavigationHistory";
import { socket } from "../../../../utils/socket";
import useApiCall from "../../../../hooks/useApi";

interface Trip {
  tripId: number;
  from: string;
  to: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  dropTime: string;
  driverName?: string | null;
  driverProfileURL?: string | null;
  driverPhone?: string | null;
  driverId?: number;
}

interface TripState {
  ongoing: Trip[];
  created: Trip[];
  completed: Trip[];
}

const TripStatusPage: React.FC = () => {
  const { pushLatest } = useNavigationHistory();
  const { user } = useContext(UserContext);
  const router = useIonRouter();
  const [get_status] = useApiCall(axiosInstance.get);
  const ownerId = user?.owner_id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TripState>({
    ongoing: [],
    created: [],
    completed: [],
  });

  const normalizeTrips = (apiData: any): TripState => ({
    ongoing: apiData?.ongoing ?? [],
    completed: apiData?.completed ?? [],
    created: apiData?.created ?? [],
  });

  const fetchTrips = useCallback(async () => {
    if (!ownerId) return;

    setLoading(true);

    await get_status([`${constants.GET_TRIP_DETAILS_STATUS}/${ownerId}`], {
      onCompleted: (res: any) => {
        if (res?.data?.status) {
          setData(normalizeTrips(res.data.data));
        }
        setLoading(false);
      },
      onError: (err: any) => {
        console.error("FETCH ERROR:", err);
        setLoading(false);
      },
    });
  }, [ownerId]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    if (!ownerId) return;

    const handleLiveUpdate = (payload: any) => {
      if (payload?.newTrip?.owner_id === ownerId) fetchTrips();
    };

    socket.on("newTripConfirmed", handleLiveUpdate);
    return () => {
      socket.off("newTripConfirmed", handleLiveUpdate);
    };
  }, [ownerId, fetchTrips]);

  const statusMeta = useMemo(
    () => [
      { key: "ongoing" as const, title: "Ongoing Trips" },
      { key: "created" as const, title: "Upcoming Trips" },
      // { key: "completed" as const, title: "Completed Trips" },
    ],
    [],
  );

  const handleRefresh = async (e: CustomEvent) => {
    await fetchTrips();
    (e.target as HTMLIonRefresherElement).complete();
  };

  return (
    <PageLayout title="Booking" screenName="TripStatusPage" reload refetch={fetchTrips}>
      {/* ✅ Whole page wrapper */}
      <div className="relative h-full bg-[#F4F5F6]">
        <IonContent
          className="ion-padding"
          style={{
            "--padding-bottom": "calc(88px + env(safe-area-inset-bottom))",
          }}
        >
          {/* ✅ Pull to refresh */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent pullingText="Pull to refresh" />
          </IonRefresher>

          {/* ✅ IMPORTANT: padding-bottom so last card visible above fixed CTA */}
          <div className="pb-38">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, idx) => (
                  <>
                    <IonSkeletonText
                      animated
                      style={{ height: 26, borderRadius: 6, width: "55%" }}
                    />
                    <IonSkeletonText
                      animated
                      style={{ height: 16, width: "55%", borderRadius: 6 }}
                    />
                    <div
                      key={idx}
                      className="rounded-2xl bg-white shadow-sm p-4"
                    >
                      <IonSkeletonText
                        animated
                        style={{ height: 18, width: "45%" }}
                      />
                      <div className="mt-4 space-y-3">
                        <IonSkeletonText
                          animated
                          style={{ height: 16, width: "65%" }}
                        />
                        <IonSkeletonText
                          animated
                          style={{ height: 16, width: "55%" }}
                        />
                        <IonSkeletonText
                          animated
                          style={{ height: 42, borderRadius: 12 }}
                        />
                      </div>
                    </div>
                  </>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {statusMeta.map(({ key, title }) => {
                  const trips = data[key];

                  return (
                    <section key={key}>
                      <h2 className="text-xl font-bold text-black">{title}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {trips.length
                          ? `${trips.length} trip${trips.length > 1 ? "s" : ""}`
                          : `No ${title.toLowerCase()} available.`}
                      </p>

                      {trips.length > 0 ? (
                        <div className="mt-4 space-y-4">
                          {trips.map((trip) => (
                            <div
                              key={trip.tripId}
                              className="rounded-2xl bg-white shadow-md p-4"
                            >
                              {/* Trip ID */}
                              <div className="text-center mb-1">
                                <span className="text-xs text-gray-500 font-medium">
                                  Trip ID: {trip.tripId}
                                </span>
                              </div>
                              <TripCard
                                editable={false}
                                trip={{
                                  ...trip,
                                  from: trip.from?.toUpperCase(),
                                  to: trip.to?.toUpperCase(),
                                }}
                              />

                              {key === "created" ? (
                                <IonButton
                                  expand="block"
                                  className="mt-4"
                                  style={{ "--background": "#4CAF50" }}
                                  onClick={() =>
                                    pushLatest(
                                      `/interested-drivers?trip_id=${trip.tripId}`,
                                    )
                                  }
                                >
                                  View
                                </IonButton>
                              ) : (
                                <div className="mt-4">
                                  <DriverCard
                                    name={trip.driverName || "Driver Pending"}
                                    avatarUrl={trip.driverProfileURL}
                                    onViewProfile={() =>
                                      router.push(
                                        `/driver-profile?driver_id=${trip.driverId}&trip_id=${trip.tripId}`,
                                        "forward",
                                      )
                                    }
                                    phone={
                                      trip.driverPhone
                                        ? parseInt(trip.driverPhone)
                                        : undefined
                                    }
                                    statusText={
                                      key === "ongoing"
                                        ? "On the way"
                                        : "Scheduled"
                                    }
                                    disabled={!trip.driverName}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <></>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </IonContent>

        {/* ✅ FIXED CTA FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#F4F5F6]/95 backdrop-blur border-t border-gray-200 px-4 py-3">
          <IonButton
            expand="block"
            className="w-full"
            style={{ "--background": "#FFD700", "--color": "#000" }}
            onClick={() => pushLatest("/rent-your-driver")}
          >
            Hire a Driver
          </IonButton>
        </div>
      </div>
    </PageLayout>
  );
};

export default TripStatusPage;
