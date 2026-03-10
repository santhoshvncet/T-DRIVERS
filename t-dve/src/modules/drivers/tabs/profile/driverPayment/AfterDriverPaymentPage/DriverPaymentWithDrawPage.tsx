import React, { useContext, useEffect, useRef, useState } from "react";
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonText,
} from "@ionic/react";

import PageLayout from "../../../../../common/layout/PageLayout";
import SwipeToWithdraw from "./DriverSwipeToWithDraw";
import constants from "../../../../../../lib/constants";
import { UserContext } from "../../../../../../provider/UserProvider";
import useApiCall from "../../../../../../hooks/useApi";
import axiosInstance from "../../../../../../api/axiosinstance";
import { endPoints } from "../../../../../../lib/constants/endpoints";

const SHEET_HEIGHT = 300;   // Increased height
const DRAG_HEADER_HEIGHT = 150; // Optional: to allow bigger drag area


const DriverPaymentWithDrawPage: React.FC = () => {
  const { user } = useContext(UserContext);

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    bankName: "",
    LastFourNumber: "",
  });

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragStartY = useRef(0);
  const [sheetPosition, setSheetPosition] = useState(0);
  const [canDrag, setCanDrag] = useState(false);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const[get_driver_bank_details]=useApiCall(axiosInstance.get);


const fetchBankDetails = async (userId: number) => {
  await get_driver_bank_details(
    [`${endPoints.GET_DRIVER_BANK_DETAILS}/${userId}`],
    {
      onCompleted: (response: any) => {
        const data = response?.data?.data?.[0];
        if (data) {
          setBankDetails({
            accountHolderName: data.account_holder,
            bankName: data.bank_name,
            LastFourNumber: data.account_last4,
          });
        }
      },
      onError: (err: any) => {
        console.error("Failed to fetch bank details:", err);
      },
    }
  );
};

useEffect(() => {
  if (!user?.userId) return;

  fetchBankDetails(user.userId);
}, [user?.userId]);

  const handleDragStart = (e: React.TouchEvent) => {
    if (isSwipeActive) return;

    const touchY = e.touches[0].clientY;
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (touchY >= rect.top && touchY <= rect.top + DRAG_HEADER_HEIGHT) {
      setCanDrag(true);
      dragStartY.current = touchY;
    }
  };

  const handleDragMove = (e: React.TouchEvent) => {
    if (!canDrag || isSwipeActive) return;

    const currentY = e.touches[0].clientY;
    const delta = dragStartY.current - currentY;

    let newPos = sheetPosition + delta;
    if (newPos < 0) newPos = 0;
    if (newPos > SHEET_HEIGHT) newPos = SHEET_HEIGHT;

    setSheetPosition(newPos);
    dragStartY.current = currentY;
  };

  const handleDragEnd = () => {
    if (!canDrag) return;

    setSheetPosition(sheetPosition > SHEET_HEIGHT / 2 ? SHEET_HEIGHT : 0);
    setCanDrag(false);
  };

  const handleCompleteWithdraw = () => {
    window.location.href =`${constants.DRIVER_PAYMENT_WITHDRAW_COMPLETE_PAGE}`
  };

  return (
    <PageLayout
      showNotification
      screenName="Withdraw Amount"
      title="Withdraw Amount"
      showBackButton
    >
        <IonContent fullscreen className="bg-gray-100">

          {/* TOP AMOUNTS */}
          <div className="px-5 pt-5 space-y-5">
            {[
              { label: "Total Amount", value: 30540 },
              { label: "Available for Withdraw", value: 28540 },
            ].map((item, index) => (
              <IonCard key={index} className="bg-[#FFF7D6] py-4 rounded-xl border shadow-sm text-center">
                <IonCardContent>
                  <p className="text-gray-700 text-lg">{item.label}</p>
                  <IonText className="text-3xl font-bold text-black tracking-wide">
                    ₹{item.value.toLocaleString()}.00
                  </IonText>
                </IonCardContent>
              </IonCard>
            ))}

            <div className="text-center">
              <p className="text-gray-700 text-lg">Withdraw Amount</p>
              <p className="text-3xl font-bold">28,540.00</p>
            </div>

            {/* BOTTOM SHEET */}
           {/* FIXED BOTTOM SHEET */}
<div
  className="fixed left-0 bottom-0 w-full bg-white rounded-t-3xl shadow-2xl px-5 pb-6 z-50"
  style={{
    height: `${SHEET_HEIGHT}px`,
    boxShadow: "0 -12px 32px rgba(0,0,0,0.18)",
    transition: "all 0.3s ease-in-out",
  }}
   onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
>
  <div className="flex justify-center mt-2 mb-1">
    <div className="w-14 h-1.5 bg-gray-300 rounded-full"></div>
  </div>

  {/* BANK CARD */}
  <IonCard className="bg-[#FFF7D6] p-4 rounded-xl border shadow-sm mt-2">
    <IonCardContent>
      <IonText className="block font-semibold text-lg">
        {bankDetails.accountHolderName}
      </IonText>
      <IonText className="block text-gray-700 text-sm">
        {bankDetails.bankName}
      </IonText>
      <IonText className="block text-gray-500 text-sm">
        **** **** **** {bankDetails.LastFourNumber}
      </IonText>
    </IonCardContent>
  </IonCard>

  {/* SWIPE BUTTON */}
  <div className="mt-5">
    <SwipeToWithdraw
      onComplete={handleCompleteWithdraw}
      onSwiping={(v: boolean) => setIsSwipeActive(v)}
    />
  </div>
</div>
          </div>
        </IonContent>
    </PageLayout>
  );
};

export default DriverPaymentWithDrawPage;
