// utils/timeDropdown.ts

export type TimeOption = {
  label: string;
  value: number;
  disabled?: boolean;
};

/**
 * 12-hour format hours (AM/PM)
 * Generates 24 options:
 * 12 AM → 11 PM
 */
export const generateHoursOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];

  for (let h = 0; h < 24; h++) {
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const period = h < 12 ? "AM" : "PM";

    options.push({
      label: `${hour12} ${period}`, // "1 PM"
      value: h,                     // 0–23 (good for backend)
    });
  }

  return options;
};

/**
 * Minutes from 00 to 59
 * Step = 1 minute
 */
export const generateMinuteOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];

  for (let m = 0; m < 60; m++) {
    options.push({
      label: String(m).padStart(2, "0"), // "00" → "59"
      value: m,
    });
  }

  return options;
};
