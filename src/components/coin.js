'use client';

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./coin.css";
import useScreenSize from "./useIsMobile";

const BASE_URL = "https://api.malidag.com";

const Coin = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } = useScreenSize();
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const coinImages = {
    USDC: "https://api.malidag.com/learn/videos/1769909942070-0xaf88d065e77c8cc2239327c5edb3a432268e5831.png",
    BUSD: "https://api.malidag.com/learn/videos/1773502639247-BUSD.png",
    USDT: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
  };

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items/cryptos`);
        const symbols = response.data.cryptos || [];

        // keep only supported coins that have images
        const filteredCoins = symbols
          .filter((symbol) => coinImages[symbol])
          .map((symbol) => ({ symbol }));

        setCoins(filteredCoins);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching coin data:", err);
        setError(t("coin_error_loading"));
        setLoading(false);
      }
    };

    fetchCoins();
  }, [t]);

  if ((isMobile || isSmallMobile || isVerySmall) && pathname !== "/") {
    return null;
  }

  if (loading) {
    return (
      <div
        style={{
          height: "60px",
          backgroundColor: (isDesktop || isTablet) ? "#333" : "white",
        }}
      />
    );
  }

  if (error) return <div>{error}</div>;

  const handleCoinClick = (symbol) => {
    router.push(`/coin/${symbol}`);
  };

  return (
    <div
      className="coin-scroll-container"
      style={{
        backgroundColor: (isDesktop || isTablet) ? "#333" : "white",
      }}
    >
      <div className="coin-scroll">
        {coins.map((coin) => (
          <div
            key={coin.symbol}
            className="coin-item"
            onClick={() => handleCoinClick(coin.symbol)}
          >
            <img
              loading="lazy"
              src={coinImages[coin.symbol] || "https://via.placeholder.com/40"}
              alt={coin.symbol}
              className="coin-image"
            />
            <span
              className="coin-symbol"
              style={{ color: (isDesktop || isTablet) ? "white" : "black" }}
            >
              {coin.symbol}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Coin;