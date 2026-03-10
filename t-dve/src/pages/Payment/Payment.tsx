import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';

const Payment: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Payment</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <h2 style={{ textAlign: 'center', marginTop: '20px' }}>Welcome to Payment Page</h2>
      </IonContent>
    </IonPage>
  );
};

export default Payment;
