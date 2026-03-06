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
  const [loadedImages, setLoadedImages] = useState({});

  const coinImages = {
    ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
    USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
    BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
    SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422",
    BNB: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
    USDT: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
  };

  // ✅ Preload coin images
  useEffect(() => {
    Object.entries(coinImages).forEach(([symbol, url]) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setLoadedImages((prev) => ({ ...prev, [symbol]: true }));
      };
    });
  }, []);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        // ✅ Step 1: Fetch only unique crypto symbols
        const symbolResponse = await axios.get(`${BASE_URL}/items/cryptos`);
        const symbols = symbolResponse.data.cryptos;

        // ✅ Step 2: Fetch live prices
        const priceResponse = await axios.get(`${BASE_URL}/crypto-prices`);
        const prices = priceResponse.data;

        // ✅ Step 3: Map symbols to price
        const coinPrices = symbols.map((symbol) => ({
          symbol,
          price: prices[symbol] ? prices[symbol].toFixed(2) : "0.00",
        }));

        setCoins(coinPrices);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching coin data:", err);
        setError(t("coin_error_loading"));
        setLoading(false);
      }
    };

    fetchCoins();
    const intervalId = setInterval(fetchCoins, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // ✅ Hide on small screens except home
  if ((isMobile || isSmallMobile || isVerySmall) && pathname !== "/") {
    return null;
  }

  if (loading) return <div style={{ height: "60px", backgroundColor: (isDesktop || isTablet) ? "#333" : "white" }}></div>;
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
      {/* Duplicate array for seamless infinite scroll */}
      {[...coins, ...coins].map((coin, index) => (
        <div
          key={`${coin.symbol}-${index}`}
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
          <span
            className="coin-price"
            style={{ color: (isDesktop || isTablet) ? "white" : "black" }}
          >
            ${coin.price}
          </span>
        </div>
      ))}
    </div>
  </div>
);

};

export default Coin;
