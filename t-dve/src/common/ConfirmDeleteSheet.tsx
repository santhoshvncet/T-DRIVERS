import { useIonAlert } from "@ionic/react";

export const useConfirmDelete = () => {
  const [presentAlert] = useIonAlert();

  const ask = (onConfirm: () => void) => {
    presentAlert({
      header: "Remove Car",
      message: "Are you sure you want to remove this car?",
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Remove",
          role: "destructive",
          handler: onConfirm,
        },
      ],
    });
  };

  return ask;
};

