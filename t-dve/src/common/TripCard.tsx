import React, { useEffect, useState, useCallback, useRef } from "react";
import { IonCard, IonIcon, IonInput, IonSpinner, IonText } from "@ionic/react";
import { Controller } from "react-hook-form";

import useApiCall from "../hooks/useApi";
import axiosInstance from "../api/axiosinstance";
import constants from "../lib/constants";
import util from "../utils";
import { ITrip } from "./type";
import { Geolocation } from "@capacitor/geolocation";

import { Capacitor } from "@capacitor/core";
import { useToast } from "../hooks/useToast";
import { informationCircleOutline, warningOutline } from "ionicons/icons";
interface LocationSelectorProps {
  control?: any;
  watch?: any;
  setValue?: any;
  editable?: boolean;
  showMetaCard?: boolean;
  trip?: ITrip;
  fromField?: string;
  toField?: string;
}

const TripCard: React.FC<LocationSelectorProps> = ({
  control,
  watch,
  setValue,
  editable = false,
  showMetaCard = true,
  trip,
  fromField = "fromCity",
  toField = "toCity",
}) => {
  /* ===================== STATE ===================== */
  const [fromList, setFromList] = useState<any[]>([]);
  const [toList, setToList] = useState<any[]>([]);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [toWarning, setToWarning] = useState<string | null>(null);

  const fromSkip = useRef(false);
  const toSkip = useRef(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  const [getCity] = useApiCall(axiosInstance.get);
  const [isFocused, setIsFocused] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  const fromCity = watch ? watch(fromField) : trip?.fromCity || trip?.from;
  const toCity = watch ? watch(toField) : trip?.toCity || trip?.to;
  const toast = useToast();
  /* ===================== API ===================== */
  const fetchCities = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) return [];

      const res = await getCity([
        constants.GET_CITY_SEARCH_API,
        { params: { query } },
      ]);

      return (res?.data?.data || []).slice(0, 6);
    },
    [getCity]
  );


  const getCurrentLocation = async () => {
    try {
      setLoadingCurrentLocation(true);
      let latitude: number;
      let longitude: number;

      /* ===================== WEB ===================== */
      if (!Capacitor.isNativePlatform()) {
        if (!("geolocation" in navigator)) {
          alert("Geolocation not supported in browser");
          return;
        }

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            })
        );

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      /* ===================== ANDROID / IOS ===================== */
      else {
        const perm = await Geolocation.checkPermissions();

        if (perm.location !== "granted") {
          const req = await Geolocation.requestPermissions();
          if (req.location !== "granted") {
            alert("Location permission denied");
            return;
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      /* ===================== BACKEND ===================== */
      const res = await getCity([
        constants.GET_CITY_SEARCH_API,
        {
          params: {
            latitude,
            longitude,
          },
        },
      ]);

      const city = res?.data?.data?.[0];
      if (!city) {
        alert("Unable to detect location");
        return;
      }

      fromSkip.current = true;
      setValue?.(fromField, city.label);
      setValue?.(`${fromField}Id`, city.id);
      setShowFrom(false);

    } catch (err) {
      console.error("Current location failed", err);
      alert("Failed to get current location");
    } finally {
      setLoadingCurrentLocation(false);
    }
  };


  /* ===================== FROM AUTOCOMPLETE ===================== */
  useEffect(() => {
    if (!editable || fromSkip.current) {
      fromSkip.current = false;
      return;
    }

    if (!fromCity || fromCity.length === 0) {
      setFromList([]);
      setShowFrom(true);
      return;
    }
    if (fromCity.length < 2) {
      setShowFrom(true);
      return;
    }

    const t = setTimeout(async () => {
      const res = await fetchCities(fromCity);
      setFromList(res);
      setShowFrom(true);
    }, 300);

    return () => clearTimeout(t);
  }, [fromCity, editable, fetchCities]);

  /* ===================== TO AUTOCOMPLETE ===================== */
  useEffect(() => {
    if (!editable || toSkip.current) {
      toSkip.current = false;
      return;
    }

    if (!toCity || toCity.length < 2) {
      setShowTo(false);
      return;
    }

    const t = setTimeout(async () => {
      const res = await fetchCities(toCity);
      setToList(res);
      setShowTo(true);
    }, 300);

    return () => clearTimeout(t);
  }, [toCity, editable, fetchCities]);

  /* ===================== OUTSIDE CLICK ===================== */
  useEffect(() => {
    if (!editable) return;

    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setShowFrom(false);
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setShowTo(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editable]);


  return (
    <div
      className={`rounded-xl shadow p-4 transition-all duration-300 ${isFocused ? "mt-[-120px]" : ""
        }`}
      style={{ background: "#F7F8F9" }}
    >

      <div className="flex items-start">
        {/* Line */}
        <div className="mt-1 flex flex-col items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="w-1 h-19 bg-gray-300" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
        </div>

        <div className="ml-4 w-full">
          {/* FROM */}
          <p className="text-gray-500 text-sm">From:</p>
          <div className="relative w-full" ref={fromRef}>
            {editable ? (
              <Controller
                name={fromField}
                control={control}
                render={({ field }) => (
                  <IonInput
                    value={field.value || ""}
                    placeholder="Your Current Location"
                    onIonInput={(e: any) => {
                      field.onChange(e.target.value ?? "");
                      setValue?.(`fromCityId`, null);
                    }}
                  />
                )}
              />
            ) : (
              <p className="text-base font-normal">{fromCity}</p>
            )}
            {editable && showFrom && (
              <div
                className="absolute w-full bg-white border rounded shadow mt-1 z-50"
                style={{
                  maxHeight: "260px",
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <div
                  className="p-3 border-b cursor-pointer text-blue-600 hover:bg-gray-100 text-center flex items-center justify-center gap-2"
                  onClick={getCurrentLocation}
                >
                  {loadingCurrentLocation ? (
                    <>
                      <IonSpinner name="lines" /> Loading...
                    </>
                  ) : (
                    "📍 Use Current Location"
                  )}
                </div>


                {/* City Suggestions */}
                {fromList.map((city) => (
                  <div
                    key={city.id}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (
                        (toCity || "").trim().toLowerCase() ===
                        city.label.trim().toLowerCase()
                      ) {
                        toast.error("From and To location cannot be the same");
                        return;
                      }

                      fromSkip.current = true;
                      setValue?.(fromField, city.label);
                      setValue?.("fromCityId", city.id);
                      setShowFrom(false);
                    }}
                  >
                    <div className="font-medium">{city.area}</div>
                    <div className="text-xs text-gray-500">
                      {city.name}, {city.state}
                    </div>
                  </div>
                ))}
              </div>
            )}


          </div>

          <div className="my-3" />

          {/* TO */}
          <p className="text-gray-500 text-sm">To:</p>
          <div className="relative w-full" ref={toRef}>
            {editable ? (
              <Controller
                name={toField}
                control={control}
                render={({ field }) => {
                  const hasValue = (field.value || "").trim().length > 0;

                  return (
                    <>
                      <IonInput
                        value={field.value || ""}
                        placeholder="Destination"
                        onIonFocus={() => setIsFocused(true)}
                        onIonBlur={() => {
                          setIsFocused(false);

                          const match = toList.find(
                            (city) =>
                              city.label.trim().toLowerCase() ===
                              (field.value || "").trim().toLowerCase()
                          );

                          if (hasValue && !match) {
                            setToWarning(
                              "Please select a location from the dropdown or nearby location"
                            );
                          } else {
                            setToWarning(null);
                          }
                        }}
                        onIonInput={(e: any) => {
                          field.onChange(e.target.value ?? "");
                          setValue?.(`${toField}Id`, null);
                          setToWarning(null);
                        }}
                      />

                      {!hasValue && (
                        <div className="flex items-center gap-2 mt-1 text-gray-500">
                          <IonIcon icon={informationCircleOutline} />
                          <IonText className="text-sm">
                            Select a destination from the dropdown or nearby locations
                          </IonText>
                        </div>
                      )}


                      {toWarning && (
                        <div className="flex items-center gap-2 mt-1 text-red-500">
                          <IonIcon icon={informationCircleOutline} />
                          <IonText className="text-sm">{toWarning}</IonText>
                        </div>
                      )}
                    </>
                  );
                }}
              />



            ) : (
              <p className="text-base font-normal">{toCity}</p>
            )}

            {editable && showTo && toList.length > 0 && (
              <div
                className="absolute w-full bg-white border rounded shadow mt-1 z-50"
                style={{
                  maxHeight: "260px",
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {toList.map((city) => (
                  <div
                    key={city.id}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if ((fromCity || "").trim().toLowerCase() === city.label.trim().toLowerCase()) {
                        toast.error('From and To location cannot be the same')
                        return;
                      }
                      toSkip.current = true;
                      setValue?.(toField, city.label);
                      setValue?.(`toCityId`, city.id);
                      setShowTo(false);
                      setToWarning(null);
                    }}
                  >
                    <div className="font-medium">{city.area}</div>
                    <div className="text-xs text-gray-500">
                      {city.name}, {city.state}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!editable && showMetaCard && (
            <IonCard className="bg-yellow-100 p-4 mt-2 rounded-2xl shadow-md mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <strong>{util.formatDateShort(trip?.startDate)}</strong>
                </div>
                <div>→</div>
                <div className="text-right">
                  <strong>{util.formatDateShort(trip?.endDate)}</strong>
                </div>
              </div>
            </IonCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripCard;
