"use client";

import { createContext, useContext, useState, useEffect } from "react";
import i18n from "@/i18n";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ lang: externalLang, children }) {
  const [lang, setLang] = useState(externalLang || "en");

  // Restore saved language after refresh
  useEffect(() => {
    const savedLang = localStorage.getItem("lang");

    if (savedLang) {
      setLang(savedLang);
      i18n.changeLanguage(savedLang);
    } else if (externalLang) {
      setLang(externalLang);
      i18n.changeLanguage(externalLang);
    }
  }, []);

  // Keep local state in sync if externalLang changes
  useEffect(() => {
    if (!externalLang) return;

    const savedLang = localStorage.getItem("lang");

    // User's saved selection takes priority
    if (!savedLang && externalLang !== lang) {
      setLang(externalLang);
      i18n.changeLanguage(externalLang);
    }
  }, [externalLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}