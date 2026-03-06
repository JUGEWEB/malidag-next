"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ lang: externalLang, children }) {
  const [lang, setLang] = useState(externalLang || "en");

  // ✅ keep local state in sync with Providers' `lang`
  useEffect(() => {
    if (externalLang && externalLang !== lang) {
      setLang(externalLang);
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
