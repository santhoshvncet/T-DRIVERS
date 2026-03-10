import React, { useContext, useEffect, useState } from "react";
import {
  IonModal,
  IonCard,
  IonCardContent,
  IonImg,
  IonSpinner,
  IonText,
  IonIcon,
} from "@ionic/react";
import useApiCall from "../hooks/useApi";
import constants from "../lib/constants";
import axiosInstance from "../api/axiosinstance";
import { UserContext } from "../provider/UserProvider";
import { closeOutline } from "ionicons/icons";

interface Announcement {
  id: number;
  title: string;
  message: string;
  icon_url?: string;
  read_at?: string | null;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AnnouncementModal: React.FC<Props> = ({
  isOpen,
  onClose,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);

  const [getAnnouncements] = useApiCall(axiosInstance.get);
  const [markAllRead] = useApiCall(axiosInstance.post);

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(
      dateString.includes("Z") || dateString.includes("+")
        ? dateString
        : `${dateString}+05:30`
    );

    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) return `Today • ${time}`;
    if (isYesterday) return `Yesterday • ${time}`;

    return (
      date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + ` • ${time}`
    );
  };


  const fetchAnnouncements = async () => {
    setLoading(true);
    const user_id = user.userId;
    await getAnnouncements(
      [`${constants.GET_ANNOUNCEMENTS}/${user_id}?role=${user.role}`],
      {
        onCompleted: async (response) => {
          const data = response?.data?.data || [];
          setAnnouncements(data);
          setLoading(false);
        },
        onError: (error) => {
          console.error("Failed to fetch announcements:", error);
          setLoading(false);
        },
      }
    );
  };


  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
      //   markAllRead(
      //   [`${constants.GET_ANNOUNCEMENTS}/${user.userId}/read-all?role=${user.role}`],
      //   {
      //     // onCompleted: () => {
      //     //   // Clear UI immediately
      //     //   setAnnouncements([]);
      //     // },
      //     onError: (err) => {
      //       console.error("Mark read failed", err);
      //     },
      //   }
      // );
    }
  }, [isOpen]);

  const handleClose = () => {
    markAllRead(
      [`${constants.GET_ANNOUNCEMENTS}/${user.userId}/read-all?role=${user.role}`],
      {
        onError: (err) => {
          console.error("Mark read failed", err);
        },
      }
    );

    onClose();
  };



  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      backdropDismiss
      className="announcement-modal"
    >
      <div
        className="flex flex-col h-full pt-14 px-3"
        onClick={handleClose}
      >

        {/* Loader */}
        {loading && (
          <div className="flex justify-center mt-6">
            <IonSpinner name="crescent" />
          </div>
        )}

        {/* No Notifications */}
        {!loading && announcements.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <IonText>
              <p className="text-lg font-bold ">No notifications available</p>
            </IonText>
          </div>
        )}

        {/* Notification List */}
        {!loading && announcements.length > 0 && (
          <div
            className="flex flex-col gap-3 overflow-y-auto pb-6"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            {announcements.map((item) => (
              <IonCard
                key={item.id}
                className="flex items-center gap-3 shadow-md rounded-lg min-h-[100px]"
                onClick={onClose}
              >
                {item.icon_url && (
                  <IonImg
                    src={item.icon_url}
                    alt="icon"
                    className="w-9 h-9"
                    style={{ flexShrink: 0 }}
                  />
                )}

                <IonCardContent className="p-0">
                  <p className="font-semibold text-black text-sm">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatNotificationDate(item.created_at)}
                  </p>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </div>
    </IonModal>
  );
};

export default AnnouncementModal;
