import React, { useEffect, useState } from "react";
import useApiCall from "../../hooks/useApi";
import axiosInstance from "../../api/axiosinstance";
import constants from "../../lib/constants";
import { IonCard } from "@ionic/react";

interface Props {
  tripId?: number;
}

const DriverArrivalInfo: React.FC<Props> = ({ tripId }) => {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);


  const [getArrivalInfo, { loading }] = useApiCall(axiosInstance.get);

  const fetchArrivalInfo = () => {
    if (!tripId) return;

    getArrivalInfo([`${constants.DRIVER_ARRIVAL_TIME}/${tripId}`], {
      onCompleted: (res: any) => {
        if (res?.data?.status) {
          setDistanceKm(res.data.distanceKm);
          setEtaMinutes(res.data.etaMinutes);

          if (res.data.driver_latitude && res.data.driver_longitude) {
                setDriverLat(res.data.driver_latitude);
                setDriverLng(res.data.driver_longitude);
            }
        }
      },
      onError: () => {
        setDistanceKm(null);
        setEtaMinutes(null);
      },
    });
  };

  useEffect(() => {
    if (!tripId) return;

    // initial fetch
    fetchArrivalInfo();

    // update every 2 minutes
    const intervalId = window.setInterval(() => {
      fetchArrivalInfo();
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [tripId]);

  const openDriverLocation = () => {
  if (driverLat == null || driverLng == null) {
    console.log("start of the location view");
    alert("Location not available");
    return;
  }
  console.log("open call for view");
  const url = `https://www.google.com/maps?q=${driverLat},${driverLng}`;
  window.open(url, "_blank");
  }

  const formatETA = (minutes: number) => {
    if (minutes < 60) return `~${minutes} mins`;

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return mins > 0 ? `~${hrs} hr ${mins} mins` : `~${hrs} hr`;
  };

  return (
    <IonCard className="bg-yellow-100 p-4 mt-2 rounded-2xl shadow-md mb-4">

        <div className="flex justify-between items-start">
    <div>
        {loading ? (
          <p className="text-gray-500 text-sm">
            Calculating arrival time…
          </p>
        ) : distanceKm !== null && etaMinutes !== null ? (
          <>
            <p className="text-sm font-medium">
              Driver is {distanceKm} km away
            </p>
            <p className="text-sm text-gray-600">
              Estimated arrival: {formatETA(etaMinutes)}
            </p>
          </>
        ) : (
          <p className="text-sm text-500">
             Driver has not shared the location yet...
          </p>
        )}
        </div>

        {!loading && driverLat !== null && driverLng !== null && (
          <div
            onClick={openDriverLocation}
            className="flex align-item text-lg cursor-pointer"
            style={{ color: "#D39C2F", whiteSpace: "nowrap" }}
          >
            📍 View
          </div>
        )}
      </div>
    </IonCard>
  );
};

export default DriverArrivalInfo;