"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./recomendedItem.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { getCountryConfig } from "./countryUtils";

const BASE_URL = "https://api.malidag.com";
const CACHE_KEY = "recommendedItems_first20";
const MAX_CACHE_ITEMS = 20;

function RecommendedItem({ country }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [recommendedItems, setRecommendedItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loadingRecommendations, setLoadingRecommendations] =
    useState(true);

  const [translations, setTranslations] = useState({});
  const [rates, setRates] = useState(null);

  // =========================================================
  // COUNTRY
  // =========================================================

  const countryCode = country.code.toLowerCase();
const countryName = country.name;

  const countryCurrencyConfig = useMemo(
    () => getCountryConfig(countryName),
    [countryName]
  );

  const withCountry = useCallback(
    (path) => {
      if (!path) {
        return `/${countryCode}`;
      }

      const cleanPath = path.replace(
        /^\/(fr|gb|br|us|de|ie|au|be|ir)(\/|$)/,
        "/"
      );

      return `/${countryCode}${
        cleanPath.startsWith("/")
          ? cleanPath
          : `/${cleanPath}`
      }`;
    },
    [countryCode]
  );

  // =========================================================
  // LANGUAGE
  // =========================================================

  const currentLanguage = ["en", "fr", "br"].includes(
    i18n.language
  )
    ? i18n.language
    : "en";

  // =========================================================
  // CURRENCY
  // =========================================================

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/prices/rates`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch rates: ${response.status}`
          );
        }

        const data = await response.json();

        setRates(data?.rates || {});
      } catch (error) {
        console.error(
          "Error fetching exchange rates:",
          error
        );
      }
    };

    fetchRates();
  }, []);

  const convertUsdToLocal = useCallback(
    (usdValue) => {
      const usdPrice = Number(usdValue || 0);

      const currency =
        countryCurrencyConfig?.currency || "USD";

      if (!Number.isFinite(usdPrice)) {
        return 0;
      }

      if (currency === "USD") {
        return usdPrice;
      }

      const rate = Number(rates?.[currency]);

      if (!rate || !Number.isFinite(rate)) {
        return null;
      }

      return usdPrice * rate;
    },
    [rates, countryCurrencyConfig?.currency]
  );

  const renderPrice = useCallback(
    (usdValue) => {
      const localizedValue =
        convertUsdToLocal(usdValue);

      if (localizedValue === null) {
        return "...";
      }

      const symbol =
        countryCurrencyConfig?.symbol || "$";

      return `${symbol}${localizedValue.toFixed(2)}`;
    },
    [
      convertUsdToLocal,
      countryCurrencyConfig?.symbol,
    ]
  );

  // =========================================================
  // REVIEWS
  // =========================================================

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/get-reviews/${productId}`
      );

      if (response.data.success) {
        const reviewsArray =
          response.data.reviews || [];

        const totalRating = reviewsArray.reduce(
          (acc, review) => {
            const rating = parseFloat(review.rating);

            return acc + (isNaN(rating) ? 4 : rating);
          },
          0
        );

        const averageRating = reviewsArray.length
          ? (
              totalRating / reviewsArray.length
            ).toFixed(1)
          : null;

        setReviews((prev) => ({
          ...prev,

          [productId]: {
            averageRating,
            reviewsArray,
          },
        }));
      }
    } catch {
      setReviews((prev) => ({
        ...prev,

        [productId]: {
          averageRating: 4.3,
          reviewsArray: Array(133).fill({
            rating: 4.3,
          }),
          fallback: true,
        },
      }));
    }
  };

  // =========================================================
  // RECOMMENDED ITEMS
  // =========================================================

  useEffect(() => {
    const cacheKey =
      `${CACHE_KEY}_${countryCode}`;

    const loadCachedItems = () => {
      try {
        const cached =
          localStorage.getItem(cacheKey);

        if (!cached) return false;

        const parsed = JSON.parse(cached);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          setRecommendedItems(parsed);
          setLoadingRecommendations(false);

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
          `${BASE_URL}/recommended-items?min=1&max=50&country=${encodeURIComponent(
            countryCode
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch recommendations: ${response.status}`
          );
        }

        const data = await response.json();

        const freshItems = data?.items || [];

        setRecommendedItems(freshItems);

        localStorage.setItem(
          cacheKey,
          JSON.stringify(
            freshItems.slice(
              0,
              MAX_CACHE_ITEMS
            )
          )
        );
      } catch (error) {
        console.error(
          "Error fetching recommended items:",
          error
        );
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadCachedItems();
    fetchRecommendedItems();
  }, [countryCode]);

  // =========================================================
  // FETCH REVIEWS
  // =========================================================

  useEffect(() => {
    recommendedItems.forEach((item) => {
      if (
        item?.itemId &&
        !reviews[item.itemId]
      ) {
        fetchReviews(item.itemId);
      }
    });
  }, [recommendedItems, reviews]);

  // =========================================================
  // PRODUCT TRANSLATIONS
  // =========================================================

  useEffect(() => {
    if (!recommendedItems.length) return;

    if (currentLanguage === "en") {
      setTranslations({});
      return;
    }

    let cancelled = false;

    const fetchTranslations = async () => {
      try {
        const results = await Promise.all(
          recommendedItems.map(async (item) => {
            const productId = String(
              item?.itemId || ""
            ).trim();

            if (!productId) return null;

            try {
              const response = await fetch(
                `${BASE_URL}/translate/product/translate/${productId}/${currentLanguage}`,
                {
                  cache: "no-store",
                }
              );

              if (!response.ok) {
                return null;
              }

              const data =
                await response.json();

              return [
                productId,
                data?.translation || null,
              ];
            } catch (error) {
              console.error(
                `Translation fetch failed for ${productId}:`,
                error
              );

              return null;
            }
          })
        );

        if (cancelled) return;

        const nextTranslations = {};

        results.forEach((result) => {
          if (!result) return;

          const [productId, translation] =
            result;

          if (translation) {
            nextTranslations[productId] =
              translation;
          }
        });

        setTranslations(nextTranslations);
      } catch (error) {
        console.error(
          "Error fetching recommended translations:",
          error
        );
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

  // =========================================================
  // HELPERS
  // =========================================================

  const handleItemClick = (id) => {
    if (!id) return;

    router.push(
      withCountry(`/product/${id}`)
    );
  };

  const getProductName = (item) => {
    const productId = String(
      item?.itemId || ""
    ).trim();

    return (
      translations?.[productId]?.name ||
      item?.item?.name ||
      t("recommended_item")
    );
  };

  const getStockText = (item) => {
    const stock = Number(
      item?.details?.numberItemText ||
        item?.item?.numberOfItems
    );

    if (!stock || stock >= 100) {
      return null;
    }

    return t("only_left_in_stock", {
      count: stock,
    });
  };

  const getSoldText = (item) => {
    const sold = Number(
      item?.item?.sold ||
        item?.details?.soldText
    );

    if (!sold || sold <= 0) {
      return null;
    }

    return t("sold_count", {
      count: sold,
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="recommended-items-container">
      <h2 className="recommended-title">
        {t("recommended_products")}
      </h2>

      <div className="recommended-grid">
        {loadingRecommendations &&
        recommendedItems.length === 0 ? (
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="recommended-item skeleton-card"
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
            const productName =
              getProductName(item);

            const ratingObj =
              reviews[item.itemId];

            const averageRating =
              ratingObj?.averageRating || 4.3;

            const reviewCount =
              ratingObj?.reviewsArray?.length ||
              133;

            const roundedRating =
              Math.round(averageRating);

            const stockText =
              getStockText(item);

            const soldText =
              getSoldText(item);

            const usdPrice = Number(
              item?.item?.usdPrice ??
                item?.item?.price ??
                0
            );

            return (
              <div
                className="recommended-item"
                key={
                  item.id ||
                  item.itemId
                }
              >
                <div
                  className="rec-img"
                  onClick={() =>
                    handleItemClick(item.id)
                  }
                >
                  <img
                    src={
                      item.item?.images?.[0] ||
                      "/fallback.png"
                    }
                    alt={productName}
                    className="recommended-image"
                  />
                </div>

                <div className="recommended-info">
                  <p
                    onClick={() =>
                      handleItemClick(item.id)
                    }
                    className="recommended-name"
                  >
                    {productName}
                  </p>

                  <div className="item-sta">
                    {"★".repeat(roundedRating)}
                    {"☆".repeat(
                      5 - roundedRating
                    )}

                    <span className="review-count">
                      {" "}
                      ({reviewCount}{" "}
                      {t("reviews")})
                    </span>
                  </div>

                  {soldText && (
                    <div className="recommended-sold">
                      {soldText}
                    </div>
                  )}

                  {stockText && (
                    <div className="recommended-stock">
                      {stockText}
                    </div>
                  )}

                  <div className="recommended-price">
                    {renderPrice(usdPrice)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RecommendedItem;