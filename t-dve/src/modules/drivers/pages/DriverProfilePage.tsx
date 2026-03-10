import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
    IonContent,
    IonItem,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    useIonToast,
    useIonRouter,
} from "@ionic/react";

import axiosInstance from "../../../api/axiosinstance";
import constants from "../../../lib/constants";
import PageLayout from "../../common/layout/PageLayout";
import { toast } from "react-toastify";
import useApiCall from "../../../hooks/useApi";

const DriverProfilePage: React.FC = () => {
    const query = new URLSearchParams(window.location.search);
    const driver_id = query.get("driver_id");
    const trip_id = query.get("trip_id");

    const router = useIonRouter();
    const [present] = useIonToast();
    const [driverDetails, setDriverDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [getDriverProfile] = useApiCall(axiosInstance.get);


    useEffect(() => {
        if (!driver_id) return;

        const fetchDriver = async () => {
            try {
                setLoading(true);

                await getDriverProfile(
                    [`${constants.GET_DRIVER_PROFILE_API}/${driver_id}`],
                    {
                        onCompleted: (res) => {
                            if (res?.data?.status) {
                                setDriverDetails(res.data.data);
                            } else {
                                toast.error("Failed to fetch driver details.");
                            }
                        },
                        onError: () => {
                            toast.error("Error loading driver.");
                        },
                    }
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDriver();
    }, [driver_id]);


    return (
        <PageLayout title="Driver Profile" screenName="driver profile" showBackButton>
            <IonContent fullscreen
                className="ion-padding"
                style={{ backgroundColor: '#ffffffff' }}
            >
                {!driverDetails ?
                    <IonLabel className="w-full flex justify-center items-center mt-20">No driver data found.</IonLabel>
                    : loading ?
                        <IonLabel className="w-full flex justify-center items-center mt-20">Loading...</IonLabel> :
                        <IonGrid>
                            <IonRow className="ion-justify-content-center ion-margin-top">
                                <IonCol size="auto">
                                    <div className="w-[140px] h-[140px] rounded-full overflow-hidden">
                                        <img
                                            src={driverDetails.profile_photo_url || "/upload_area.png"}
                                            alt="Driver"
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                </IonCol>
                            </IonRow>
                            <IonRow className="ion-justify-content-center">
                                <IonCol size="auto">
                                    <h2>{driverDetails.full_name}</h2>
                                </IonCol>
                            </IonRow>

                            <IonRow className="ion-justify-content-center ion-margin-top">
                                <IonCol size="13">
                                    <IonItem
                                        lines="none"
                                        style={{
                                            borderRadius: 12,
                                            padding: "14px",
                                            margin: "10px 16px",
                                            justifyContent: "center",
                                            border: "1px solid #E5E7EB",
                                            boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <IonLabel className="ion-text-center" style={{ color: "#333", fontWeight: 500 }}>
                                            {driverDetails.city_name}, {driverDetails.state_name}
                                        </IonLabel>
                                    </IonItem>


                                    <IonItem
                                        lines="none"
                                        style={{
                                            borderRadius: 14,
                                            padding: "14px",
                                            margin: "10px 16px",
                                            justifyContent: "center",
                                            border: "1px solid #E5E7EB",
                                            boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <IonLabel className="ion-text-center" style={{ color: "#333", fontWeight: 500 }}>
                                            {driverDetails.transmission || "Manual & Automatic"}
                                        </IonLabel>
                                    </IonItem>


                                    <IonItem
                                        lines="none"
                                        style={{
                                            borderRadius: 14,
                                            padding: "14px",
                                            margin: "10px 16px",
                                            justifyContent: "center",
                                            border: "1px solid #E5E7EB",
                                            boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <IonLabel className="ion-text-center" style={{ color: "#333", fontWeight: 500 }}>
                                            {driverDetails.board_type || "Whiteboard & Yellowboard"}
                                        </IonLabel>
                                    </IonItem>
                                </IonCol>
                            </IonRow>
                        </IonGrid>}
            </IonContent>
        </PageLayout>
    );
};

export default DriverProfilePage;
