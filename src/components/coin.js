'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';
import './coin.css';
import useScreenSize from './useIsMobile';

const BASE_URL = 'https://api.malidag.com';

function Coin() {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } = useScreenSize();
  const router = useRouter();
  const pathname = usePathname();

  const isDesktopLike = isDesktop || isTablet;
  const isSmallScreen = isMobile || isSmallMobile || isVerySmall;

  useEffect(() => {
    const fetchWatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${BASE_URL}/items`);
        const items = Array.isArray(response.data) ? response.data : [];

        const watchItems = items
          .filter((itemData) => {
            const item = itemData?.item || {};
            const details = itemData?.details || {};

            const type = String(item.type || details.type || '').toLowerCase();
            const brandType = String(item.brandType || details.brandType || '').toLowerCase();
            const department = String(item.department || details.department || '').toLowerCase();
            const category = String(itemData.category || details.category || '').toLowerCase();

            return (
              type === 'watches' ||
              brandType === 'watches' ||
              brandType === 'wathes' ||
              (department === 'jewelry' && type.includes('watch')) ||
              (category === 'jewelry' && type.includes('watch'))
            );
          })
          .slice(0, 8);

        setWatches(watchItems);
      } catch (err) {
        console.error('Error fetching watches:', err);
        setError('Unable to load watches');
      } finally {
        setLoading(false);
      }
    };

    fetchWatches();
  }, []);

  const shouldHide = useMemo(() => {
    return isSmallScreen && pathname !== '/';
  }, [isSmallScreen, pathname]);

  if (shouldHide) return null;

  const handleWatchesClick = () => {
    router.push('/coin/watches');
  };

  const getWatchImage = (itemData) => {
    const item = itemData?.item || {};
    const variants = item?.imagesVariants || {};

    const firstVariantList = Object.values(variants).find(Array.isArray);
    const firstVariant = firstVariantList?.[0];

    if (typeof firstVariant === 'string') return firstVariant;
    if (firstVariant?.url) return firstVariant.url;

    return item?.images?.[0] || '/fallback.png';
  };

  const getBrandName = (itemData) => {
    return itemData?.item?.brand || itemData?.details?.brand || 'Watch';
  };

  const getWatchName = (itemData) => {
    return itemData?.item?.name || itemData?.details?.itemName || 'Luxury watch';
  };

  if (loading) {
    return (
      <section
        className={`coin-strip ${isDesktopLike ? 'coin-strip--desktop' : 'coin-strip--mobile'} coin-strip--loading`}
        aria-label="Loading watches"
      >
        <div className="coin-strip__shell">
          {!isDesktopLike && (
            <div className="coin-strip__header">
              <div className="coin-strip__eyebrow">Jewelry store</div>
              <h2 className="coin-strip__title">Get your watches</h2>
            </div>
          )}

          <div className="coin-strip__scroll">
            {[1, 2, 3].map((item) => (
              <div key={item} className="coin-pill coin-pill--skeleton" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return <div className="coin-strip__error">{error}</div>;
  }

 return (
  <section
    className={`coin-strip ${
      isDesktopLike ? 'coin-strip--desktop' : 'coin-strip--mobile'
    }`}
    aria-label="Watches shop"
  >
    <div className="coin-strip__shell">
      {isDesktopLike ? (
        <button
          type="button"
          className="coin-strip__desktop-title"
          onClick={handleWatchesClick}
        >
          Watches store
        </button>
      ) : (
        <>
          <div className="coin-strip__header">
            <div className="coin-strip__eyebrow">
              Jewelry store
            </div>

            <div className="coin-strip__title-row">
              <h2 className="coin-strip__title">
                Get your watches
              </h2>

              <button
                type="button"
                className="coin-strip__live"
                onClick={handleWatchesClick}
                aria-label="View more watches"
              >
                View more
              </button>
            </div>
          </div>

          <div className="coin-strip__scroll">
            {watches.map((watch) => (
              <button
                key={watch.id}
                type="button"
                className="coin-pill coin-pill--mobile"
                onClick={handleWatchesClick}
                aria-label={`Open ${getWatchName(watch)}`}
              >
                <span className="coin-pill__image-wrap">
                  <img
                    loading="lazy"
                    src={getWatchImage(watch)}
                    alt={getWatchName(watch)}
                    className="coin-pill__image"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/fallback.png';
                    }}
                  />
                </span>

                <span className="coin-pill__content">
                  <span className="coin-pill__symbol">
                    {getBrandName(watch)}
                  </span>

                  <span className="coin-pill__label">
                    {getWatchName(watch)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  </section>
);
}

export default Coin;