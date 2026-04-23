"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./saveBig.css";
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "./checkoutStore";

const BASE_URL = "https://api.malidag.com";
const CRYPTO_URL = "https://api.malidag.com/crypto-prices";

function SaveBig() {
  const router = useRouter();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [types, setTypes] = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [bestSellerId, setBestSellerId] = useState(null);

  useEffect(() => {
    const fetchFilteredItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = response.data || [];

       const filteredData = data.filter((item) => {
  const usdPrice = parseFloat(item?.item?.usdPrice || 0);
  const originalPrice = parseFloat(item?.item?.originalPrice || 0);
  const discount =
    originalPrice > 0 ? (originalPrice - usdPrice) / originalPrice : 0;

  return (
    ["BNB", "BTC", "ETH", "USDC", "USDT", "ADA", "BUSD", "SOL"].includes(
      String(item?.item?.cryptocurrency || "").toUpperCase()
    ) &&
    discount <= 0.2
  );
});

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item?.item?.type || "Other";
          if (!acc[type]) acc[type] = [];
          acc[type].push(item);
          return acc;
        }, {});

        const bestSeller = [...filteredData].sort(
  (a, b) => Number(b?.item?.sold || 0) - Number(a?.item?.sold || 0)
)[0];

setBestSellerId(bestSeller?.id || null);

        const initialColors = {};
        filteredData.forEach((product) => {
          const colorKeys = Object.keys(product?.item?.imagesVariants || {});
          if (colorKeys.length > 0) {
            initialColors[product.id] = colorKeys[0];
          }
        });

        setSelectedColorByItem(initialColors);
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
        setCryptoPrices(response.data || {});
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
      }
    };

    fetchFilteredItems();
    fetchCryptoPrices();
    const intervalId = setInterval(fetchCryptoPrices, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const allItems = useMemo(() => Object.values(types).flat(), [types]);

  const formatTypeForUrl = (type) =>
    encodeURIComponent(String(type || "").toLowerCase().replace(/\s+/g, "-"));

  const handleNavigateByType = (firstItem) => {
    const type = (firstItem?.item?.type || "").toLowerCase();
    const category = (firstItem?.category || "").toLowerCase();
    const gender = (firstItem?.item?.genre || "").toLowerCase();

    const formattedType = formatTypeForUrl(type);

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
    const upperCrypto = String(cryptocurrency || "").toUpperCase();
    if (!cryptoPrices[upperCrypto]) return null;
    return (Number(usdPrice) / cryptoPrices[upperCrypto]).toFixed(2);
  };

  const getCryptoIcon = (cryptocurrency) => {
    const cryptoIcons = {
      ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
      USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
      BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
      SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422",
      BNB: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
      USDT: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
      BTC: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
      ADA: "https://assets.coingecko.com/coins/images/975/large/cardano.png?1547034860",
    };
    return cryptoIcons[String(cryptocurrency || "").toUpperCase()] || "/crypto-icons/default.png";
  };

  const renderStars = (rating) => {
    const safeRating = Math.round(Number(rating) || 0);
    return (
      <div className="bbe-stars-container">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < safeRating ? "bbe-star filled" : "bbe-star empty"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleItemClick = (id) => {
    router.push(`/product/${id}`);
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();
    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.item?.imagesVariants || {});
  };

  const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

  const getDisplayImage = (product) => {
  const selectedColor = selectedColorByItem[product.id];
  const variants = product?.item?.imagesVariants || {};

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number" ? a.position : 999999;
      const posB =
        typeof b === "object" && typeof b?.position === "number" ? b.position : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object" ? a?.filename || "" : String(a || "").split("/").pop() || "";
      const nameB =
        typeof b === "object" ? b?.filename || "" : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(product?.item?.images?.[0]) || "/fallback.png";
};

  const getColorSwatch = (colorName = "") => {
    const color = colorName.trim().toLowerCase();

    const swatches = {
      black: "#111111",
      white: "#f8f8f8",
      red: "#dc2626",
      blue: "#2563eb",
      green: "#16a34a",
      yellow: "#eab308",
      pink: "#ec4899",
      purple: "#9333ea",
      orange: "#f97316",
      brown: "#92400e",
      grey: "#9ca3af",
      gray: "#9ca3af",
      silver: "#c0c0c0",
      gold: "#d4af37",
      beige: "#d6c7a1",
      cream: "#f5f0dc",
      ivory: "#fffff0",
      navy: "#1e3a8a",
      "sky blue": "#38bdf8",
      skyblue: "#38bdf8",
      maroon: "#7f1d1d",
      olive: "#556b2f",
      khaki: "#c3b091",
      multicolor: "linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #3b82f6, #a855f7)",
      transparent:
        "linear-gradient(135deg, #ddd 25%, #fff 25%, #fff 50%, #ddd 50%, #ddd 75%, #fff 75%, #fff 100%)",
    };

    return swatches[color] || "#d1d5db";
  };

  const getDiscountPercentage = (usdPrice, originalPrice) => {
  const current = Number(usdPrice || 0);
  const original = Number(originalPrice || 0);

  if (!original || current >= original) return 0;
  return Math.round(((original - current) / original) * 100);
};

  const handleAddToBasketPreview = (product, selectedColor, selectedImage, e) => {
    e.stopPropagation();
    setItemData({
      ...product,
      selectedColor,
      selectedImage,
    });
  };

  if (loading) {
    return (
      <div className="item-spinner-wrapper">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="bbe-container">
      <div className="bbe-type-list">
        {Object.entries(types).map(([type, items]) => {
          const firstItem = items[0];
          const category = firstItem?.category?.toLowerCase();
          const gender = firstItem?.item?.genre || "Unisex";
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

      <div className="bbe-item-grid">
        {allItems.map((product) => {
          const { id, item } = product;
          const selectedColor = selectedColorByItem[id];
          const colorOptions = getColorOptions(product);
          const displayImage = getDisplayImage(product);
          const cryptoValue = convertToCrypto(item?.usdPrice, item?.cryptocurrency);
          const isBestSeller = id === bestSellerId;
          const discountPercentage = getDiscountPercentage(item?.usdPrice, item?.originalPrice);

          return (
           <div key={id} className="bbe-item-card">
  <div className="bbe-item-media">
    {isBestSeller && (
      <div className="bbe-image-badge bbe-image-badge-best">
        Best Seller
      </div>
    )}

    {discountPercentage > 0 && (
      <div className="bbe-image-badge bbe-image-badge-discount">
        -{discountPercentage}%
      </div>
    )}

    <img
      src={displayImage}
      alt={item?.name}
      onClick={() => handleItemClick(id)}
      className="bbe-item-image"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/fallback.png";
      }}
    />
  </div>

  <div className="bbe-item-info" onClick={() => handleItemClick(id)}>
    <div className="bbe-item-price-row">
      <span className="bbe-item-price">${item?.usdPrice}</span>

      <span className="bbe-deals-badge">Deal</span>

      {Number(item?.originalPrice || 0) > 0 && (
        <span className="bbe-item-original-price">
          ${Number(item.originalPrice).toFixed(2)}
        </span>
      )}
    </div>

    <div className="bbe-crypto-row">
      <img
        src={getCryptoIcon(item?.cryptocurrency)}
        className="bbe-crypto-icon"
        alt={item?.cryptocurrency}
      />
      <span className="bbe-crypto-price">
        {cryptoValue ? `${cryptoValue} ${item?.cryptocurrency}` : item?.cryptocurrency}
      </span>
    </div>

    <div className="bbe-item-name">
      {item?.name?.length > 70 ? `${item.name.slice(0, 70)}...` : item?.name}
    </div>

    {colorOptions.length > 0 && (
      <div className="bbe-color-block" onClick={(e) => e.stopPropagation()}>
        <div className="bbe-color-label">
          Color: <span>{selectedColor}</span>
        </div>

        <div className="bbe-color-options">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              className={`bbe-color-circle ${
                selectedColor === color ? "active" : ""
              }`}
              title={color}
              aria-label={`Select ${color}`}
              style={{ background: getColorSwatch(color) }}
              onClick={(e) => handleColorSelect(id, color, e)}
            />
          ))}
        </div>
      </div>
    )}

    <div className="bbe-item-rating">{renderStars(item?.rating || 0)}</div>

    <button
      type="button"
      className="bbe-add-basket-btn"
      onClick={(e) =>
        handleAddToBasketPreview(product, selectedColor, displayImage, e)
      }
    >
      Add to Basket
    </button>
  </div>
</div>
          );
        })}
      </div>
    </div>
  );
}

export default SaveBig;