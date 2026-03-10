// hooks/useFilePicker.ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const useFilePicker = () => {
  const pickFromCamera = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 80
      });

      return photo;
    } catch (err) {
      console.error("Camera access error:", err);
      return null;
    }
  };

  const pickFromGallery = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 80
      });

      return photo;
    } catch (err) {
      console.error("Gallery access error:", err);
      return null;
    }
  };

  return { pickFromCamera, pickFromGallery };
};
