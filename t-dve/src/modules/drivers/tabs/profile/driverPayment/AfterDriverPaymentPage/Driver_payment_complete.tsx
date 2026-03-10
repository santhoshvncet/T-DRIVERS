import React from "react";
import {
  IonPage,
} from "@ionic/react";
import routes from "../../../../../../lib/constants/routes";
import PaymentStatusPage from "../../../../../../common/PaymentCard";
import constants from "../../../../../../lib/constants";



export default function PaymentSuccess() {
const [isPaymentDone, setIsPaymentDone] = React.useState(true);
const paymentPage  = constants.DRIVER_PAYMENT_PAGE

  return (
    <IonPage>
      <PaymentStatusPage isPayment={isPaymentDone} redirectUrl= {paymentPage}/>
    </IonPage>
  );
}
