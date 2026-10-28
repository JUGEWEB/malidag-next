'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import './fashionForAll.css';
import useScreenSize from './useIsMobile';
import Link from 'next/link';
import { useTranslation } from "react-i18next";
import { getCountryConfig } from "./countryUtils";
import Image from "next/image";

const BASE_URL = 'https://api.malidag.com';
const MAX_ITEMS = 17;
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
const [hasNextPage, setHasNextPage] = useState(false);
const [page, setPage] = useState(1);
const [retryKey, setRetryKey] = useState(0);
const [rates, setRates] = useState(null);

// Cache already fetched pages while this component is mounted.
const pageCacheRef = useRef(new Map());


const touchStartX = useRef(null);
const touchStartY = useRef(null);

const handleTouchStart = (event) => {
  touchStartX.current = event.touches[0].clientX;
  touchStartY.current = event.touches[0].clientY;
};

const handleTouchEnd = (event) => {
  if (
    touchStartX.current === null ||
    touchStartY.current === null
  ) {
    return;
  }

  const deltaX =
    event.changedTouches[0].clientX - touchStartX.current;

  const deltaY =
    event.changedTouches[0].clientY - touchStartY.current;

  touchStartX.current = null;
  touchStartY.current = null;

  // Ignore small movements and vertical page scrolling.
  if (
    Math.abs(deltaX) < 50 ||
    Math.abs(deltaX) <= Math.abs(deltaY)
  ) {
    return;
  }

  if (isLoading) return;

  if (deltaX < 0 && canGoNext) {
    setPage((prev) => prev + 1);
  } else if (deltaX > 0 && canGoPrevious) {
    setItems([]);
setIsLoading(true);
    setPage((prev) => prev - 1);
  }
};

  const { t, i18n } = useTranslation();
  const { isMobile, isSmallMobile, isVerySmall, isTablet } = useScreenSize();
  const displayTitle = title || t("fashion_for_all");
const displayEyebrow = eyebrow || t("curated_collection");
const displayViewMore = viewMoreLabel || t("view_more");
const [itemTranslations, setItemTranslations] = useState({});
 
const pageSize =
  isMobile || isSmallMobile || isVerySmall
    ? 2
    : isTablet
    ? 3
    : 5;

const itemsPerRowClass = useMemo(() => {
  if (pageSize === 2) return "items-2";
  if (pageSize === 3) return "items-3";
  return "items-5";
}, [pageSize]);

const showDesktopArrows = true;

const maxPages = Math.ceil(MAX_ITEMS / pageSize);
const canGoPrevious = page > 1;
const canGoNext =
  page < maxPages && hasNextPage;


  const countryCode = country?.code?.toLowerCase() || "fr";

  const countryCurrencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

const withCountry = (path) => {
  if (!path) return `/${countryCode}`;

 const cleanPath = path.replace(
  /^\/(fr|gb|br|us|de|ie|au|be)(\/|$)/,
  "/"
);

  return `/${countryCode}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

 
const fetchFashionItems = useCallback(() => {
  const cacheKey = `${countryCode}:${category}:${pageSize}:${page}`;

  pageCacheRef.current.delete(cacheKey);
  setRetryKey((prev) => prev + 1);
}, [countryCode, category, pageSize, page]);

// Reset pagination whenever the country, category,
// or responsive page size changes.
useEffect(() => {
  setPage(1);
  setItems([]);
  setHasNextPage(false);
  setHasError(false);
  setIsLoading(true);
  pageCacheRef.current.clear();
}, [countryCode, category, pageSize]);

// Fetch only the current page from the API.
useEffect(() => {
  const controller = new AbortController();
  let cancelled = false;

  const loadPage = async () => {
    const cacheKey =
      `${countryCode}:${category}:${pageSize}:${page}`;

    const cached = pageCacheRef.current.get(cacheKey);

    if (cached) {
      setItems(cached.items);
      setHasNextPage(cached.hasNextPage);
      setHasError(false);
      setIsLoading(false);
      setIsFetchingFreshData(false);
      return;
    }

    setIsLoading(true);
    setIsFetchingFreshData(true);
    setHasError(false);

    try {
      const params = new URLSearchParams({
        country: countryCode,
        page: String(page),
        limit: String(pageSize),
      });

      const response = await fetch(
        `${BASE_URL}/items/category/clothes?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch fashion items: ${response.status}`
        );
      }

      const data = await response.json();

      const fetchedItems = Array.isArray(data?.items)
        ? data.items
        : [];

      // The API always uses a fixed page size.
      // Only trim the displayed results to respect MAX_ITEMS.
      const remainingSlots =
        MAX_ITEMS - (page - 1) * pageSize;

      const pageItems = fetchedItems.slice(
        0,
        Math.max(0, remainingSlots)
      );

      const nextPageAvailable =
        Boolean(data?.pagination?.hasNextPage) &&
        page < Math.ceil(MAX_ITEMS / pageSize);

      if (cancelled) return;

      pageCacheRef.current.set(cacheKey, {
        items: pageItems,
        hasNextPage: nextPageAvailable,
      });

      setItems(pageItems);
      setHasNextPage(nextPageAvailable);
    } catch (error) {
      if (cancelled || error.name === "AbortError") {
        return;
      }

      console.error(
        "Error fetching fashion items:",
        error
      );

      setItems([]);
      setHasError(true);
    } finally {
      if (!cancelled) {
        setIsLoading(false);
        setIsFetchingFreshData(false);
      }
    }
  };

  loadPage();

  return () => {
    cancelled = true;
    controller.abort();
  };
}, [
  countryCode,
  category,
  page,
  pageSize,
  retryKey,
]);


useEffect(() => {
  const fetchRates = async () => {
    try {
      const response = await fetch(`${BASE_URL}/prices/rates`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.status}`);
      }

      const data = await response.json();
      setRates(data?.rates || {});
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  fetchRates();
}, []);

const convertUsdToLocal = useCallback(
  (usdValue) => {
    const usdPrice = Number(usdValue || 0);
    const currency = countryCurrencyConfig?.currency || "USD";

    if (!usdPrice) return 0;

    if (currency === "USD") {
      return usdPrice;
    }

    const rate = Number(rates?.[currency]);

    if (!rate) {
      return null;
    }

    return usdPrice * rate;
  },
  [rates, countryCurrencyConfig?.currency]
);

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


 
const scrollCarousel = useCallback(
  (direction) => {
    if (isLoading) return;

    if (direction === "left" && page > 1) {
      setPage((prev) => prev - 1);
    }

    if (
      direction === "right" &&
      hasNextPage &&
      page < maxPages
    ) {

      setItems([]);
setIsLoading(true);
      setPage((prev) => prev + 1);
    }
  },
  [isLoading, page, hasNextPage, maxPages]
);


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

 const renderPrice = (usdValue) => {
  const localizedValue = convertUsdToLocal(usdValue);

  if (localizedValue === null) {
    return "...";
  }

  const numericValue = localizedValue.toFixed(2);
  const [whole, decimal] = numericValue.split(".");
  const symbol = countryCurrencyConfig?.symbol || "$";

  return (
    <>
      {symbol}{whole}
      <sup className="carousel-card__price-decimal">
        {decimal}
      </sup>
    </>
  );
};

 
const renderState = (message, type = "default") => (
  <div
    className={`fashion-carousel__state fashion-carousel__state--${type}`}
    role={type === "loading" ? "status" : undefined}
    aria-live={type === "loading" ? "polite" : undefined}
  >
    <div className="fashion-carousel__state-content">
      {type === "loading" ? (
        <div
          className="fashion-carousel__spinner"
          aria-label={message}
        />
      ) : (
        <>
          <span className="fashion-carousel__state-title">
            {message}
          </span>

          {type === "error" && (
            <button
              type="button"
              className="fashion-carousel__retry-button"
              onClick={fetchFashionItems}
            >
              {t("try_again")}
            </button>
          )}
        </>
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
      {showDesktopArrows && (
          <>
            <div className="fashion-carousel__edge fashion-carousel__edge--left" />
            <div className="fashion-carousel__edge fashion-carousel__edge--right" />

            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="fashion-carousel__nav fashion-carousel__nav--left"
              aria-label={t("scroll_left")}
             disabled={!canGoPrevious || isLoading}
            >
              <LeftOutlined />
            </button>

            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="fashion-carousel__nav fashion-carousel__nav--right"
              aria-label={t("scroll_right")}
              disabled={!canGoNext || isLoading}
            >
              <RightOutlined />
            </button>
          </>
        )}

       

      <div
        className="carousel-slides"
        aria-label={`${displayTitle} products, page ${page}`}
        role="region"
        aria-live="polite"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
                                      <Image
                                        src={imageUrl}
                                        alt={itemName}
                                        fill
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1200px) 25vw, 20vw"
                                        quality={75}
                                        loading="lazy"
                                        className="carousel-image"
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
                        {renderPrice(originalPriceValue)}
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

    </section>
  );
}

export default FashionForAll;