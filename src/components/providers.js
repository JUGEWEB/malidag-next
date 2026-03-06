"use client";

import { WagmiProvider } from "wagmi";
import { config } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import MainLayout from "./layout";
import { LanguageProvider } from "./LanguageContext";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import i18n from "@/i18n";

export default function Providers({ children, initialLang }) {
  const [queryClient] = useState(() => new QueryClient());
  const [lang, setLang] = useState(null); // 🚨 start with null
  const [userId, setUserId] = useState(null);

  const supportedLanguages = Object.keys(i18n.options.resources);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function initLang() {
      try {
        let storedLang = localStorage.getItem("lang");

        // 1️⃣ Fetch from backend if user logged in
        if (userId) {
          const res = await fetch(
            `https://api.malidag.com/api/lang?userId=${userId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.lang) {
              storedLang = data.lang;
              localStorage.setItem("lang", data.lang);
            }
          }
        }

        // 2️⃣ If nothing → use browser language
        if (!storedLang) {
          const browserLang = navigator.language?.split("-")[0] || "en";
          storedLang = initialLang || browserLang;
          localStorage.setItem("lang", storedLang);
        }

        // 3️⃣ Validate
        if (!supportedLanguages.includes(storedLang)) {
          storedLang = "en";
          localStorage.setItem("lang", "en");
        }

        // 4️⃣ Sync state + i18n
        setLang(storedLang);
        if (i18n.language !== storedLang) {
          await i18n.changeLanguage(storedLang);
        }

        // 5️⃣ Sync backend if missing
        if (userId && storedLang) {
          await fetch("https://api.malidag.com/api/lang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, lang: storedLang }),
          });
        }

        // 6️⃣ Update <html lang="">
        document.documentElement.setAttribute("lang", storedLang);
      } catch (err) {
        console.error("Language detection error:", err);
        setLang("en"); // fallback
      }
    }

    initLang();
  }, [userId, supportedLanguages]);

  // 🚨 Don’t render children until language is resolved
  if (!lang) return null; // or show a loading spinner

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <LanguageProvider lang={lang}>
          <MainLayout>{children}</MainLayout>
        </LanguageProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
