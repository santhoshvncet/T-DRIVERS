import { IonAvatar, IonCard, IonCardContent, IonIcon, IonLabel } from "@ionic/react";
import { callOutline } from "ionicons/icons";
import useNavigationHistory from "../hooks/useNavigationHistory";
import { Browser } from "@capacitor/browser";


interface OwnerCardProps { name: string;
  avatarUrl?: string;
  phone?: string;
  origin_latitude?: number;
  origin_longitude?: number;
  onViewProfile?: () => void;
  onTrack?: () => void;
  onCall?:() => void;
  onMessage?: () => void;
}

export const OwnerCard: React.FC<OwnerCardProps> = ({
  name,
  avatarUrl,
  phone,
  origin_latitude,
  origin_longitude,
  onCall,
}) => {
  const {pushLatest} = useNavigationHistory() 

 const handleCall = async () => {
  if (!phone) return;
  await Browser.open({ url: `tel:${phone}` });
};
  
  const circleButtonBase =
    "flex h-10 w-10 items-center justify-center rounded-full shadow-sm active:scale-95";
  const openOwnerLocation = () => {
  if (origin_latitude == null || origin_longitude == null) {
    alert("Location not available");
    return;
  }

  const url = `https://www.google.com/maps?q=${origin_latitude},${origin_longitude}`;
  window.open(url, "_blank");
};

  return (
    <IonCard className="rounded-2xl border border-slate-200 bg-gray-100 shadow-sm">
      <IonCardContent className="p-4">
        <section className="flex items-start flex-wrap justify-between gap-4">
          <header className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1">
              <IonAvatar className="h-16 w-16 overflow-hidden border border-slate-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-base font-semibold text-slate-700">
                    {name?.[0]}
                  </span>
                )}
              </IonAvatar>
              <div
                onClick={openOwnerLocation}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#D39C2F",
                  fontSize: "14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span>📍</span>
                <span>View location</span>
              </div>
            </div>

            <section className="ml-3 space-y-1 pt-1 flex flex-col">
              <IonLabel className="block font-semibold text-slate-900">
                {name}
              </IonLabel>

              {phone && (
                <p className ="flex items-center-safe gap-1.5 text-xs text-slate-900">
                   <div onClick={handleCall} className={`${circleButtonBase} bg-emerald-500 text-white mt-5`}>
              <IonIcon icon={callOutline} className="h-4 w-4" />
            </div>
                  <span className="mt-5">{phone}</span>
                </p>
              )}
            </section>
          </header>

          {/* <aside className="mt-1 flex flex-col items-center gap-2" onClick={handleCall}>
            <div onClick={handleCall} className={`${circleButtonBase} bg-emerald-500 text-white`}>
              <IonIcon icon={callOutline} className="h-4 w-4" />
            </div>
          </aside> */}
        </section>
      </IonCardContent>
    </IonCard>
  );
};

export default OwnerCard;
