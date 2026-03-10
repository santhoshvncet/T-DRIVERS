import { useIonActionSheet } from "@ionic/react";
import { Capacitor } from "@capacitor/core";

interface ScanUploadSheetProps {
  onScan: () => void;
  onUpload: () => void;
}

const ScanUploadSheet = ({ onScan, onUpload }: ScanUploadSheetProps) => {
  const [present] = useIonActionSheet();
  const platform = Capacitor.getPlatform()

const openSheet = () => {
  const buttons: any[] = [];

  if (platform === "android" || "web") {
    buttons.push({
      text: "📷 Scan Document",
      handler: () => {
        setTimeout(() => {
          onScan();
        }, 300);
      },
    });
  }

  buttons.push(
    {
      text: "📄 Upload File",
      handler: () => {
        setTimeout(() => {
          onUpload();
        }, 300);
      },
    },
    {
      text: "Cancel",
      role: "cancel",
    }
  );

  present({
    cssClass: "custom-action-sheet",
    header: "Select an option",
    buttons,
  });
};

  return { openSheet };
};

export default ScanUploadSheet;