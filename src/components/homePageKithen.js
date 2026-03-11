"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./homePageKithen.css";
import useScreenSize from "./useIsMobile";
import languages from "@/i18nLanguages";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "./checkoutStore";
import Head from "next/head";

function ItemHomePage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});

  const {
    isMobile,
    isTablet,
    isSmallMobile,
    isVerySmall,
    isVeryVerySmall,
  } = useScreenSize();

  const router = useRouter();
  const { t } = useTranslation();
  const { setItemData } = useCheckoutStore();

  const baseUrl = "https://www.malidag.com";
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const stableCoinMap = {
    usdt: {
      label: "USDT",
      image: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
    },
    usdc: {
      label: "USDC",
      image: "https://api.malidag.com/learn/videos/1769909942070-0xaf88d065e77c8cc2239327c5edb3a432268e5831.png",
    },
    busd: {
      label: "BUSD",
      image: "https://cryptologos.cc/logos/binance-usd-busd-logo.png",
    },
  };

  const fetchTranslation = async (productId, lang) => {
    if (translations[productId]?.[lang]) return;

    try {
      const response = await axios.get(
        `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
      );

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: response.data.translation,
        },
      }));
    } catch (error) {
      console.error(`Translation fetch error for ${productId}:`, error.message);
    }
  };

  const fetchReviews = async (productId) => {
    if (!productId) return;

    try {
      const response = await axios.get(
        `https://api.malidag.com/get-reviews/${productId}`
      );

      if (response.data?.success) {
        const reviewsArray = Array.isArray(response.data.reviews)
          ? response.data.reviews
          : [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = Number(review?.rating);
          return acc + (Number.isNaN(rating) ? 0 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? totalRating / reviewsArray.length
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating,
            count: reviewsArray.length,
            reviewsArray,
          },
        }));
      } else {
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating: null,
            count: 0,
            reviewsArray: [],
          },
        }));
      }
    } catch (error) {
      setReviews((prev) => ({
        ...prev,
        [productId]: {
          averageRating: null,
          count: 0,
          reviewsArray: [],
        },
      }));
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`https://api.malidag.com/items/`);
        const fetchedItems = response.data || [];

        const filteredItems = fetchedItems.filter(
          (item) => item?.item?.genre === "home"
        );

        setItems(filteredItems);

        for (const product of filteredItems) {
          const productId = product.itemId;
          const lang = i18n.language || "en";
          fetchTranslation(productId, lang);
          fetchReviews(productId);
        }

        const uniqueCategories = [
          ...new Set(filteredItems.map((item) => item.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    if (!items.length) return;

    const lang = i18n.language || "en";

    items.forEach((product) => {
      fetchTranslation(product.itemId, lang);
    });
  }, [i18n.language, items]);

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

  const renderStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

  if (loading) {
    return <div className="loading-message">{t("loading")}</div>;
  }

  return (
    <div className="kitchen-page-wrapper">
      <Head>
        <link rel="canonical" href={`${baseUrl}${currentPath}`} />

        {languages.map((lang) => (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={`${baseUrl}/${lang}${currentPath}`}
          />
        ))}

        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${baseUrl}/en${currentPath}`}
        />

        <meta property="og:title" content="Home & Kitchen - Malidag" />
        <meta
          property="og:description"
          content="Explore quality home & kitchen items at Malidag. Available in 107 languages."
        />
        <meta property="og:url" content={`${baseUrl}${currentPath}`} />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://www.malidag.com/og-image.jpg"
        />
      </Head>

      <div className="kitchen-hero">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2Fsteptodown.com479163.jpg?alt=media&token=0abc0129-3e54-4b9c-ba3d-ed4d9e61e960"
          alt="home and kitchen page"
          className="kitchen-hero-image"
        />
        <div className="kitchen-hero-overlay">
          <h1>{t("home_and_kitchen") || "Home & Kitchen"}</h1>
          <p>
            {t("discover_amazing_products") ||
              "Beautiful essentials for your home."}
          </p>
        </div>
      </div>

      <div
        className="kitchen-items-grid"
        style={{
          gridTemplateColumns: isVeryVerySmall
            ? "repeat(1, 1fr)"
            : isVerySmall
            ? "repeat(2, 1fr)"
            : isSmallMobile
            ? "repeat(2, 1fr)"
            : isMobile
            ? "repeat(2, 1fr)"
            : isTablet
            ? "repeat(3, 1fr)"
            : "repeat(4, 1fr)",
        }}
      >
        {items.map((itemData) => {
          const { itemId, id, item } = itemData;
          const { name, usdPrice, originalPrice, sold, videos, cryptocurrency } =
            item;

          const reviewsData = reviews[itemId] || {};
          const finalRating = reviewsData?.averageRating || 0;
          const reviewCount = reviewsData?.count || 0;

          const normalizedVideos = Array.isArray(videos) ? videos : [videos];
          const firstVideoUrl = normalizedVideos.find(
            (video) => typeof video === "string" && video.endsWith(".mp4")
          );

          const translated = translations[itemId]?.[i18n.language];
          const productName = translated?.name || name;

          const handleReviewClick = (data) => {
            setItemData(data);
            router.push("/reviewPage");
          };

          const normalizedCrypto = String(cryptocurrency || "").toLowerCase();
          const stableCoin = stableCoinMap[normalizedCrypto];

          return (
            <div key={id} className="kitchen-card">
              <div className="kitchen-card-media">
                {activeVideoId === id && firstVideoUrl ? (
                  <video
                    src={firstVideoUrl}
                    controls
                    autoPlay
                    onEnded={handleVideoStop}
                    className="kitchen-card-image"
                  />
                ) : (
                  <>
                    <img
                      className="kitchen-card-image"
                      src={item?.images?.[0] || "/placeholder.png"}
                      onClick={() => handleItemClick(id)}
                      alt={name}
                    />
                    {firstVideoUrl && (
                      <button
                        className="video-play-btn"
                        onClick={() => handleVideoPlay(id)}
                        type="button"
                      >
                        ▶
                      </button>
                    )}
                  </>
                )}

                {stableCoin && (
                  <div className="coin-floating-badge">
                    <img
                      src={stableCoin.image}
                      alt={stableCoin.label}
                      className="coin-floating-icon"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span>{stableCoin.label}</span>
                  </div>
                )}
              </div>

              <div
                onClick={() => handleItemClick(id)}
                className="kitchen-card-details"
              >
                <div className="item-name" title={productName}>
                  {productName.length > 42
                    ? `${productName.substring(0, 42)}...`
                    : productName}
                </div>

                <div className="price-row">
                  <span className="item-price">${usdPrice}</span>
                  {originalPrice > 0 && (
                    <span className="item-original-price">
                      ${originalPrice}
                    </span>
                  )}
                </div>

                <div className="sold-row">
                  <span className="item-sold-count">{sold}</span>
                  <span className="item-sold-label">{t("sold")}</span>
                </div>

                {stableCoin && (
                  <div className="accepted-coin-single">
                    <img
                      src={stableCoin.image}
                      alt={stableCoin.label}
                      className="accepted-coin-icon"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="accepted-coin-text">
                      {stableCoin.label}
                    </span>
                  </div>
                )}

                <div
                  className="reviews-row"
                  onClick={() => handleReviewClick(itemData)}
                  title={t("view_reviews")}
                >
                  <span className="item-type-stars">
                    {finalRating ? renderStars(finalRating) : "☆☆☆☆☆"}
                  </span>
                  <span className="review-count-text">
                    {reviewCount > 0 ? `(${reviewCount})` : t("no_rating")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ItemHomePage;