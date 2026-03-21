'use client';

import React, { useEffect, useMemo, useState } from "react";
import "./menFashion.css";
import { useRouter } from "next/navigation";
import RecommendedItem from "./personalRecommend";
import { useCheckoutStore } from "./checkoutStore";

function MenFashion({ mtypes, groupedTypes, cryptoPrices = {} }) {
  const router = useRouter();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [bestSellerId, setBestSellerId] = useState(null);

  const allItems = useMemo(
    () => Object.values(groupedTypes || {}).flat(),
    [groupedTypes]
  );

  useEffect(() => {
    const initialColors = {};
    let bestSeller = null;

    allItems.forEach((product) => {
      const colorKeys = Object.keys(product?.item?.imagesVariants || {});
      if (colorKeys.length > 0) {
        initialColors[product.id] = colorKeys[0];
      }

      if (
        !bestSeller ||
        Number(product?.item?.sold || 0) > Number(bestSeller?.item?.sold || 0)
      ) {
        bestSeller = product;
      }
    });

    setSelectedColorByItem(initialColors);
    setBestSellerId(bestSeller?.id || null);
  }, [allItems]);

  const handleItemClick = (id) => {
    router.push(`/product/${id}`);
  };

  const convertToCrypto = (usdPrice, cryptocurrency) => {
    const upperCrypto = String(cryptocurrency || "").toUpperCase();
    if (!cryptoPrices?.[upperCrypto]) return null;
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

    return (
      cryptoIcons[String(cryptocurrency || "").toUpperCase()] ||
      "/crypto-icons/default.png"
    );
  };

  const renderStars = (rating) => {
    const safeRating = Math.round(Number(rating) || 0);
    return (
      <div className="product-stars-container">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < safeRating ? "product-star filled" : "product-star empty"}
          >
            ★
          </span>
        ))}
      </div>
    );
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

  const getDisplayImage = (product) => {
    const selectedColor = selectedColorByItem[product.id];
    const variants = product?.item?.imagesVariants || {};

    if (selectedColor && variants[selectedColor]?.[0]) {
      return variants[selectedColor][0];
    }

    return product?.item?.images?.[0] || "/fallback.png";
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
      multicolor:
        "linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #3b82f6, #a855f7)",
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

  return (
    <div className="men-fashion-page">
      <section className="men-hero">
        <img
          src="https://api.malidag.com/learn/videos/1754140515701-man-in-white-and-light-tan-outfit.jpg"
          alt="men fashion"
          className="men-hero-image"
        />
        <div className="men-hero-overlay">
          <div className="men-hero-content">
            <span className="men-hero-badge">Men's Fashion</span>
            <h1>Fresh Fits for Every Day</h1>
            <p>Discover sneakers, socks, outfits, and trending essentials.</p>
          </div>
        </div>
      </section>

      <section className="men-types-section">
        <div className="section-header">
          <h2>Shop by Type</h2>
        </div>

        <div className="men-types-row">
          {Object.keys(groupedTypes || {}).map((type, idx) => (
            <button
              key={idx}
              className="type-chip"
              onClick={() => router.push(`/item-of-men/${type.toLowerCase()}`)}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="men-products-section">
        <div className="section-header">
          <h2>Trending Products</h2>
          <span>{allItems.length} items</span>
        </div>

        <div className="men-products-grid">
          {allItems.map((product) => {
            const { id, item } = product;
            const selectedColor = selectedColorByItem[id];
            const colorOptions = getColorOptions(product);
            const displayImage = getDisplayImage(product);
            const cryptoValue = convertToCrypto(item?.usdPrice, item?.cryptocurrency);
            const isBestSeller = id === bestSellerId;
            const discountPercentage = getDiscountPercentage(
              item?.usdPrice,
              item?.originalPrice
            );

            return (
              <article
                key={id}
                className="product-card"
                onClick={() => handleItemClick(id)}
              >
                <div className="product-image-wrap">
                  {isBestSeller && (
                    <div className="product-image-badge product-image-badge-best">
                      Best Seller
                    </div>
                  )}

                  {discountPercentage > 0 && (
                    <div className="product-image-badge product-image-badge-discount">
                      -{discountPercentage}% off
                    </div>
                  )}

                  <img
                    src={displayImage}
                    alt={item?.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/fallback.png";
                    }}
                  />
                </div>

                <div className="product-info">

                   {colorOptions.length > 0 && (
                    <div
                      className="product-color-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="product-color-label">
                        Color: <span>{selectedColor}</span>
                      </div>

                      <div className="product-color-options">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`product-color-circle ${
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
                  <div className="product-price-row">

                    <span className="product-price">${item?.usdPrice}</span>

                    {Number(item?.originalPrice || 0) > 0 && (
                      <span className="product-old-price">
                        ${Number(item.originalPrice).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="product-crypto-row">
                    <img
                      src={getCryptoIcon(item?.cryptocurrency)}
                      className="product-crypto-icon"
                      alt={item?.cryptocurrency}
                    />

                    <span className="product-crypto-price">
                      {cryptoValue
                        ? `${cryptoValue} ${item?.cryptocurrency}`
                        : item?.cryptocurrency || "USDT"}
                    </span>
                  </div>

                  <h3 className="product-title">
                    {item?.name?.length > 60
                      ? `${item.name.substring(0, 60)}...`
                      : item?.name}
                  </h3>

                  <div className="product-meta">
                    <span>{item?.sold ? `${item.sold} sold` : "New"}</span>
                  </div>

                  <div className="product-rating">
                    {renderStars(item?.rating || 0)}
                  </div>

                  <button
                    type="button"
                    className="product-add-basket-btn"
                    onClick={(e) =>
                      handleAddToBasketPreview(product, selectedColor, displayImage, e)
                    }
                  >
                    Add to Basket
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="recommended-section">
        <RecommendedItem />
      </section>
    </div>
  );
}

export default MenFashion;