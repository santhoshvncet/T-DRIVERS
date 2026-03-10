import { IonText } from "@ionic/react";
import PageLayout from "../../common/layout/PageLayout";
import CustomDropdown from "../../../common/selectDropdown";
import InputController from "../../../common/InputController";
import { useForm, Controller } from "react-hook-form";
import { LoadingButton } from "../../../common/LoadingButton";
import { useContext, useEffect, useState } from "react";
import useApiCall from "../../../hooks/useApi";
import axiosInstance from "../../../api/axiosinstance";
import { endPoints } from "../../../lib/constants/endpoints";
import { useHistory } from "react-router";
import { UserContext } from "../../../provider/UserProvider";
import { hasPermission } from "../../../utils/permissions";
import { generateHoursOptions } from "../../../utils/timeDropdown";

const Configure = () => {
  const [isEdit, setIsEdit] = useState(false);
  const history = useHistory();
  const { user } = useContext(UserContext);
  const canEdit = hasPermission(user, "Configure Edit");

  const { control, setValue, getValues } = useForm({
    defaultValues: {
      shiftDayFrom: null as any,      // will hold number (0–23)
      shiftDayTo: null as any,
      pricePerHourDay: null as any,
      shiftNightFrom: null as any,
      shiftNightTo: null as any,
      pricePerHourNight: null as any,
      driverBataHours: "fixed",
      driverBataPrice: null as any,
      fareDistance: "1km",
      farePrice: null as any,
    },
  });

  // numeric hours 0–23, labels "12 AM"..."11 PM"
  const timeOptions = generateHoursOptions();

  const driverBataOptions = [
    { label: "Minimum hours", value: "min_hours" },
    { label: "Fixed", value: "fixed" },
  ];

  const fareDistanceOptions = [
    { label: "1 km", value: "1km" },
    { label: "5 km", value: "5km" },
    { label: "10 km", value: "10km" },
  ];

  const inputClass = "flex-grow max-w-[120px] h-14";

  // Convert API time ("06:00:00" or "06:00") to hour number (0–23)
  const extractHour = (time: string | null): number | null => {
    if (!time) return null;
    const [hours] = time.split(":");
    const h = parseInt(hours, 10);
    return isNaN(h) ? null : h;
  };

  // Convert hour number to "HH:00" string for API
  const toBackendTime = (hour: any): string | null => {
    if (hour === null || hour === undefined || hour === "") return null;
    const h = Number(hour);
    if (isNaN(h)) return null;
    return `${String(h).padStart(2, "0")}:00`;
  };

  const fetchConfig = async () =>
    axiosInstance.get(endPoints.GET_DRIVER_CONFIG);
  const [apiCall] = useApiCall(fetchConfig);

  useEffect(() => {
    apiCall([], {
      onCompleted: (res) => {
        if (res?.data?.status && Array.isArray(res?.data?.data)) {
          const data = res.data.data;

          const dayShift = data.find(
            (c: any) => c.config_type === "day_shift"
          );
          const nightShift = data.find(
            (c: any) => c.config_type === "night_shift"
          );
          const driverBata = data.find(
            (c: any) => c.config_type === "driver_bata"
          );
          const fareOneWay = data.find(
            (c: any) => c.config_type === "fare_one_way"
          );

          if (dayShift) {
            setValue("shiftDayFrom", extractHour(dayShift.time_from));
            setValue("shiftDayTo", extractHour(dayShift.time_to));
            setValue("pricePerHourDay", parseFloat(dayShift.fare));
          }

          if (nightShift) {
            setValue("shiftNightFrom", extractHour(nightShift.time_from));
            setValue("shiftNightTo", extractHour(nightShift.time_to));
            setValue("pricePerHourNight", parseFloat(nightShift.fare));
          }

          if (driverBata) {
            setValue(
              "driverBataHours",
              driverBata.config_value || "fixed"
            );
            setValue(
              "driverBataPrice",
              parseFloat(driverBata.fare)
            );
          }

          if (fareOneWay) {
            setValue(
              "fareDistance",
              fareOneWay.config_value || "1km"
            );
            setValue("farePrice", parseFloat(fareOneWay.fare));
          }
        }
      },
      onError: (err) => console.error("get Config API Error:", err),
    });
  }, []);

  const handleSaveChanges = async () => {
    const formValues = getValues();

    const requestData = {
      shiftDayFrom: toBackendTime(formValues.shiftDayFrom),
      shiftDayTo: toBackendTime(formValues.shiftDayTo),
      pricePerHourDay: parseFloat(formValues.pricePerHourDay),
      shiftNightFrom: toBackendTime(formValues.shiftNightFrom),
      shiftNightTo: toBackendTime(formValues.shiftNightTo),
      pricePerHourNight: parseFloat(formValues.pricePerHourNight),
      driverBata: formValues.driverBataHours,
      fare: formValues.fareDistance,
      driverBataPrice: parseFloat(formValues.driverBataPrice),
      farePrice: parseFloat(formValues.farePrice),
    };

    try {
      const response = await axiosInstance.put(
        endPoints.UPDATE_DRIVER_CONFIG,
        requestData
      );
      if (response?.data?.status) {
        setIsEdit(false);
      } else {
        alert("Failed to update configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Failed to update configuration");
    }
  };

  const handleBackClick = () => {
    history.push("/home");
  };

  return (
    <PageLayout
      screenName="Configure"
      title={user?.name}
      showNotification
      showBackButton
      backButtonClick={handleBackClick}
    >
      <div className="flex flex-col justify-center">
      <div className="m-3 space-y-4 max-w-full">
        {/* Shift Timing (Day) */}
        <IonText className="font-bold block mb-2">
          Shift Timing (Day)
        </IonText>
        <div className="flex flex-wrap gap-2">
          <Controller
            name="shiftDayFrom"
            control={control}
            render={({ field }) => (
              <CustomDropdown
                {...field}
                placeholder="From"
                options={timeOptions}
                className={inputClass}
                disabled={!isEdit || !canEdit}
              />
            )}
          />
          <Controller
            name="shiftDayTo"
            control={control}
            render={({ field }) => (
              <CustomDropdown
                {...field}
                placeholder="To"
                options={timeOptions}
                className={inputClass}
                disabled={!isEdit || !canEdit}
              />
            )}
          />
          <span className="text-yellow-400 font-bold whitespace-nowrap text-lg mt-2">
            →
          </span>
          <InputController
            control={control}
            placeholder="Price Per Hour"
            name="pricePerHourDay"
            className={inputClass}
            disabled={!isEdit || !canEdit}
          />
        </div>

        {/* Shift Timing (Night) */}
        <IonText className="font-bold block mb-2">
          Shift Timing (Night)
        </IonText>
        <div className="flex flex-wrap gap-2">
          <Controller
            name="shiftNightFrom"
            control={control}
            render={({ field }) => (
              <CustomDropdown
                {...field}
                placeholder="From"
                options={timeOptions}
                className={inputClass}
                disabled={!isEdit || !canEdit}
              />
            )}
          />
          <Controller
            name="shiftNightTo"
            control={control}
            render={({ field }) => (
              <CustomDropdown
                {...field}
                placeholder="To"
                options={timeOptions}
                className={inputClass}
                disabled={!isEdit || !canEdit}
              />
            )}
          />
          <span className="text-yellow-400 font-bold whitespace-nowrap text-lg mt-2">
            →
          </span>
          <InputController
            control={control}
            placeholder="Price Per Hour"
            name="pricePerHourNight"
            className={inputClass}
            disabled={!isEdit || !canEdit}
          />
        </div>

        {/* Driver Bata */}
        <IonText className="font-bold block mb-2">
          Driver Bata
        </IonText>
        <div className="flex flex-wrap gap-2">
          <Controller
            name="driverBataHours"
            control={control}
            render={({ field }) => (
              <CustomDropdown
                {...field}
                placeholder="Minimum hours"
                options={driverBataOptions}
                className="flex-grow max-w-[240px] h-14"
                disabled={!isEdit || !canEdit}
              />
            )}
          />
          <span className="text-yellow-400 font-bold whitespace-nowrap text-lg mt-2">
            →
          </span>
          <InputController
            control={control}
            placeholder="Price"
            name="driverBataPrice"
            className={inputClass}
            disabled={!isEdit || !canEdit}
          />
        </div>

        {/* Fare (One Way) */}
        <IonText className="font-bold block mb-2">
          Fare (One Way)
        </IonText>
        <div className="flex flex-wrap gap-2">
          <Controller
            name="fareDistance"
            control={control}
            render={({ field }) => (
              <CustomDropdown
                {...field}
                placeholder="1 km"
                options={fareDistanceOptions}
                className="flex-grow max-w-[240px] h-14"
                disabled={!isEdit || !canEdit}
              />
            )}
          />
          <span className="text-yellow-400 font-bold whitespace-nowrap text-lg mt-2">
            →
          </span>
          <InputController
            control={control}
            placeholder="Price"
            name="farePrice"
            className={inputClass}
            disabled={!isEdit || !canEdit}
          />
        </div>

        {/* Edit/Save Button */}
        {canEdit && (
          <LoadingButton
            label={isEdit ? "Save the Changes" : "Edit"}
            handleButtonClick={() => {
              if (isEdit) {
                handleSaveChanges();
              } else {
                setIsEdit(true);
              }
            }}
            className="w-full text-black"
          />
        )}
      </div>
      </div>
    </PageLayout>
  );
};

export default Configure;