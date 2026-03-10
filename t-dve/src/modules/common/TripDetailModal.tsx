/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { use, useContext, useEffect, useState } from "react";
import { IonButton, IonContent, IonIcon, IonModal, useIonRouter } from "@ionic/react";
import GetOtp from "./GetOtp";
import { useForm } from "react-hook-form";
import useApiCall from "../../hooks/useApi";
import axiosInstance from "../../api/axiosinstance";
import constants from "../../lib/constants";
import { useToast } from "../../hooks/useToast";
import TripCard from "../../common/TripCard";
import DriverCard from "../../common/DriverCard";
import { LoadingButton } from "../../common/LoadingButton";
import { ITrip } from "../../common/type";
import DriverArrivalInfo from "./DriverArrivalInfo";
import { refresh } from "ionicons/icons";
import { UserContext } from "../../provider/UserProvider";

interface ownerTripDetails {
  isOpen: boolean;
  onModalClose: () => void;
  onModalOpen: () => void;
  onCoordinatesUpdate: (origin: any, destination: any) => void;
  onTripDataFetch: (data: any) => void;
}

const TripDetailModal: React.FC<ownerTripDetails> = ({
  isOpen,

  onModalClose,
  onModalOpen,
  onCoordinatesUpdate,
  onTripDataFetch,
}) => {
  const toast = useToast();
  const router = useIonRouter();
    const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false)
  const [trip, setTrip] = useState<ITrip | null>(null);
  const [driver, setDriver] = useState<any | null>(null);
  const [status, setStatus] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const ownerId = user?.owner_id;

  const AllowedStatuses = [
    "CONFIRMED",
    "ONGOING",
    "TRIP_STARTED"
  ];

  const isOneWayWithoutAllowance =
    trip?.trip_type === "oneway" && !trip?.driver_allowance;

  const { control, watch, setValue, getValues } = useForm({
    defaultValues: {
      fromCity: "",
      toCity: "",
      name: "",
      phone: "",
      city: "",
      profileUrl: "",
    },
  });

  const [get_trip] = useApiCall(axiosInstance.get);

  const getTrip = async () => {
    await get_trip([`${constants.GET_TRIP_DETAILS}/${ownerId}`], {
      onCompleted: (res: any) => {
        const tripData = res?.data?.trip;
        if (!tripData){       
        onTripDataFetch(undefined);
          return
        } 

        setTrip(tripData);
        setDriver(res?.data?.driver);

        setStatus(tripData.status);
        setShowOtp(AllowedStatuses.includes(tripData.status));

        setValue("fromCity", tripData.from);
        setValue("toCity", tripData.to);
        setValue("name", res?.data?.driver?.name);
        setValue("phone", res?.data?.driver?.phone);
        setValue(
          "city",
          `${res?.data?.driver?.userCity}, ${res?.data?.driver?.state}`
        );
        setValue("profileUrl", res?.data?.driver?.profileUrl);

        onTripDataFetch(tripData);

        onCoordinatesUpdate(
          { lat: Number(tripData.origin_latitude), lng: Number(tripData.origin_longitude) },
          { lat: Number(tripData.dest_latitude), lng: Number(tripData.dest_longitude) }
        );
      },
      onError: () => toast.error("Could not fetch trip details"),
    });
  };



  useEffect(() => {
    getTrip();
  },[])


  const handlePay = async () => {
    if (!trip?.id) return toast.error("Trip not found");
    setLoading(true)

    try {
      const res = await axiosInstance.post(constants.END_TRIP, { trip_id: trip.id });

      if (res.data?.status) {
        sessionStorage.setItem(
          "paymentDetails",
          JSON.stringify(res.data.data)
        );
        router.push(`/payment-details/${trip.id}`, "forward");
      } else {
        toast.error(res.data?.message || "Payment failed");
      }
    } catch (err) {
      toast.error("Trip not completed yet");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    toast.error('contact Admin');
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onModalClose}
      onWillPresent={onModalOpen}
      initialBreakpoint={0.5}
      breakpoints={[0, 0.5, 0.8, 1]}
      canDismiss
      backdropDismiss
      mode="ios"
      className="rounded-t-2xl has-handle mb-[calc(env(safe-area-inset-bottom,0px)+56px)] [--padding-bottom:calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
    >



      <IonContent className="ion-padding">
        {trip && (
          <>
            <div className="flex justify-between">
            <p className="text-sm text-gray-500 font-medium mb-1">
              Trip ID: <span className="text-gray-900 font-semibold">{trip.id}</span>
            </p>
            <IonIcon icon={refresh} onClick={() => window.location.reload()}
              className="h-6 w-6 text-gray-600 cursor-pointer mx-2"
            />
            </div>

            <p className="p-2 font-semibold">About Trip</p>

            {AllowedStatuses.includes(status) && <GetOtp key={status} />}

            {status === "PAYMENT_PENDING" &&
              (isOneWayWithoutAllowance ? (
                <div className="mt-2 p-3 rounded-lg bg-red-100 text-red-700 text-sm font-semibold text-center">
                  Driver allowance not provided. Please contact support.
                </div>
              ) : (
                <LoadingButton
                  loading={loading}
                  label="Pay"
                  color="success"
                  type="button"
                  handleButtonClick={handlePay}
                  className="flex-1 mt-2"
                />
              ))}

            <TripCard control={control} watch={watch} setValue={setValue} editable={false} trip={trip} />

            <p className="my-3 font-semibold">Driver</p>
            <DriverCard
              name={getValues("name")}
              phone={Number(getValues("phone"))}
              avatarUrl={getValues("profileUrl")}
              languages={driver?.languages}
              onViewProfile={() => router.push(`/driver-profile?driver_id=${driver?.id}`, "forward")}
            />
            {AllowedStatuses.includes(status) &&
              <DriverArrivalInfo tripId={trip.id} />
            }
            {/* <LoadingButton label="Cancel" type="button" className="flex-1 mt-2" /> */}
            <IonButton color='primary'
              expand="block"
              className="border-2 py-2 font-medium"
              onClick={handleCancel}
            >
              Cancel
            </IonButton>
          </>
        )}
      </IonContent>
    </IonModal>
  );
};

export default TripDetailModal;
