"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./recomendedItem.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { getCountryConfig } from "./countryUtils";
import Image from "next/image";

const BASE_URL = "https://api.malidag.com";
const CACHE_KEY = "recommendedItems_first20";
const MAX_CACHE_ITEMS = 20;

function RecommendedItem({ country }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [recommendedItems, setRecommendedItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const reviewRequestsRef = useRef(new Set());
  const [loadingRecommendations, setLoadingRecommendations] =
    useState(true);

  const [translations, setTranslations] = useState({});
  const [rates, setRates] = useState(null);
  const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const [loadMoreError, setLoadMoreError] = useState(false);

const loadMoreRef = useRef(null);
const fetchingRef = useRef(false);
const requestRef = useRef(null);
const generationRef = useRef(0);

const [isPhone, setIsPhone] = useState(false);

useEffect(() => {
  const media = window.matchMedia("(max-width: 767px)");

  const updateScreenSize = () => setIsPhone(media.matches);

  updateScreenSize();

  media.addEventListener("change", updateScreenSize);

  return () => {
    media.removeEventListener("change", updateScreenSize);
  };
}, []);

const batchSize = isPhone ? 4 : 8;

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
  if (!productId) return;

  if (reviewRequestsRef.current.has(productId)) return;

reviewRequestsRef.current.add(productId);

  try {
    const response = await axios.get(
      `${BASE_URL}/get-reviews/${encodeURIComponent(productId)}`
    );

    const reviewsArray =
      response.data?.success &&
      Array.isArray(response.data?.reviews)
        ? response.data.reviews
        : [];

    const validReviews = reviewsArray.filter((review) => {
      const rating = Number(review?.rating);

      return (
        review?.rating !== null &&
        review?.rating !== undefined &&
        review?.rating !== "" &&
        Number.isFinite(rating) &&
        rating >= 1 &&
        rating <= 5
      );
    });

    const averageRating =
      validReviews.length > 0
        ? validReviews.reduce(
            (sum, review) => sum + Number(review.rating),
            0
          ) / validReviews.length
        : null;

    setReviews((prev) => ({
      ...prev,
      [productId]: {
        averageRating,
        reviewsArray,
        count: reviewsArray.length,
        hasValidRating: validReviews.length > 0,
      },
    }));
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error(
        `Error fetching reviews for ${productId}:`,
        error
      );
    }

    setReviews((prev) => ({
      ...prev,
      [productId]: {
        averageRating: null,
        reviewsArray: [],
        count: 0,
        hasValidRating: false,
      },
    }));
  }

  finally {
  reviewRequestsRef.current.delete(productId);
}
};

  // =========================================================
  // RECOMMENDED ITEMS
  // =========================================================

  
const loadNextRecommendations = useCallback(
  async (nextPage, signal, generation) => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;

    if (nextPage === 1) {
      setLoadingRecommendations(true);
    } else {
      setLoadingMore(true);
    }

    setLoadMoreError(false);

    try {
      const response = await axios.get(
        `${BASE_URL}/recommended-items`,
        {
          params: {
            min: 1,
            max: 50,
            country: countryCode,
            page: nextPage,
            limit: batchSize,
          },
          signal,
        }
      );

      if (generation !== generationRef.current) return;

      const incoming = Array.isArray(response.data?.items)
        ? response.data.items
        : [];

      setRecommendedItems((previous) => {
        if (nextPage === 1) return incoming;

        const existingIds = new Set(
          previous.map((item) => String(item.itemId || item.id))
        );

        return [
          ...previous,
          ...incoming.filter(
            (item) =>
              !existingIds.has(String(item.itemId || item.id))
          ),
        ];
      });

      const more = Boolean(
        response.data?.pagination?.hasNextPage
      );

      setHasMore(more);
      setPage(nextPage + 1);

      if (nextPage === 1) {
        localStorage.setItem(
          `${CACHE_KEY}_${countryCode}`,
          JSON.stringify(incoming.slice(0, MAX_CACHE_ITEMS))
        );
      }
    } catch (error) {
      if (
        generation === generationRef.current &&
        !signal.aborted
      ) {
        console.error("Recommended pagination error:", error);
        setLoadMoreError(true);
      }
    } finally {
      if (generation === generationRef.current) {
        fetchingRef.current = false;
        setLoadingRecommendations(false);
        setLoadingMore(false);
      }
    }
  },
  [countryCode, batchSize]
);

useEffect(() => {
  generationRef.current += 1;
  const generation = generationRef.current;

  requestRef.current?.abort();

  const controller = new AbortController();
  requestRef.current = controller;

  fetchingRef.current = false;

  setPage(1);
  setHasMore(true);
  setLoadMoreError(false);
  setLoadingRecommendations(true);
  setRecommendedItems([]);

  loadNextRecommendations(1, controller.signal, generation);

  return () => {
    controller.abort();
    generationRef.current += 1;
    fetchingRef.current = false;
  };
}, [loadNextRecommendations]);

useEffect(() => {
  const target = loadMoreRef.current;

  if (
    !target ||
    loadingRecommendations ||
    loadingMore ||
    !hasMore ||
    loadMoreError
  ) {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (
        entry.isIntersecting &&
        !fetchingRef.current &&
        window.scrollY > 0
      ) {
        observer.disconnect();

        const controller = new AbortController();
        requestRef.current = controller;

        loadNextRecommendations(
          page,
          controller.signal,
          generationRef.current
        );
      }
    },
    {
      root: null,
      rootMargin: "200px",
      threshold: 0,
    }
  );

  observer.observe(target);

  return () => observer.disconnect();
}, [
  page,
  hasMore,
  loadingRecommendations,
  loadingMore,
  loadMoreError,
  loadNextRecommendations,
]);


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
         [...Array(batchSize)].map((_, i) => (
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

           const ratingObj = reviews[item.itemId];

const averageRating = ratingObj?.averageRating ?? null;

const reviewCount = ratingObj?.count ?? 0;

const hasValidRating =
  ratingObj?.hasValidRating === true &&
  reviewCount > 0 &&
  Number.isFinite(averageRating) &&
  averageRating > 0;

const roundedRating = hasValidRating
  ? Math.max(0, Math.min(5, Math.round(averageRating)))
  : 0;

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
                 <Image
                  src={item.item?.images?.[0] || "/fallback.png"}
                  alt={productName}
                  fill
                  sizes="(max-width: 600px) 50vw, 200px"
                  quality={75}
                  loading="lazy"
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

                 {hasValidRating && (
  <div className="item-sta">
    {"★".repeat(roundedRating)}
    {"☆".repeat(5 - roundedRating)}

    <span className="review-count">
      {" "}
      {averageRating.toFixed(1)} ({reviewCount} {t("reviews")})
    </span>
  </div>
)}

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

      {hasMore && (
  <div ref={loadMoreRef} className="recommended-load-more">
    {loadingMore && (
      <div className="recommended-loading-spinner" />
    )}

    {loadMoreError && (
      <button
        type="button"
        onClick={() => {
          const controller = new AbortController();
          requestRef.current = controller;

          loadNextRecommendations(
            page,
            controller.signal,
            generationRef.current
          );
        }}
      >
        {t("try_again")}
      </button>
    )}
  </div>
)}
    </div>
  );
}

export default RecommendedItem;