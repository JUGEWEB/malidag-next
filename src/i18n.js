import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import fr from "./locales/fr/translation.json";
import ar from "./locales/ar/translation.json";
import pt from "./locales/pt/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
      pt: { translation: pt }
    },

    fallbackLng: "en",

    supportedLngs: ["en", "fr", "ar", "pt"],

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;