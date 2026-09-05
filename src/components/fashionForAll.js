'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import './fashionForAll.css';
import useScreenSize from './useIsMobile';
import Link from 'next/link';
import { useTranslation } from "react-i18next";

const BASE_URL = 'https://api.malidag.com';
const MAX_ITEMS = 17;
const CACHED_ITEMS_COUNT = 10;
const CACHE_KEY = 'fashionForAll_first10';
const CACHE_TIME_KEY = 'fashionForAll_first10_time';
const CACHE_TTL = 1000 * 60 * 30;
const FALLBACK_IMAGE = '/placeholder-image.png';

function FashionForAll({
  title ,
  eyebrow ,
  viewMoreLabel ,
  sectionRoute = '/fashionPage',
  productRouteBase = '/product',
  category = 'clothes',
  showHeader = true,
  showViewMore = true,
  country,
}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingFreshData, setIsFetchingFreshData] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { t, i18n } = useTranslation();
  const scrollRef = useRef(null);
  const { isMobile, isSmallMobile, isVerySmall, isTablet } = useScreenSize();
  const displayTitle = title || t("fashion_for_all");
const displayEyebrow = eyebrow || t("curated_collection");
const displayViewMore = viewMoreLabel || t("view_more");
const [itemTranslations, setItemTranslations] = useState({});
  const itemsPerRowClass = useMemo(() => {
    if (isSmallMobile || isVerySmall) return 'items-2';
    if (isTablet || isMobile) return 'items-3';
    return 'items-5';
  }, [isMobile, isSmallMobile, isTablet, isVerySmall]);

  const showDesktopArrows = !isMobile && !isSmallMobile && !isVerySmall;

  const countryCode = country?.code?.toLowerCase() || "fr";

const withCountry = (path) => {
  if (!path) return `/${countryCode}`;

  const cleanPath = path.replace(/^\/(fr|gb|us|de|ie|au|be)(\/|$)/, "/");

  return `/${countryCode}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < maxScrollLeft - 5);
  }, []);

  const readCache = useCallback(() => {
    try {
      if (typeof window === 'undefined') return null;

    const cacheKey = `${CACHE_KEY}_${countryCode}_${category}`;
const cacheTimeKey = `${CACHE_TIME_KEY}_${countryCode}_${category}`;

      const cachedItems = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(cacheTimeKey);

      if (!cachedItems || !cachedTime) return null;

      const isExpired = Date.now() - Number(cachedTime) > CACHE_TTL;
      if (isExpired) return null;

      const parsedItems = JSON.parse(cachedItems);

      if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        return null;
      }

      return parsedItems;
    } catch (error) {
      console.error('Error reading fashion carousel cache:', error);
      return null;
    }
  }, [category]);

  const writeCache = useCallback(
    (fashionItems) => {
      try {
        if (typeof window === 'undefined') return;

       const cacheKey = `${CACHE_KEY}_${countryCode}_${category}`;
const cacheTimeKey = `${CACHE_TIME_KEY}_${countryCode}_${category}`;

        const firstItems = fashionItems.slice(0, CACHED_ITEMS_COUNT);
        localStorage.setItem(cacheKey, JSON.stringify(firstItems));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
      } catch (error) {
        console.error('Error writing fashion carousel cache:', error);
      }
    },
    [category, countryCode]
  );

  const fetchFashionItems = useCallback(async () => {
  try {
    setIsFetchingFreshData(true);
    setHasError(false);

    if (!countryCode) {
      setItems([]);
      return;
    }

    const response = await fetch(
      `${BASE_URL}/items/category/clothes?country=${encodeURIComponent(countryCode)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status}`);
    }

    const data = await response.json();

    const fashionItems = (
      Array.isArray(data) ? data : data?.items || []
    ).slice(0, MAX_ITEMS);

    setItems(fashionItems);
    writeCache(fashionItems);
  } catch (error) {
    console.error("Error fetching fashion items:", error);
    setHasError(true);
  } finally {
    setIsFetchingFreshData(false);
    setIsLoading(false);
  }
}, [category, countryCode, writeCache]);

useEffect(() => {
  if (!items.length || !i18n.language) return;

  let cancelled = false;

  const fetchTranslations = async () => {
    const lang = ["en", "fr", "br"].includes(i18n.language)
      ? i18n.language
      : "en";

    // English is the original product language.
    if (lang === "en") {
      if (!cancelled) {
        setItemTranslations({});
      }
      return;
    }

    try {
      const results = await Promise.all(
        items.map(async (item) => {
          const productId = item?.itemId;

          if (!productId) return null;

          try {
            const response = await fetch(
              `${BASE_URL}/translate/product/translate/${encodeURIComponent(
                productId
              )}/${encodeURIComponent(lang)}`
            );

            if (!response.ok) return null;

            const data = await response.json();

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

      const translationMap = {};

      results.forEach((result) => {
        if (!result) return;

        const [productId, translation] = result;

        if (translation) {
          translationMap[productId] = translation;
        }
      });

      setItemTranslations(translationMap);
    } catch (error) {
      console.error("Error fetching product translations:", error);
    }
  };

  fetchTranslations();

  return () => {
    cancelled = true;
  };
}, [items, i18n.language]);

  useEffect(() => {
    const cachedItems = readCache();

    if (cachedItems && cachedItems.length > 0) {
      setItems(cachedItems);
      setIsLoading(false);
    }

    fetchFashionItems();
  }, [fetchFashionItems, readCache]);

  useEffect(() => {
    updateScrollState();
  }, [items, updateScrollState]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollCarousel = useCallback((direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.82;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const getItemData = useCallback((item) => {
    const rawItem = item?.item || {};
    const details = item?.details || {};

    const imageUrl = rawItem?.images?.[0] || item?.image_url || '';

   const originalName =
  rawItem?.name ||
  details?.itemName ||
  item?.name ||
  t("fashion_item");

const translatedProduct = itemTranslations[item?.itemId];

const itemName =
  translatedProduct?.name ||
  translatedProduct?.itemName ||
  originalName;

    const currentPriceValue = Number(
      rawItem?.usdPrice ?? details?.usdText ?? rawItem?.price ?? 0
    );

    const originalPriceValue = Number(
      rawItem?.originalPrice ?? details?.originalPrice ?? 0
    );

    const discountPercentage =
      originalPriceValue > 0 &&
      currentPriceValue > 0 &&
      currentPriceValue < originalPriceValue
        ? Math.round(
            ((originalPriceValue - currentPriceValue) / originalPriceValue) * 100
          )
        : 0;

    return {
      imageUrl,
      itemName,
      currentPriceValue,
      originalPriceValue,
      discountPercentage,
    };
  }, [itemTranslations, t]);

  const renderPrice = (value) => {
    const numericValue = Number(value || 0).toFixed(2);
    const [whole, decimal] = numericValue.split('.');

    return (
      <>
        ${whole}
        <sup className="carousel-card__price-decimal">{decimal}</sup>
      </>
    );
  };

  const renderState = (message, type = 'default') => (
    <div className={`fashion-carousel__state fashion-carousel__state--${type}`}>
      <div className="fashion-carousel__state-content">
        <span className="fashion-carousel__state-title">{message}</span>

        {type === 'error' && (
          <button
            type="button"
            className="fashion-carousel__retry-button"
            onClick={fetchFashionItems}
          >
           {t("try_again")}
          </button>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading && items.length === 0) {
  return renderState(t("loading_products"), "loading");
}

if (!isLoading && items.length === 0 && hasError) {
  return renderState(t("unable_load_products"), "error");
}

if (!isLoading && items.length === 0) {
  return renderState(t("no_products_found"), "empty");
}

    return (
      <div className="fashion-carousel__viewport">
        {items.length > 0 && showDesktopArrows && (
          <>
            <div className="fashion-carousel__edge fashion-carousel__edge--left" />
            <div className="fashion-carousel__edge fashion-carousel__edge--right" />

            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="fashion-carousel__nav fashion-carousel__nav--left"
              aria-label={t("scroll_left")}
              disabled={!canScrollLeft}
            >
              <LeftOutlined />
            </button>

            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="fashion-carousel__nav fashion-carousel__nav--right"
              aria-label={t("scroll_right")}
              disabled={!canScrollRight}
            >
              <RightOutlined />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="carousel-slides"
          aria-label={`${title} products`}
          role="region"
        >
          {items.map((item, index) => {
            const {
              imageUrl,
              itemName,
              currentPriceValue,
              originalPriceValue,
              discountPercentage,
            } = getItemData(item);

            return (
              <div
                key={item.id || `${itemName}-${index}`}
                className={`carousel-item ${itemsPerRowClass}`}
              >
                <Link
                 href={`${withCountry(productRouteBase)}/${item.id}`}
                  className="carousel-card"
                  aria-label={`Open ${itemName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="carousel-card__media">
                    {discountPercentage > 0 && (
                      <div className="carousel-card__badge">
                       -{discountPercentage}% {t("off")}
                      </div>
                    )}

                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={itemName}
                        className="carousel-image"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    ) : (
                      <div className="carousel-image carousel-image--placeholder">
                        <span>{t("no_image_available")}</span>
                      </div>
                    )}
                  </div>

                  <div className="carousel-card__content">
                    <h3 className="carousel-card__title" title={itemName}>
                      {itemName?.length > 10
                        ? `${itemName.substring(0, 10)}...`
                        : itemName}
                    </h3>

                    <div className="carousel-card__footer">
                      <div className="carousel-card__pricing">
                        <span className="carousel-card__price">
                          {currentPriceValue > 0
                            ? renderPrice(currentPriceValue)
                            : t("view_product")}
                        </span>

                        {originalPriceValue > 0 && (
                          <span className="carousel-card__original-price">
                            ${originalPriceValue.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <span className="carousel-card__cta">{t("view_product")}</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="fashion-carousel" aria-label={`${title} carousel`}>
      {showHeader && (
        <div className="fashion-carousel__header">
          <div className="fashion-carousel__heading-wrap">
            <span className="fashion-carousel__eyebrow">{displayEyebrow}</span>
            <h2 className="fashion-carousel__title">{displayTitle}</h2>
          </div>

          {showViewMore && sectionRoute && (
            <a
             href={sectionRoute}
              className="fashion-carousel__view-more"
              aria-label={`View more from ${title}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {displayViewMore}
            </a>
          )}
        </div>
      )}

      {renderContent()}

      {isFetchingFreshData && items.length > 0 && (
        <div className="fashion-carousel__refreshing" aria-live="polite">
          <span>{t("refreshing")}</span>
        </div>
      )}
    </section>
  );
}

export default FashionForAll;