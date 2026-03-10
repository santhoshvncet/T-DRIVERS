import React, { useContext, useEffect, useState } from "react";
import {
    IonContent,
    IonLabel,
    IonButton,
    IonIcon,
    IonModal,
} from "@ionic/react";
import PageLayout from "../../common/layout/PageLayout";
import { UserContext } from "../../../provider/UserProvider";
import { useRazorpayPayment } from "../../../hooks/useRazorpayPayment";
import axiosInstance from "../../../api/axiosinstance";
import { endPoints } from "../../../lib/constants/endpoints";
import { useToast } from "../../../hooks/useToast";
import { number } from "framer-motion";
import useNavigationHistory from "../../../hooks/useNavigationHistory";
import constants from "../../../lib/constants";
import { informationCircleOutline } from "ionicons/icons";
import useApiCall from "../../../hooks/useApi";

interface FareData {
    trip_id: string
    base_fare: number;
    extra_hour_charge: number;
    night_charge: number;
    driver_allowance: number;
    final_fare: number;
    actual_hours: number;
    estimated_hours: number;
    distance_km: number;
    duration_type: "LOCAL" | "OUTSTATION";
}

const PaymentDetails: React.FC = () => {
    const [fare, setFare] = useState<FareData | null>(null);

    const { user } = useContext(UserContext);
    const [post_status] = useApiCall(axiosInstance.post);
    const { pushLatest } = useNavigationHistory();
    const [showFareInfo, setShowFareInfo] = useState(false);

    const { initiatePayment, loading, verifying } = useRazorpayPayment();

    const toast = useToast();


    useEffect(() => {
        const stored = sessionStorage.getItem("paymentDetails");
        if (stored) {
            setFare(JSON.parse(stored));
        }
    }, []);

    if (!fare) return null;

    console.log("trip id", fare.trip_id)
    console.log("here is the fare", fare)

    // const totalHours = fare.actual_hours + fare.estimated_hours;
    const extraHours = Math.max(fare.actual_hours - fare.estimated_hours, 0);

    const totalHours =
        fare.estimated_hours + Math.max(fare.actual_hours - fare.estimated_hours, 0);

    const fullDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    const baseHours = fullDays * 24;
    // ---------- OUTSTATION SLAB BREAKDOWN ----------
    const outstationSlabs: { label: string; price: number }[] = [];

    if (fare.duration_type === "OUTSTATION") {
        if (totalHours <= 12) {
            outstationSlabs.push({
                label: "",
                price: 1500,
            });
        } else {
            // First 12 hours always
            outstationSlabs.push({
                label: "",
                price: 1500,
            });

            let remaining = totalHours - 12;

            while (remaining > 0) {
                if (remaining <= 12) {
                    outstationSlabs.push({
                        label: "",
                        price: 1500,
                    });
                    break;
                } else {
                    outstationSlabs.push({
                        label: "",
                        price: 2000,
                    });
                    remaining -= 24;
                }
            }
        }
    }
const totalBookedPrice =
  fare.duration_type === "LOCAL"
    ? fare.base_fare
    : outstationSlabs.reduce((sum, slab) => sum + slab.price, 0);




    let baseFareParts: number[] = [];

    if (totalHours <= 12) {
        baseFareParts = [1500];
    } else if (totalHours <= 24) {
        baseFareParts = [2000];
    } else {
        // > 24 hrs
        baseFareParts = [2000]; // first 24 hrs
        const remainingHours = totalHours - 24;
        const fullDays = Math.floor(remainingHours / 24);
        for (let i = 0; i < fullDays; i++) {
            baseFareParts.push(2000);
        }

        const leftoverHours = remainingHours % 24;

        // Add another ₹2000 ONLY if leftover > 12 hours
        if (leftoverHours > 12) {
            baseFareParts.push(2000);
        }
    }

    const outstationBaseFare = baseFareParts.reduce((sum, v) => sum + v, 0);
    const updateTripStatus = async (status: string, trip_id: string) => {
        try {
            if (!status || !trip_id) {
                toast.error("failed updating trip status");
                return null;
            }

            let responseData: any = null;

            await post_status(
                [
                    endPoints.POST_TRIP_STATUS,
                    { status, trip_id },
                ],
                {
                    onCompleted: (response: any) => {
                        if (!response) {
                            toast.error("failed fetching response");
                            return;
                        }
                        responseData = response;
                    },
                    onError: (error: any) => {
                        toast.error("internal server error");
                        console.log(error);
                    },
                }
            );

            return responseData;
        } catch (error: any) {
            toast.error("internal server error");
            console.log(error);
            return null;
        }
    };

    const handleRazorpayPay = async () => {
        if (!fare?.trip_id) {
            console.log("Trip id is missing for the payment")
            return
        }
        const trip_id = fare?.trip_id

        if (!user?.owner_id) {
            console.error("Owner ID missing. User not authenticated?");
            return;
        }
        initiatePayment({
            amount: fare?.final_fare,
            user: {
                name: user?.name,
                email: user?.email,
                contact: user?.phone,
                ownerId: String(user.owner_id)
            },
            trip_id: fare?.trip_id,
            onSuccess: async (response: any) => {
                console.log("User successfully subscribed!", response);
                try {
                    pushLatest(constants.BOOKING_PAGE);
                } catch (err) {
                    console.error("Failed payment:", err);
                }

            }
        });
    };
    return (
        <PageLayout
            title="Payment Details"
            screenName="PaymentDetails"
            showBackButton
        >
            <IonContent className="px-4 pt-4 pb-32 bg-gray-50">

                {(loading || verifying) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                        <p className="text-center text-sm font-semibold text-gray-800">
                            {loading ? (
                                <>Loading, please wait do not close or go back</>
                            ) : (
                                <>
                                    Verifying your payment…
                                    <br />
                                    Please do not close or go back.
                                </>
                            )}
                        </p>
                    </div>
                )}




                {/* CARD */}
                <div className="bg-white rounded-xl p-4 shadow w-full max-w-md mx-auto">

                    <div className="flex justify-between text-sm text-gray-800 mb-2">
                        <span>Exceeded Hours</span>
                        <span>{Math.max(fare.actual_hours - fare.estimated_hours, 0)} hrs</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-800 mb-2">
                        <span>Booked Hours</span>
                        <span>{fare.estimated_hours} hrs</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-800 mb-4">
                        <span>Total Hours</span>
                        <span>{fare.estimated_hours + Math.max(fare.actual_hours - fare.estimated_hours, 0)} hrs</span>
                    </div>


                    {/* Booked Charges */}
                    <IonLabel className="text-sm font-semibold text-gray-900">
                        Booked Charges
                    </IonLabel>
                    <div className="h-px bg-gray-400 my-3" />

                    <div className="flex justify-between text-sm text-gray-800 mb-2">
                        <span className="flex items-center gap-1">
                            {fare.duration_type === "OUTSTATION"
                                ? "Base Fare (Outstation)"
                                : "Base Fare (Local)"}

                            <IonIcon
                                icon={informationCircleOutline}
                                className="text-lg text-gray-500 cursor-pointer"
                                onClick={() => setShowFareInfo(true)}
                            />
                        </span>



                        {/* LOCAL */}
                        {fare.duration_type === "LOCAL" && (
                            <div className="flex justify-between text-sm text-gray-800 mb-2">
                                <span>
                                    ₹350
                                    {Math.max(fare.estimated_hours - 2, 0) > 0 &&
                                        ` + ₹${Math.max(fare.estimated_hours - 2, 0) * 100}`}
                                    {" = "}
                                    ₹{fare.base_fare}
                                </span>
                            </div>
                        )}
                        {fare.duration_type === "OUTSTATION" && (
                            <div className="space-y-2">
                                {outstationSlabs.map((slab, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between text-sm text-gray-800"
                                    >
                                        <span>{slab.label}</span>
                                        <span>₹{slab.price}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                    <IonModal
                        isOpen={showFareInfo}
                        onDidDismiss={() => setShowFareInfo(false)}
                        backdropDismiss
                        className="fare-rules-modal"
                    >
                        <div className="flex items-center justify-center h-full px-4">
                            <div className="bg-white rounded-xl w-full max-w-sm p-4 shadow-xl">

                                <h3 className="text-base font-semibold mb-3">
                                    {fare.duration_type === "OUTSTATION"
                                        ? "Outstation Fare Rules"
                                        : "Local Fare Rules"}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-700">

                                    {fare.duration_type === "LOCAL" && (
                                        <>
                                            <div className="flex justify-between">
                                                <span>Base Fare (Up to 2 hrs)</span>
                                                <span>₹350</span>
                                            </div>

                                            <div className="text-xs text-gray-500 mt-1">
                                                Remaining hours: {totalHours % 24} hrs
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Extra Hour Charge</span>
                                                <span>₹100 / hour</span>
                                            </div>
                                        </>
                                    )}
                                    {fare.duration_type === "OUTSTATION" && (
                                        <>
                                            <div className="flex justify-between">
                                                <span>First 12 hours (only if total ≤ 12 hrs)</span>
                                                <span>₹1500</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span>Each 24-hour block</span>
                                                <span>₹2000</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span>Remaining ≤ 12 hours</span>
                                                <span>1500</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span>Remaining &gt; 12 hours</span>
                                                <span>₹2000</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <IonButton
                                    expand="block"
                                    className="mt-4"
                                    style={{ backgroundColor: "#FFD600", color: "#000" }}
                                    onClick={() => setShowFareInfo(false)}
                                >
                                    Close
                                </IonButton>

                            </div>
                        </div>
                    </IonModal>
                    <div className="h-px bg-gray-400 my-3" />

                    <div className="flex justify-between text-sm font-semibold text-gray-900 mb-2">
                        <span>Total Booked Hours</span>
                        <span>₹{totalBookedPrice}</span>
                    </div>


                    <IonLabel className="text-sm font-semibold text-gray-900 block mt-4">
                        Additional Charges
                    </IonLabel>
                    <div className="h-px bg-gray-400 my-3" />

                    {fare.duration_type === "LOCAL" && (
                        <div className="flex justify-between text-sm text-gray-800 mb-2">
                            <span>Extra Hour Charge</span>
                            <span>
                                {extraHours} hrs × 150 = ₹{fare.extra_hour_charge}
                            </span>
                        </div>
                    )}

                    {fare.duration_type === "OUTSTATION" && fare.extra_hour_charge > 0 && (
                        <div className="flex justify-between text-sm text-gray-800 mb-2">
                            <span>Extra Day Charge</span>
                            <span>
                                {extraHours} hrs = ₹{fare.extra_hour_charge}
                            </span>
                        </div>
                    )}



                    <div className="flex justify-between text-sm text-gray-800 mb-2">
                        <span>Night Charge</span>
                        <span>₹{fare.night_charge}</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-800 mb-4">
                        <span>Driver Allowance</span>
                        <span>₹{fare.driver_allowance}</span>
                    </div>

                    <div className="h-px bg-gray-400 my-3" />

                    <div className="flex justify-between text-sm font-semibold text-gray-900">
                        <span>Total Amount</span>
                        <span>₹{fare.final_fare}</span>
                    </div>

                </div>
            </IonContent>
            
{!loading &&
            <div className="fixed bottom-0 left-0 right-0 bg-black px-4 py-3 flex items-center gap-3">
                <span className="text-white text-base font-medium flex-1">
                    Pay
                </span>

                <IonButton

                    className=" !text-black font-bold text-lg rounded-xl px-6"
                    onClick={handleRazorpayPay}
                >
                    {fare.final_fare}.00
                </IonButton>
            </div>
}



        </PageLayout>
    );
};

export default PaymentDetails;
