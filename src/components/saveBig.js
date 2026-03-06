"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./payBNBBTCETH.css";
import { useRouter } from 'next/navigation';

const BASE_URL = "https://api.malidag.com";
const CRYPTO_URL = "https://api.malidag.com/crypto-prices";

function SaveBig() {
   const router = useRouter();
  const [types, setTypes] = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilteredItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = response.data;

        const filteredData = data.filter((item) => {
          const usdPrice = parseFloat(item.item.usdPrice);
          const originalPrice = parseFloat(item.item.originalPrice);
          const discount = originalPrice > 0 ? (originalPrice - usdPrice) / originalPrice : 0;

          return (
            ["BNB", "BTC", "ETH", "USDC", "USDT", "ADA", "BUSD", "SOL"].includes(item.item.cryptocurrency) &&
            discount <= 2 // At least 50% discount
          );
        });

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item.item.type || "Other";
          if (!acc[type]) acc[type] = [];
          acc[type].push(item);
          return acc;
        }, {});

        setTypes(groupedData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCryptoPrices = async () => {
      try {
        const response = await axios.get(CRYPTO_URL);
        setCryptoPrices(response.data);
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
      }
    };

    fetchFilteredItems();
    fetchCryptoPrices();
    const intervalId = setInterval(fetchCryptoPrices, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const formatTypeForUrl = (type) =>
    encodeURIComponent(type.toLowerCase().replace(/\s+/g, "-"));
  
  const handleNavigateByType = (firstItem) => {
  const type = (firstItem.item.type || "").toLowerCase();
  const category = (firstItem.category || "").toLowerCase();
  const gender = (firstItem.item.genre || "").toLowerCase();

  const formattedType = formatTypeForUrl(type);

  // ✅ Prioritize Kids route first (since pet care might accidentally eat it)
  if (
    ["clothes", "toys", "accessories", "gear", "toy"].includes(category) &&
    ["boy", "girl", "babies", "babyboy", "babygirl", "kids", "kid"].includes(gender)
  ) {
    router.push(`/itemOfKids/${gender}/${formattedType}`);
  } else if (category === "beauty") {
    router.push(`/itemOfItems/${formattedType}`);
  } else if (category === "shoes") {
    router.push(`/itemOfShoes/${gender}-${formattedType}`);
  } else if (category === "clothes" && gender === "women") {
    router.push(`/item-of-women/${formattedType}`);
  } else if (category === "clothes" && gender === "men") {
    router.push(`/item-of-men/${formattedType}`);
  } else if (category === "electronic") {
    router.push(`/itemOfElectronic/${formattedType}`);
  } else if (category === "home & kitchen") {
    router.push(`/itemOfHome/${formattedType}`);
  } else if (category === "pet care") {
    router.push(`/petCare/${gender}/${formattedType}`);
  } else {
    console.warn("No route matched for:", { type, category, gender });
  }
};


  const convertToCrypto = (usdPrice, cryptocurrency) => {
    if (!cryptoPrices[cryptocurrency]) return null;
    return (usdPrice / cryptoPrices[cryptocurrency]).toFixed(2);
  };

  const getCryptoIcon = (cryptocurrency) => {
    const cryptoIcons = {
      ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
      USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
      BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
      SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422",
      BNB: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
      USDT: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
    };
    return cryptoIcons[cryptocurrency] || "/crypto-icons/default.png";
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-container">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < rating ? "star filled" : "star empty"}>★</span>
        ))}
      </div>
    );
  };

  const handleItemClick = (id) => {
    router.push(`/product/${id}`);
  };

  if (loading) return <div className="loading-message">Loading Items...</div>;

  return (
    <div className="bbe-container">
      {/* Types List (clickable) */}
      <div className="bbe-type-list">
      {Object.entries(types).map(([type, items]) => {
  const firstItem = items[0];
  const category = firstItem.category?.toLowerCase();
  const gender = firstItem.item.genre || "Unisex";
  const label = category === "electronic" ? type : `${gender} ${type}`;
  
  return (
    <div
      key={type}
      className="bbe-type-item"
      onClick={() => handleNavigateByType(firstItem)}
    >
      {label}
    </div>
  );
})}


      </div>

      {/* All Discounted Items */}
      <div className="bbe-item-grid">
        {Object.values(types).flat().map(({ id, item }) => (
          <div key={id} className="bbe-item-card">
            <div style={{ backgroundColor: "white", filter: "brightness(0.88) contrast(1.2)" }}>
              <img
                src={item.images[0]}
                alt={item.name}
                onClick={() => handleItemClick(id)}
                className="bbe-item-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/fallback.png";
                }}
              />
            </div>
            <div className="bbe-item-info" onClick={() => handleItemClick(id)}>
              <div className="bbe-item-price">
                ${item.usdPrice}
                <span className="crypto-price">
                  {convertToCrypto(item.usdPrice, item.cryptocurrency)} {item.cryptocurrency}
                  <img
                    src={getCryptoIcon(item.cryptocurrency)}
                    className="crypto-icon"
                    alt={item.cryptocurrency}
                  />
                </span>
              </div>
              <div className="bbe-item-name">
                {item.name.length > 100 ? `${item.name.slice(0, 100)}...` : item.name}
              </div>
              <div className="bbe-item-rating">{renderStars(item.rating || 0)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SaveBig;
