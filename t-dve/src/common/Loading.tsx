import { IonSpinner, IonContent } from '@ionic/react';

export const Loading = () => (
  <IonContent className="ion-padding ion-text-center">
    <IonSpinner name="crescent" />
  </IonContent>
);
