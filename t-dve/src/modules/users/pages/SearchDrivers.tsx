import { IonCard, IonCardContent } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import driverAvatar from "../../../../public/driverAvatar.jpg";
import tDriverOwnerAvatar from "../../../../public/tDriverOwnerAvatar.jpg";
import axiosInstance from "../../../api/axiosinstance";
import { endPoints } from "../../../lib/constants/endpoints";
import constants from "../../../lib/constants";
import { useSearchWaves } from "../tabs/booking/wavesSearch";
import useApiCall from "../../../hooks/useApi";
import PageLayout from "../../common/layout/PageLayout";
import useNavigationHistory from "../../../hooks/useNavigationHistory";

interface DriverDot {
  id: number;
  x: number;
  y: number;
  distance: number;
  avatar: string;
}

const OWNER_RADIUS = 36;
const OWNER_SAFE_DISTANCE = OWNER_RADIUS + 20;
const MAX_RADIUS = 260;
const DOT_SIZE = 14;
const MIN_DISTANCE = 22;
const POLL_INTERVAL = 10000;
const TIMEOUT = 10 * 60 * 1000;

const DriverSearch: React.FC = () => {
  const { radius } = useSearchWaves();
  const [driverCount, setDriverCount] = useState<number>(0);
  const [drivers, setDrivers] = useState<DriverDot[]>([]);
  const [getStatus] = useApiCall(axiosInstance.get);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tripId = localStorage.getItem("tripId_for_range");
  const { pushLatest } = useNavigationHistory();

  /** Load stored driver count */
  useEffect(() => {
    const stored = Number(localStorage.getItem("driverCount") || 0);
    if (!Number.isNaN(stored)) setDriverCount(stored);
  }, []);

  /** Generate driver dots without overlap */
  const generateDrivers = (count: number): DriverDot[] => {
    const points: DriverDot[] = [];
    let attempts = 0;

    while (points.length < count && attempts < count * 60) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (MAX_RADIUS - DOT_SIZE);

      if (r < OWNER_SAFE_DISTANCE) continue;

      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);

      const overlaps = points.some((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE;
      });

      if (!overlaps) {
        points.push({
          id: Date.now() + Math.random(),
          x,
          y,
          distance: Math.hypot(x, y),
          avatar: driverAvatar,
        });
      }
    }
    return points;
  };

  /** Regenerate drivers when count changes */
  useEffect(() => {
    if (driverCount > 0) {
      setDrivers(generateDrivers(driverCount));
    }
  }, [driverCount]);

  /** Polling for interested drivers */
  useEffect(() => {
    if (!tripId) return;

    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += POLL_INTERVAL;

      getStatus(
        [endPoints.GET_INTERESTED_DRIVERS_API, { params: { trip_id: tripId } }],
        {
          onCompleted: (res: any) => {
            const hasDrivers =  res?.data?.data?.count > 0;            
            if (hasDrivers || elapsed >= TIMEOUT) {
              if (intervalRef.current) clearInterval(intervalRef.current);
             pushLatest(`${constants.INTERESTED_DRIVER_PAGE}?trip_id=${tripId}`)
            }
          },
          onError: (err: any) => {
            console.error("Driver polling failed:", err);
          },
        }
      );
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tripId, getStatus]);

  const visibleDrivers = drivers.filter(
    (d) => d.distance <= (radius / 5000) * MAX_RADIUS
  );

  return (
    <PageLayout
      title="Searching for Drivers"
      screenName="SearchDrivers"
      showBackButton
    >
      <div className="pb-6">
        {/* Background */}
        <div className="absolute inset-0 bg-gray-100 z-0" />

        {/* Radar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="relative w-[700px] h-[700px]">
            <div className="absolute inset-0 rounded-full bg-yellow-300/20 animate-[var(--animate-wave)]" />
            <div className="absolute inset-[90px] rounded-full bg-yellow-400/25 animate-[var(--animate-wave)] [animation-delay:1.2s]" />
            <div className="absolute inset-[250px] rounded-full bg-yellow-500/30" />

            {visibleDrivers.map((d) => (
              <div
                key={d.id}
                className="absolute w-10 h-10 rounded-full border-2 border-white shadow-lg animate-pulse z-20 overflow-hidden"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(${d.x}px, ${d.y}px)`,
                }}
              >
                <img src={d.avatar} alt="driver" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Pickup Point */}
          <div className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full border-4 border-white shadow-xl z-40 -translate-x-1/2 -translate-y-1/2 overflow-hidden">
            <img src={tDriverOwnerAvatar} alt="Owner" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Status Card */}
        <IonCard className="absolute bottom-26 left-4 right-4 rounded-2xl z-40">
          <IonCardContent>
            <p className="text-lg font-semibold">Searching within 15 km</p>
            <p className="text-sm text-gray-500">
              {driverCount
                ? `${driverCount} available drivers`
                : "Finding available drivers…"}
            </p>
          </IonCardContent>
        </IonCard>
      </div>
    </PageLayout>
  );
};

export default DriverSearch;
