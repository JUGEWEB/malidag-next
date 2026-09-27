// src/components/i18nServer.js

import i18next from "i18next";

import en from "@/locales/en/translation.json";
import fr from "@/locales/fr/translation.json";
import br from "@/locales/br/translation.json";

const resources = {
  en: {
    translation: en,
  },

  fr: {
    translation: fr,
  },

  br: {
    translation: br,
  },
};

const initI18n = async (lng = "en") => {
  const language =
    resources[lng]
      ? lng
      : "en";

  const instance =
    i18next.createInstance();

  await instance.init({
    lng: language,

    fallbackLng: "en",

    resources,

    interpolation: {
      escapeValue: false,
    },
  });

  return instance;
};

export default initI18n;