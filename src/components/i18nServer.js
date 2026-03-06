// src/i18nServer.js
import i18n from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";

const initI18n = async (lng) => {
  const instance = i18n.createInstance();
  await instance.use(Backend).init({
    lng,
    fallbackLng: "en",
    backend: {
      loadPath: path.resolve("./src/locales/{{lng}}/translation.json"),
    },
    interpolation: {
      escapeValue: false,
    },
  });

  return instance;
};

export default initI18n;
