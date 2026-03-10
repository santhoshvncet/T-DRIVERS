// src/utils/common.ts
import { Device } from "@capacitor/device";
import constants from "../lib/constants";
import OneSignal from "onesignal-cordova-plugin";
import axiosInstance from "../api/axiosinstance";

interface AnalyticsEvent {
  [key: string]: any;
}

const common = {
  /**
   * Construct a page title for T-Drive
   * @param title Page-specific title
   * @returns Full page title
   */
  constructPageTitle: (title?: string): string => {
    return title ? `T-Drive - ${title}` : 'T-Drive';
  },

  /**
   * Set the document title and produce a page view analytics event
   * @param title Page-specific title
   */
  setPageTitle: (title?: string) => {
    const pageTitle = common.constructPageTitle(title);
    document.title = pageTitle;

    common.produceAnalyticsEvent(constants.EVENT_NAME.PAGE_VIEW, {
      pageTitle,
      pageLocation: window.location.href,
    });
  },

  /**
   * Push a custom event to Google Tag Manager dataLayer
   * @param eventName Event name
   * @param otherEvent Optional additional data
   */
  produceAnalyticsEvent: (eventName: string, otherEvent: AnalyticsEvent = {}) => {
    window?.dataLayer?.push({
      'event': eventName,
      ...otherEvent,
    });
  },

  /**
   * Get the current device platform (android/ios/web)
   * @returns Device platform as string
   */
  getDevicePlatform: async (): Promise<string | undefined> => {
    try {
      const info = await Device.getInfo();
      return info.platform;
    } catch (e) {
      console.error("getDevicePlatform Error:", e);
      return undefined;
    }
  },

  /**
   * Dispatch a custom tab change event
   * @param tabKey Key of the tab
   */
  tabChangeEvent: (tabKey: string) => {
    const tabEvent = new CustomEvent(constants.TAB_CHANGE_EVENT_LISTENER, {
      detail: { tabKey },
    });
    window.dispatchEvent(tabEvent);
  },

  /**
   * Generate a unique string ID
   * @returns Unique string
   */
  generateUniqueId: (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return timestamp + randomStr;
  },
formatDateShort:(isoOrDate: string | Date | undefined) => {
  if (!isoOrDate) return "";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return isoOrDate.toString();
  const day = d.getDate();
  const month = d.toLocaleString(undefined, { month: "short" }); // "Aug"
  const weekday = d.toLocaleString(undefined, { weekday: "short" }); // "Thu"
  return `${day} ${month}, ${weekday}`; // "10 Aug, Thu"
},
formatTimeFromParts: (dateIsoOrDate?: string | Date) => {
  if (!dateIsoOrDate) return "";
  const d = typeof dateIsoOrDate === "string" ? new Date(dateIsoOrDate) : dateIsoOrDate;
  if (Number.isNaN(d.getTime())) return dateIsoOrDate.toString();
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
},

combineDateAndTime: (dateIso?: string, timeStr?: string)=> {
  if (!dateIso && !timeStr) return undefined;
  if (timeStr && (timeStr.includes("T") || timeStr.includes("Z") || timeStr.includes("+"))) {
    try { return new Date(timeStr); } catch { /* fallback below */ }
  }
  if (!dateIso) {
    return new Date(`1970-01-01T${timeStr ?? "00:00:00"}`);
  }
  const dateOnly = dateIso.split("T")[0];
  const normalizedTime = timeStr?.length === 5 ? `${timeStr}:00` : (timeStr ?? "00:00:00");
  return new Date(`${dateOnly}T${normalizedTime}`);
},

requestAndLoginOnesignalPermission: async (userId: string) => {
  try {
    const device = await common.getDevicePlatform();
    if (device === "web" || !userId) return;

    // ✅ Initialize only once (move outside if possible)
    OneSignal.initialize(constants.ONESIGNAL_ID);

    // ✅ Ask permission FIRST
    const permission = await OneSignal.Notifications.requestPermission(true);
    console.log("Permission result:", permission);

    // ✅ Wait for subscription token / ID
    const pushSub = await OneSignal.User.pushSubscription.getIdAsync();
    console.log("pushSubscriptionId:", pushSub);

    // ✅ Now login with external ID
    const externalId = `tdrivers_user_${userId}`;
    await OneSignal.login(externalId);
    console.log("OneSignal login successful for", externalId);

    // ✅ Save external id to DB AFTER login success
    await axiosInstance.post("/users/update_external_id", { userId });

  } catch (err) {
    console.error("OneSignal error:", err);
  }
},

logoutOneSignal: async () => {
  try {
    const device = await common.getDevicePlatform();
    if (device === "web") return;

    OneSignal.initialize(constants.ONESIGNAL_ID);

    await OneSignal.logout();
    console.log("OneSignal logout success");

    OneSignal.Notifications.clearAll();
    OneSignal.Notifications.removeGroupedNotifications?.();

  } catch (err) {
    console.error("OneSignal logout error:", err);
  }
}


};

export default common;
