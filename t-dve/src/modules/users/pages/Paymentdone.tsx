import React from "react";
import {
  IonPage,
} from "@ionic/react";
import PaymentStatusPage from "../../../common/PaymentCard";
import routes from "../../../lib/constants/routes";





export default function PaymentSuccess() {
const [isPaymentDone, setIsPaymentDone] = React.useState(true);


  return (
    <IonPage>
      <PaymentStatusPage isPayment={isPaymentDone}  redirectUrl={routes.HOME_PAGE} />
    </IonPage>
  );
}
