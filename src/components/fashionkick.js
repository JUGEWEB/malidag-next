"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./FashionKick.css";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import ShoeRecommended from "./shoeRecomended";

const BASE_URL = "https://api.malidag.com";

const CACHE_KEYS = {
  FASHION_TYPES: "fashionkick_types_cache",
  FASHION_ITEMS: "fashionkick_items_cache",
};

const CACHE_TTL = 1000 * 60 * 30;

const TYPE_TRANSLATION_KEYS = {
  "Men sneakers": "men_sneakers",
  "Girls boots": "girls_boots",
  "Women boots": "women_boots",
  "Women sneakers": "women_sneakers",
  "Men boots": "men_boots",
};

function getCache(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data ?? null;
  } catch (error) {
    console.error(`Cache read error for ${key}:`, error);
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
    console.error(`Cache write error for ${key}:`, error);
  }
}

function formatGroupedItems(data = []) {
  const filtered = data.filter((item) => {
    const category = (item?.category || "").toLowerCase();
    const sold = Number(item?.item?.sold ?? 0);
    return category === "shoes" && sold >= 100;
  });

  return filtered.reduce((acc, item) => {
    const type = item?.item?.type || "Other";
    const genre = item?.item?.genre || "General";

    if (!acc[type]) acc[type] = {};
    if (!acc[type][genre]) {
      acc[type][genre] = { genre, items: [] };
    }

    if (acc[type][genre].items.length < 10) {
      acc[type][genre].items.push({
        id: item?.id,
        itemId: item?.itemId,
        item: item?.item || {},
      });
    }

    return acc;
  }, {});
}

function ProductSkeleton() {
  return (
    <div className="fashionkick-product-card skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton skeleton-price" />
      <div className="skeleton skeleton-stars" />
      <div className="skeleton skeleton-text short" />
      <div className="skeleton skeleton-text" />
    </div>
  );
}

function TypeSkeleton() {
  return (
    <div className="type-section">
      <div className="type-image-id skeleton" />
      <div className="skeleton skeleton-type-title" />
    </div>
  );
}

function TopicSkeleton() {
  return <div className="fashionkick-topic-card skeleton topic-skeleton" />;
}

function StarRating({ rating = 0 }) {
  const rounded = Math.round(Number(rating) || 0);

  return (
    <div className="fashionkick-stars" aria-label={`Rating: ${rounded} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rounded ? "star filled" : "star"}>
          ★
        </span>
      ))}
    </div>
  );
}

function FashionKick({ initialMTypes = [], initialTypes = {} }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [types, setTypes] = useState(initialTypes);
  const [mtypes, setMTypes] = useState(initialMTypes);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState({});
  const [reviews, setReviews] = useState({});

  const translationRequestsRef = useRef(new Set());
  const reviewRequestsRef = useRef(new Set());

  const currentLang = i18n.language || "en";

  const hasCachedContent = useMemo(() => {
    return mtypes.length > 0 || Object.keys(types).length > 0;
  }, [mtypes, types]);

  const topicCards = useMemo(() => {
    return Object.entries(types).flatMap(([type, genres]) =>
      Object.keys(genres).map((genre) => ({
        type,
        genre,
        key: `${type}-${genre}`,
      }))
    );
  }, [types]);

  const allItems = useMemo(() => {
    return Object.values(types)
      .flatMap((genreMap) => Object.values(genreMap))
      .flatMap((genreObj) => genreObj.items || []);
  }, [types]);

  const getTranslatedName = useCallback(
    (item, itemId) => {
      const translated = translations[itemId]?.[currentLang]?.name;
      const fallback = item?.name || "Unnamed product";
      const value = translated || fallback;
      return value.length > 60 ? `${value.slice(0, 60)}...` : value;
    },
    [translations, currentLang]
  );

  const fetchTranslation = useCallback(
    async (productId, lang) => {
      if (!productId) return;
      if (translations[productId]?.[lang]) return;

      const requestKey = `${productId}_${lang}`;
      if (translationRequestsRef.current.has(requestKey)) return;

      translationRequestsRef.current.add(requestKey);

      try {
        const response = await axios.get(
          `${BASE_URL}/translate/product/translate/${productId}/${lang}`
        );

        setTranslations((prev) => ({
          ...prev,
          [productId]: {
            ...(prev[productId] || {}),
            [lang]: response.data?.translation || {},
          },
        }));
      } catch (error) {
        console.error(`Translation fetch error for ${productId}:`, error.message);
      } finally {
        translationRequestsRef.current.delete(requestKey);
      }
    },
    [translations]
  );

  const fetchReviews = useCallback(async (productId) => {
    if (!productId) return;
    if (reviewRequestsRef.current.has(productId)) return;
    if (reviews[productId]) return;

    reviewRequestsRef.current.add(productId);

    try {
      const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

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
        console.error(`Review fetch error for ${productId}:`, error);
      }
    } finally {
      reviewRequestsRef.current.delete(productId);
    }
  }, [reviews]);

  const hydrateProductMeta = useCallback(
    async (groupedData, lang) => {
      const productIds = Object.values(groupedData)
        .flatMap((genreMap) => Object.values(genreMap))
        .flatMap((genreObj) => genreObj.items || [])
        .map((product) => product?.itemId)
        .filter(Boolean);

      await Promise.all(
        productIds.map((itemId) =>
          Promise.all([fetchTranslation(itemId, lang), fetchReviews(itemId)])
        )
      );
    },
    [fetchTranslation, fetchReviews]
  );

  useEffect(() => {
    const cachedTypes = getCache(CACHE_KEYS.FASHION_TYPES);
    const cachedItems = getCache(CACHE_KEYS.FASHION_ITEMS);

    if (cachedTypes) setMTypes(cachedTypes);
    if (cachedItems) setTypes(cachedItems);

    if (cachedTypes || cachedItems) {
      setLoading(false);

      if (cachedItems) {
        hydrateProductMeta(cachedItems, currentLang).catch((error) => {
          console.error("Error hydrating cached product data:", error);
        });
      }
    }
  }, [currentLang, hydrateProductMeta]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [categoriesRes, itemsRes] = await Promise.all([
          axios.get(`${BASE_URL}/categories/FashionKick`),
          axios.get(`${BASE_URL}/items`),
        ]);

        if (cancelled) return;

        const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
        const items = Array.isArray(itemsRes.data) ? itemsRes.data : [];
        const groupedData = formatGroupedItems(items);

        setMTypes(categories);
        setTypes(groupedData);

        setCache(CACHE_KEYS.FASHION_TYPES, categories);
        setCache(CACHE_KEYS.FASHION_ITEMS, groupedData);

        await hydrateProductMeta(groupedData, currentLang);
      } catch (error) {
        console.error("Error fetching FashionKick data:", error);
        if (!cancelled) {
          setMTypes((prev) => prev || []);
          setTypes((prev) => prev || {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [currentLang, hydrateProductMeta]);

  useEffect(() => {
    if (!Object.keys(types).length) return;

    Object.values(types).forEach((genreMap) => {
      Object.values(genreMap).forEach((genreObj) => {
        genreObj.items.forEach(({ itemId }) => {
          fetchTranslation(itemId, currentLang);
        });
      });
    });
  }, [types, currentLang, fetchTranslation]);

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  const handleCategoryClick = (category) => {
    if (!category) return;
    const formattedCategory = category.toLowerCase().replace(/\s+/g, "-");
    router.push(`/itemOfShoes/${encodeURIComponent(formattedCategory)}`);
  };

 if (loading && !hasCachedContent) {
  return (
    <div className="fashionkick-slider">
      <section className="fashionkick-panel fashionkick-panel-dark fashionkick-hero-panel">
        <div className="fashionkick-page-inner">
          <section className="fashionkick-hero-shell skeleton-hero-shell">
            <div className="fashionkick-hero-copy">
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-hero-title" />
              <div className="skeleton skeleton-hero-title short" />
              <div className="skeleton skeleton-hero-text" />
              <div className="skeleton skeleton-hero-text short" />
              <div className="fashionkick-hero-trust-row">
                <div className="skeleton skeleton-trust-pill" />
                <div className="skeleton skeleton-trust-pill" />
                <div className="skeleton skeleton-trust-pill" />
              </div>
            </div>

            <div className="fashionkick-hero-visual skeleton-hero-visual" />
          </section>

          <div className="fashionkick-section-header">
            <h2>Shop by Category</h2>
            <span>Premium picks</span>
          </div>

          <div className="fashionkick-types-row">
            {Array.from({ length: 4 }).map((_, index) => (
              <TypeSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="fashionkick-panel fashionkick-panel-dark fashionkick-banner-panel">
        <div className="fashionkick-page-inner">
          <div className="fashionkick-section-header">
            <h2>Top Topics</h2>
            <span>Trending collections</span>
          </div>

          <div className="fashionkick-topic-banner topic-skeleton" />
        </div>
      </section>

      <section className="fashionkick-catalog-section">
        <div className="fashionkick-page-inner">
          <div className="fashionkick-section-header">
            <h2>Trending Products</h2>
            <span>Loading items</span>
          </div>

          <div className="fashionkick-products-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

return (
  <div className="fashionkick-slider">
    <section className="fashionkick-panel fashionkick-panel-dark fashionkick-hero-panel">
      <div className="fashionkick-page-inner">
        <section className="fashionkick-hero-shell">
          <div className="fashionkick-hero-copy">
            <span className="fashionkick-hero-label">Luxury Footwear</span>

            <h1 className="fashionkick-hero-heading">
              Curated Styles
              <span className="fashionkick-hero-heading-accent"> For Every Step</span>
            </h1>

            <p className="fashionkick-hero-subtext">
              Explore premium sneakers and boots crafted for bold looks, everyday comfort,
              and modern elegance. Designed to turn every walk into a statement.
            </p>

            <div className="fashionkick-hero-actions">
              <button
                type="button"
                className="fashionkick-primary-btn"
                onClick={() => {
                  const el = document.getElementById("fashionkick-products");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Shop Trending
              </button>

              <button
                type="button"
                className="fashionkick-secondary-btn"
                onClick={() => {
                  const el = document.getElementById("fashionkick-categories");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Explore Categories
              </button>
            </div>

            <div className="fashionkick-hero-trust-row">
              <div className="fashionkick-trust-pill">Best-selling styles</div>
              <div className="fashionkick-trust-pill">Premium comfort</div>
              <div className="fashionkick-trust-pill">Modern luxury</div>
            </div>
          </div>

          <div className="fashionkick-hero-visual">
            <div className="fashionkick-hero-visual-card fashionkick-hero-card-main">
              <img
                src="https://cdn.malidag.com/themes/1773233374853-869b7d85-8687-4f39-8301-83679b8afd83.webp"
                alt="Luxury footwear showcase"
                className="fashionkick-hero-visual-image"
              />
              <div className="fashionkick-hero-visual-overlay" />
              <div className="fashionkick-hero-visual-content">
                <span className="fashionkick-mini-badge">New Season</span>
                <h3>Statement Sneakers & Boots</h3>
                <p>Elevated essentials for every wardrobe.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="fashionkick-categories" className="fashionkick-categories-section">
          <div className="fashionkick-section-header">
            <h2>Shop by Category</h2>
            <span>{mtypes.length} collections</span>
          </div>

          {mtypes.length === 0 ? (
            <div className="fashionkick-empty">{t("no_types_found_fashion")}</div>
          ) : (
            <div className="fashionkick-types-row">
              {mtypes.map((typeObj, index) => (
                <article
                  key={typeObj?._id || index}
                  className="type-section"
                  onClick={() => handleCategoryClick(typeObj?.type)}
                >
                  <div className="type-image-id">
                    <img
                      src={typeObj?.image}
                      alt={typeObj?.type || "Fashion category"}
                      className="type-image-imgid"
                      loading="lazy"
                    />
                  </div>

                  <div className="type-content">
                    <span className="type-kicker">Collection</span>
                    <h3 className="type-title">
                      {t(TYPE_TRANSLATION_KEYS[typeObj?.type] || typeObj?.type)}
                    </h3>
                    <span className="type-link">Explore now</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>

    <section className="fashionkick-panel fashionkick-panel-dark fashionkick-banner-panel">
      <div className="fashionkick-page-inner">
        <div className="fashionkick-section-header">
          <h2>Top Topics</h2>
          <span>{topicCards.length} style directions</span>
        </div>

        <section className="fashionkick-topic-banner">
          <img
            src="https://cdn.malidag.com/themes/1773233374853-869b7d85-8687-4f39-8301-83679b8afd83.webp"
            alt="Fashion topics"
            className="fashionkick-topic-banner-image"
          />

          <div className="fashionkick-topic-banner-overlay" />

          <div className="fashionkick-topic-banner-vertical">
            <span className="fashionkick-badge">Premium Collection</span>
            <h2 className="fashionkick-banner-title">Step Into Luxury</h2>
            <p className="fashionkick-banner-text">
              Discover best-selling sneakers and boots designed for style, comfort,
              and confidence. Scroll through the most wanted looks and enter your next obsession.
            </p>

            <div className="fashionkick-topic-scroll">
              {topicCards.length === 0 ? (
                <div className="fashionkick-topic-empty">
                  {t("no_types_found_fashion") || "No topics found"}
                </div>
              ) : (
                topicCards.map(({ type, genre, key }) => (
                  <button
                    key={key}
                    type="button"
                    className="fashionkick-topic-vertical-item"
                    onClick={() =>
                      router.push(
                        `/shoesTopTopic/${encodeURIComponent(type)}/${encodeURIComponent(genre)}`
                      )
                    }
                  >
                    <span className="fashionkick-topic-item-type">{t(type) || type}</span>
                    <span className="fashionkick-topic-item-genre">{genre}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </section>

    <section id="fashionkick-products" className="fashionkick-catalog-section">
      <div className="fashionkick-page-inner">
        <div className="fashionkick-section-header">
          <h2>Trending Products</h2>
          <span>{allItems.length} items</span>
        </div>

        {allItems.length === 0 ? (
          <div className="fashionkick-empty">
            {t("no_products_found") || "No products found right now."}
          </div>
        ) : (
          <section className="fashionkick-products-grid">
            {allItems.map(({ id, item, itemId }) => {
              const reviewData = reviews[itemId];
              const averageRating = reviewData?.averageRating;
              const reviewCount = reviewData?.count || 0;
              const translatedName = getTranslatedName(item, itemId);

              return (
                <article
                  key={id}
                  className="fashionkick-product-card"
                  onClick={() => handleItemClick(id)}
                >
                  <div className="fashionkick-product-media">
                    <img
                      src={item?.images?.[0] || "/placeholder.png"}
                      alt={item?.name || "Product"}
                      className="fashionkick-product-image"
                      loading="lazy"
                    />

                    <div className="fashionkick-product-floating-tag">
                      {item?.type || "Premium"}
                    </div>
                  </div>

                  <div className="fashionkick-product-content">
                    <div className="fashionkick-product-topline">
                      <div className="fashionkick-price">
                        ${Number(item?.usdPrice || 0).toLocaleString()}
                      </div>

                      {item?.originalPrice && Number(item.originalPrice) > Number(item?.usdPrice) ? (
                        <div className="fashionkick-old-price">
                          ${Number(item.originalPrice).toLocaleString()}
                        </div>
                      ) : null}
                    </div>

                    <StarRating rating={averageRating || 0} />

                    <div className="fashionkick-review-text">
                      {averageRating
                        ? `${averageRating.toFixed(1)}/5 (${reviewCount} reviews)`
                        : t("no_reviews_yet") || "No reviews yet"}
                    </div>

                    <div className="fashionkick-name">{translatedName}</div>

                    <div className="fashionkick-product-footer">
                      <span className="fashionkick-product-genre">
                        {item?.genre || "Fashion"}
                      </span>
                      <span className="fashionkick-product-cta">View details</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="fashionkick-recommended-wrap">
          <div className="fashionkick-section-header">
            <h2>Recommended For You</h2>
            <span>Picked from your style</span>
          </div>

          <ShoeRecommended />
        </div>
      </div>
    </section>
  </div>
);
}

export default FashionKick;