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
import { usePathname, useRouter } from "next/navigation";
import { ConfigProvider, App as AntdApp } from "antd";

const BASE_URLs = "https://api.malidag.com";

const REQUIRED_CACHE_KEYS = [
  "fashionForAll_first10",
  "electronic_first10",
  "topTopic_first10",
  "recommendedItems_first20",
];

const SUPPORTED_COUNTRIES = [
  {
    name: "United States",
    code: "us",
    flag: "https://flagcdn.com/w320/us.png",
  },
  {
    name: "United Kingdom",
    code: "gb",
    flag: "https://flagcdn.com/w320/gb.png",
  },
  {
    name: "France",
    code: "fr",
    flag: "https://flagcdn.com/w320/fr.png",
  },
  {
    name: "Germany",
    code: "de",
    flag: "https://flagcdn.com/w320/de.png",
  },
  {
    name: "Ireland",
    code: "ie",
    flag: "https://flagcdn.com/w320/ie.png",
  },
  {
    name: "Australia",
    code: "au",
    flag: "https://flagcdn.com/w320/au.png",
  },
  {
  name: "Belgium",
  code: "be",
  flag: "https://flagcdn.com/w320/be.png",
},
];

export default function MainLayout({ children, lang }) {
  const [user, setUser] = useState(null);
  const [basketItems, setBasketItems] = useState([]);
  const [allCountries] = useState(SUPPORTED_COUNTRIES);
  const [languageReady, setLanguageReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [bootProduct, setBootProduct] = useState(null);
  const [countryChanging, setCountryChanging] = useState(false);
  const router = useRouter();

const [country, setCountryState] = useState(null);

const setCountry = (nextCountry) => {
  if (!nextCountry?.code) return;

  setCountryState(nextCountry);
  localStorage.setItem("selectedCountry", JSON.stringify(nextCountry));
  window.dispatchEvent(new Event("countryChanged"));
};

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
  setCountryChanging(false);
}, [pathname]);

useEffect(() => {
  const segments = pathname.split("/").filter(Boolean);
  const routeCountryCode = segments[0];

  if (!routeCountryCode) return;

  const isSupportedRouteCountry = SUPPORTED_COUNTRIES.some(
    (c) => c.code === routeCountryCode
  );

  if (!isSupportedRouteCountry) {
    localStorage.removeItem("selectedCountry");
    setCountryState(null);
    setCountryChanging(true);
    router.replace("/");
  }
}, [pathname, router]);


useEffect(() => {
  if (!country?.code) return;

  const segments = pathname.split("/").filter(Boolean);
  const routeCountryCode = segments[0];

  const supportedCodes = SUPPORTED_COUNTRIES.map((c) => c.code);

  if (!routeCountryCode || !supportedCodes.includes(routeCountryCode)) {
    return;
  }

  if (routeCountryCode === country.code) {
    return;
  }

  setCountryChanging(true);

  segments[0] = country.code;
  router.replace(`/${segments.join("/")}`);
}, [country?.code, pathname, router]);

  useEffect(() => {
  const detectCountry = async () => {
    try {
      const savedCountry = localStorage.getItem("selectedCountry");
      if (savedCountry) {
       setCountry(JSON.parse(savedCountry));
        return;
      }

      const res = await axios.get("https://ipapi.co/json/");
      const detectedCode = res.data?.country_code?.toLowerCase();
      const detectedName = res.data?.country_name;

     if (detectedCode && detectedName) {
        const supportedCountry = SUPPORTED_COUNTRIES.find(
          (c) => c.code === detectedCode
        );

        if (!supportedCountry) {
          router.replace("/");
          return;
        }

        setCountry(supportedCountry);
      }
    } catch (err) {
      console.error("Country detection failed", err);

     router.replace("/");
    }
  };

  detectCountry();
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
          src="https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2FChatGPT%20Image%20May%206%2C%202026%2C%2012_09_22%20AM.png?alt=media&token=19d4b065-b842-4e9a-81be-028450001cad"
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
            country,
            setCountry,
            countryChanging,
            setCountryChanging,
            chain,
          }}
        >

          {countryChanging && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 999999,
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                }}
              >
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2FChatGPT%20Image%20May%206%2C%202026%2C%2012_09_22%20AM.png?alt=media&token=19d4b065-b842-4e9a-81be-028450001cad"
                  alt="Malidag"
                  style={{
                    width: "110px",
                    height: "110px",
                    objectFit: "contain",
                  }}
                />

                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Updating delivery country...
                </div>
              </div>
            )}
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
              country,
              setCountry,
            }}
          />
          <main>{children}</main>
          <MalidagFooter />
        </AppContext.Provider>
      </AntdApp>
    </ConfigProvider>
  );
}