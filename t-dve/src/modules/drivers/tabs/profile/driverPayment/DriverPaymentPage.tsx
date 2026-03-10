import React, { useContext, useEffect, useState } from "react";
import {
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonImg,
  IonText,
  IonModal,
} from "@ionic/react";

import axiosInstance from "../../../../../api/axiosinstance";
import constants from "../../../../../lib/constants";
import { UserContext } from "../../../../../provider/UserProvider";
import useApiCall from "../../../../../hooks/useApi";
import { useHistory } from "react-router";
import PageLayout from "../../../../common/layout/PageLayout";
import { endPoints } from "../../../../../lib/constants/endpoints";
import { truncateText } from "../../../../../utils/truncateText";

interface Transaction {
  direction: string;
  id: number;
  from: string;
  to: string;
  date: string;
  time: string;
  amount: number;
  image: string;
  meta: any[];
}

const DriverPaymentPage: React.FC = () => {
  const { user } = useContext(UserContext);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const history = useHistory();
  const [getDriverBalance] = useApiCall(axiosInstance.get);

  /** API — get transactions */
  const getDriverTransactions = async (userId: number) => {
    return axiosInstance.get(
      `${constants.GET_DRIVER_PAYMENT_TRANSACTIONS}/${userId}`
    );
  };

  const [executeApi, { loading }] = useApiCall(getDriverTransactions);


  const PaymentSkeleton = () => (
    <div className="px-5 mt-6 animate-pulse">
      <div className="bg-gray-200 rounded-3xl p-6 h-40 mb-6"></div>

      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-40 bg-gray-300 rounded"></div>
        <div className="h-5 w-16 bg-gray-300 rounded"></div>
      </div>

      {/* Transaction items */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-gray-200 p-4 rounded-2xl"
          >
            {/* Avatar */}
            <div className="h-12 w-12 bg-gray-300 rounded-full"></div>

            {/* Text */}
            <div className="flex flex-col mx-3 flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-gray-300 rounded"></div>
              <div className="h-4 w-1/3 bg-gray-300 rounded"></div>
            </div>

            {/* Amount */}
            <div className="h-5 w-16 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const visibleTransactions = showAll
    ? transactions
    : transactions.slice(0, 5);


  useEffect(() => {
    getDriverBalance([
      `${endPoints.GET_DRIVER_BALANCE}/${user.userId}`
    ], {
      onCompleted: (res) => {
        setTotalAmount(res?.data.data.balance_rupees);
      },
      onError: (err) => {
        console.log("error while fetching driver balance", err);
      }
    })

  }, [])

  /** Fetch transactions */
  useEffect(() => {
    if (!user?.userId) return;

    executeApi([user.userId], {
      onCompleted: (res) => {
        const data = res.data;

        const formatted = data.data.map((item: any) => ({
          id: item.trip_id,
          from: item.origin_area,
          to: item.destination_area,
          date: new Date(item.completed_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          time: new Date(item.completed_at).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          amount: Number(item.amount) / 100,
          direction: item.direction,
          meta: item.meta,
          image:
            item.selected_car_image ||
            item.driver_image ||
            "https://cdn-icons-png.flaticon.com/512/147/147144.png",
        }));


        setTransactions(formatted);
      },

      onError: (err) => {
        console.error("Transaction API error:", err);
      },
    });
  }, [user?.userId]);


  const handleBackClick = () => {
    history.push("/home");
  };

  return (
    <PageLayout
      screenName="payment withdraw"
      title="payment"
      showBackButton
      
      backButtonClick={handleBackClick}
    >
      <IonContent fullscreen className="bg-white overflow-y-auto"
        style={{
          "--padding-bottom": "calc(env(safe-area-inset-bottom) + 86px)",
        }}>
        {loading && <PaymentSkeleton />}

        {/* UI Content (Hidden while loading) */}
        {!loading && (
          <>
            {/* Total Amount Card */}
            <div className="px-5 pt-4">
              <IonCard className="bg-[#FFF7D6] rounded-3xl shadow-md border border-yellow-200 text-center px-6 py-8">
                <IonCardContent>
                  <IonText className="block text-gray-700 text-lg font-medium">
                    Total Amount
                  </IonText>

                  <IonText className="block text-3xl font-extrabold text-black tracking-wide mt-1">
                    ₹{totalAmount}.00
                  </IonText>

                  {/* <IonButton
                      className="w-full mt-4 font-semibold text-black"
                      onClick={handleBankCheck}
                    >
                      Withdraw
                    </IonButton> */}
                </IonCardContent>
              </IonCard>
            </div>

            {/* Recent Transactions */}
            <div className="flex justify-between items-center px-5 mt-6">
              <h3 className="font-semibold text-gray-800 text-lg">
                Recent Transactions
              </h3>
              {transactions.length > 5 && (
                <button
                  className="text-yellow-600 font-medium"
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll ? "Show Less" : "See All"}
                </button>
              )}

            </div>

            {transactions.length === 0 && (
              <p className="text-center mt-5 text-gray-500">
                No transactions found.
              </p>
            )}
            <div className="px-4 sm:px-5 mt-4 space-y-3 sm:space-y-4">
              {visibleTransactions.map((tx) => (
                <IonCard
                  key={tx.id}
                  onClick={() => { setSelectedTx(tx); setShowModal(true); }}
                  className="flex items-center justify-between bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm border border-gray-100"
                >
                  <IonImg
                    src={tx.image}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                  />

                  <div className="flex flex-col ml-3 flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base flex items-center gap-1 truncate">
                      {truncateText(tx.from, 12)}
                      <span className="text-yellow-500 text-base sm:text-xl">➜</span>
                      {truncateText(tx.to, 12)}
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                      {tx.date} • {tx.time}
                    </p>
                  </div>

                  <p
                    className={`font-semibold text-sm sm:text-lg flex-shrink-0 ${tx.direction === "DEBIT" ? "text-red-600" : "text-green-600"
                      }`}
                  >
                    {tx.direction === "DEBIT" ? "- " : "+ "} ₹{tx.amount}.00
                  </p>
                </IonCard>
              ))}
            </div>
            <IonModal
              isOpen={showModal}
              onDidDismiss={() => setShowModal(false)}
              className="tx-modal"
              initialBreakpoint={0.6}
              breakpoints={[0, 0.6, 0.8]}
              backdropDismiss={true}
            >
              <div className="p-4 space-y-3 pb-15px">
                <h2 className="font-semibold text-lg">Transaction Details</h2>

                <p className="text-sm">
                  <b>Trip:</b> {selectedTx?.from} ➜ {selectedTx?.to}
                </p>

                <p className="text-sm">
                  <b>Amount:</b> ₹{selectedTx?.amount}
                </p>

                <p className="text-sm">
                  <b>Transaction-Type:</b> {selectedTx?.direction}
                </p>

                <h3 className="font-semibold mt-3 text-sm">Meta Info</h3>

                {selectedTx?.meta?.map((m: any, idx: number) => (
                  <pre key={idx} className="bg-gray-100 p-2 rounded text-xs">
                    {
                      <div>
                        {m.razorpay_payment_id &&
                          <div>
                            <h3>Source : {m.source}</h3>
                            <p>payment ID : {m.razorpay_payment_id}</p>
                            <p>Order ID : {m.order_id}</p>
                          </div>
                        }

                      </div>
                    }
                  </pre>
                ))}

                <IonButton expand="block" onClick={() => setShowModal(false)}>
                  Close
                </IonButton>
              </div>
            </IonModal>

          </>

        )}
      </IonContent>
    </PageLayout>
  );
};
export default DriverPaymentPage;