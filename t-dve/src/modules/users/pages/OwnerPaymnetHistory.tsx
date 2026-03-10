import React, { useEffect, useMemo, useState } from "react";
import {
  IonContent,
  IonCard,
  IonButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { closeOutline, arrowUp } from "ionicons/icons";
import PageLayout from "../../../modules/common/layout/PageLayout";
import PaymentCard, {
  PaymentStatus,
} from "../../../common/PaymentHistoryforOwner";
import axiosInstance from "../../../api/axiosinstance";
import constants from "../../../lib/constants";
import CustomDropdown from "../../../common/selectDropdown";
import useApiCall from "../../../hooks/useApi";


interface PaymentFromAPI {
  trip_id: number;
  origin_city: string;
  dest_city: string;
  end_date: string;
  fare_amount: number;
  payment_status: string;
  razorpay_payment_id?: string;
  payment_method?: string;
}

interface PaymentUI extends PaymentFromAPI {
  ui_status: PaymentStatus;
}


const normalizeStatus = (status?: string): PaymentStatus => {
  switch ((status || "").toLowerCase()) {
    case "captured":
      return "PAID";
    case "authorized":
      return "PENDING";
    case "refunded":
      return "REFUND";
    case "failed":
      return "FAILED";
    default:
      return "FAILED";
  }
};


const OwnerPaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priceOrder, setPriceOrder] = useState<"ASC" | "DESC" | null>(null);
  const [dateOrder, setDateOrder] = useState<"NEW" | "OLD" | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<any>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentUI | null>(null);
  const [get_status] = useApiCall(axiosInstance.get);


  const paymentOptions = [
    { label: "All", value: "ALL" },
    { label: "Paid", value: "PAID" },
    { label: "Pending", value: "PENDING" },
    { label: "Refund", value: "REFUND" },
    { label: "Failed", value: "FAILED" },
  ]

  function formatDateToDMY(inputDate: Date) {
    const date = new Date(inputDate);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months start at 0
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }



  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const ownerData = localStorage.getItem("user");
        const parsedOwner = ownerData ? JSON.parse(ownerData) : null;

        const ownerId =
          parsedOwner?.owner_id ||
          parsedOwner?.id ||
          parsedOwner?.data?.owner_id ||
          parsedOwner?.data?.id;

        if (!ownerId) {
          setError("Owner ID not found. Please login again.");
          setLoading(false);
          return;
        }

        await get_status(
          [`${constants.GET_PAYMENT_HISTORY}/${ownerId}`],
          {
            onCompleted: (res: any) => {
              if (!res?.data?.status) {
                setError(res?.data?.msg || "No payment history found.");
              } else {
                const normalized: PaymentUI[] = (res.data.payments || []).map(
                  (p: PaymentFromAPI) => ({
                    ...p,
                    end_date: formatDateToDMY(new Date(p.end_date)),
                    ui_status: normalizeStatus(p.payment_status),
                  })
                );
                setPayments(normalized);
              }
              setLoading(false);
            },
            onError: (err: any) => {
              console.error(err);
              setError("Failed to load payment history.");
              setLoading(false);
            },
          }
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load payment history.");
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  const filteredPayments = useMemo(() => {
    let data = [...payments];

    if (statusFilter !== "ALL") {
      data = data.filter((p) => p.ui_status === statusFilter);
    }

    const map = new Map<number, PaymentUI>();
    for (const p of data) {
      if (!map.has(p.trip_id)) {
        map.set(p.trip_id, p);
      }
    }

    let result = Array.from(map.values());

    if (priceOrder) {
      result.sort((a, b) =>
        priceOrder === "ASC"
          ? a.fare_amount - b.fare_amount
          : b.fare_amount - a.fare_amount
      );
    } else if (dateOrder) {
      result.sort((a, b) =>
        dateOrder === "NEW"
          ? new Date(b.end_date).getTime() -
          new Date(a.end_date).getTime()
          : new Date(a.end_date).getTime() -
          new Date(b.end_date).getTime()
      );
    }

    return result;
  }, [payments, statusFilter, priceOrder, dateOrder]);


  const handlePaymentButton = (payment: PaymentUI) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };


  return (
    <PageLayout
      title="Payment History"
      screenName="payment history"
      showBackButton
    >
      <IonContent
        style={{
          "--padding-bottom": "calc(env(safe-area-inset-bottom) + 86px)",
        }}
      >
        {/* Filters */}
        <IonCard className="mx-4 mt-3 mb-2 rounded-2xl shadow-sm sticky top-0 z-20 bg-white">
          <div className="flex gap-3 px-4 py-3 overflow-x-auto">
            <IonButton
              size="small"
              fill={priceOrder ? "solid" : "outline"}
              onClick={() => {
                setPriceOrder(priceOrder === "ASC" ? "DESC" : "ASC");
                setDateOrder(null);
              }}
              className="text-black"
            >
              <div className="flex items-center gap-2">
                <span>Price</span>
                <IonIcon
                  src={arrowUp}
                  className={`transition-transform duration-200 text-black text-[16px] ${priceOrder === "ASC" ? "rotate-0" : "rotate-180"
                    }`}
                />
              </div>
            </IonButton>

            <IonButton
              size="small"
              fill={dateOrder ? "solid" : "outline"}
              onClick={() => {
                setDateOrder(dateOrder === "NEW" ? "OLD" : "NEW");
                setPriceOrder(null);
              }}
              className="text-black"
            >
              <div className="flex items-center gap-2">
                <span>Date</span>
                <IonIcon
                  src={arrowUp}
                  className={`transition-transform duration-200 text-black text-[16px] ${dateOrder === "NEW" ? "rotate-0" : "rotate-180"
                    }`}
                />
              </div>
            </IonButton>

            {/* <IonSelect
              value={statusFilter}
              interface="popover"
              onIonChange={(e) => setStatusFilter(e.detail.value)}
            >
              <IonSelectOption value="ALL">All</IonSelectOption>
              <IonSelectOption value="PAID">Paid</IonSelectOption>
              <IonSelectOption value="PENDING">Pending</IonSelectOption>
              <IonSelectOption value="REFUND">Refund</IonSelectOption>
              <IonSelectOption value="FAILED">Failed</IonSelectOption>
            </IonSelect> */}
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={paymentOptions}
            />
          </div>
        </IonCard>

        {/* List */}
        {filteredPayments.map((p) => (
          <PaymentCard
            key={`${p.trip_id}-${p.payment_status}-${p.fare_amount}`}
            tripId={p.trip_id}
            originCity={p.origin_city}
            destCity={p.dest_city}
            endDate={p.end_date}
            fareAmount={Number(p.fare_amount)}
            status={p.ui_status}
            handleClick={() => handlePaymentButton(p)}
          />
        ))}

        {/* ---------- MODAL ---------- */}
        <IonModal
          isOpen={isModalOpen}
          onDidDismiss={() => setIsModalOpen(false)}
          initialBreakpoint={0.5}
          breakpoints={[0, 0.5, 0.9]}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Payment Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsModalOpen(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {selectedPayment && (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold">
                    {selectedPayment.ui_status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold">
                    ₹{selectedPayment.fare_amount}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID</span>
                  <span className="font-medium break-all text-right">
                    {selectedPayment.razorpay_payment_id || "--"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium">
                    {selectedPayment.payment_method || "--"}
                  </span>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      From : <br />
                      {selectedPayment.origin_city}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">To</span>
                    <span>{selectedPayment.dest_city}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>{selectedPayment.end_date}</span>
                  </div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </PageLayout>
  );
};

export default OwnerPaymentHistory;
