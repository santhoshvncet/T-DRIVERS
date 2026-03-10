import React from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

type PhotoKeys = "front" | "left" | "back" | "right";

interface CarPhotoGridProps {
  carPhotos: Partial<Record<PhotoKeys, string | File | null>>;
  onUpload: (key: PhotoKeys, file: File) => void;
  editMode: boolean;
  cameraOnly?: boolean;   // ✅ NEW OPTIONAL PROP
  disabled?: boolean;
}

const CarPhotoGrid: React.FC<CarPhotoGridProps> = ({
  carPhotos,
  onUpload,
  editMode,
  cameraOnly = false,   // default → normal behavior
  disabled = false
}) => {
  const items: { key: PhotoKeys; label: string }[] = [
    { key: "front", label: "Car Front" },
    { key: "left", label: "Car Left Side" },
    { key: "back", label: "Car Back" },
    { key: "right", label: "Car Right Side" },
  ];

  // Convert Base64 → File
  const base64ToFile = (dataUrl: string, fileName: string) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], fileName, { type: mime });
  };

  // 📸 CAMERA ONLY MODE
  const openCamera = async (key: PhotoKeys) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        allowEditing: false,
      });

      const file = base64ToFile(image.dataUrl!, `${key}-${Date.now()}.jpg`);
      onUpload(key, file);
    } catch (err) {
      console.log("Camera cancelled", err);
    }
  };

  return (
    <div className="w-full flex justify-center mt-4 mb-3">
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 no-scrollbar">
        {items.map(({ key, label }) => {
          const val = carPhotos[key];
          const preview =
            val && typeof val !== "string"
              ? URL.createObjectURL(val as File)
              : val || null;

          return (
            <label
              key={key}
                            className={`min-w-[130px] min-h-[130px] w-[130px] h-[130px] 
                         border border-dashed border-gray-300 rounded-xl 
                         flex flex-col items-center justify-center 
                         overflow-hidden cursor-pointer bg-white flex-shrink-0 
                         ${disabled ? "pointer-events-none opacity-96" : ""}`}
            >
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="text-3xl text-gray-300">+</div>
                  <span className="text-xs mt-1 text-gray-600">{label}</span>
                </>
              )}

              {editMode &&
                (!cameraOnly ? (
                  // 📁 NORMAL MODE (gallery + camera)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && onUpload(key, e.target.files[0])
                    }
                  />
                ) : (
                  // for : CAMERA-ONLY 
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onClick={(e) => {
                      e.preventDefault();
                      openCamera(key); // open camera manually
                    }}
                  />
                ))}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default CarPhotoGrid;
