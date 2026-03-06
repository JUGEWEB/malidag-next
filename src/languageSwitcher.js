import i18n from "./i18n";

export const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  localStorage.setItem("lng", lng); // optional: store preference
};

export const getCurrentLanguage = () => {
  return i18n.language || localStorage.getItem("lng") || "en";
};
