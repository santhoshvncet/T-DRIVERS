import type { ToastOptions } from "@ionic/react";
import { useIonToast } from "@ionic/react";;
import { checkmarkCircle, warning } from "ionicons/icons";
import './customStyle.css'
/**
 * Custom hook for displaying Ionic toasts.
 * @returns An object with success and error toast functions.
 */
export const useToast = () => {
  const [present, dismiss] = useIonToast();

  /**
   * Displays a toast message.
   * @param message - The message to display in the toast.
   * @param duration - The duration of the toast in milliseconds.
   * @param success - A boolean indicating whether it's a success toast.
   * @param customToastIcon - Custom icon for the toast.
   * @param customColor - Custom color for the toast.
   */
  const showMessage = (
    message: string,
    duration: number,
    success: boolean,
    customToastIcon?: string,
    customColor?: ToastOptions["color"]
  ) => {
    present({
      message,
      duration,
      icon: customToastIcon ? customToastIcon : success ? checkmarkCircle : warning,
      color: customColor ? customColor : success ? "success" : "warning",
    });
  };

  /**
   * Displays a success toast message.
   * @param message - The message to display in the success toast.
   * @param duration - The duration of the toast in milliseconds. Default is 2000 milliseconds.
   * @param customToastIcon - Custom icon for the success toast.
   */
  const success = (message: string, duration: number = 2000, customToastIcon?: string, customColor?: ToastOptions["color"]) => {
    showMessage(message, duration, true, customToastIcon, customColor);
  };

  /**
   * Displays an error toast message.
   * @param message - The message to display in the error toast.
   * @param duration - The duration of the toast in milliseconds. Default is 2000 milliseconds.
   * @param customToastIcon - Custom icon for the error toast.
   */
  const error = (message: string, duration: number = 2000, customToastIcon?: string, customColor?: ToastOptions["color"]) => {
    showMessage(message, duration, false, customToastIcon, customColor);
  };

  const bottomErrorToast = ({ message, icon }: { message: string, icon?: string }) => {
    dismiss();
    setTimeout(()=> {
      present({ message, position: 'bottom', animated: true, color: 'danger', icon: icon ? icon : warning, cssClass: "bottom-toast-class" })
    },500)
  }

  return {
    success,
    error,
    dismiss,
    bottomErrorToast
  };
};