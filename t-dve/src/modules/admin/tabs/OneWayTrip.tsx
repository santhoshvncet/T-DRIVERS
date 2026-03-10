/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useState } from "react";
import useApiCall from "../../../hooks/useApi";
import axiosInstance from "../../../api/axiosinstance";
import { endPoints } from "../../../lib/constants/endpoints";
import {
  IonModal,
  IonIcon,
  IonContent,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonList,
  IonItem,
} from "@ionic/react";
import { close, search } from "ionicons/icons";
import { LoadingButton } from "../../../common/LoadingButton";
import InputController from "../../../common/InputController";
import { Controller, useForm } from "react-hook-form";
import { useToast } from "../../../hooks/useToast";
import { truncateText } from "../../../utils/truncateText";

const OneWayTrip = () => {
  const [oneWayTripsData, setOneWayTripsData] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]); // For filtered trips
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasDriverAllowance, setHasDriverAllowance] = useState(false);
  const toast = useToast();

  const { control, setValue, getValues, watch } = useForm({
    defaultValues: {
      driverAllowance: null,
      searchTrip: "",  // Make sure searchTrip is initialized with an empty string
    },
  });

  // Fetch trips data
  const fetchAllOnewayTrips = async () =>
    axiosInstance.get(endPoints.GET_ONEWAY_TRIPS);
  const [apiCall] = useApiCall(fetchAllOnewayTrips);

  useEffect(() => {
    apiCall([], {
      onCompleted: (res) => {
        if (res?.data?.status && Array.isArray(res?.data?.data)) {
          setOneWayTripsData(res?.data?.data);
          setFilteredTrips(res?.data?.data); // Initially set all trips
        }
      },
      onError: (err) => console.error("get One Way Trips API Error:", err),
    });
  }, []);

  useEffect(() => {
    const searchTripValue = watch("searchTrip"); // Get the value of the search input
    // Filter trips based on the search value
    const filtered = oneWayTripsData.filter((trip) =>
      trip.id.toString().includes(searchTripValue)  // Filtering trips by ID
    );
    setFilteredTrips(filtered);
  }, [watch("searchTrip"), oneWayTripsData]);  // Re-run when search value or trips data changes

  const handleViewClick = (trip: any) => {
    setSelectedTrip(trip);
    setValue("driverAllowance", trip.driver_allowance != null ? trip.driver_allowance : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTrip(null);
  };

  const handleSave = async (trip: any) => {
    const allowance = getValues("driverAllowance");

    if (allowance === null || allowance === "" || isNaN(Number(allowance))) {
      toast.error("Please enter a valid driver allowance");
      return;
    }

    if (Number(allowance) > trip.fare_amount) {
      toast.error("Driver allowance cannot be greater than total amount");
      return;
    }

    try {
      await axiosInstance.put(endPoints.UPDATE_DRIVER_ALLOWANCE, {
        tripId: trip.id,
        driverAllowance: Number(allowance),
      });

      setOneWayTripsData((prev) =>
        prev.map((t) => (t.id === trip.id ? { ...t, driver_allowance: Number(allowance) } : t))
      );
      toast.success(`Driver Allowance ${( selectedTrip?.driver_allowance && !hasDriverAllowance ) ? 'Given' : 'Updated'} to the Trip ${trip.id}`)

      setSelectedTrip((prev: any) => (prev ? { ...prev, driver_allowance: Number(allowance) } : prev));
      setHasDriverAllowance(false);
    } catch (err) {
      console.error("Update driver allowance error:", err);
      toast.error("Failed to update driver allowance");
    }
  };

  useEffect(() => {
    if (selectedTrip) {
      setHasDriverAllowance(selectedTrip.driver_allowance ? false : true);
    }
  }, [selectedTrip]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)]">
      {/* Search Input */}
      <div className="mx-3 flex justify-end">
        <Controller
          control={control}
          name="searchTrip"
          render={() => (
            <InputController
              control={control}
              name="searchTrip"
              placeholder="Search Trip by ID"
              className="px-4 py-2"
              icon={<IonIcon src={search} className="h-6 w-6" />}
            />
          )}
        />
      </div>

      {/* Trip List */}
      <div className="overflow-y-auto flex-1 mb-12">
        <IonList>
          {filteredTrips.length > 0 ? (
            filteredTrips.map((trip: any) => (
              <IonItem key={trip?.id} lines="none" className="border-b border-gray-300">
                <IonGrid className="w-full">
                  <IonRow className="ion-align-items-center ion-align-justify-center ion-nowrap">
                    {/* Trip ID */}
                    <IonCol size="2" sizeMd="1">
                      <IonLabel className="text-[14px] font-medium">{trip?.id}</IonLabel>
                    </IonCol>

                    {/* From → To */}
                    <IonCol size="6" sizeMd="7" className="flex justify-center">
                      <IonLabel className="text-[14px]">
                        <div className="flex gap-3">
                          <IonText color="warning">From: </IonText>
                          {truncateText(trip?.from_place, 12)}
                        </div>
                        <div className="flex gap-3">
                          <IonText color="success">To: </IonText>
                          {truncateText(trip?.to_place, 12)}
                        </div>
                      </IonLabel>
                    </IonCol>

                    {/* View Button */}
                    <IonCol size="3" sizeMd="3" className="ion-text-end">
                      <LoadingButton
                        label="View"
                        handleButtonClick={() => handleViewClick(trip)}
                        className="w-[80px] text-black mx-auto"
                      />
                    </IonCol>

                  </IonRow>
                </IonGrid>
              </IonItem>
            ))
          ) : (
            <div className="flex justify-center items-center py-10">
              <IonLabel className="font-bold text-[18px]">No Trips Found</IonLabel>
            </div>
          )}
        </IonList>
      </div>

      {/* Modal for Trip Details */}
      <IonModal isOpen={isModalOpen} onDidDismiss={closeModal} className="ion-modal-custom">
        <div className="flex justify-between items-center p-3 border-b border-solid border-[#d1d1d1]">
          <h3>Trip Details</h3>
          <IonIcon
            slot="icon-only"
            icon={close}
            className="text-3xl"
            onClick={() => {
              setSelectedTrip(null);
              setIsModalOpen(false);
            }}
          />
        </div>

        <IonContent className="ion-padding">
          {selectedTrip && (
            <div className="space-y-2 mx-4 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Trip ID:</span> {selectedTrip.id}
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">From:</span> {selectedTrip.from_place}, {selectedTrip.from_state}
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">To:</span> {selectedTrip.to_place}, {selectedTrip.to_state}
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Driver Name:</span> {selectedTrip.driver_name}
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Phone:</span> {selectedTrip.phone}
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Start Date:</span> {selectedTrip.start_date ? new Date(selectedTrip.start_date).toLocaleDateString("en-GB") : "N/A"}
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">End Date:</span> {selectedTrip.end_date ? new Date(selectedTrip.end_date).toLocaleDateString("en-GB") : "N/A"}
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Total Amount:</span> {`${Number(selectedTrip.fare_amount).toFixed(0)} ₹`}
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold">Driver Allowance:</span>
                <div className="w-[120px]">
                  <InputController
                    control={control}
                    placeholder="Driver Allowance"
                    name="driverAllowance"
                    className="w-full h-10"
                    endIcon="₹"
                    disabled={!hasDriverAllowance}
                  />
                </div>
              </div>
              <LoadingButton
                label={selectedTrip?.driver_allowance && !hasDriverAllowance ? "Edit" : "Save"}
                handleButtonClick={() => {
                  (selectedTrip?.driver_allowance && !hasDriverAllowance)
                    ? setHasDriverAllowance(true)
                    : handleSave(selectedTrip);
                }}
                className="w-[90px] text-black mx-auto py-6"
              />
            </div>
          )}
        </IonContent>
      </IonModal>
    </div>
  );
};

export default OneWayTrip;