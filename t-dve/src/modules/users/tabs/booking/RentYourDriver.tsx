import React, { useState, useEffect, useContext, useRef } from "react";
import { IonGrid, IonRow, IonCol, IonButton, IonContent, IonIcon, IonModal, } from "@ionic/react";
import PageLayout from "../../../common/layout/PageLayout";
import constants from "../../../../lib/constants";
import axiosInstance from "../../../../api/axiosinstance";
import useApiCall from "../../../../hooks/useApi";
import { useForm } from "react-hook-form";
import TripTypeSelector from "./TripTypeSelector";
import AddDateTime from "./AddDateTime";
import { UserContext } from "../../../../provider/UserProvider";
import useNavigationHistory from "../../../../hooks/useNavigationHistory";
import TripCard from "../../../../common/TripCard";
import CarSelectTabs from "../../../../common/carSelectTab";
import { useTripStorage } from "../../../../hooks/useTripStorage";
import { CarData } from "../../pages/ManageCarDetails";
import { useToast } from "../../../../hooks/useToast";
import { useHistory } from "react-router";
import { informationCircleOutline } from "ionicons/icons";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { endPoints } from "../../../../lib/constants/endpoints";
import { LoadingButton } from "../../../../common/LoadingButton";

const RentYourDriver: React.FC = () => {
  const [tripType, setTripType] = useState("oneway");
  const [duration, setDuration] = useState("hours");
  const [dateTime, setDateTime] = useState<any>(null);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [pickupTime, setPickupTime] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [showFareRules, setShowFareRules] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { pushLatest } = useNavigationHistory();
  const { setTrip } = useTripStorage();
  const toast = useToast();
  const [cars, setCars] = useState<CarData[]>([]);
  const [primaryCarId, setPrimaryCarId] = useState<number | null>(null);
  const [loadButton, setLoadButton] = useState(false)
  const [fetchCars] = useApiCall(axiosInstance.get);
  const[post_status]=useApiCall(axiosInstance.post);
  // const [createTrip] = useApiCall(axiosInstance.post);
  const [createTrip, { loading: createTripLoading }] = useApiCall(axiosInstance.post);
  const [createTwoWayTrip, { loading: createTwoWayLoading }] = useApiCall(axiosInstance.post);

  const isSubmitting = createTripLoading || createTwoWayLoading;
  const [nearDrivers] = useApiCall(axiosInstance.get);
  const[get_status]=useApiCall(axiosInstance.get)

  const history = useHistory();


  const [isLoading, setIsLoading] = useState(true);

  const { control, watch, setValue, getValues } = useForm({
    defaultValues: {
      fromCity: "",
      toCity: "",
      returnFromCity: "",
      returnToCity: "",

      fromCityId: null,
      toCityId: null,
      returnFromCityId: null,
      returnToCityId: null,
    },
  });
  const [farePreview, setFarePreview] = useState<{
    fare_amount: number;
    estimated_hours: number;
    duration_type: "LOCAL" | "OUTSTATION";
  } | null>(null);


  const { user } = useContext(UserContext);
  const fromCity = watch("fromCity");
  const toCity = watch("toCity");

const fetchCityCoords = async (cityName: string) => {
  let result = { lat: 0, lng: 0 };
  console.log("here is the fetch city cordinates")

  await get_status(
    [constants.GET_CITY_SEARCH_API, { query: cityName }],
    {
      onCompleted: (res: any) => {
        const city = res?.data?.data?.[0];
        if (city) {
          console.log("here it is",city)
          result = {
            lat: Number(city.latitude),
            lng: Number(city.longitude),
          };
        }
      },
      onError: () => {
        result = { lat: 0, lng: 0 };
      },
    }
  );

  return result;
};

  //   useEffect(() => {
  //   if (tripType !== "twoway") return;

  //   const from = watch("fromCity");
  //   const to = watch("toCity");

  //   // UI ONLY mirror
  //   setValue("returnFromCity", to || "");
  //   setValue("returnToCity", from || "");
  // }, [tripType, watch("fromCity"), watch("toCity")]);
  useEffect(() => {
    if (tripType !== "twoway") return;

    const from = watch("fromCity");
    const to = watch("toCity");

    setValue(
      "returnFromCity",
      to?.trim() ? to : "Your Current Location"
    );

    setValue(
      "returnToCity",
      from?.trim() ? from : "Destination"
    );
  }, [tripType, watch("fromCity"), watch("toCity")]);



const handleDateTimeSelect = async (data: any) => {
  if (fromCity && toCity) {
    setDateTime(data.date);
  }
  setPickupTime(data.pickupTime);
  setDropTime(data.dropTime);

  if (!fromCity || !toCity) {
    toast.error("Please select pickup and drop cities first");
    return;
  }

  if (!data.date?.startDate || !data.date?.endDate) {
    toast.error("Please select trip start and end dates");
    return;
  }

  if (!data.pickupTime || !data.dropTime) {
    toast.error("Please select pickup and drop times");
    return;
  }

  try {
    const payload = {
      start_date: data.date.startDate,
      end_date: data.date.endDate,
      pickup_time: data.pickupTime,
      drop_time: data.dropTime,
      origin_name: fromCity,
      dest_name: toCity,
      origin_id: getValues("fromCityId"),
      dest_id: getValues("toCityId"),
    };

    console.log("Sending payload:", payload);

    await post_status(
      [constants.CALCULATE_FARE, payload],
      {
        onCompleted: (res: any) => {
          if (res?.data?.status) {
            setFarePreview(res.data.data);
          } else {
            toast.error(res?.data?.message || "Fare calculation failed");
          }
        },
        onError: (_err: any) => {
          toast.error("Unable to calculate fare. Try different timings");
        },
      }
    );
  } catch (err: any) {
    toast.error("Unable to calculate fare. Try different timings");
  }
};

  useEffect(() => {
    setIsLoading(true);
    fetchCars([`${constants.GET_OWNER_CARS_API}/${user.userId}`], {
      onCompleted: (res) => {
        const list = res?.data?.data || [];
        setCars(list);

        const primary = list.find((c: any) => c.is_primary);
        if (primary) {
          setPrimaryCarId(primary.id);
          setSelectedCarId((prev) => prev ?? primary.id);
        }

        setIsLoading(false);
      },
      onError: () => {
        toast.error("Could not fetch cars.");
        setIsLoading(false);
      },
    });
  }, []);


  const handleCreateTrip = async () => {
    setLoadButton(true);
    const origin_name = watch("fromCity");
    const dest_name = watch("toCity");

    if (!selectedCarId) {
      setLoadButton(false);
      toast.error("Please select a car");
      return;
    }

    if (!watch("fromCity") || !watch("toCity")) {
      setLoadButton(false);
      toast.error("Please select your start and drop locations");
      return;
    }
    if (!dateTime?.startDate || !dateTime?.endDate) {
      setLoadButton(false);
      toast.error("Please select trip dates");
      return;
    }
    if (!pickupTime || !dropTime) {
      setLoadButton(false);
      toast.error("please select pickup and drop date time");
      return;
    }

    const scheduledAt = new Date().toISOString();
    const originCoords = await fetchCityCoords(watch("fromCity"));
    const destCoords = await fetchCityCoords(watch("toCity"));

    /* ===================== ONE WAY ===================== */
    if (tripType === "oneway") {
      // const origin_id = watch("fromCityId");
      // const dest_id = watch("toCityId");

      if (!origin_name || !dest_name) {
        toast.error("Invalid city selection");
        setLoadButton(false);
        return;
      }


      await createTrip(
        [
          constants.CREATE_TRIP_API,
          {
            owner_id: user?.owner_id,
            car_id: selectedCarId,
            origin_name,
            dest_name,
            start_date: dateTime.startDate,
            end_date: dateTime.endDate,
            pickup_time: pickupTime,
            drop_time: dropTime,
            duration_type: duration,
            scheduled_at: scheduledAt,
            origin_id: getValues("fromCityId"),
            dest_id: getValues("toCityId")

          },
        ],
        {
          onCompleted: (res) => {
            if (res?.data?.status) {
              const tripId = res?.data?.data?.id;
              const cityId = res?.data?.data?.origin_id;
              const fareAmount = res?.data?.data?.fare_amount;

              if (tripId) {
                setTrip({
                  id: tripId,
                  origin_name: watch("fromCity"),
                  dest_name: watch("toCity"),
                  startDate: dateTime.startDate,
                  endDate: dateTime.endDate,
                  duration_type: duration,
                  tripType,
                  pickupTime,
                  dropTime,
                  carId: selectedCarId,
                  origin_latitude: originCoords.lat,
                  origin_longitude: originCoords.lng,
                  dest_latitude: destCoords.lat,
                  dest_longitude: destCoords.lng,
                  fare_amount: fareAmount
                });
                sessionStorage.setItem("fare_amount", String(fareAmount));
                setLoadButton(false);
              }
              nearDrivers([`${endPoints.GET_NEAR_BY_DRIVERS}/${cityId}`], {
                onCompleted: (res) => {
                  const driverCount = res?.data?.count || 0;
                  console.log("driver count : ", driverCount);
                  console.log("response :", res?.data?.data);
                  localStorage.setItem("driverCount", String(driverCount));
                  localStorage.setItem("tripId_for_range", tripId)
                  pushLatest(constants.SEARCH_DRIVER_RANGE_BASED_PAGE);
                  setLoadButton(false);
                },
                onError: (error) => {
                  setLoadButton(false);
                  console.log("here is the error", error)
                  toast.error("Failed Fetching nearby drivers", error);
                  console.log("error while fetching the drivers", error);
                  toast.error(error)
                },
              });
            }
          },
        onError: (error: any) => {
            console.log("here is the error", error)
  setLoadButton(false);

  
  
  toast.error(error?.message || "Failed to create trip");
}
        }
      );

      return;
    }

    if (!origin_name || !dest_name) {
      setLoadButton(false);
      toast.error("Invalid city selection");
      return;
    }

    await createTwoWayTrip(
      [
        constants.CREATE_TWO_WAY_API,
        {
          owner_id: user?.owner_id,
          car_id: selectedCarId,

          origin_id: getValues("fromCityId"),
          dest_id: getValues("toCityId"),

          start_date: dateTime.startDate,
          end_date: dateTime.endDate,
          pickup_time: pickupTime,
          drop_time: dropTime,
          scheduled_at: scheduledAt,
        },
      ],
      {
        onCompleted: (res) => {
          if (res?.data?.status) {
            const tripId = res?.data?.data?.id;
            const fareAmount = res?.data?.data?.fare_amount;
            const cityId = res?.data?.data?.origin_id;

            if (tripId) {
              setTrip({
                id: tripId,
                origin_name: watch("fromCity"),
                dest_name: watch("toCity"),
                startDate: dateTime.startDate,
                endDate: dateTime.endDate,
                duration_type: duration,
                tripType: "twoway",
                pickupTime,
                dropTime,
                carId: selectedCarId,
                origin_latitude: originCoords.lat,
                origin_longitude: originCoords.lng,
                dest_latitude: destCoords.lat,
                dest_longitude: destCoords.lng,
                fare_amount: fareAmount,
              });
              setLoadButton(false);
              sessionStorage.setItem("fare_amount", String(fareAmount));
            }

            nearDrivers([`${endPoints.GET_NEAR_BY_DRIVERS}/${cityId}`], {
              onCompleted: (response) => {
                const driverCount = response?.data?.count || 0;
                localStorage.setItem("driverCount", String(driverCount));
                localStorage.setItem("tripId_for_range", tripId);

                pushLatest(constants.SEARCH_DRIVER_RANGE_BASED_PAGE);
                setLoadButton(false);
              },
              onError: (error) => {
                setLoadButton(false);
                toast.error("Failed fetching nearby drivers", error);
              },
            });
          }
        },
        onError: (error) => {
          setLoadButton(false);
          toast.error(error);
        },
      }
    );

  };

  const handleBackClick = () => {
    history.push("/booking");
  };

  useEffect(() => {
    if (!fromCity || !toCity) {
      setDateTime(null)
      setFarePreview(null)
    }
  }, [fromCity, toCity])

  return (
    <PageLayout title="Hire a Driver" screenName="booking" showBackButton backButtonClick={handleBackClick}>
      <IonContent fullscreen scrollY className="ion-padding">
        {isLoading && (
          <div className="animate-pulse">


            <div className="flex gap-3 mb-5">
              <div className="h-10 flex-1 bg-gray-300 rounded-xl"></div>
              <div className="h-10 flex-1 bg-gray-300 rounded-xl"></div>
              <div className="h-10 flex-1 bg-gray-300 rounded-xl"></div>
            </div>


            <div className="flex gap-4 mb-5">
              <div className="h-10 w-28 bg-gray-300 rounded-lg"></div>
              <div className="h-10 w-28 bg-gray-300 rounded-lg"></div>
            </div>


            <div className="bg-gray-200 rounded-xl p-5 mb-5">
              <div className="h-4 w-32 bg-gray-300 rounded mb-3"></div>
              <div className="h-10 bg-gray-300 rounded mb-4"></div>

              <div className="h-4 w-20 bg-gray-300 rounded mb-3"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>


            <div className="h-12 bg-gray-300 rounded-xl mb-5"></div>


            <div className="flex gap-3 mb-5">
              <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
              <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
            </div>


            <div className="h-12 bg-gray-300 rounded-xl mt-8 mb-10"></div>
          </div>
        )}

        {!isLoading && (
          <IonGrid>
            <div className="flex flex-col gap-3 h-[calc(100dvh-220px)] sm:h-[calc(100dvh-240px)] md:h-[calc(100dvh-260px)] lg:h-[calc(100dvh-280px)] overflow-y-auto">
              <IonRow>
                <IonCol>
                  <CarSelectTabs cars={cars} selectedCarId={selectedCarId} setSelectedCarId={setSelectedCarId} 
                  onAddCar={() => {
                    if (cars.length >= 3) {
                      toast.error("Maximum allowed cars is 3");
                      return;
                    }

                    pushLatest("/cardetails?redirect=/rent-your-driver");
                  }} 
                  isManage={false} 
                  primaryCarId={primaryCarId} 
                />
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <TripTypeSelector tripType={tripType} setTripType={setTripType} />
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <TripCard control={control} watch={watch} setValue={setValue} editable={true} />
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <AddDateTime onDateTimeSelect={handleDateTimeSelect} selectedDates={dateTime} fromCity={fromCity} toCity={toCity} />
                </IonCol>
              </IonRow>

              {tripType === "twoway" && (
                <>
                  <p className="text-sm font-semibold text-black m-1">Return</p>
                  <IonRow>
                    <IonCol>
                      <TripCard control={control} watch={watch} setValue={setValue} editable={false} showMetaCard={false} fromField="returnFromCity" toField="returnToCity" />
                    </IonCol>
                  </IonRow>
                </>
              )}
              {farePreview && (
                <IonRow className="mb-18">
                  <IonCol>
                    <div className="bg-[#F7F8F9] rounded-xl p-4 border border-[#E8ECF4]">
                      <div className="flex justify-between mb-2 text-sm text-gray-700">
                        <span>Booked Hours</span>
                        <strong className="text-black">
                          {farePreview.estimated_hours} Hr
                        </strong>
                      </div>

                      <div className="flex justify-between mb-2 text-sm text-gray-700">
                        <span>
                          Base Price
                          {farePreview.duration_type !== "LOCAL" && " (Outstation)"}
                        </span>

                        <strong className="text-black">
                          {farePreview.duration_type === "LOCAL"
                            ? "₹350 / 2 Hr"
                            : farePreview.estimated_hours > 12
                              ? "₹2000 / 24 Hr"
                              : "₹1500 / 12 Hr"}
                        </strong>
                      </div>



                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Total Trip Price</span>

                        <div className="flex items-center gap-1.5">
                          <strong className="text-black text-base">
                            ₹ {farePreview.fare_amount}
                          </strong>

                          <IonIcon
                            icon={informationCircleOutline}
                            className="text-lg text-gray-500 cursor-pointer"
                            onClick={() => setShowFareRules(true)}
                          />
                        </div>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
              )}
            </div>
            <IonModal
              isOpen={showFareRules}
              onDidDismiss={() => setShowFareRules(false)}
              backdropDismiss
              className="fare-rules-modal"
            >
              <div className="flex items-center justify-center h-full px-4">
                <div className="bg-white rounded-xl w-full max-w-sm p-4 shadow-xl">
                  <h3 className="text-base font-semibold mb-3">
                    {farePreview?.duration_type === "OUTSTATION"
                      ? "Outstation Fare Rules"
                      : "Local Fare Rules"}
                  </h3>

                  {/* 🔹 LOCAL RULES */}
                  {farePreview?.duration_type === "LOCAL" && (
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Base Fare (2 hrs)</span>
                        <span>₹350</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Additional Hours</span>
                        <span>₹100 / hour</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Exceeded Hours</span>
                        <span>₹100 / hour</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Night Charge</span>
                        <span>₹150 (one-time)</span>
                      </div>
                    </div>
                  )}


                  {farePreview?.duration_type === "OUTSTATION" && (
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Up to 12 Hours</span>
                        <span>₹1500</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Up to 24 Hours</span>
                        <span>₹2000</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Extra Hours (≤ 12 hrs)</span>
                        <span>₹1500</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Extra Hours (&gt; 12 hrs)</span>
                        <span>₹2000</span>
                      </div>


                    </div>
                  )}

                  <IonButton
                    expand="block"
                    className="mt-4"
                    style={{ backgroundColor: "#FFD600", color: "#000" }}
                    onClick={() => setShowFareRules(false)}
                  >
                    Close
                  </IonButton>
                </div>
              </div>
            </IonModal>

            <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-[#f2f9fb] px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.08)]">
              <LoadingButton label="Find My Driver"
                type="button"
                loading={loadButton}
                disable={loadButton}
                size="large"
                className="w-full"
                handleButtonClick={handleCreateTrip}
              />
            </div>
          </IonGrid>
        )}
      </IonContent>
    </PageLayout>
  );
};

export default RentYourDriver;