
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";
import "./fashionKickTrending.css";
import { AppContext } from "./appContext";

const BASE_URL = "https://api.malidag.com";
const PAGE_SIZE = 8;

const isTrendingShoe = (product) =>
  String(product?.category || "").trim().toLowerCase() ===
    "shoes" &&
  Number(product?.item?.sold || 0) >= 100;

const getProductKey = (product) =>
  String(product?.id ?? product?.itemId ?? "");

const getImageUrl = (entry) => {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry.url === "string") return entry.url;
  return "";
};

const getProductImage = (product) => {
  const variants = product?.item?.imagesVariants || {};
  const firstColor = Object.keys(variants)[0];

  if (firstColor && Array.isArray(variants[firstColor])) {
    const sorted = [...variants[firstColor]].sort((a, b) => {
      const aPos = Number.isFinite(a?.position)
        ? a.position
        : 999999;
      const bPos = Number.isFinite(b?.position)
        ? b.position
        : 999999;

      return aPos - bPos;
    });

    const image = getImageUrl(sorted[0]);
    if (image) return image;
  }

  return (
    getImageUrl(product?.item?.images?.[0]) ||
    "/fallback.png"
  );
};

export default function FashionKickTrending({ countryCode }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const safeCountry = String(countryCode || "").toLowerCase();

  const currentLanguage = isSupportedLanguage(i18n.language)
    ? i18n.language
    : "en";

  const [products, setProducts] = useState([]);
  const [rates, setRates] = useState(null);
  const [translations, setTranslations] = useState({});
  const [reviews, setReviews] = useState({});
const { country } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [page, setPage] = useState(1);

 const loadMoreRef = useRef(null);
const activeRequestRef = useRef(false);
const metadataFetchedRef = useRef(new Set());

const [allTrendingProducts, setAllTrendingProducts] = useState([]);

const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

  const withCountry = useCallback(
    (path) => `/${safeCountry}${path}`,
    [safeCountry]
  );

  const formatPrice = (usdAmount) => {
    const amount = Number(usdAmount);

    if (!Number.isFinite(amount) || !currencyConfig) {
      return t("price_unavailable");
    }

    const currency = currencyConfig.currency;

    const rate =
      currency === "USD"
        ? 1
        : Number(rates?.[currency]);

    if (!Number.isFinite(rate) || rate <= 0) {
      return t("price_unavailable");
    }

    return (
      currencyConfig.symbol +
      (amount * rate).toFixed(2)
    );
  };

  // Fetch currency rates once.
  useEffect(() => {
    const controller = new AbortController();

    axios
      .get(`${BASE_URL}/prices/rates`, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        setRates(data?.rates || data || null);
      })
      .catch((error) => {
        if (!axios.isCancel(error)) {
          console.error("Currency rates error:", error);
        }
      });

    return () => controller.abort();
  }, []);

  // Reset metadata when the language changes.
  useEffect(() => {
    metadataFetchedRef.current.clear();
    setTranslations({});
  }, [currentLanguage]);

  
/*
 * Fetch the full catalog once using the same endpoint
 * as the main FashionKick page.
 */
useEffect(() => {
  if (!safeCountry) return;

  const controller = new AbortController();

  const fetchTrendingProducts = async () => {
    setLoading(true);
    setLoadError(false);
    setProducts([]);
    setAllTrendingProducts([]);
    setPage(1);
    setHasMore(true);

    try {
      const response = await axios.get(
        `${BASE_URL}/items?country=${encodeURIComponent(safeCountry)}`,
        { signal: controller.signal }
      );

      const raw = response.data;

      const items = Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw)
          ? raw
          : [];

     
const trending = items.filter(isTrendingShoe);

// Display all trending products, including the first 8.
setAllTrendingProducts(trending);

// Show the first 8 immediately.
setProducts(trending.slice(0, PAGE_SIZE));

// Enable infinite scrolling only if more than 8 exist.
setHasMore(trending.length > PAGE_SIZE);

    } catch (error) {
      if (axios.isCancel(error)) return;

      console.error("Trending products error:", error);
      setLoadError(true);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  fetchTrendingProducts();

  return () => controller.abort();
}, [safeCountry, retryCount]);

/*
 * Reveal the next 8 products when the user scrolls.
 * No additional /items API request is needed.
 */
useEffect(() => {
  if (page === 1 || loading) return;

  setLoadingMore(true);

  const timeout = setTimeout(() => {
    const visibleCount = page * PAGE_SIZE;

    setProducts(
      allTrendingProducts.slice(0, visibleCount)
    );

    setHasMore(
      visibleCount < allTrendingProducts.length
    );

    setLoadingMore(false);
  }, 250);

  return () => clearTimeout(timeout);
}, [page, allTrendingProducts, loading]);


  // Reset catalog cursor when country changes.
  // The component is keyed by country in the SEO page below,
  // so a country change mounts a fresh instance.

  // IntersectionObserver: load the next batch.
  useEffect(() => {
    const target = loadMoreRef.current;

    if (
      !target ||
      loading ||
      loadingMore ||
      !hasMore ||
      loadError
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setPage((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [
    products,
    loading,
    loadingMore,
    hasMore,
    loadError,
  ]);

  // Fetch product reviews and translations.
  useEffect(() => {
    if (!products.length) return;

    let cancelled = false;

    products.forEach(async (product) => {
      const itemId = product?.itemId;
      if (!itemId) return;

      const reviewKey = `review:${itemId}`;
      const translationKey =
        `translation:${currentLanguage}:${itemId}`;

      if (!metadataFetchedRef.current.has(reviewKey)) {
        metadataFetchedRef.current.add(reviewKey);

        try {
          const { data } = await axios.get(
            `${BASE_URL}/get-reviews/${itemId}`
          );

          if (!cancelled) {
            const ratings = (
              Array.isArray(data?.reviews)
                ? data.reviews
                : []
            )
              .map((review) => Number(review?.rating))
              .filter(
                (rating) =>
                  Number.isFinite(rating) &&
                  rating >= 1 &&
                  rating <= 5
              );

            const average = ratings.length
              ? ratings.reduce((a, b) => a + b, 0) /
                ratings.length
              : null;

            setReviews((prev) => ({
              ...prev,
              [itemId]: {
                average,
                count: ratings.length,
              },
            }));
          }
        } catch (error) {
          metadataFetchedRef.current.delete(reviewKey);
          console.error("Review fetch failed:", error);
        }
      }

      if (
        currentLanguage !== "en" &&
        !metadataFetchedRef.current.has(translationKey)
      ) {
        metadataFetchedRef.current.add(translationKey);

        try {
          const { data } = await axios.get(
            `${BASE_URL}/translate/product/translate/${itemId}/${currentLanguage}`
          );

          if (!cancelled) {
            setTranslations((prev) => ({
              ...prev,
              [itemId]: data?.translation || null,
            }));
          }
        } catch (error) {
          metadataFetchedRef.current.delete(translationKey);
          console.error("Translation fetch failed:", error);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [products, currentLanguage]);

  const handleRetry = () => {
    setLoadError(false);
    setRetryCount((prev) => prev + 1);
  };

  return (
    <main className="fkt-page">
      <div className="fkt-container">
        <button
          type="button"
          className="fkt-back"
          onClick={() =>
            router.push(withCountry("/fashionkick"))
          }
        >
          <span aria-hidden="true">←</span>
          Back to FashionKick
        </button>

        <header className="fkt-header">
          <span className="fkt-eyebrow">
            MALIDAG FASHIONKICK
          </span>

          <h1>
            {t("fashionkick_trending_products", {
              defaultValue: "Trending Shoes",
            })}
          </h1>

          <p>
            Discover popular footwear and trending styles.
          </p>
        </header>

        <section
          className="fkt-grid"
          aria-label="Trending footwear"
        >
          {products.map((product) => {
            const { id, item = {}, itemId } = product;

            const originalName =
              item.name ||
              product?.details?.itemName ||
              "Unnamed product";

            const displayName =
              translations[itemId]?.name ||
              originalName;

            const price = Number(item.usdPrice || 0);
            const originalPrice = Number(
              item.originalPrice || 0
            );

            const discount =
              originalPrice > price && originalPrice > 0
                ? Math.round(
                    ((originalPrice - price) / originalPrice) *
                      100
                  )
                : 0;

            const review = reviews[itemId];

            return (
              <article
                key={getProductKey(product)}
                className="fkt-card"
              >
                <div
                  className="fkt-image-wrap"
                  onClick={() =>
                    router.push(
                      withCountry(`/product/${id}`)
                    )
                  }
                >
                  {discount > 0 && (
                    <span className="fkt-discount">
                      -{discount}%
                    </span>
                  )}

                  <Image
                    src={getProductImage(product)}
                    alt={displayName}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={75}
                    className="fkt-image"
                  />
                </div>

                <div className="fkt-info">
                  <span className="fkt-brand">
                    {item.brand ||
                      product?.details?.brand ||
                      "Malidag"}
                  </span>

                  <h2
                    className="fkt-name"
                    onClick={() =>
                      router.push(
                        withCountry(`/product/${id}`)
                      )
                    }
                  >
                    {displayName}
                  </h2>

                  <div className="fkt-price-row">
                    <strong>{formatPrice(price)}</strong>

                    {discount > 0 && (
                      <del>
                        {formatPrice(originalPrice)}
                      </del>
                    )}
                  </div>

                  {review?.count > 0 && (
                    <div className="fkt-rating">
                      <span>★</span>
                      {review.average.toFixed(1)}
                      <span className="fkt-review-count">
                        ({review.count})
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="fkt-view-btn"
                    onClick={() =>
                      router.push(
                        withCountry(`/product/${id}`)
                      )
                    }
                  >
                    View Product
                    <span aria-hidden="true"> →</span>
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {(loading || loadingMore) && (
          <div className="fkt-loader" role="status">
            <span
              className="fkt-spinner"
              aria-hidden="true"
            />
            <span>{t("loading")}</span>
          </div>
        )}

        {loadError && (
          <div className="fkt-message">
            <p>Unable to load trending products.</p>
            <button
              type="button"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !loadError &&
          !hasMore &&
          products.length === 0 && (
            <div className="fkt-message">
              No trending shoes found.
            </div>
          )}

        {hasMore && !loadError && (
          <div
            ref={loadMoreRef}
            className="fkt-scroll-trigger"
            aria-hidden="true"
          />
        )}
      </div>
    </main>
  );
}
