import React, { useEffect, useState } from "react";
import {
  IonButton,
  IonCard,
  IonContent,
  IonImg,
  IonProgressBar,
  IonSkeletonText,
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import axiosInstance from "../../api/axiosinstance";
import { endPoints } from "../../lib/constants/endpoints";
import { useToast } from "../../hooks/useToast";
import {
  CAR_PHOTO_CONFIG,
  CarPhoto,
  createEmptyCarPhotos,
} from "../../types/carPhotoTypes";
import { compressImage, dataUrlToBlob } from "../../utils/fileUtils";

interface CarPhotoUploadProps {
  tripId: number;
  photoUploadType: "start" | "end";
  onSubmitSuccess: () => void;
  onTripDataUpdate?: (carImages: string[]) => void;
}

const CarPhotoUpload: React.FC<CarPhotoUploadProps> = ({
  tripId,
  photoUploadType,
  onSubmitSuccess,
  onTripDataUpdate,
}) => {
  const [carPhotos, setCarPhotos] = useState<CarPhoto[]>(createEmptyCarPhotos);
  const [isCompressing, setIsCompressing] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const toast = useToast();

  /* ---------------- LOCAL SAVE ---------------- */
  const saveImageLocally = async (slot: number, dataUrl: string) => {
    const name = `car_${tripId}_${photoUploadType}_${slot}.jpg`;
    await Filesystem.writeFile({
      path: name,
      data: dataUrl,
      directory: Directory.Data,
    });
    return name;
  };

  const canUploadSlot = (index: number) => {
    if (index === 0) return true; // Front always enabled

    // All previous slots must have remoteUrl
    for (let i = 0; i < index; i++) {
      if (!carPhotos[i]?.remoteUrl) return false;
    }
    return true;
  };

  /* ---------------- UPLOAD WITH RETRY + PROGRESS ---------------- */
  const uploadWithRetry = async (
    formData: FormData,
    onProgress: (p: number) => void,
    retries = 5
  ): Promise<any> => {
    try {
      return await axiosInstance.put(endPoints.UPLOAD_CAR_TRIPS, formData, {
        timeout: 60000,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e: any) => {
          if (!e.total) return;
          const percent = Math.round((e.loaded * 100) / e.total);
          onProgress(Math.min(percent, 90)); // smooth UX, cap at 90%
        },
      });
    } catch (err) {
      if (retries === 0) throw err;
      await new Promise((r) => setTimeout(r, 3000));
      return uploadWithRetry(formData, onProgress, retries - 1);
    }
  };

  /* ---------------- LOAD EXISTING ---------------- */
  const loadExistingPhasePhotos = async () => {
    if (!tripId) return;
    try {
      setIsInitialLoading(true);
      const fd = new FormData();
      fd.append("trip_id", String(tripId));
      fd.append(
        "tripType",
        photoUploadType === "start" ? "startTrip" : "endTrip"
      );

      const res = await axiosInstance.put(endPoints.UPLOAD_CAR_TRIPS, fd);
      if (!res.data?.success) return;

      const images: string[] = res.data.data || [];
      const base = photoUploadType === "start" ? 0 : 4;

      setCarPhotos(
        createEmptyCarPhotos().map((s, i) => {
          const url = images[base + i];
          if (!url) return s;
          return { ...s, localUrl: url, remoteUrl: url, progress: 100 };
        })
      );
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadExistingPhasePhotos();
  }, [tripId, photoUploadType]);

  /* ---------------- UPLOAD SINGLE ---------------- */
  const uploadSingleCarPhoto = async (slot: number, dataUrl: string) => {
    try {
      setIsCompressing(slot);

      const compressed = await compressImage(dataUrl, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.6,
      });

      const localFile = await saveImageLocally(slot, compressed);
      setIsCompressing(null);

      setCarPhotos((p) => {
        const n = [...p];
        n[slot] = {
          ...n[slot],
          localUrl: compressed,
          isUploading: true,
          progress: 0,
        };
        return n;
      });

      const file = await Filesystem.readFile({
        path: localFile,
        directory: Directory.Data,
      });

      const blob = dataUrlToBlob(`data:image/jpeg;base64,${file.data}`);
      const photo = carPhotos[slot];

      const fd = new FormData();
      fd.append("trip_id", String(tripId));
      fd.append(
        "tripType",
        photoUploadType === "start" ? "startTrip" : "endTrip"
      );
      fd.append(photo.fieldName, blob);

      const response = await uploadWithRetry(fd, (percent) => {
        setCarPhotos((p) => {
          const n = [...p];
          n[slot] = {
            ...n[slot],
            progress: Math.max(n[slot].progress, percent),
          };
          return n;
        });
      });

      const urls: string[] = response.data.data || [];
      const base = photoUploadType === "start" ? 0 : 4;

      // Step 1: Force 100% progress for smooth UX
      setCarPhotos((p) => {
        const n = [...p];
        n[slot] = {
          ...n[slot],
          progress: 100,
        };
        return n;
      });

      // Step 2: Wait 300ms so user can see 100%
      await new Promise((r) => setTimeout(r, 300));

      // Step 3: Mark upload complete & remove overlay
      setCarPhotos((p) => {
        const n = [...p];
        n[slot] = {
          ...n[slot],
          isUploading: false,
          remoteUrl: urls[base + slot],
        };
        return n;
      });

      onTripDataUpdate?.(urls);
      const sideLabel = CAR_PHOTO_CONFIG[slot].label;
      const phaseText = photoUploadType === "start" ? "Start trip" : "End trip";
      toast.success(`${phaseText} - ${sideLabel} photo uploaded`);
    } catch {
      toast.error("Upload failed. Will retry automatically.");
      setCarPhotos((p) => {
        const n = [...p];
        n[slot] = { ...n[slot], isUploading: false };
        return n;
      });
      setIsCompressing(null);
    }
  };

  /* ---------------- AUTO RETRY ---------------- */
  useEffect(() => {
    const retry = () => {
      carPhotos.forEach((p, i) => {
        if (p.localUrl && !p.remoteUrl && !p.isUploading) {
          uploadSingleCarPhoto(i, p.localUrl);
        }
      });
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [carPhotos]);

  /* ---------------- CAMERA ---------------- */
  const openCamera = async (index: number) => {
    if (!canUploadSlot(index)) {
      toast.error("Please upload previous car photo first");
      return;
    }

    const image = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 90,
    });

    if (image.dataUrl) uploadSingleCarPhoto(index, image.dataUrl);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = () => {
    if (!carPhotos.every((p) => p.remoteUrl)) {
      toast.error("Upload all photos first");
      return;
    }
    onSubmitSuccess();
  };

  const getPhotoUploadHeader = () => {
    return photoUploadType === "end"
      ? "Upload End Trip Car Photos"
      : "Upload Start Trip Car Photos";
  };

  /* ---------------- UI ---------------- */
  return (
    <IonContent className="ion-padding [--background:#F9FAFB]">
      {/* Header Card */}
      <IonCard className="mx-auto mt-4 mb-3 w-full max-w-lg px-3 py-3 text-center">
        <p className="text-base font-semibold text-gray-700 sm:text-lg">
          {getPhotoUploadHeader()}
        </p>
      </IonCard>

      {/* Photo Grid Card */}
      <IonCard className="mx-auto w-full max-w-lg overflow-hidden px-3 py-4">
        <div
          className="
            flex gap-3 pb-2
            overflow-x-auto
            snap-x snap-mandatory
            [-webkit-overflow-scrolling:touch]
            [scrollbar-width:none]
            [-ms-overflow-style:none]
          "
        >
          {CAR_PHOTO_CONFIG.map(
            (cfg: { label: string; field: string }, index: number) => {
              const photo = carPhotos[index];
              const isProcessing =
                photo.isUploading || isCompressing === index;
              const isDisabled = !canUploadSlot(index) || isProcessing;

              return (
                <div key={cfg.field} className="flex-shrink-0 text-center">
                  {/* Photo Card */}
                  <IonCard
                    button={!isDisabled}
                    onClick={() => !isDisabled && openCamera(index)}
                    className={[
                      "ion-no-margin",
                      "transition-transform duration-200 ease-in-out active:scale-95",
                      "flex flex-col items-center justify-center",
                      "overflow-hidden relative",
                      "bg-white",
                      "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                      "rounded-[14px]",
                      "w-[22vw] max-w-[110px] min-w-[70px]",
                      "h-[22vw] max-h-[110px] min-h-[70px]",
                      !canUploadSlot(index)
                        ? "opacity-40 pointer-events-none"
                        : "",
                      photo.remoteUrl
                        ? "border border-gray-300 border-[1.5px]"
                        : "border-2 border-dashed border-gray-300",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {/* Image or Placeholder */}
                    {isInitialLoading ? (
                      <IonSkeletonText
                        animated
                        className="h-screen w-full"
                      />
                    ) : photo.localUrl ? (
                      <IonImg
                        src={photo.localUrl}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        className={`text-3xl ${
                          canUploadSlot(index)
                            ? "text-gray-400"
                            : "text-gray-300"
                        }`}
                      >
                        +
                      </span>
                    )}

                    {/* Upload Progress Overlay */}
                    {photo.isUploading && (
                      <div
                        className="
                          absolute inset-0
                          flex flex-col items-center justify-center
                          gap-1.5
                          rounded-xl p-2
                          bg-white/40
                          backdrop-blur-sm
                        "
                      >
                        {/* Progress Percentage */}
                        <span
                          className="
                            text-[12px] font-bold text-gray-800
                            [text-shadow:0_1px_2px_rgba(255,255,255,0.6)]
                          "
                        >
                          {photo.progress}%
                        </span>

                        {/* IonProgressBar */}
                        <IonProgressBar
                          value={photo.progress / 100}
                          type="determinate"
                          className="
                            h-[4px] w-[85%] rounded-[4px]
                            [--background:rgba(209,213,219,0.7)]
                            [--progress-background:#22C55E]
                          "
                        />

                        {/* Uploading Label */}
                        <span className="text-[12px] font-medium text-gray-600">
                          Uploading...
                        </span>
                      </div>
                    )}
                  </IonCard>

                  {/* Label */}
                  <p className="mt-1.5 text-xs font-medium text-gray-500">
                    {cfg.label}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </IonCard>

      {/* Submit Button */}
      <IonButton
        expand="block"
        onClick={handleSubmit}
        className="mx-auto mt-6 w-full max-w-lg rounded-xl py-3 font-semibold"
      >
        Submit
      </IonButton>
    </IonContent>
  );
};

export default CarPhotoUpload;