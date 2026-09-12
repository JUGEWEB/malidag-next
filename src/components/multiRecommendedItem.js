"use client";

import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./recomendedItem.css";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { AppContext } from "./appContext";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

const BASE_URL = "https://api.malidag.com";
const MAX_CACHE_ITEMS = 20;

function MultiRecommendedItem({
  category,
  type,
  title,
  minPrice = 1,
  maxPrice = 300000,
}) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { country } = useContext(AppContext);

  const [recommendedItems, setRecommendedItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [rates, setRates] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const countryCode =
    country?.code?.toLowerCase() || null;

  const currentLanguage =
    isSupportedLanguage(i18n.language)
      ? i18n.language
      : "en";

  const currencyConfig = useMemo(
    () => getCountryConfig(country?.name || ""),
    [country?.name]
  );

  const normalizedCategory =
    category?.toLowerCase?.() || "";

  const normalizedType =
    type?.toLowerCase?.() || "";

 const CACHE_KEY =
  `recommendedItems_${countryCode}_${normalizedCategory}_${normalizedType}_first20`;

  const withCountry = (path) => {
    if (!countryCode) return "/";

    if (!path) {
      return `/${countryCode}`;
    }

    return `/${countryCode}${
      path.startsWith("/")
        ? path
        : `/${path}`
    }`;
  };

  const renderStars = (rating) => {
    const rounded = Math.max(
      0,
      Math.min(5, Math.round(Number(rating) || 0))
    );

    return (
      "★".repeat(rounded) +
      "☆".repeat(5 - rounded)
    );
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/prices/rates`
        );

        setRates(
          response.data?.rates ||
          response.data ||
          null
        );
      } catch (error) {
        console.error(
          "Failed to fetch currency rates:",
          error
        );

        setRates(null);
      }
    };

    fetchRates();
  }, []);

  const getCurrencyRate = () => {
    if (!currencyConfig || !rates) {
      return null;
    }

    if (currencyConfig.currency === "USD") {
      return 1;
    }

    const rate = Number(
      rates?.[currencyConfig.currency]
    );

    return Number.isFinite(rate) && rate > 0
      ? rate
      : null;
  };

  const formatPrice = (usdAmount) => {
    const amount = Number(usdAmount);

    if (!Number.isFinite(amount)) {
      return t("price_unavailable");
    }

    const rate = getCurrencyRate();

    if (rate === null || !currencyConfig) {
      return t("price_unavailable");
    }

    const converted = amount * rate;

    return `${currencyConfig.symbol}${converted.toFixed(2)}`;
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/get-reviews/${productId}`
      );

      const reviewsArray = Array.isArray(
        response.data?.reviews
      )
        ? response.data.reviews
        : [];

      const totalRating = reviewsArray.reduce(
        (acc, review) => {
          const rating = parseFloat(review?.rating);

          return acc + (
            Number.isNaN(rating)
              ? 4
              : rating
          );
        },
        0
      );

      const averageRating =
        reviewsArray.length > 0
          ? (
              totalRating /
              reviewsArray.length
            ).toFixed(2)
          : null;

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          averageRating,
          count: reviewsArray.length,
          reviewsArray,
        },
      }));
    } catch (error) {
      if (error?.response?.status === 404) {
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating: null,
            count: 0,
            reviewsArray: [],
          },
        }));
      } else {
        console.error(
          "Error fetching reviews:",
          error
        );
      }
    }
  };

  useEffect(() => {
  if (
    !countryCode ||
    !normalizedCategory ||
    !normalizedType
  ) {
    setRecommendedItems([]);
    setLoadingRecommendations(false);
    return;
  }

  let cancelled = false;

  const loadCachedItems = () => {
    try {
      const cached =
        localStorage.getItem(CACHE_KEY);

      if (!cached) return false;

      const parsed = JSON.parse(cached);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0
      ) {
        setRecommendedItems(parsed);
        setLoadingRecommendations(false);

        Promise.all(
          parsed.map((item) => {
            const productId = item?.itemId;

            return productId
              ? fetchReviews(productId)
              : Promise.resolve();
          })
        ).catch((error) => {
          console.error(
            "Error fetching cached reviews:",
            error
          );
        });

        return true;
      }
    } catch (error) {
      console.error(
        "Error reading recommended cache:",
        error
      );
    }

    return false;
  };

  const fetchRecommendedItems = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/items/${encodeURIComponent(
          normalizedCategory
        )}?country=${encodeURIComponent(
          countryCode
        )}`
      );

      if (!response.ok) {
        throw new Error(
          `Recommended items request failed: ${response.status}`
        );
      }

      const data = await response.json();

      const itemsArray =
        Array.isArray(data?.items)
          ? data.items
          : [];

      const filteredItems =
        itemsArray.filter((item) => {
          const price = Number(
            item?.item?.usdPrice ?? 0
          );

          const itemType =
            item?.details?.type || "";

          return (
            itemType.toLowerCase() ===
              normalizedType &&
            price >= minPrice &&
            price <= maxPrice
          );
        });

      const shuffledItems =
        [...filteredItems].sort(
          () => 0.5 - Math.random()
        );

      const selectedItems =
        shuffledItems.slice(0, 30);

      if (cancelled) return;

      setRecommendedItems(selectedItems);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(
          selectedItems.slice(
            0,
            MAX_CACHE_ITEMS
          )
        )
      );

      await Promise.all(
        selectedItems.map((item) => {
          const productId = item?.itemId;

          return productId
            ? fetchReviews(productId)
            : Promise.resolve();
        })
      );
    } catch (error) {
      console.error(
        "Error fetching recommended items:",
        error
      );

      if (!cancelled) {
        setRecommendedItems([]);
      }
    } finally {
      if (!cancelled) {
        setLoadingRecommendations(false);
      }
    }
  };

  const hasCache = loadCachedItems();

  if (!hasCache) {
    setRecommendedItems([]);
    setLoadingRecommendations(true);
  }

  fetchRecommendedItems();

  return () => {
    cancelled = true;
  };
}, [
  countryCode,
  normalizedCategory,
  normalizedType,
  minPrice,
  maxPrice,
  CACHE_KEY,
]);

  useEffect(() => {
    if (!recommendedItems.length) {
      return;
    }

    if (currentLanguage === "en") {
      setTranslations({});
      return;
    }

    let cancelled = false;

    const fetchTranslations = async () => {
      const results = {};

      await Promise.all(
        recommendedItems.map(
          async (item) => {
            const productId =
              item?.itemId;

            if (!productId) return;

            try {
              const response =
                await axios.get(
                  `${BASE_URL}/translate/product/translate/${productId}/${currentLanguage}`
                );

              if (
                response.data?.translation
              ) {
                results[productId] =
                  response.data.translation;
              }
            } catch (error) {
              console.error(
                `Failed to translate product ${productId}:`,
                error
              );
            }
          }
        )
      );

      if (!cancelled) {
        setTranslations(results);
      }
    };

    fetchTranslations();

    return () => {
      cancelled = true;
    };
  }, [
    recommendedItems,
    currentLanguage,
  ]);

  const getTranslatedName = (item) => {
    const productId = item?.itemId;

    const originalName =
      item?.item?.name ||
      t("unnamed_item");

    if (currentLanguage === "en") {
      return originalName;
    }

    return (
      translations?.[productId]?.name ||
      originalName
    );
  };

  const handleItemClick = (id) => {
    if (!id) return;

    router.push(
      withCountry(`/product/${id}`)
    );
  };

  const displayTitle =
    title ||
    t("recommended_type", {
      type:
        type ||
        t("products"),
    });

    if (
  !loadingRecommendations &&
  recommendedItems.length === 0
) {
  return null;
}

  return (
    <div className="recommended-items-container">
      <h2 className="recommended-title">
        {displayTitle}
      </h2>

      <div className="recommended-grid">
        {loadingRecommendations &&
        recommendedItems.length === 0 ? (
          [...Array(8)].map((_, index) => (
            <div
              className="recommended-item skeleton-card"
              key={index}
            >
              <div className="rec-img skeleton-image" />

              <div className="recommended-info">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))
        ) : (
          recommendedItems.map((item) => {
            const productId =
              item?.itemId;

            const itemId =
              item?.id;

            const productName =
              getTranslatedName(item);

            const reviewData =
              reviews[productId];

            const averageRating =
              reviewData?.averageRating;

            const reviewCount =
              reviewData?.count || 0;

            const price =
              item?.item?.usdPrice;

            return (
              <div
                className="recommended-item"
                key={itemId || productId}
              >
                <div className="rec-img">
                  <img
                    src={
                      item?.item?.images?.[0] ||
                      "/fallback.png"
                    }
                    alt={productName}
                    className="recommended-image"
                    onClick={() =>
                      handleItemClick(itemId)
                    }
                  />
                </div>

                <div className="recommended-info">
                  <p
                    className="recommended-name"
                    onClick={() =>
                      handleItemClick(itemId)
                    }
                  >
                    {productName}
                  </p>

                  {reviewCount > 0 && (
                    <>
                      <div className="item-sta">
                        {renderStars(
                          averageRating
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: "6px",
                        }}
                      >
                        {t("rating_reviews", {
                          rating:
                            averageRating,
                          count:
                            reviewCount,
                        })}
                      </div>
                    </>
                  )}

                  {price != null && (
                    <div className="recommended-price">
                      {formatPrice(price)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MultiRecommendedItem;