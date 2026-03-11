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

const REQUIRED_CACHE_KEYS = [
  "fashionForAll_first10",
  "electronic_first10",
  "topTopic_first10",
  "recommendedItems_first20",
];

export default function MainLayout({ children, lang }) {
  const [user, setUser] = useState(null);
  const [basketItems, setBasketItems] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [languageReady, setLanguageReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [bootProduct, setBootProduct] = useState(null);

  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

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

  useEffect(() => {
    setTimeout(() => window.scrollTo(0, 0), 200);
  }, [pathname]);

  useEffect(() => {
    if (!languageReady) return;

    const hasAnyCache = () => {
      try {
        return REQUIRED_CACHE_KEYS.some((key) => {
          const value = localStorage.getItem(key);
          return value && value !== "[]" && value !== "null";
        });
      } catch (error) {
        console.error("Cache check error:", error);
        return false;
      }
    };

    const bootApp = async () => {
      try {
        const cachedExists = hasAnyCache();

        if (cachedExists) {
          setAppReady(true);
          return;
        }

        const response = await fetch(`${BASE_URLs}/recommended-items?min=1&max=20`);
        const data = await response.json();
        const items = data.items || [];

        if (items.length > 0) {
          setBootProduct(items[0]);

          localStorage.setItem(
            "recommendedItems_first20",
            JSON.stringify(items.slice(0, 20))
          );
        }

        setAppReady(true);
      } catch (error) {
        console.error("Boot preload error:", error);
        setAppReady(true);
      }
    };

    bootApp();
  }, [languageReady]);

  if (!languageReady || !appReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: "#fff",
          padding: "24px",
        }}
      >
        <img
          src="https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2FGemini_Generated_Image_8tsm718tsm718tsm-removebg-preview.png?alt=media&token=265d1922-0c07-4658-9955-58660103c88e"
          alt="Malidag"
          style={{
            width: "120px",
            height: "120px",
            objectFit: "contain",
            marginBottom: "20px",
          }}
        />

        {bootProduct?.item?.images?.[0] && (
          <img
            src={bootProduct.item.images[0]}
            alt={bootProduct.item?.name || "Loading product"}
            style={{
              width: "160px",
              height: "160px",
              objectFit: "contain",
              marginBottom: "16px",
              borderRadius: "16px",
            }}
          />
        )}

        <div
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#222",
            marginBottom: "8px",
          }}
        >
          Loading Malidag...
        </div>

        {bootProduct?.item?.name && (
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              textAlign: "center",
              maxWidth: "260px",
            }}
          >
            {bootProduct.item.name}
          </div>
        )}
      </div>
    );
  }

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