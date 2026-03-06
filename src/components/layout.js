"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { AppContext } from "./appContext";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { auth } from "@/components/firebaseConfig";
import i18n from "i18next";
import AppHeader from "@/components/appHeader";
import MalidagFooter from "@/components/malidagFooter";
import { usePathname } from "next/navigation";
import { ConfigProvider, App as AntdApp } from "antd";

const BASE_URLs = "https://api.malidag.com";

export default function MainLayout({ children, lang }) {
  const [user, setUser] = useState(null);
  const [basketItems, setBasketItems] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [languageReady, setLanguageReady] = useState(false);

  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();

  // ✅ setup auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // ✅ setup language (from server header, not IP country)
  useEffect(() => {
    const initLanguage = async () => {
      try {
        await i18n.changeLanguage(lang || "en");
      } finally {
        setLanguageReady(true);
      }
    };
    initLanguage();
  }, [lang]);

  // ✅ fetch countries for dropdowns etc. (not for language detection anymore)
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,cca2,flags");
        const countries = res.data.map((c) => ({
          name: c.name.common,
          code: c.cca2.toLowerCase(),
          flag: c.flags?.png || c.flags?.svg || "",
        }));
        setAllCountries(countries.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Countries list fetch failed", err);
      }
    };
    fetchCountries();
  }, []);

  // ✅ fetch basket items
  useEffect(() => {
    const fetchBasketItems = async () => {
      const userId = user?.uid || "guest";
      try {
        const res = await axios.get(`${BASE_URLs}/basket/${userId}`);
        setBasketItems(res.data.basket || []);
      } catch (err) {
        console.error("Basket fetch error", err);
      }
    };

    fetchBasketItems();
    const interval = setInterval(fetchBasketItems, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // ✅ scroll top on route change
  useEffect(() => {
    setTimeout(() => window.scrollTo(0, 0), 200);
  }, [pathname]);

  if (!languageReady) return null;

  return (
    <ConfigProvider>
      <AntdApp>
    <AppContext.Provider
      value={{
        basketItems,
        user,
        connectors,
        connect,
        address,
        disconnect,
        isConnected,
        chainId: chain?.id || null,
        pendingConnector,
        allCountries,
        chain,
      }}
    >
      <AppHeader
        {...{
          basketItems,
          user,
          connectors,
          connect,
          address,
          disconnect,
          isConnected,
          pendingConnector,
          allCountries,
        }}
      />
      <main>{children}</main>
      <MalidagFooter />
    </AppContext.Provider>
     </AntdApp>
    </ConfigProvider>
  );
}
