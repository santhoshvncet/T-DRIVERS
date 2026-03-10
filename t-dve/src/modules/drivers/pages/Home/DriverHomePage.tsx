import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import PageLayout from "../../../common/layout/PageLayout";
import TripMap from "../../../../common/TripMap";
import DriverTripDetailModal from "./DriverTripDetailModal";
import AnnouncementModal from "../../../../common/AnnouncementModal";
import { UserContext } from "../../../../provider/UserProvider";
import useApiCall from "../../../../hooks/useApi";
import axiosInstance from "../../../../api/axiosinstance";
import { endPoints } from "../../../../lib/constants/endpoints";
import { useToast } from "../../../../hooks/useToast";
import { useShowHide } from "../../../../hooks/useShowHide";
import { IonContent } from "@ionic/react";
import DriverHomeSkeleton from "../../../common/driverHomeSkeleton";

type LatLng = { lat: number; lng: number };

const DriverHomePage: React.FC = () => {
  const toast = useToast();
  const { user } = useContext(UserContext);
  const location = useLocation();

  const [updateActiveStatus] = useApiCall(axiosInstance.post);
  const { visible, onHide, onShow } = useShowHide({ showAnnouncement: false });

  // ✅ store coords only when needed
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);

  const [tripData, setTripData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(true);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    setLoadingTrip(true);
  }, []);

  useEffect(() => {
    if (user?.driver_status) {
      setIsActive(user.driver_status === "active");
    } else {
      setIsActive(false);
    }
  }, [user?.driver_status]);

  useEffect(() => {
    if (tripData) {
      setIsActive(false);
    }
  });

  useEffect(() => {
    const onHome = location.pathname === "/home";
    setShowModal(onHome && !!tripData);
  }, [location.pathname, tripData]);

  const handleCoordinatesUpdate = useCallback((o: LatLng, d: LatLng) => {
    setOrigin(o);
    setDestination(d);
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (tripData) {
      return setIsActive(false);
    }

    if (!Capacitor.isNativePlatform()) {
      if (!("geolocation" in navigator))
        throw new Error("Geolocation not supported");
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          }),
      );

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }

    const perm = await Geolocation.checkPermissions();
    if (perm.location !== "granted") {
      const req = await Geolocation.requestPermissions();
      if (req.location !== "granted")
        throw new Error("Location permission denied");
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  }, []);

  const handleStatusToggle = useCallback(
    async (checked: boolean) => {
      if (!user?.driver_id) return;

      if (tripData && checked) {
        toast.error("Finish the current trip before going Active");
        setIsActive(false);
        return;
      }

      if (updatingStatus) return;

      setUpdatingStatus(true);

      const payload: any = {
        driverId: user.driver_id,
        status: checked ? "active" : "non-active",
      };

      try {

        if (checked) {
          const location = await getCurrentLocation();
          if (location) {
            payload.driver_latitude = location.latitude;
            payload.driver_longitude = location.longitude;
          }
        }

        // ✅ Call API
        await updateActiveStatus([
          endPoints.UPDATE_DRIVER_ACTIVE_STATUS,
          payload,
        ]);


        setIsActive(checked);
        user.driver_status = checked ? "active" : "non-active";

        toast.success(checked ? "Driver Activated" : "Driver Deactivated");
      } catch (err: any) {
        console.error("Status toggle error:", err);
        toast.error(err?.message || "Failed to update status");
      } finally {
        setUpdatingStatus(false);
      }
    },
    [user, tripData, updatingStatus, toast, updateActiveStatus, getCurrentLocation],
  );

  return (
    <PageLayout
      screenName="home"
      title="home"
      showNotification
      showStatusToggle
      isActive={isActive}
      onStatusToggle={handleStatusToggle}
      disableStatusToggle={!!tripData || updatingStatus}
      onNotificationClick={() => onShow("showAnnouncement")}
      reload
      refetch={tripData}
    >
      <IonContent
        className="px-3 py-3"
        style={{
          "--padding-bottom": "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
        }}
      >
        {loadingTrip ? (
    <DriverHomeSkeleton />
  ) : !tripData ? (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="text-lg font-semibold text-gray-700">No Trips </p>
            <p className="text-sm text-gray-500 mt-1 text-center">
              You will see your trip here once a customer books.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-md">
            {origin && destination && (
              <TripMap
                origin={origin}
                destination={destination}
                isModalOpen={showModal}
              />
            )}
          </div>
        )}
        <DriverTripDetailModal
          isOpen={showModal}
          onModalClose={() => setShowModal(false)}
          onCoordinatesUpdate={handleCoordinatesUpdate}
          onTripDataFetch={(data) => {
            setTripData(data);
            setLoadingTrip(false);
          }}
        />
        {visible.showAnnouncement && (
          <AnnouncementModal
            isOpen={visible.showAnnouncement}
            onClose={onHide}
          />
        )}
      </IonContent>
    </PageLayout>
  );
};

export default DriverHomePage;
