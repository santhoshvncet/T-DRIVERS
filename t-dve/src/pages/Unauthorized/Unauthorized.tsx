// src/pages/Unauthorized/Unauthorized.tsx
import React from 'react';
import { useHistory } from 'react-router-dom'; // Import useHistory
import { IonPage, IonContent, IonText, IonButton } from '@ionic/react';
import PageLayout from '../../modules/common/layout/PageLayout';

const Unauthorized: React.FC = () => {
  const history = useHistory();

  const handleGoHome = () => {
    history.push('/home');
  };

  return (
    <PageLayout screenName={'Unauthorized'} showBackButton>
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', marginTop: '50%' }}>
            <IonText color="danger"><h1>Unauthorized !!!</h1></IonText>
            <IonText>
              <p>Access Denied! You don't have permission to access this page. Please Contact Support </p>
            </IonText>
            {/* Add the "Go Home" button */}
            <IonButton expand="full" onClick={handleGoHome} className='mt-6 w-26 mx-auto'>
              Go Home
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    </PageLayout>
  );
};

export default Unauthorized;