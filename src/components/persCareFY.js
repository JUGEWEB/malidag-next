"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

import "./personalCare.css";
import RecommendedItem from "./personalRecommend";
import useScreenSize from "./useIsMobile";

const API_BASE_URL = "https://api.malidag.com";

const API_ENDPOINTS = {
  categories: `${API_BASE_URL}/categories/Beauty`,
  items: `${API_BASE_URL}/items`,
  reviews: (productId) => `${API_BASE_URL}/get-reviews/${productId}`,
};

const CACHE_KEYS = {
  BEAUTY_TYPES: "beauty_types_cache_v2",
  BEAUTY_ITEMS: "beauty_items_cache_v2",
};

const CACHE_TTL = 1000 * 60 * 30;
const MAX_ITEMS_PER_TYPE = 10;
const MAX_RENDERED_ITEMS_PER_TYPE = 5;
const MIN_SOLD_THRESHOLD = 100;

const FALLBACK_CRYPTO_ICON =
  "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png";

const CRYPTO_ICONS = {
  USDT: FALLBACK_CRYPTO_ICON,
  USDC: FALLBACK_CRYPTO_ICON,
  BUSD: FALLBACK_CRYPTO_ICON,
};

const initialState = {
  types: {},
  categoryTypes: [],
  reviews: {},
  loading: true,
  error: null,
};

function getCache(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;

    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error(`[Cache] Failed reading key: ${key}`, error);
    return null;
  }
}

function setCache(key, data) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error(`[Cache] Failed writing key: ${key}`, error);
  }
}

function groupBeautyItems(items = []) {
  const filtered = items.filter(
    (entry) =>
      entry?.category?.toLowerCase() === "beauty" &&
      Number(entry?.item?.sold ?? 0) >= MIN_SOLD_THRESHOLD
  );

  return filtered.reduce((acc, entry) => {
    const type = entry?.item?.type?.trim() || "Other";

    if (!acc[type]) acc[type] = [];
    if (acc[type].length < MAX_ITEMS_PER_TYPE) {
      acc[type].push(entry);
    }

    return acc;
  }, {});
}

function calculateReviewSummary(reviewsArray = []) {
  if (!Array.isArray(reviewsArray) || reviewsArray.length === 0) {
    return {
      averageRating: null,
      reviewsArray: [],
      totalReviews: 0,
    };
  }

  const totalRating = reviewsArray.reduce((acc, review) => {
    const rating = Number.parseFloat(review?.rating);
    return acc + (Number.isNaN(rating) ? 4 : rating);
  }, 0);

  return {
    averageRating: (totalRating / reviewsArray.length).toFixed(2),
    reviewsArray,
    totalReviews: reviewsArray.length,
  };
}

function ProductCard({ product, review, onClick }) {
  const item = product?.item || {};
  const crypto = item?.cryptocurrency || "USDT";
  const cryptoIcon = CRYPTO_ICONS[crypto] || FALLBACK_CRYPTO_ICON;
  const averageRating = review?.averageRating;
  const totalReviews = review?.totalReviews || 0;
  const productName = item?.name || "Unnamed product";
  const productImage = item?.images?.[0] || "/placeholder.png";
  const productPrice = item?.usdPrice || "0";
  const roundedRating = Math.round(Number(averageRating) || 0);

  return (
    <article
      className="pc-gallery-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      aria-label={`Open ${productName}`}
    >
      <div className="pc-gallery-image-wrap">
        <img
          src={productImage}
          alt={productName}
          className="pc-gallery-image"
          loading="lazy"
        />
      </div>

      <div className="pc-gallery-info">
        <div className="pc-gallery-top">
          <span className="pc-price">${productPrice}</span>

          <div className="pc-crypto" aria-label={`Paid with ${crypto}`}>
            <span>{crypto}</span>
            <img
              src={cryptoIcon}
              alt={crypto}
              className="crypto-icon"
              loading="lazy"
            />
          </div>
        </div>

        <h4 className="pc-gallery-name" title={productName}>
          {productName}
        </h4>

        <div className="pc-rating-row">
          <div
            className="stars-container"
            aria-label={`Rating ${averageRating || 0} out of 5`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={`star ${index < roundedRating ? "filled" : "empty"}`}
              >
                ★
              </span>
            ))}
          </div>

          <span className="pc-rating-text">
            {averageRating ? `${averageRating}/5` : "No reviews yet"}
            {totalReviews > 0 ? ` (${totalReviews})` : ""}
          </span>
        </div>
      </div>
    </article>
  );
}

function CategoryPills({ types, onClick }) {
  if (!types.length) return null;

  return (
    <nav className="pc-pill-nav" aria-label="Beauty type navigation">
      {types.map((type) => (
        <button
          key={type}
          type="button"
          className="pc-pill"
          onClick={() => onClick(type)}
        >
          Top {type}
        </button>
      ))}
    </nav>
  );
}

function LoadingSkeleton({ isDesktop, isTablet }) {
  return (
    <div className="personal-care-container">
      <div className="pc-skeleton-wrapper">
        <div className="pc-skeleton pc-skeleton-title" />

        <div className="pc-skeleton-circles">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="pc-skeleton-circle-block">
              <div
                className="pc-skeleton pc-skeleton-circle"
                style={{
                  width: isDesktop || isTablet ? 140 : 90,
                  height: isDesktop || isTablet ? 140 : 90,
                }}
              />
              <div className="pc-skeleton pc-skeleton-line short" />
            </div>
          ))}
        </div>

        {[...Array(2)].map((_, sectionIndex) => (
          <section key={sectionIndex} className="pc-skeleton-section">
            <div className="pc-skeleton pc-skeleton-heading" />

            <div
              className="pc-skeleton-grid"
              style={{
                gridTemplateColumns:
                  isDesktop || isTablet ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
              }}
            >
              {[...Array(6)].map((_, cardIndex) => (
                <div key={cardIndex} className="pc-skeleton-card">
                  <div className="pc-skeleton pc-skeleton-image" />
                  <div className="pc-skeleton-card-body">
                    <div className="pc-skeleton pc-skeleton-line short" />
                    <div className="pc-skeleton pc-skeleton-line" />
                    <div className="pc-skeleton pc-skeleton-line medium" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PersonalCare({ lang }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDesktop, isTablet } = useScreenSize();

  const [state, setState] = useState(initialState);
  const { types, categoryTypes, reviews, loading, error } = state;

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  const hasCachedContent = useMemo(() => {
    return categoryTypes.length > 0 || Object.keys(types).length > 0;
  }, [categoryTypes, types]);

  const fetchReviewsBatch = useCallback(async (productIds, signal) => {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    if (!uniqueIds.length) return {};

    const results = await Promise.allSettled(
      uniqueIds.map(async (productId) => {
        try {
          const response = await axios.get(API_ENDPOINTS.reviews(productId), {
            signal,
          });

          if (response?.data?.success) {
            return [productId, calculateReviewSummary(response.data.reviews || [])];
          }

          return [productId, calculateReviewSummary([])];
        } catch (error) {
          if (axios.isCancel?.(error) || error?.name === "CanceledError") {
            throw error;
          }

          if (error?.response?.status === 404) {
            return [productId, calculateReviewSummary([])];
          }

          console.error(`[Reviews] Failed for product ${productId}`, error);
          return [productId, calculateReviewSummary([])];
        }
      })
    );

    return results.reduce((acc, result) => {
      if (result.status === "fulfilled") {
        const [productId, reviewData] = result.value;
        acc[productId] = reviewData;
      }
      return acc;
    }, {});
  }, []);

  const hydrateFromCache = useCallback(
    async (signal) => {
      const cachedCategoryTypes = getCache(CACHE_KEYS.BEAUTY_TYPES) || [];
      const cachedItems = getCache(CACHE_KEYS.BEAUTY_ITEMS) || {};

      if (!cachedCategoryTypes.length && !Object.keys(cachedItems).length) {
        return false;
      }

      setState((prev) => ({
        ...prev,
        categoryTypes: cachedCategoryTypes,
        types: cachedItems,
        loading: false,
      }));

      const cachedProductIds = Object.values(cachedItems)
        .flat()
        .map((product) => product?.itemId)
        .filter(Boolean);

      try {
        const cachedReviews = await fetchReviewsBatch(cachedProductIds, signal);

        setState((prev) => ({
          ...prev,
          reviews: cachedReviews,
        }));
      } catch (error) {
        if (error?.name !== "CanceledError") {
          console.error("[Cache hydrate] Failed fetching cached reviews", error);
        }
      }

      return true;
    },
    [fetchReviewsBatch]
  );

  const fetchFreshData = useCallback(
    async (signal) => {
      try {
        const [categoryResponse, itemsResponse] = await Promise.all([
          axios.get(API_ENDPOINTS.categories, { signal }),
          axios.get(API_ENDPOINTS.items, { signal }),
        ]);

        const fetchedCategoryTypes = Array.isArray(categoryResponse?.data)
          ? categoryResponse.data
          : [];

        const allItems = Array.isArray(itemsResponse?.data)
          ? itemsResponse.data
          : [];

        const groupedItems = groupBeautyItems(allItems);

        setCache(CACHE_KEYS.BEAUTY_TYPES, fetchedCategoryTypes);
        setCache(CACHE_KEYS.BEAUTY_ITEMS, groupedItems);

        const productIds = Object.values(groupedItems)
          .flat()
          .map((product) => product?.itemId)
          .filter(Boolean);

        const fetchedReviews = await fetchReviewsBatch(productIds, signal);

        setState((prev) => ({
          ...prev,
          categoryTypes: fetchedCategoryTypes,
          types: groupedItems,
          reviews: fetchedReviews,
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (axios.isCancel?.(error) || error?.name === "CanceledError") return;

        console.error("[PersonalCare] Failed loading beauty data", error);

        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Unable to load beauty products right now.",
        }));
      }
    },
    [fetchReviewsBatch]
  );

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      await hydrateFromCache(controller.signal);
      await fetchFreshData(controller.signal);
    })();

    return () => controller.abort();
  }, [hydrateFromCache, fetchFreshData]);

  const beautyTypeNames = useMemo(() => Object.keys(types), [types]);

  const handleItemClick = useCallback(
    (id) => {
      if (id) router.push(`/product/${id}`);
    },
    [router]
  );

  const handleCategoryClick = useCallback(
    (category) => {
      if (!category) return;
      router.push(`/itemOfItems/${category.toLowerCase()}`);
    },
    [router]
  );

  const handleTopTypeClick = useCallback(
    (type) => {
      if (!type) return;
      router.push(`/beauty/top/${type.toLowerCase()}`);
    },
    [router]
  );

  if (loading && !hasCachedContent) {
    return <LoadingSkeleton isDesktop={isDesktop} isTablet={isTablet} />;
  }

  return (
    <section className="personal-care-container">
      <header className="personal-care-header">
        <h2 className="personal-care-title">
          {t("Malidag Beauty", "Malidag Beauty")}
        </h2>
      </header>

      {error && (
        <div className="pc-alert" role="alert">
          {error}
        </div>
      )}

      <section className="pc-section">
        <div className="beauty-category">
          {categoryTypes.length === 0 ? (
            <div className="pc-empty-state">
              {t(
                "No types found for Beauty category",
                "No types found for Beauty category"
              )}
            </div>
          ) : (
            categoryTypes.map((typeObj, index) => (
              <button
                key={typeObj?._id || `${typeObj?.type}-${index}`}
                type="button"
                className="type-section"
                onClick={() => handleCategoryClick(typeObj?.type)}
                aria-label={`Browse ${typeObj?.type}`}
              >
                <div className="type-image-i">
                  <img
                    src={typeObj?.image}
                    alt={typeObj?.type || "Beauty category"}
                    className="pc-category-image"
                    loading="lazy"
                  />
                </div>
                <h3 className="type-title">{typeObj?.type}</h3>
              </button>
            ))
          )}
        </div>
      </section>

      <CategoryPills types={beautyTypeNames} onClick={handleTopTypeClick} />

      {beautyTypeNames.length === 0 && !loading ? (
        <div className="pc-empty-state">
          {t(
            "No beauty products available right now.",
            "No beauty products available right now."
          )}
        </div>
      ) : (
        beautyTypeNames.map((type) => (
          <section key={type} className="pc-product-section">
            <div className="pc-section-header">
              <h3 className="pc-section-title">{type} Top Items</h3>
              <button
                type="button"
                className="pc-link-button"
                onClick={() => handleTopTypeClick(type)}
              >
                View all
              </button>
            </div>

            <div
              className="pc-product-grid"
              style={{
                gridTemplateColumns:
                  isDesktop || isTablet ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
              }}
            >
              {types[type]
                ?.slice(0, MAX_RENDERED_ITEMS_PER_TYPE)
                .map((product, index) => (
                  <ProductCard
                    key={product?.id || product?.itemId || `${type}-${index}`}
                    product={product}
                    review={reviews[product?.itemId]}
                    onClick={() => handleItemClick(product?.id)}
                  />
                ))}
            </div>
          </section>
        ))
      )}

      <RecommendedItem />
    </section>
  );
}

export default PersonalCare;