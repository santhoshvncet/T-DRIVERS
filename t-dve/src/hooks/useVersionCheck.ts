// import { useEffect, useState, useCallback } from "react";
// import { isPlatform } from "@ionic/react";
// import { App as CapacitorApp } from "@capacitor/app";
// import constants from "../lib/constants";
// import useApiCall from "./useApi";
// import axiosInstance from "../api/axiosInstance";
// import { Capacitor } from "@capacitor/core";

// type VersionResponse = {
//     latest_version: string;
//     min_supported_version?: string;
//     mandatory_update?: boolean;
//     release_notes?: string;
//     store_urls?: { android?: string; ios?: string; web?: string };
// };

// // compare semantic versions; returns -1 if old < new, 0 if equal, 1 if old > new
// const versionCompare = (oldVersion: string = "0.0.0", newVersion: string = "0.0.0"): number => {
//     const divideVersion = (version: string) => version.split('.').map(num => parseInt(num || "0", 10));

//     const existingVersion = divideVersion(oldVersion);
//     const latestVersion = divideVersion(newVersion);

//     for (let i = 0; i < Math.max(existingVersion.length, latestVersion.length); i++) {
//         const existing = existingVersion[i] || 0;
//         const latest = latestVersion[i] || 0;

//         if (existing < latest) return -1;
//         if (existing > latest) return 1;
//     }

//     return 0;
// };


// function getPlatform() {
//     if (isPlatform("android")) return "android";
//     if (isPlatform("ios")) return "ios";
//     return "web";
// }

// // get installed version at runtime (Capacitor) or fallback to build-time version
// async function getInstalledVersion(): Promise<string> {
//     try {
//         if(Capacitor.isNativePlatform()){
//         const info = await CapacitorApp.getInfo();
//         if (info?.version) {
//             return info.version;
//         }
//         } else {
//             console.log('Skipping CapacitorApp.getInfo(): not a native platform.')
//             return constants.APP_VERSION.APP_BUILD_VERSION;
//         }
       
//     } catch (err) {
//         console.log("⚠️ CapacitorApp.getInfo() failed or running on web:", err);
//     }
//     return constants.APP_VERSION.APP_BUILD_VERSION;
// }

// export function useVersionCheck({
//     auto = true,
//     checkOnVisible = true,
// }: { auto?: boolean; checkOnVisible?: boolean } = {}) {
//     const [installedVersion, setInstalledVersion] = useState<string>(constants.APP_VERSION.APP_BUILD_VERSION);
//     const [latestVersion, setLatestVersion] = useState<string>(constants.APP_VERSION.APP_BUILD_VERSION);
//     const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
//     const [mandatoryUpdate, setMandatoryUpdate] = useState<boolean>(false);
//     const [open, setOpen] = useState<boolean>(false);
//     const [lastError, setLastError] = useState<any>(null);
//     const [storeUrl, setStoreUrl] = useState<string | { android?: string; ios?: string; web?: string } | null>(null);

//     const [versionInfo, setVersionInfo] = useState<VersionResponse | null>(null);
//     const [get_version] = useApiCall(axiosInstance.get);


//     const checkVersion = useCallback(async () => {
//         try {
//             setLastError(null);

//             // get installed/current version
//             const currentVersion = await getInstalledVersion();


//             setInstalledVersion(currentVersion);

//             // fetch latest version from backend
//             const res = await get_version(
//                 [constants.VERSION_API, { params: { platform: "android", version: currentVersion } }],
//                 {
//                     onCompleted: (resp) => {
//                         const data = resp?.data?.data?.rows || [];

//                         const versionObj: VersionResponse | undefined = Array.isArray(data) ? data[0] : data;
//                         // ←── Additions: set versionInfo and compute storeUrl
//                         // ←── Additions: set versionInfo and compute storeUrl

//                         setVersionInfo(versionObj || null);




//                         // resolve storeUrl (backend currently returns `store_url` string)
//                         const platform = getPlatform();

//                         const platformUrl =
//                             (versionObj as any)?.store_url ||            // prefer the single-string field your backend sends
//                             (versionObj?.store_urls && versionObj.store_urls[platform]) || // fallback if backend sends object
//                             null;

//                         setStoreUrl(platformUrl);


                        
                     


//                         if (versionObj) {
//                             if (versionObj.latest_version) {
//                                 setLatestVersion(versionObj.latest_version);
//                             }
//                             if (versionObj.release_notes) {
//                                 setReleaseNotes(versionObj.release_notes);
//                             }
//                             if (typeof versionObj.mandatory_update === "boolean") {
//                                 setMandatoryUpdate(versionObj.mandatory_update);
//                             }

//                             // optional: compare versions and open modal / trigger update logic
//                             const cmp = versionCompare(currentVersion, versionObj.latest_version || currentVersion);
//                             if (cmp === -1) {
//                                 // installed < latest → update available
//                                 setOpen(true);
//                             } else {
//                                 setOpen(false);
//                             }
//                         }
//                     },
//                     onError: (err) => {
//                         console.error("Error fetching version info (onError):", err);
//                     },
//                 }
//             );

//         } catch (e) {
//             setLastError(e);
//             console.error("checkVersion failed:", e);
//         }
//     }, [get_version]);

//     // auto-run on mount if requested
//     useEffect(() => {
//         if (auto) {
//             checkVersion();
//         }
//     }, [auto, checkOnVisible, checkVersion]);

//     return {
//         installedVersion,
//         latestVersion,
//         releaseNotes,
//         mandatoryUpdate,
//         open,
//         lastError,
//         checkVersion,
//         storeUrl,
//         versionInfo,
//     };
// }