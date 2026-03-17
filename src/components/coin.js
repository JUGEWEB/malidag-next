'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import './coin.css';
import useScreenSize from './useIsMobile';

const BASE_URL = 'https://api.malidag.com';

const coinImages = {
  USDC: 'https://api.malidag.com/learn/videos/1769909942070-0xaf88d065e77c8cc2239327c5edb3a432268e5831.png',
  BUSD: 'https://api.malidag.com/learn/videos/1773502639247-BUSD.png',
  USDT: 'https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png',
};

function Coin() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } = useScreenSize();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const isDesktopLike = isDesktop || isTablet;
  const isSmallScreen = isMobile || isSmallMobile || isVerySmall;

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${BASE_URL}/items/cryptos`);
        const symbols = response.data?.cryptos || [];

        const filteredCoins = symbols
          .filter((symbol) => coinImages[symbol])
          .map((symbol) => ({ symbol }));

        setCoins(filteredCoins);
      } catch (err) {
        console.error('Error fetching coin data:', err);
        setError(t('coin_error_loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, [t]);

  const shouldHide = useMemo(() => {
    return isSmallScreen && pathname !== '/';
  }, [isSmallScreen, pathname]);

  if (shouldHide) return null;

  if (loading) {
    return (
      <section
        className={`coin-strip ${isDesktopLike ? 'coin-strip--desktop' : 'coin-strip--mobile'} coin-strip--loading`}
        aria-label="Loading supported cryptocurrencies"
      >
        <div className="coin-strip__shell">
          {!isDesktopLike && (
            <div className="coin-strip__header">
              <div className="coin-strip__eyebrow">Secure checkout</div>
              <h2 className="coin-strip__title">Pay with crypto</h2>
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

  const handleCoinClick = (symbol) => {
    router.push(`/coin/${symbol}`);
  };

  return (
    <section
      className={`coin-strip ${isDesktopLike ? 'coin-strip--desktop' : 'coin-strip--mobile'}`}
      aria-label="Supported cryptocurrencies"
    >
      <div className="coin-strip__shell">
        {!isDesktopLike && (
          <div className="coin-strip__header">
            <div className="coin-strip__eyebrow">Secure checkout</div>
            <div className="coin-strip__title-row">
              <h2 className="coin-strip__title">Pay with crypto</h2>
              <span className="coin-strip__live">
                <span className="coin-strip__live-dot" />
                Available now
              </span>
            </div>
          </div>
        )}

        <div className="coin-strip__scroll">
          {coins.map((coin) => (
            <button
              key={coin.symbol}
              type="button"
              className={`coin-pill ${isDesktopLike ? 'coin-pill--desktop' : 'coin-pill--mobile'}`}
              onClick={() => handleCoinClick(coin.symbol)}
              aria-label={`Open ${coin.symbol}`}
            >
              <span className="coin-pill__image-wrap">
                <img
                  loading="lazy"
                  src={coinImages[coin.symbol]}
                  alt={coin.symbol}
                  className="coin-pill__image"
                />
              </span>

              <span className="coin-pill__content">
                <span className="coin-pill__symbol">{coin.symbol}</span>
                <span className="coin-pill__label">Stablecoin</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Coin;