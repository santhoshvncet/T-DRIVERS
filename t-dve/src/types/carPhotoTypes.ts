// carPhotoTypes.ts
// Shared types and configuration for car photo upload

export const CAR_PHOTO_CONFIG = [
  { label: "Car Front", field: "photo_front" },
  { label: "Car Right", field: "photo_right" },
  { label: "Car Left", field: "photo_left" },
  { label: "Car Back", field: "photo_back" },
] as const;

export type CarPhotoField = (typeof CAR_PHOTO_CONFIG)[number]["field"];

export type CarPhoto = {
  localUrl: string;      // preview (data URL or remote URL)
  remoteUrl?: string;    // final S3 URL from backend
  isUploading: boolean;
  progress: number;      // 0–100
  fieldName: CarPhotoField;
};

export const createEmptyCarPhotos = (): CarPhoto[] =>
  CAR_PHOTO_CONFIG.map((cfg) => ({
    localUrl: "",
    remoteUrl: undefined,
    isUploading: false,
    progress: 0,
    fieldName: cfg.field,
  }));

export const CAR_PHOTO_LABELS = [
  "Car Front",
  "Car Right", 
  "Car Left",
  "Car Back",
];
