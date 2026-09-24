"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./recomendedItem.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { AppContext } from "./appContext";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

const BASE_URL = "https://api.malidag.com";

const MAX_DISPLAY_ITEMS = 30;
const MAX_CACHE_ITEMS = 20;
const CACHE_TTL = 1000 * 60 * 30;

function ShoeRecommended() {
  const router = useRouter();
  const { country } = useContext(AppContext);
  const { t } = useTranslation();

  const countryCode = country?.code?.toLowerCase() || "fr";

  const currentLang = isSupportedLanguage(i18n.language)
    ? i18n.language
    : "en";

  const currencyConfig = useMemo(
    () => getCountryConfig(country?.name || ""),
    [country?.name]
  );

  /*
   * IMPORTANT:
   * Cache must be country-specific.
   *
   * We do NOT want products fetched for France appearing from
   * localStorage when the customer switches to Brazil or the UK.
   */
  const cacheKey = useMemo(
    () => `recommended_shoes_${countryCode}`,
    [countryCode]
  );

  const [recommendedItems, setRecommendedItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [rates, setRates] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const reviewRequestsRef = useRef(new Set());
  const translationRequestsRef = useRef(new Set());

  /*
   * Country-aware routes
   */
  const withCountry = useCallback(
    (path) => {
      if (!path) return `/${countryCode}`;

      const cleanPath = path.replace(
        /^\/(fr|gb|br|us|de|ie|au|be)(\/|$)/,
        "/"
      );

      return `/${countryCode}${
        cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`
      }`;
    },
    [countryCode]
  );

  /*
   * Reviews
   */
  const fetchReviews = useCallback(async (productId) => {
    if (!productId) return;

    if (reviewRequestsRef.current.has(productId)) {
      return;
    }

    reviewRequestsRef.current.add(productId);

    try {
      const response = await axios.get(
        `${BASE_URL}/get-reviews/${encodeURIComponent(productId)}`
      );

      if (response.data?.success) {
        const reviewsArray = Array.isArray(response.data.reviews)
          ? response.data.reviews
          : [];

        const totalRating = reviewsArray.reduce((total, review) => {
          const rating = Number(review?.rating);

          return total + (Number.isFinite(rating) ? rating : 0);
        }, 0);

        const averageRating =
          reviewsArray.length > 0
            ? totalRating / reviewsArray.length
            : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating,
            count: reviewsArray.length,
          },
        }));
      } else {
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating: null,
            count: 0,
          },
        }));
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating: null,
            count: 0,
          },
        }));
      } else {
        console.error(
          `Error fetching reviews for ${productId}:`,
          error
        );
      }
    } finally {
      reviewRequestsRef.current.delete(productId);
    }
  }, []);

  /*
   * Product translations
   *
   * English is the original product data, so we don't call
   * the translation API for English.
   */
  const fetchTranslation = useCallback(async (itemId, lang) => {
    if (!itemId || lang === "en") return;

    const requestKey = `${itemId}_${lang}`;

    if (translationRequestsRef.current.has(requestKey)) {
      return;
    }

    translationRequestsRef.current.add(requestKey);

    try {
      const response = await axios.get(
        `${BASE_URL}/translate/product/translate/${encodeURIComponent(
          itemId
        )}/${encodeURIComponent(lang)}`
      );

      const translatedProduct = response.data?.translation || {};

      setTranslations((prev) => ({
        ...prev,
        [itemId]: {
          ...(prev[itemId] || {}),
          [lang]: translatedProduct,
        },
      }));
    } catch (error) {
      console.error(
        `Translation fetch error for ${itemId}:`,
        error
      );
    } finally {
      translationRequestsRef.current.delete(requestKey);
    }
  }, []);

  /*
   * Load reviews + translations for a collection of products.
   */
  const hydrateItems = useCallback(
    async (items) => {
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      await Promise.all(
        items.map((product) => {
          const itemId = product?.itemId;

          if (!itemId) return Promise.resolve();

          return Promise.all([
            fetchReviews(itemId),
            fetchTranslation(itemId, currentLang),
          ]);
        })
      );
    },
    [currentLang, fetchReviews, fetchTranslation]
  );

  /*
   * Currency rates
   */
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

  const getCurrencyRate = useCallback(() => {
    if (!currencyConfig || !rates) return null;

    if (currencyConfig.currency === "USD") {
      return 1;
    }

    const rate = Number(
      rates?.[currencyConfig.currency]
    );

    return Number.isFinite(rate) && rate > 0
      ? rate
      : null;
  }, [currencyConfig, rates]);

  const convertUsd = useCallback(
    (usdAmount) => {
      const amount = Number(usdAmount);

      if (!Number.isFinite(amount)) {
        return null;
      }

      const rate = getCurrencyRate();

      if (!rate) {
        return null;
      }

      return amount * rate;
    },
    [getCurrencyRate]
  );

  const formatPrice = useCallback(
    (usdAmount) => {
      const converted = convertUsd(usdAmount);

      if (converted === null || !currencyConfig) {
        return t("price_unavailable");
      }

      return `${currencyConfig.symbol}${converted.toFixed(2)}`;
    },
    [convertUsd, currencyConfig, t]
  );

  /*
   * Country-specific cache
   */
  const readCache = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = localStorage.getItem(cacheKey);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      if (
        !parsed?.timestamp ||
        !Array.isArray(parsed?.items) ||
        Date.now() - parsed.timestamp > CACHE_TTL
      ) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.items;
    } catch (error) {
      console.error(
        "Error reading recommended cache:",
        error
      );

      return null;
    }
  }, [cacheKey]);

  const writeCache = useCallback(
    (items) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            items: items.slice(0, MAX_CACHE_ITEMS),
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error(
          "Error writing recommended cache:",
          error
        );
      }
    },
    [cacheKey]
  );

  /*
   * Products
   */
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoadingRecommendations(true);

      /*
       * Show country-specific cache immediately if available.
       */
      const cachedItems = readCache();

      if (cachedItems?.length) {
        setRecommendedItems(cachedItems);
        setLoadingRecommendations(false);

        hydrateItems(cachedItems).catch((error) => {
          console.error(
            "Error hydrating cached recommended products:",
            error
          );
        });
      }

      try {
        const response = await axios.get(
          `${BASE_URL}/items?country=${encodeURIComponent(
            countryCode
          )}`
        );

        if (cancelled) return;

        const itemsArray = Array.isArray(response.data?.items)
          ? response.data.items
          : Array.isArray(response.data)
          ? response.data
          : [];

        /*
         * Recommended shoes:
         * - category must be shoes
         * - canonical USD price between $1 and $50
         *
         * No cryptocurrency filtering.
         */
        const filteredItems = itemsArray.filter((product) => {
          const category = String(
            product?.category || ""
          )
            .trim()
            .toLowerCase();

          const usdPrice = Number(
            product?.item?.usdPrice ?? 0
          );

          return (
            category === "shoes" &&
            Number.isFinite(usdPrice) &&
            usdPrice >= 1 &&
            usdPrice <= 100
          );
        });

        /*
         * Randomize the eligible products.
         */
        const shuffledItems = [...filteredItems].sort(
          () => Math.random() - 0.5
        );

        const selectedItems = shuffledItems.slice(
          0,
          MAX_DISPLAY_ITEMS
        );

        if (cancelled) return;

        setRecommendedItems(selectedItems);

        writeCache(selectedItems);

        await hydrateItems(selectedItems);
      } catch (error) {
        console.error(
          "Error fetching recommended items:",
          error
        );

        /*
         * Keep cached products on screen if the fresh request fails.
         */
        if (!cancelled && !cachedItems?.length) {
          setRecommendedItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRecommendations(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [
    countryCode,
    readCache,
    writeCache,
    hydrateItems,
  ]);

  /*
   * When language changes, translate the products already
   * displayed without needing to refetch the product catalog.
   */
  useEffect(() => {
    if (currentLang === "en") return;
    if (!recommendedItems.length) return;

    recommendedItems.forEach((product) => {
      if (product?.itemId) {
        fetchTranslation(
          product.itemId,
          currentLang
        );
      }
    });
  }, [
    currentLang,
    recommendedItems,
    fetchTranslation,
  ]);

  const getProductName = useCallback(
    (product) => {
      const itemId = product?.itemId;
      const originalName =
        product?.item?.name ||
        t("fashion_item");

      if (currentLang === "en") {
        return originalName;
      }

      return (
        translations?.[itemId]?.[currentLang]?.name ||
        translations?.[itemId]?.[currentLang]?.itemName ||
        originalName
      );
    },
    [translations, currentLang, t]
  );

  const handleItemClick = useCallback(
    (id) => {
      if (!id) return;

      router.push(
        withCountry(`/product/${id}`)
      );
    },
    [router, withCountry]
  );

  const renderStars = (rating) => {
    const rounded = Math.max(
      0,
      Math.min(
        5,
        Math.round(Number(rating) || 0)
      )
    );

    return (
      <>
        {"★".repeat(rounded)}
        {"☆".repeat(5 - rounded)}
      </>
    );
  };

  return (
    <div className="recommended-items-container">

       <div className="fashionkick-section-header">
      <span>{t("fashionkick_picked_from_style")}</span>
    </div>
    
      <div className="recommended-grid">
        {loadingRecommendations &&
        recommendedItems.length === 0 ? (
          Array.from({ length: 8 }).map((_, index) => (
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
        ) : recommendedItems.length === 0 ? null : (
          recommendedItems.map((product) => {
            const itemId = product?.itemId;
            const rawItem = product?.item || {};

            const reviewData = reviews[itemId];

            const averageRating =
              reviewData?.averageRating;

            const reviewCount =
              reviewData?.count || 0;

            const productName =
              getProductName(product);

            const currentPrice = Number(
              rawItem?.usdPrice ?? 0
            );

            return (
              <div
                className="recommended-item"
                key={product?.id || itemId}
              >
                <div className="rec-img">
                  <img
                    src={
                      rawItem?.images?.[0] ||
                      "/fallback.png"
                    }
                    alt={productName}
                    className="recommended-image"
                    loading="lazy"
                    onClick={() =>
                      handleItemClick(product?.id)
                    }
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/fallback.png";
                    }}
                  />
                </div>

                <div className="recommended-info">
                  <p
                    className="recommended-name"
                    onClick={() =>
                      handleItemClick(product?.id)
                    }
                  >
                    {productName}
                  </p>

                  <div
                    className="item-sta"
                    aria-label={
                      averageRating
                        ? t("rating_out_of_five", {
                            rating:
                              averageRating.toFixed(1),
                          })
                        : t("no_rating")
                    }
                  >
                    {averageRating
                      ? renderStars(averageRating)
                      : t("no_rating")}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "6px",
                    }}
                  >
                    {averageRating
                      ? t("recommended_review_summary", {
                          rating:
                            averageRating.toFixed(1),
                          count: reviewCount,
                        })
                      : t("no_reviews_yet")}
                  </div>

                  <div className="recommended-price">
                    {formatPrice(currentPrice)}
                  </div>

                  <button
                    type="button"
                    className="recommended-view-btn"
                    onClick={() =>
                      handleItemClick(product?.id)
                    }
                  >
                    {t("fashionkick_view_product")}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ShoeRecommended;