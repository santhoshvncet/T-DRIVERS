import {
  IonModal,
  IonContent,
  IonDatetime,
  IonButton,
  IonIcon,
  IonList,
  IonLabel,
} from "@ionic/react";
import { calendarOutline, chevronForward } from "ionicons/icons";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import CustomDropdown from "../../../../common/selectDropdown";
import {
  generateHoursOptions,
  generateMinuteOptions,
  TimeOption,
} from "../../../../utils/timeDropdown";

type AddDateTimeProps = {
  selectedDates?: {
    startDate: string | null;
    endDate: string | null;
  };
  onDateTimeSelect?: (data: {
    date: { startDate: string | null; endDate: string | null };
    dateArray: string[];
    pickupTime: string;
    dropTime: string;
  }) => void;
  fromCity: string;
  toCity: string;
};

interface DateFormValues {
  date: string[] | null;
  pickupTime: number; // decimal hours from start day (0–24)
  dropTime: number;   // decimal hours, 0–48 (can cross midnight)
}

const END_OF_DAY = 23 + 59 / 60; // 23:59 as decimal hours

const AddDateTime: React.FC<AddDateTimeProps> = ({
  selectedDates,
  onDateTimeSelect,
  fromCity,
  toCity
}) => {
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD


  // 👉 today is the initial START
  const [rangeStart, setRangeStart] = useState<string | null>(today);
  // const [firstClickDone, setFirstClickDone] = useState(false);
  const citiesSelected = !!(fromCity && toCity);

  const getNow = () => {
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  };

  const [liveTime, setLiveTime] = useState(getNow());

  const currentTime = liveTime.hour + liveTime.minute / 60;
  const currentHour = liveTime.hour;
  const currentMinute = liveTime.minute;

  const inputClass = "flex-grow max-w-[200px] h-14";

  const { control, handleSubmit, watch, setValue, reset, getValues } = useForm<DateFormValues>({
    defaultValues: {
      // 👉 when cities are already selected on mount, today is selected
      date: citiesSelected ? [today] : null,
      pickupTime: currentTime,
      // default drop = pickup + 2 hours
      dropTime: currentTime + 2,
    },
  });

  const pickupTime = watch("pickupTime");
  const dropTime = watch("dropTime");
  const dates = watch("date");

  /* ---------------- which day is selected? ---------------- */

  const startDateStr =
    Array.isArray(dates) && dates.length > 0
      ? dates[0].split("T")[0]
      : today;

  const isStartToday = startDateStr === today;

  // pickup bounds within the start day
  const pickupMinTime = isStartToday ? currentTime : 0; // today: from now, future: 00:00
  const pickupMaxTime = END_OF_DAY; // 23:59

  // drop bounds relative to pickup:
  //   min = +2h, max = +24h  (can cross midnight)
  const minDropTime = pickupTime + 2;
  const maxDropTime = pickupTime + 24;

  /* ---------------- time breakdown: pickup / drop / minDrop / maxDrop --------------- */

  // pickup (always in day 0)
  const pickupTotalMinutes = Math.round(pickupTime * 60);
  const pickupHour24 = Math.floor(pickupTotalMinutes / 60) % 24;
  const pickupMinute = pickupTotalMinutes % 60;

  // drop (0–48, may be next day)
  const dropTotalMinutes = Math.round(dropTime * 60);
  const dropHourAbs = Math.floor(dropTotalMinutes / 60); // absolute hour index
  const dropHour24 = dropHourAbs % 24;
  const dropMinute = dropTotalMinutes % 60;

  const minDropTotalMinutes = Math.round(minDropTime * 60);
  const minDropHourAbs = Math.floor(minDropTotalMinutes / 60);
  const minDropMinute = minDropTotalMinutes % 60;

  const maxDropTotalMinutes = Math.round(maxDropTime * 60);
  const maxDropHourAbs = Math.floor(maxDropTotalMinutes / 60);
  const maxDropMinute = maxDropTotalMinutes % 60;

  const baseHourOptions: TimeOption[] = generateHoursOptions();
  const baseMinuteOptions: TimeOption[] = generateMinuteOptions();

  /* ---------------------- OPTIONS FOR DROPDOWNS ---------------------- */

  // PICKUP HOURS:
  // - if start date is today: from current hour to 11 PM
  // - if start date is future: 0–23 (whole day)
  const pickupHourOptions: TimeOption[] = baseHourOptions.filter((opt) => {
    if (!isStartToday) return opt.value <= 23;
    return opt.value >= currentHour && opt.value <= 23;
  });

  // PICKUP MINUTES:
  // - if today & current hour: minutes >= currentMinute
  // - otherwise: all minutes
  const pickupMinuteOptions: TimeOption[] = baseMinuteOptions.filter((opt) => {
    if (!isStartToday) return true;

    if (pickupHour24 > currentHour) return true;
    if (pickupHour24 < currentHour) return false;

    return opt.value >= currentMinute;
  });

  // DROP HOURS: from minDropTime .. maxDropTime (absolute hours, may cross midnight)
  const dropHourOptions: TimeOption[] = (() => {
    const options: TimeOption[] = [];
    const startHourAbs = Math.floor(minDropTime);
    const endHourAbs = Math.floor(maxDropTime);

    for (let h = startHourAbs; h <= endHourAbs; h++) {
      const hour24 = h % 24;
      const ampm = hour24 >= 12 ? "PM" : "AM";
      const hours12 = hour24 % 12 || 12;
      options.push({
        label: `${hours12} ${ampm}`,
        value: h, // absolute hour index
      });
    }
    return options;
  })();

  // DROP MINUTES:
  // - if min & max are in same absolute hour: between [minDropMinute, maxDropMinute]
  // - if in first hour: >= minDropMinute
  // - if in last hour:  <= maxDropMinute
  // - middle hours: all minutes
  const dropMinuteOptions: TimeOption[] = baseMinuteOptions.filter((opt) => {
    if (minDropHourAbs === maxDropHourAbs && dropHourAbs === minDropHourAbs) {
      return opt.value >= minDropMinute && opt.value <= maxDropMinute;
    }
    if (dropHourAbs === minDropHourAbs) {
      return opt.value >= minDropMinute;
    }
    if (dropHourAbs === maxDropHourAbs) {
      return opt.value <= maxDropMinute;
    }
    return true;
  });

  /* ------------------------ helpers ------------------------ */

  const convertToTimeLabel = (val: number) => {
    const totalMinutes = Math.round(val * 60);
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;

    return `${hours12}:${String(minutes).padStart(2, "0")} ${ampm}`;
  };

  const toTime = (v: number) => {
    const totalMinutes = Math.round(v * 60);
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr + "T12:00:00"); // local, no rollover
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
};

const getDatesBetween = (startDate: string, endDate: string): string[] => {
  const datesArr: string[] = [];

  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");

  const [actualStart, actualEnd] =
    start <= end ? [start, end] : [end, start];

  const current = new Date(actualStart);
  while (current <= actualEnd) {
    datesArr.push(current.toLocaleDateString("en-CA"));
    current.setDate(current.getDate() + 1);
  }

  return datesArr;
};

  /* ------------ keep pickup >= pickupMinTime when start is today ----------- */

  useEffect(() => {
    if (!isStartToday) return;

    if (pickupTime < pickupMinTime) {
      const newPickup = pickupMinTime;
      const defaultDrop = newPickup + 2; // min 2 hours
      setValue("pickupTime", newPickup, { shouldValidate: true });
      setValue("dropTime", defaultDrop, { shouldValidate: true });
    }
  }, [isStartToday, pickupMinTime, pickupTime, setValue]);

  /* ------------- keep drop between [minDropTime, maxDropTime] ----------- */

  useEffect(() => {
    if (dropTime < minDropTime) {
      setValue("dropTime", minDropTime, { shouldValidate: true });
    } else if (dropTime > maxDropTime) {
      setValue("dropTime", maxDropTime, { shouldValidate: true });
    }
  }, [dropTime, minDropTime, maxDropTime, setValue]);

  useEffect(() => {
    if (!Array.isArray(dates) || dates.length === 0) return;
  
    const startStr = dates[0].split("T")[0];
    const endStr = dates[dates.length - 1].split("T")[0];
  
    const startObj = new Date(startStr);
    const endObj = new Date(endStr);
  
    const spanDays =
      (endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24);
  
    // 🟢 Only ignore auto-updates if user manually selected a LONG range (3+ days)
    // We still auto-manage 1/2 day ranges that are created by drop time
    if (spanDays >= 1) return; // Changed from spanDays >= 1 to spanDays > 1
  
    const dropDayOffset = Math.floor(dropTime / 24); // 0 = same day, 1 = next day
    const newEndDateStr = addDays(startStr, dropDayOffset);
    const newDates = getDatesBetween(startStr, newEndDateStr);
  
    if (JSON.stringify(dates) !== JSON.stringify(newDates)) {
      setValue("date", newDates);
    }
  }, [dates, dropTime, setValue]);

  /* ---------------- live current time updater --------------- */

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const scheduleNextTime = () => {
      const now = new Date();
      const msToNextMinute =
        (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      timer = setTimeout(() => {
        setLiveTime(getNow());
        scheduleNextTime();
      }, msToNextMinute);
    };

    scheduleNextTime();
    return () => clearTimeout(timer);
  }, []);

  /* ------------------ SUBMIT ------------------ */

  const onSubmit = (data: DateFormValues) => {
    const dts = data.date || [];
    const dateOnly = dts.map((d) => d.split("T")[0]);

    onDateTimeSelect?.({
      date: {
        startDate: dateOnly[0] || null,
        endDate: dateOnly[dateOnly.length - 1] || null,
      },
      dateArray: dateOnly,
      pickupTime: toTime(data.pickupTime),
      dropTime: toTime(data.dropTime),
    });
    setShowModal(false);
  };

  const dropDayOffset = Math.floor(dropTime / 24);

  useEffect(() => {
    if (!citiesSelected) {
      // no from/to city → clear everything
      reset({
        date: null,
        pickupTime: currentTime,
        dropTime: currentTime + 2,
      });
      setRangeStart(null);
      return;
    }

    // fromCity & toCity are set:
    // if there is no date yet, default to TODAY as start
    const currentDate = getValues("date");
    const hasDates =
      Array.isArray(currentDate) ? currentDate.length > 0 : !!currentDate;

    if (!hasDates) {
      reset({
        date: [today],                // ✅ today preselected
        pickupTime: currentTime,
        dropTime: currentTime + 2,
      });
      setRangeStart(today);           // ✅ today is "start" in state
    }
  }, [citiesSelected, reset, getValues, currentTime, today]);

  return (
    <>
      <IonButton
        expand="block"
        fill="clear"
        disabled={!citiesSelected}
        onClick={() => citiesSelected && setShowModal(true)}
        className="w-full bg-[#F7F8F9] text-black border border-[#E8ECF4] rounded-[12px] h-[50px] normal-case"
      >
        <div className="flex items-center justify-center gap-2 w-full">
          <IonIcon icon={calendarOutline} slot="start" />
          {citiesSelected && selectedDates?.startDate
            ? `${selectedDates.startDate} → ${selectedDates.endDate}`
            : "Add Dates"}
          <IonIcon icon={chevronForward} slot="end" />
        </div>
      </IonButton>

      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonContent className="ion-padding">
          <IonButton
            fill="clear"
            onClick={() => setShowModal(false)}
            style={{ margin: "16px 0 0 -12px" }}
          >
            <IonIcon
              icon={chevronForward}
              slot="icon-only"
              style={{
                transform: "rotate(180deg)",
                color: "black",
              }}
              className="p-0 m-0"
            />
          </IonButton>

          <IonList>
            {/* DATE PICKER */}
            <div className="flex justify-center">
              <Controller
                name="date"
                control={control}
                render={({ field }) => {
                  const normalizeDate = (v: string) => String(v).split("T")[0];
                
                  const handleDateChange = (e: CustomEvent) => {
                    // previous range (before click)
                    const prev: string[] = Array.isArray(field.value)
                      ? (field.value as string[]).map(normalizeDate)
                      : [];
                  
                    // new set of values after Ionic toggled the day
                    const rawNext = e.detail.value;
                    const next: string[] = Array.isArray(rawNext)
                      ? (rawNext as string[]).map(normalizeDate)
                      : rawNext
                      ? [normalizeDate(rawNext as string)]
                      : [];
                  
                    // 🔍 find which date was clicked by comparing prev and next
                    let clicked: string | null = null;
                    if (next.length > prev.length) {
                      // a date was added
                      clicked = next.find((d) => !prev.includes(d)) ?? null;
                    } else if (next.length < prev.length) {
                      // a date was removed (toggle off)
                      clicked = prev.find((d) => !next.includes(d)) ?? null;
                    } else {
                      // same length (fallback) – just take the last one
                      clicked = next[next.length - 1] ?? null;
                    }
                    if (!clicked) return;
                  
                    // current range in our model
                    const hasRange = prev.length > 1;
                    const currentStart = rangeStart ?? prev[0] ?? null;
                    const currentEnd = hasRange ? prev[prev.length - 1] : null;
                  
                    // 0️⃣ no start at all (safety)
                    if (!currentStart) {
                      setRangeStart(clicked);
                      field.onChange([clicked]);          // only start selected
                      return;
                    }
                  
                    // 1️⃣ have START (e.g. today) but no full range yet → first click is END
                    if (!hasRange) {
                      const [from, to] =
                        currentStart <= clicked
                          ? [currentStart, clicked]
                          : [clicked, currentStart];
                    
                      const range = getDatesBetween(from, to);
                      setRangeStart(from);                // keep earlier as start
                      field.onChange(range);
                      return;
                    }
                  
                    // 2️⃣ already have RANGE: currentStart .. currentEnd
                    const isInsideRange =
                      currentEnd !== null &&
                      clicked >= currentStart &&
                      clicked <= currentEnd;
                  
                    if (isInsideRange) {
                      // click INSIDE range → new END
                      const [from, to] =
                        currentStart <= clicked
                          ? [currentStart, clicked]
                          : [clicked, currentStart];
                    
                      const range = getDatesBetween(from, to);
                      setRangeStart(from);
                      field.onChange(range);
                    } else {
                      // click OUTSIDE range → new START, wait for next END
                      setRangeStart(clicked);
                      field.onChange([clicked]);
                    }
                  };
                
                  return (
                    <IonDatetime
                      presentation="date"
                      multiple={true}
                      min={today}
                      value={citiesSelected ? field.value ?? [] : []}
                      onIonChange={handleDateChange}
                      className="calendar-custom"
                      mode="md"
                    />
                  );
                }}
              />
            </div>

            {/* PICKUP DROPDOWNS */}
            <div className="flex items-start gap-4 justify-between mt-4">
              <div className="flex flex-col gap-2 flex-1 justify-center">
                <IonLabel className="text-md font-medium">
                  Pickup — {convertToTimeLabel(pickupTime)}
                </IonLabel>

                <div className="flex gap-2">
                  {/* Pickup hour */}
                  <div className="flex flex-col gap-2 w-full">
                    <IonLabel className="text-sm font-medium">
                      Select Hour
                    </IonLabel>
                    <CustomDropdown
                      value={pickupHour24}
                      placeholder="Pickup Hour"
                      options={pickupHourOptions}
                      className={inputClass + " w-full"}
                      onChange={(val) => {
                        const h = Number(val);
                        let m = pickupMinute;

                        if (
                          isStartToday &&
                          h === currentHour &&
                          m < currentMinute
                        ) {
                          m = currentMinute;
                        }

                        let newVal = h + m / 60;
                        if (newVal < pickupMinTime) newVal = pickupMinTime;
                        if (newVal > pickupMaxTime) newVal = pickupMaxTime;

                        setValue("pickupTime", newVal, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </div>

                  {/* Pickup minutes */}
                  <div className="flex flex-col gap-2 w-full">
                    <IonLabel className="text-sm font-medium">
                      Select Minute
                    </IonLabel>
                    <CustomDropdown
                      value={pickupMinute}
                      placeholder="Pickup Minutes"
                      options={pickupMinuteOptions}
                      className={inputClass + " w-full"}
                      onChange={(val) => {
                        const m = Number(val);
                        let newVal = pickupHour24 + m / 60;
                        if (newVal < pickupMinTime) newVal = pickupMinTime;
                        if (newVal > pickupMaxTime) newVal = pickupMaxTime;

                        setValue("pickupTime", newVal, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DROP DROPDOWNS */}
            <div className="flex flex-col gap-2 flex-1 mt-4">
              <IonLabel className="text-md font-medium">
                Drop — {dropDayOffset === 1 ? "Tomorrow " : ""}
                {convertToTimeLabel(dropTime)}
                
                {/* 🚀 Visual indicator */}
                {dropDayOffset === 1 && (
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full mx-1">
                    +1 day
                  </span>
                )}
              </IonLabel>

              <div className="flex gap-2">
                {/* Drop hour */}
                <div className="flex flex-col gap-2 w-full">
                  <IonLabel className="text-sm font-medium">
                    Select Hour
                  </IonLabel>
                  <CustomDropdown
                    value={dropHourAbs}
                    placeholder="Drop Hour"
                    options={dropHourOptions}
                    className={inputClass + " w-full"}
                    onChange={(val) => {
                      const hAbs = Number(val);
                      let m = dropMinute;

                      let newVal = hAbs + m / 60;
                      if (newVal < minDropTime) newVal = minDropTime;
                      if (newVal > maxDropTime) newVal = maxDropTime;

                      setValue("dropTime", newVal, {
                        shouldValidate: true,
                      });
                    }}
                  />
                </div>

                {/* Drop minutes */}
                <div className="flex flex-col gap-2 w-full">
                  <IonLabel className="text-sm font-medium">
                    Select Minute
                  </IonLabel>
                  <CustomDropdown
                    value={dropMinute}
                    placeholder="Drop Minutes"
                    options={dropMinuteOptions}
                    className={inputClass + " w-full"}
                    onChange={(val) => {
                      const m = Number(val);
                      let candidate = dropHourAbs + m / 60;

                      if (candidate < minDropTime) candidate = minDropTime;
                      if (candidate > maxDropTime) candidate = maxDropTime;

                      setValue("dropTime", candidate, {
                        shouldValidate: true,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </IonList>

          {/* CONFIRM BUTTON */}
          <IonButton
            expand="block"
            onClick={handleSubmit(onSubmit)}
            style={{
              background: "#FFD700",
              color: "#000",
              borderRadius: "8px",
              marginTop: "16px",
            }}
          >
            Confirm
          </IonButton>
        </IonContent>
      </IonModal>
    </>
  );
};

export default AddDateTime;