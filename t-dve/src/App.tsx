import React from 'react';
import { IonApp } from '@ionic/react';
import './i18n';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';
import './theme/global.css';

import { setupIonicReact } from '@ionic/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProvider } from './provider/UserProvider';
import Routes from './Routes';
import { useOneSignal } from './hooks/useOneSignal';
import { initSafeArea } from './safeArea';


setupIonicReact({
  scrollAssist: false,   
  scrollPadding: false,  
});

const App: React.FC = () => {
  useOneSignal();
  initSafeArea()

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
      <IonApp className="h-full">
        <UserProvider>
          <Routes />
        </UserProvider>
      </IonApp>
    </GoogleOAuthProvider>
  );
};

export default App;
