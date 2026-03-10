import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tdrivers.app',
  appName: 'Tdrivers',
  webDir: 'dist',
  plugins: {
    OneSignal: {
      appId: "bfed7248-f934-48fa-8845-59a631458a12",
      googleProjectNumber: "1030101349708",
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "195625969759-r3qapk1nefifcoej02iisah80s26l5eu.apps.googleusercontent.com",
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
 
  },
};

export default config;
