import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/react';

const NetworkError = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Network Error</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding">
      <h2>No Internet Connection</h2>
    </IonContent>
  </IonPage>
);

export default NetworkError;
