"use client";

import React from "react";
import useScreenSize from "./useIsMobile";

const TheCryptoShop = () => {
  const { isMobile, isSmallMobile, isVerySmall } = useScreenSize();

  const headingStyle = {
    fontSize: isMobile || isSmallMobile || isVerySmall ? "22px" : "32px",
    fontWeight: "bold",
    marginBottom: "25px",
    textAlign: "center",
    color: "#00ffe7",
    textShadow: "0 0 5px #00ffe7",
  };

  const sectionStyle = {
    backgroundColor: "#111",
    padding: "20px",
    borderRadius: "12px",
    margin: "20px auto",
    maxWidth: "900px",
    fontSize: isMobile ? "14px" : "16px",
    color: "#eee",
    lineHeight: 1.8,
    border: "1px solid #333",
    boxShadow: "0 0 10px rgba(0,255,231,0.05)",
  };

  const announcementBox = {
    background:
      "linear-gradient(135deg, rgba(0,255,231,0.15) 0%, rgba(0,255,150,0.05) 100%)",
    border: "1px solid #00ffe7",
    borderRadius: "12px",
    padding: "20px",
    color: "#fff",
    textAlign: "center",
    boxShadow: "0 0 20px rgba(0,255,231,0.2)",
  };

  const listStyle = {
    paddingLeft: "20px",
    marginTop: "10px",
  };

  const containerStyle = {
    padding: "20px",
    backgroundColor: "#000",
    minHeight: "100vh",
  };

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>🪙 Welcome to The Crypto Shop</h1>

      {/* ✅ BNB Vault Announcement */}
      <div style={announcementBox}>
        <h2 style={{ color: "#00ffe7", marginBottom: "10px" }}>
          🚀 Official AnnouncementB Vault is Live!
        </h2>
        <p>
          <strong> Vault (VLT)</strong> is the official payment and utility
          token for the Malidag ecosystem. It powers purchases, discounts, and
          Web3 payments across the entire Malidag Shop.
        </p>
        <p>
          Starting <strong>November 2025</strong>, VLT will be accepted as one
          of the main cryptocurrencies on Malidag Shop and integrated directly
          into <strong>Binege</strong> for trading and price tracking.
        </p>
        <p style={{ marginTop: "10px" }}>
          🔗 Learn more:{" "}
          <a
            href="https://vault.malidag.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00ffe7", textDecoration: "underline" }}
          >
            https://vault.malidag.com
          </a>
        </p>
      </div>

      {/* 🔹 What is The Crypto Shop */}
      <div style={sectionStyle}>
        <p>
          <strong style={{ color: "#00ffe7" }}>What is The Crypto Shop?</strong>
        </p>
        <p>
          The Crypto Shop is your access point to buying cryptocurrencies or
          digital gems within the <strong>Malidag</strong> platform. It’s fast,
          integrated, and gives users multiple options to choose from available
          crypto assets.
        </p>
        <p>
          Users are expected to make their own research before purchasing.
          Malidag does not provide investment advice or guarantee returns.
        </p>
      </div>

      {/* 🔹 Binege Integration */}
      <div style={sectionStyle}>
        <p>
          <strong style={{ color: "#00ffe7" }}>🔗 Binege Integration</strong>
        </p>
        <p>
          All tokens listed on <strong>Malidag</strong> will also be listed on{" "}
          <strong>Binege</strong>, our upcoming crypto directory and trading
          platform. Malidag uses Binege's API to display token info and pricing.
        </p>
        <p>
          Binege ensures the tokens you see on Malidag are verified and globally
          listed. This provides a unified, trusted source for crypto discovery
          and shopping.
        </p>
      </div>

      {/* 🔹 Coming Soon Section */}
      <div style={sectionStyle}>
        <p>
          <strong style={{ color: "#00ffe7" }}>🔮 Coming Soon</strong>
        </p>
        <ul style={listStyle}>
          <li>✔️ Real-time token prices via Binege API</li>
          <li>✔️ Seamless crypto checkout options (BNV, BNB, ETH, USDT, more)</li>
          <li>✔️ Cross-app token availability (Malidag + Binege)</li>
          <li>✔️ Loyalty rewards for crypto purchases</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <p
          style={{
            textAlign: "center",
            fontWeight: "bold",
            color: "#00ffe7",
          }}
        >
          Stay tuned. We’re building the future of shopping with Web3.
        </p>
      </div>
    </div>
  );
};

export default TheCryptoShop;
