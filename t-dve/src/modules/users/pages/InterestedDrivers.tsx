import React, { useContext, useEffect, useState } from "react";
import { IonContent, useIonRouter } from "@ionic/react";
import constants from "../../../lib/constants";
import axiosInstance from "../../../api/axiosinstance";
import PageLayout from "../../common/layout/PageLayout";
import DriverCard from "../../../common/DriverCard";
import { useIonViewWillEnter } from "@ionic/react";

import { socket } from "../../../utils/socket";

import { useToast } from "../../../hooks/useToast";
import useApiCall from "../../../hooks/useApi";
import user from "../../../lib/mapper/user";
import { UserContext } from "../../../provider/UserProvider";

interface Driver {
  phone: number;
  driver_id: number;
  full_name: string;
  profile_image?: string | null;
  user_id: number;
}


const InterestedDrivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
    const { user } = useContext(UserContext);
    const ownerId = user?.owner_id
  
  const router = useIonRouter();

  const query = new URLSearchParams(window.location.search);


  const [post_status] = useApiCall(axiosInstance.post);
  const [get_interested_drivers] = useApiCall(axiosInstance.get);

  const trip_id = query.get("trip_id");
  const [bookingDriverId, setBookingDriverId] = useState<number | null>(null);
  const toast = useToast()


  const handleBook = async (driverId: number) => {
    setBookingDriverId(driverId);
    const driverDetails = drivers.find(d => d.driver_id === driverId);
    if (!driverDetails) {
      console.log("Driver details required");
      setBookingDriverId(null);
      return;
    }

    await post_status(
      [
        constants.CONFIRM_DRIVER_API,
        {
          trip_id: trip_id,
          driver_id: driverId,
          ownerId:user?.owner_id
        },
      ],
      {
        onCompleted: (res: any) => {
          console.log("here is the response", res?.data?.success);

          if (res?.data?.success) {
            const updatedTrip = res.data.data.trip;
            const updatedDriver = res.data.data.driver;
            localStorage.setItem("trip_id", String(updatedTrip.id));
            localStorage.setItem("driver_id", String(updatedDriver.id));
            sessionStorage.setItem("REFRESH_INTERESTED_DRIVERS", "1");
            toast.success("Driver booked successfully!");
            // router.push("/home", "forward");
            window.location.href = "/home";

          } else {
            console.log(res.data.message);
            
            toast.error(res.data.message || "Failed to book driver");
          }

          setBookingDriverId(null);
        },
        onError: (err: any) => {
          console.log("Error booking driver:", err);
          toast.error(err?.message || "Booking failed");
          setBookingDriverId(null);
        },
      }
    );
  };


  const fetchData = async () => {
    setLoading(true);
    await get_interested_drivers(
      [constants.GET_INTERESTED_DRIVERS_API, { params: { trip_id: trip_id } }],
      {
        onCompleted: (res: any) => {
          console.log('interested drivers',res);
          if (res?.data?.status) {
            const rows = res?.data?.data?.rows ?? [];
            setDrivers(
              rows.map((d: any) => ({
                driver_id: d.driver_id,
                full_name: d.name, // response key is `name`
                profile_image: d.profile_photo_url,
                user_id: d.user_id,
                phone: d.phone,
              }))
            );
          } else {
            toast.error(res?.data?.message || "Failed to fetch interested drivers");
          }
          setLoading(false);
        },
        onError: () => {
          toast.error("Failed to fetch interested drivers");
          setLoading(false);
        },
      }
    );
  };

  useEffect(() => {
      fetchData();
    
  }, []);

  useIonViewWillEnter(() => {
    const refresh = window.sessionStorage.getItem(
      "REFRESH_INTERESTED_DRIVERS"
    );

    if (refresh === "1") {
      window.sessionStorage.removeItem("REFRESH_INTERESTED_DRIVERS");
      fetchData();
    }
  });




  


  useEffect(() => {
    const handleLiveUpdate = (payload: any) => {
      if (payload?.trip_id === trip_id) {
        fetchData();
      }
    };
    socket.on("newInterestedDriver", handleLiveUpdate);
    return () => {
      socket.off("newInterestedDriver", handleLiveUpdate);
    };
  }, [trip_id]);


  const handleBackClick = async () => {

    router.push('/booking', 'back');
  };


  //   try {
  //     await get_status(
  //       [`${constants.GET_TRIP_DETAILS}/${ownerId}`],
  //       {
  //         onCompleted: (res: any) => {
  //           if (res?.data?.trip) {
  //             setTripDetailsLocal(res.data.trip);
  //           }
  //         },
  //         onError: (error: any) => {
  //           console.log("Error is ", error?.response?.data?.msg);
  //           toast.error(error?.response?.data?.msg);
  //         },
  //       }
  //     );
  //   } catch (error: any) {
  //     console.log("Error is ", error?.response?.data?.msg);
  //     toast.error(error?.response?.data?.msg);
  //   }
  // };

  // useEffect(() => {
  //   if (!tripIdFromQuery) return;
  //   fetchTrip();
  // }, [tripIdFromQuery]);


  return (
    <PageLayout screenName="InterestedDrivers" title="Interested Drivers" showBackButton backButtonClick={handleBackClick} reload refetch={fetchData}>
      <IonContent className="ion-padding" fullscreen>
        {!loading && drivers.length === 0 && <p>No drivers have shown interest yet.</p>}
        {!loading &&
          drivers.map(driver => (
            <div key={driver.driver_id} style={{ marginBottom: "18px" }}>
              <DriverCard
                name={driver.full_name}
                avatarUrl={driver.profile_image}
                phone={driver?.phone}
                onViewProfile={() =>
                  router.push(`/driver-profile?driver_id=${driver.driver_id}&trip_id=${trip_id}`, "forward")
                }
                onBook={async () => await handleBook(driver.driver_id)}
                disabled={bookingDriverId === driver.driver_id}
                loading={bookingDriverId === driver.driver_id}
              />
            </div>
          ))}
      </IonContent>
    </PageLayout>
  );
};

export default InterestedDrivers;