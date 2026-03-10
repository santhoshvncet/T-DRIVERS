import { useState, useEffect, useMemo } from 'react';
import { Camera, type GalleryPhoto  } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import sumBy from 'lodash/sumBy';
import { useToast } from './useToast';
import { useTranslation } from 'react-i18next';
import useBase64Compression from './useBase64Compression';
import util from '../utils';

interface PickedPhotos extends GalleryPhoto {
  source: "Gallery";
  base64: string | null;
  uniqueId: string;
}

interface I_UseGallery {
  photos: PickedPhotos[];
  picker: () => Promise<void>;
  loading: boolean;
  error: string;
  permissionStatus: string;
  removePhoto: (index: string) => void;
  totalFileSize: number | null
}

interface UseGalleryOptions {
  onPhotoUpdate?: (photos: any) => void;
}

export function useGallery(options: UseGalleryOptions = {}): I_UseGallery {
  const { onPhotoUpdate } = options;
  const [photos, setPhotos] = useState<PickedPhotos[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { compressBase64 } = useBase64Compression();
  const toast = useToast();
  const { t: translate } = useTranslation();

  const totalFileSize = useMemo(() => sumBy(photos, 'fileSize'), [photos]);

  const getBase64FromBlobUrl = async (blobUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to convert blob to base64", err);
      return null;
    }
  };

  const getBase64FromFile = async (path?: string, webPath?: string): Promise<string | null> => {
    try {
      if (webPath?.startsWith("blob:")) {
        return await getBase64FromBlobUrl(webPath);
      }

      if (path) {
        const file = await Filesystem.readFile({ path });
        return `data:image/jpeg;base64,${file.data}`;
      }
    } catch (err) {
      console.error("Error converting file to base64", err);
    }
    return null;
  };

  const checkPermission = async () => {
    try {
      const status = await Camera.checkPermissions();
      setPermissionStatus(status.photos);
    } catch (err) {
      handlePermissionError(err);
    }
  };

  const requestPermission = async () => {
    try {
      const status = (await Camera.requestPermissions()).photos;
      setPermissionStatus(status);

      if (status !== "granted") {
        toast.error(translate("Please grant permission to access photos"));
      }
    } catch (err) {
      handlePermissionError(err);
    }
  };

  const picker = async () => {
    try {
      // await checkPermission();
      // if (permissionStatus !== "granted") {
      //   await requestPermission();
      //   return;
      // }
      const status = await Camera.checkPermissions();

      const photosPermission = status.photos;

      // ✅ iOS allows "limited"
      if (photosPermission !== "granted" && photosPermission !== "limited") {
        const req = await Camera.requestPermissions();
        const finalStatus = req.photos;

        if (finalStatus !== "granted" && finalStatus !== "limited") {
          toast.error(translate("Please grant permission to access photos"));
          return;
        }
      }

      setLoading(true);
      //to limit to one 
      const picked = await Camera.pickImages({ limit: 1 });


          // If OS returns more than one despite limit, inform user
      if (picked.photos.length > 1) {
        toast.error("Please select only one file");
        return
      }

      const enhancedPhotos = await Promise.all(
        picked.photos.map(async (photo) => {
          const base64Raw = await getBase64FromFile(photo.path, photo.webPath);
          if (!base64Raw) return null;

          const compressed = await compressBase64(base64Raw);
          return {
            ...photo,
            source: "Gallery" as const,
            uniqueId: util.generateUniqueId(),
            base64: compressed.compressedData || base64Raw,
            fileSize: compressed.compressedFileSize || compressed.originalFileSize
          } as PickedPhotos;
        })
      );
        //updated
      const filteredPhotos = enhancedPhotos.filter(Boolean) as PickedPhotos[];
      //previous
      // const updatedPhotos = [...photos, ...filteredPhotos];
      const  updatedPhotos = filteredPhotos.length ? [filteredPhotos[0]] : [];
      setPhotos(updatedPhotos);
      onPhotoUpdate?.(updatedPhotos); // ✅ send flat array of photos

    } catch (err) {
      console.error("Error picking images:", err);
      handlePickerError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionError = (err: any) => {
    console.error("Camera permission error:", err);
    const msg = JSON.stringify(err).includes("UNIMPLEMENTED")
      ? "Gallery API Not available"
      : err?.message || "Unknown error";
    setError(msg);
  };

  const handlePickerError = (err: any) => {
    // if (util.isAllowedError(err.message)) {
    //   const msg = JSON.stringify(err).includes("UNIMPLEMENTED")
    //     ? "Camera API Not available"
    //     : err.message;
    //   setError(msg);
    // }
  };

  const removePhoto = (uniqueId: string) => {
    setPhotos((prev) => prev.filter((p) => p.uniqueId !== uniqueId));
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return {
    photos,
    picker,
    loading,
    error,
    permissionStatus,
    removePhoto,
    totalFileSize,
  };
}

