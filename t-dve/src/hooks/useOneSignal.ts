import { useEffect } from 'react';
import common from '../utils/common'; 
import constants from '../lib/constants';

declare const window: any;

export const useOneSignal = () => {
  useEffect(() => {
    const initOneSignal = () => {
      try {
        const OneSignal = window?.plugins?.OneSignal;
        if (!OneSignal) {
          console.warn('[OneSignal] Plugin not found.');
          return;
        }

        OneSignal.setAppId(constants.ONESIGNAL_ID);

        OneSignal.setNotificationOpenedHandler((notification: any) => {
          console.log('[OneSignal] Notification opened:', notification);
        });

        OneSignal.promptForPushNotificationsWithUserResponse((response: any) => {
          console.log('[OneSignal] User response:', response);
        });

        console.log('[OneSignal] Initialized successfully');
      } catch (err) {
        console.error('[OneSignal] Initialization failed:', err);
      }
    };

    const setup = async () => {
      const platform = await common.getDevicePlatform();
      if (platform === 'web') {
        console.log('[OneSignal] Skipping on web platform');
        return;
      }

      document.addEventListener('deviceready', initOneSignal, { once: true });
    };

    setup();

    
    return () => {
      document.removeEventListener('deviceready', initOneSignal);
    };
  }, []);
};
