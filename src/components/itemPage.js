"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./itemPage.css";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";

const coinImages = {
  USDC: "https://api.malidag.com/learn/videos/1769909942070-0xaf88d065e77c8cc2239327c5edb3a432268e5831.png",
  BUSD: "https://api.malidag.com/learn/videos/1773502639247-BUSD.png",
  USDT: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
};

function ItemPage({ searchTerm }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  const { isMobile, isTablet, isVerySmall, isSmallMobile } = useScreenSize();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);
  const [bestSellerId, setBestSellerId] = useState(null);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(`https://api.malidag.com/get-reviews/${productId}`);
      if (response.data.success) {
        const reviewsArray = response.data.reviews || [];
        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

        setReviews((prevReviews) => ({
          ...prevReviews,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      if (!searchTerm) return;

      setLoading(true);

      try {
        const response = await axios.get(
          `https://api.malidag.com/items/${encodeURIComponent(searchTerm)}`
        );
       const matchedItems = response.data.items || [];
setItems(matchedItems);

const initialColors = {};

matchedItems.forEach((product) => {
  const colorKeys = Object.keys(product?.item?.imagesVariants || {});
  if (colorKeys.length > 0) {
    initialColors[product.id] = colorKeys[0];
  }
});

setSelectedColorByItem(initialColors);

const bestSeller = [...matchedItems].sort(
  (a, b) => Number(b?.item?.sold || b?.details?.soldText || 0) - Number(a?.item?.sold || a?.details?.soldText || 0)
)[0];

setBestSellerId(bestSeller?.id || null);

matchedItems.forEach((item) => fetchReviews(item.itemId));
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [searchTerm]);

  const categoryTypes = Array.from(
    new Set(items.map((item) => item?.item?.type).filter(Boolean))
  );

  const brands = Array.from(
    new Set(items.map((item) => item?.item?.brand).filter(Boolean))
  );

  const brandTypes = Array.from(
    new Set(items.map((item) => item?.item?.brandType).filter(Boolean))
  );

  const handleVideoPlay = (id) => {
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  const handleLinkClick = (label, value) => {
    console.log("Clicked:", label, value);
    setMenuOpen(false);
  };

  const isSmallScreen = isMobile || isTablet || isVerySmall || isSmallMobile;

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  if (!items || items.length === 0) {
    return (
      <div className="no-results-message">
        {t("no_results_found", { term: searchTerm })}
      </div>
    );
  }

  const handleColorSelect = (itemId, color, e) => {
  e.stopPropagation();
  setSelectedColorByItem((prev) => ({
    ...prev,
    [itemId]: color,
  }));
};

const getColorOptions = (itemData) => {
  return Object.keys(itemData?.item?.imagesVariants || {});
};

const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

const getDisplayImage = (itemData) => {
  const selectedColor = selectedColorByItem[itemData.id];
  const variants = itemData?.item?.imagesVariants || {};

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number"
          ? a.position
          : 999999;

      const posB =
        typeof b === "object" && typeof b?.position === "number"
          ? b.position
          : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object"
          ? a?.filename || ""
          : String(a || "").split("/").pop() || "";

      const nameB =
        typeof b === "object"
          ? b?.filename || ""
          : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(itemData?.item?.images?.[0]) || "/fallback.png";
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
    skyblue: "#38bdf8",
    "sky blue": "#38bdf8",
    maroon: "#7f1d1d",
    olive: "#556b2f",
    khaki: "#c3b091",
    transparent: "linear-gradient(135deg, #ddd 25%, #fff 25%, #fff 50%, #ddd 50%, #ddd 75%, #fff 75%, #fff 100%)",
    multicolor: "linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #3b82f6, #a855f7)",
  };

  return swatches[color] || "#d1d5db";
};

  return (
    <div className="page-layout">
      {isSmallScreen && (
        <div className="mobile-top-bar">
          <div className="mobile-results-title">
            {t("search_results")}
          </div>

          <button
            className="mobile-menu-icon-button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      )}

      <aside
        className={`sidebar-filters ${isSmallScreen ? "mobile-sidebar" : ""} ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="sidebar-block">
          <div className="sidebar-title">{t("related_types")}</div>
          <div className="sidebar-links">
            {categoryTypes.map((type, index) => (
              <div
                key={index}
                className="sidebar-main-link"
                onClick={() => handleLinkClick("type", type)}
              >
                {type}
              </div>
            ))}
          </div>
        </div>

        {brands.length > 0 && (
          <div className="sidebar-block">
            <div className="sidebar-title">Related Brands</div>
            <div className="sidebar-links">
              {brands.map((brand, index) => (
                <div
                  key={index}
                  className="sidebar-main-link"
                  onClick={() => handleLinkClick("brand", brand)}
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        )}

        {brandTypes.length > 0 && (
          <div className="sidebar-block">
            <div className="sidebar-title">Brand Types</div>
            <div className="sidebar-links">
              {brandTypes.map((brandType, index) => (
                <div
                  key={index}
                  className="sidebar-main-link"
                  onClick={() => handleLinkClick("brandType", brandType)}
                >
                  {brandType}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="item-page-container">
        {!isSmallScreen && (
          <div className="desktop-results-title">
            {t("search_results")}
          </div>
        )}

        <div className="search-results-container">
          {items.map((itemData) => {
  const { itemId, id, item = {}, details = {} } = itemData;

  const name =
    item.name ||
    details.itemName ||
    itemData.name ||
    "Unnamed item";

  const usdPrice = parseFloat(item.usdPrice || details.usdText || 0);
  const originalPrice = parseFloat(
    item.originalPrice || details.originalPrice || 0
  );

  const sold = item.sold || details.soldText || "0";
  const numericSold = Number(sold) || 0;
const isBestSeller = id === bestSellerId;
  const cryptocurrency = item.cryptocurrency || details.currencyText || "";
  const crypto = String(cryptocurrency || "").toUpperCase();

  const reductionPercentage =
    originalPrice > 0 && usdPrice >= 0 && usdPrice < originalPrice
      ? Math.round(((originalPrice - usdPrice) / originalPrice) * 100)
      : 0;

  const reviewsData = reviews[itemId] || {};
  const finalRating = reviewsData?.averageRating || t("no_rating");

  const itemPriceInCrypto = usdPrice ? usdPrice.toFixed(2) : "0.00";

  const normalizedVideos = Array.isArray(item.videos)
    ? item.videos
    : item.videos
    ? [item.videos]
    : [];

  const firstVideoUrl = normalizedVideos.find(
    (video) => typeof video === "string" && video.endsWith(".mp4")
  );

 const firstImage = getDisplayImage(itemData);
const colorOptions = getColorOptions(itemData);
const selectedColor = selectedColorByItem[id];

  return (
    <div key={id} className="item-card">
      <div className="item-media-box">
        <div className={`item-badge ${isBestSeller ? "item-badge-best" : "item-badge-top"}`}>
        {isBestSeller ? t("best_seller") : t("topIt")}
      </div>
        {activeVideoId === id && firstVideoUrl ? (
          <video
            src={firstVideoUrl}
            controls
            autoPlay
            onEnded={handleVideoStop}
            style={{ width: "100%", height: "230px", objectFit: "contain" }}
          />
        ) : (
          <>
            <img
              className="item-image"
              src={firstImage}
              onClick={() => handleItemClick(id)}
              alt={name}
              style={{ width: "100%", height: "230px", objectFit: "contain" }}
            />
            {firstVideoUrl && (
             <button
              type="button"
              className="play-button"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoPlay(id);
              }}
              aria-label="Play product video"
            >
              ▶
            </button>
            )}
          </>
        )}
      </div>

    <div onClick={() => handleItemClick(id)} className="item-details">

      {colorOptions.length > 0 && (
  <div className="item-color-block">
    <div className="item-color-label">
      {t("color")}: <span>{selectedColor}</span>
    </div>

    <div className="item-color-options">
      {colorOptions.map((color) => (
        <button
          key={color}
          type="button"
          className={`item-color-circle ${
            selectedColor === color ? "active" : ""
          }`}
          onClick={(e) => handleColorSelect(id, color, e)}
          title={color}
          aria-label={`Select ${color} color`}
          style={{
            background: getColorSwatch(color),
          }}
        />
      ))}
    </div>
  </div>
)}
  <div className="item-name" title={name}>
    {name.length > 40 ? `${name.substring(0, 40)}...` : name}
  </div>

  <div className="item-prices">
    <div className="item-price-row">
      <span className="item-price">${itemPriceInCrypto}</span>

      {originalPrice > 0 && (
        <span className="item-original-price">
          ${originalPrice.toFixed(2)}
        </span>
      )}

      {reductionPercentage > 0 && (
        <span className="item-reduction">
          -{reductionPercentage}% off
        </span>
      )}
    </div>

    <div className="item-crypto">
      <img
        src={coinImages[crypto] || "/path/to/placeholder.jpg"}
        alt={cryptocurrency}
        className="crypto-icon"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/path/to/placeholder.jpg";
        }}
      />
      <span className="item-crypto-price">
        {`${itemPriceInCrypto} ${cryptocurrency}`}
      </span>
    </div>
  </div>

  <div className="item-meta-row">
    <span className="item-sold">
      {sold} <span className="sold-label">{t("sold")}</span>
    </span>
  </div>

  <div
    className="item-type-stars"
    onClick={(e) => {
      e.stopPropagation();
      setItemData(itemData);
      router.push("/reviewPage");
    }}
    title={t("view_reviews")}
  >
    {finalRating
      ? "★".repeat(Math.round(finalRating)) +
        "☆".repeat(5 - Math.round(finalRating))
      : t("no_rating")}
  </div>

  <button
    type="button"
    className="add-to-basket-btn"
    onClick={(e) => {
      e.stopPropagation();
      setItemData(itemData);
    }}
  >
    {t("add_to_basket")}
  </button>
</div>
</div>
  );
})}
        </div>
      </main>
    </div>
  );
}

export default ItemPage;