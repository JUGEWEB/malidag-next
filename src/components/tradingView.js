"use client"

import React, { useEffect, useRef } from "react";

const TradingView = ({ symbol }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          autosize: true,
          symbol: `${symbol}USDT`, // Use the passed symbol
          interval: "D",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          theme: "dark", // Dark theme automatically uses white text
          toolbar_bg: "#000000", // Toolbar background color
          backgroundColor: "#000000", // Chart background color
          enable_publishing: false,
          allow_symbol_change: true,
          details: true,
          hotlist: true,
          calendar: true,
        });
      }
    };

    containerRef.current.appendChild(script);
  }, [symbol]);

  return   <div id="tradingview-widget" ref={containerRef} style={{ height: "500px" }} />;
};

export default TradingView;
