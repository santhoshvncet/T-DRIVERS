import React from "react";
import { IonCard, IonCardContent, IonAvatar, IonLabel, IonIcon, IonSpinner, } from "@ionic/react";
import { callOutline, } from "ionicons/icons";
import { truncateText } from "../utils/truncateText";
import useNavigationHistory from "../hooks/useNavigationHistory";
import { Browser } from "@capacitor/browser";

interface DriverCardProps {
  name: string;
  avatarUrl?: string | null;
  phone?: number;
  languages?: string[] | null;
  statusText?: string;
  experience?: string; 
  onViewProfile?: () => void;
  onTrack?: () => void;
  onCall?: () => void;
  onMessage?: () => void;
  onBook?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tripStatus?: string;
}

const DriverCard: React.FC<DriverCardProps> = ({
  name,
  avatarUrl,
  phone,
  languages,
  statusText = "On the way",
  onViewProfile,
  onBook,
  disabled,
  loading,
  tripStatus
}) => {
  const {pushLatest} = useNavigationHistory()


const handleCall = async () => {
  if (!phone) return;
  await Browser.open({ url: `tel:${phone}` });
};

  const circleButtonBase =
    "flex h-10 w-10 items-center justify-center rounded-full shadow-sm active:scale-95";

  const pillButtonBase =
    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium";

  const languageText = languages && languages.length > 0 ? languages.join(", ") : null;

  return (
    <IonCard className="rounded-2xl border border-slate-200 bg-gray-100 shadow-sm ">
      <IonCardContent className="p-4">
        <section className="flex items-start justify-between gap-4">
          <header className="flex items-start gap-3">
            {/* Avatar + status */}
            <div className="flex flex-col items-center gap-1">
              <IonAvatar className="h-20 w-20 overflow-hidden border border-slate-200">
                {avatarUrl ? ( <img src={avatarUrl} alt={name || "Driver"} className="w-full h-full" /> ) : (
                  <span className="flex h-full w-full items-center justify-center text-base font-semibold text-slate-700">
                    {(name && name.length > 0) ? name.charAt(0).toUpperCase() : "?"}
                  </span>
                )}
              </IonAvatar>
            </div>

            {/* Name + details */}
            <section className="ml-3 space-y-1 pt-1 gap-1.5 flex flex-col">
              <IonLabel className="block  font-semibold text-slate-900">{truncateText(name, 20)}</IonLabel>

              {phone && (
                <p className="flex items-center gap-1.5 text-xs text-slate-900">
                  <IonIcon icon={callOutline} className="h-4 w-4" />
                  <span>{phone}</span>
                </p>
              )}

              {languages && (<p className="text-xs text-slate-500">{languageText}</p>)}
            </section>
          </header>

          <aside className="mt-1 flex flex-col items-center gap-2">
            <div onClick={handleCall} className={`${circleButtonBase} bg-emerald-500 text-white`}>
              <IonIcon icon={callOutline} className="h-4 w-4" />
            </div>
          </aside>
        </section>

        {/* Bottom actions */}
        <div className="mt-3 flex flex-col gap-2">
            {(tripStatus !== 'CREATED') && statusText && (
                <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{statusText}</span>
                </p>
              )}
          <div className="flex gap-2">
          <div onClick={onViewProfile} 
            className={`${pillButtonBase} border text-center items-center justify-center border-slate-900 bg-white text-slate-900  h-8 w-28`}
          >
            <span>View Profile</span>
          </div>
          {onBook && (
            <>
              {!loading && (
                <div
                  onClick={!disabled ? onBook : undefined}
                  className={`${pillButtonBase} border border-slate-900 bg-yellow-300 text-black h-8 w-24 ${disabled ? "opacity-50" : ""}`}
                >
                  Book
                </div>
              )}
              {loading && (
                <div className="flex items-center justify-center h-8 w-24 rounded-xl border border-yellow-300 bg-yellow-200">
                  <IonSpinner name="crescent" />
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default DriverCard;