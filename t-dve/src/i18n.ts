import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en_translation from './locales/en/translation.json';
import hi_translation from './locales/hi/translation.json';
import ta_translation from './locales/ta/translation.json';
import kn_translation from './locales/kn/translation.json';
import te_translation from './locales/te/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en_translation },
      hi: { translation: hi_translation },
      ta: { translation: ta_translation },
      kn: { translation: kn_translation },
      te: { translation: te_translation },
    },
    lng: 'en',
    fallbackLng: ['en'],
    interpolation: { escapeValue: false },
  });

export default i18n;
