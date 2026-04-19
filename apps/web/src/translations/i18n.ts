import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonPt from './pt-BR/common.json';
import commonEn from './en-US/common.json';
import commonEs from './es-ES/common.json';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { common: commonPt },
    'en-US': { common: commonEn },
    'es-ES': { common: commonEs },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
