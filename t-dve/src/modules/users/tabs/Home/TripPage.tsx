import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useShowHide } from "../../../../hooks/useShowHide";
import PageLayout from "../../../common/layout/PageLayout";
import TripMap from "../../../../common/TripMap";
import TripDetailModal from "../../../common/TripDetailModal";
import AnnouncementModal from "../../../../common/AnnouncementModal";
import axiosInstance from "../../../../api/axiosinstance";
import constants from "../../../../lib/constants";
import { UserContext } from "../../../../provider/UserProvider";
import { IonContent } from "@ionic/react";
import useApiCall from "../../../../hooks/useApi";

const TripTestingPage: React.FC = () => {
  const location = useLocation();
  const { user } = useContext(UserContext);
  const [tripData, setTripData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [origin, setOrigin] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);

  const { visible, onHide, onShow } = useShowHide({ showAnnouncement: false });

  const handleCoordinatesUpdate = (o: any, d: any) => {
    setOrigin(o);
    setDestination(d);
  };


  useEffect(() => {
    const onHome = location.pathname === "/home";
    setIsModalOpen(onHome && !!tripData);
  }, [location.pathname, tripData]);





  return (
    <PageLayout
      reload
      refetch={tripData}
      title="Trip Details"
      screenName="TripDetails"
      showNotification
      onNotificationClick={() => onShow("showAnnouncement")}
    >
      <IonContent
        className="px-3 py-3"
        style={{
          "--padding-bottom": "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
        }}
      >
        {!tripData ? (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="text-lg font-semibold text-gray-700">No Trips Yet</p>
          </div>
        ) : (
          <div className="rounded-2xl shadow-md">
            {origin && destination && (
              <TripMap
                origin={origin}
                destination={destination}
                isModalOpen={isModalOpen}
              />
            )}
          </div>
        )}
         <TripDetailModal
            isOpen={isModalOpen}
            onModalClose={() => setIsModalOpen(false)}
            onModalOpen={() => setIsModalOpen(true)}
            onCoordinatesUpdate={handleCoordinatesUpdate}
            onTripDataFetch={(data) => setTripData(data)}
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

export default TripTestingPage;
