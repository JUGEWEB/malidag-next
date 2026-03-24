'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import './electronic.css';
import useScreenSize from './useIsMobile';

const BASE_URL = 'https://api.malidag.com';
const MAX_ITEMS = 17;
const CACHED_ITEMS_COUNT = 10;
const CACHE_KEY = 'electronic_first10';
const CACHE_TIME_KEY = 'electronic_first10_time';
const CACHE_TTL = 1000 * 60 * 30;
const FALLBACK_IMAGE = '/fallback.png';

function Electronic({
  title = 'Home office tech',
  eyebrow = 'Trending picks',
  viewMoreLabel = 'View more',
  sectionRoute = '/electronic',
  productRouteBase = '/product',
  showHeader = true,
  showViewMore = true,
}) {
  const [items, setItems] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const router = useRouter();
  const scrollRef = useRef(null);
  const { isMobile, isSmallMobile, isVerySmall, isTablet } = useScreenSize();

  const itemsPerRowClass = useMemo(() => {
    if (isSmallMobile || isVerySmall) return 'items-2';
    if (isTablet || isMobile) return 'items-3';
    return 'items-5';
  }, [isMobile, isSmallMobile, isTablet, isVerySmall]);

  const showDesktopArrows = !isMobile && !isSmallMobile && !isVerySmall;

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

      const cachedItems = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

      if (!cachedItems || !cachedTime) return null;

      const isExpired = Date.now() - Number(cachedTime) > CACHE_TTL;
      if (isExpired) return null;

      const parsedItems = JSON.parse(cachedItems);
      if (!Array.isArray(parsedItems) || parsedItems.length === 0) return null;

      return parsedItems;
    } catch (error) {
      console.error('Error reading electronic cache:', error);
      return null;
    }
  }, []);

  const writeCache = useCallback((freshItems) => {
    try {
      if (typeof window === 'undefined') return;

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(freshItems.slice(0, CACHED_ITEMS_COUNT))
      );
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error writing electronic cache:', error);
    }
  }, []);

  const fetchElectronicItems = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/items/category/electronic`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch electronic items: ${response.status}`);
      }

      const data = await response.json();
      const freshItems = (data?.items || data || []).slice(0, MAX_ITEMS);

      if (!Array.isArray(freshItems)) {
        throw new Error('Invalid electronic items response format');
      }

      setItems(freshItems);
      writeCache(freshItems);
    } catch (error) {
      console.error('Error fetching electronic items:', error);
    }
  }, [writeCache]);

  useEffect(() => {
    const cachedItems = readCache();

    if (cachedItems && cachedItems.length > 0) {
      setItems(cachedItems);
    }

    fetchElectronicItems();
  }, [fetchElectronicItems, readCache]);

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

  const handleSectionNavigation = useCallback(() => {
    if (!sectionRoute) return;
    router.push(sectionRoute);
  }, [router, sectionRoute]);

  const handleItemClick = useCallback(
    (id) => {
      if (!id) return;
      router.push(`${productRouteBase}/${id}`);
    },
    [router, productRouteBase]
  );

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

    const imageUrl = rawItem?.images?.[0] || item?.image_url || FALLBACK_IMAGE;

    const itemName =
      rawItem?.name ||
      details?.itemName ||
      item?.name ||
      'Electronic Item';

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
  }, []);

  const renderPrice = (value) => {
    const numericValue = Number(value || 0).toFixed(2);
    const [whole, decimal] = numericValue.split('.');

    return (
      <>
        ${whole}
        <sup className="electronic-carousel__price-decimal">{decimal}</sup>
      </>
    );
  };

  return (
    <section className="electronic-carousel" aria-label={`${title} carousel`}>
      {showHeader && (
        <div className="electronic-carousel__header">
          <div className="electronic-carousel__heading-wrap">
            <span className="electronic-carousel__eyebrow">{eyebrow}</span>
            <h2 className="electronic-carousel__title">{title}</h2>
          </div>

          {showViewMore && sectionRoute && (
            <button
              type="button"
              className="electronic-carousel__view-more"
              onClick={handleSectionNavigation}
              aria-label={`View more from ${title}`}
            >
              {viewMoreLabel}
            </button>
          )}
        </div>
      )}

      <div className="electronic-carousel__viewport">
        {items.length > 0 && showDesktopArrows && (
          <>
            <div className="electronic-carousel__edge electronic-carousel__edge--left" />
            <div className="electronic-carousel__edge electronic-carousel__edge--right" />

            <button
              type="button"
              className="electronic-carousel__nav electronic-carousel__nav--left"
              aria-label="Scroll left"
              onClick={() => scrollCarousel('left')}
              disabled={!canScrollLeft}
            >
              <LeftOutlined />
            </button>

            <button
              type="button"
              className="electronic-carousel__nav electronic-carousel__nav--right"
              aria-label="Scroll right"
              onClick={() => scrollCarousel('right')}
              disabled={!canScrollRight}
            >
              <RightOutlined />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="electronic-carousel__slides"
          role="region"
          aria-label={`${title} products`}
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
                className={`electronic-carousel__item ${itemsPerRowClass}`}
              >
                <button
                  type="button"
                  className="electronic-carousel__card"
                  onClick={() => handleItemClick(item.id)}
                  aria-label={`Open ${itemName}`}
                >
                  <div className="electronic-carousel__media">
                    {discountPercentage > 0 && (
                      <div className="electronic-carousel__badge">
                        -{discountPercentage}% OFF
                      </div>
                    )}

                    <img
                      src={imageUrl}
                      alt={itemName}
                      className="electronic-carousel__image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <div className="electronic-carousel__content">
                    <h3 className="electronic-carousel__item-title" title={itemName}>
                      {itemName?.length > 60
                        ? `${itemName.substring(0, 60)}...`
                        : itemName}
                    </h3>

                    <div className="electronic-carousel__footer">
                      <div className="electronic-carousel__pricing">
                        <span className="electronic-carousel__price">
                          {currentPriceValue > 0
                            ? renderPrice(currentPriceValue)
                            : 'View product'}
                        </span>

                        {originalPriceValue > 0 && (
                          <span className="electronic-carousel__original-price">
                            ${originalPriceValue.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <span className="electronic-carousel__cta">View Product</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Electronic;