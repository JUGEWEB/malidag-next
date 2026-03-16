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
            const { itemId, id, item } = itemData;
            const { name, usdPrice, originalPrice, cryptocurrency, sold, videos } = item;
            const crypto = String(cryptocurrency || "").toUpperCase();

            const reviewsData = reviews[itemId] || {};
            const finalRating = reviewsData?.averageRating || t("no_rating");

            const itemPriceInCrypto = usdPrice ? Number(usdPrice).toFixed(2) : "0.00";

            const normalizedVideos = Array.isArray(videos) ? videos : [videos];
            const firstVideoUrl = normalizedVideos.find(
              (video) => typeof video === "string" && video.endsWith(".mp4")
            );

            return (
              <div key={id} className="item-card">
                <div className="item-media-box">
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
                        src={item.images[0]}
                        onClick={() => handleItemClick(id)}
                        alt={name}
                        style={{ width: "100%", height: "230px", objectFit: "contain" }}
                      />
                      {firstVideoUrl && (
                        <div className="play-button" onClick={() => handleVideoPlay(id)}>
                          ▶️
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div onClick={() => handleItemClick(id)} className="item-details">
                  <div className="item-name" title={name}>
                    {name.length > 20 ? `${name.substring(0, 20)}...` : name}
                  </div>

                  <div className="item-prices">
                    <div className="item-price-row">
                      <span className="item-price">${usdPrice}</span>
                      {originalPrice > 0 && (
                        <span className="item-original-price">${originalPrice}</span>
                      )}
                      <span className="item-sold">
                        {sold} <span className="sold-label">{t("sold")}</span>
                      </span>
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