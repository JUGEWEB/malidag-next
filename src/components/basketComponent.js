'use client';

import React, { useContext, useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import useScreenSize from "./useIsMobile";
import { AppContext } from "./appContext";

const BasketComponent = ({ basketItems }) => {
    const [isBasketVisible, setIsBasketVisible] = useState(false);
    const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall} = useScreenSize()
  // Use location to get current path
  const pathname = usePathname();
  const { t } = useTranslation();

  const { country } = useContext(AppContext);

const countryCode =
  country?.code?.toLowerCase() || null;

const withCountry = (path) => {
  if (!countryCode) return "/";

  if (!path) {
    return `/${countryCode}`;
  }

  return `/${countryCode}${
    path.startsWith("/") ? path : `/${path}`
  }`;
};

  // Using useEffect to track location changes
 useEffect(() => {
  const shouldShowBasket =
    pathname.includes("/product/") ||
    pathname === "/cardCheckout";

  setIsBasketVisible(shouldShowBasket);
}, [pathname]);
  

  if (!isBasketVisible || basketItems.length === 0) {
    return null; // Don't render the basket if it's not visible or there are no items
  }

   if (!isDesktop) {
    return null; // Don't render the basket if it's not visible or there are no items
  }

  const getTranslatedColor = (color) => {
  if (!color) return "";

  const normalizedColor = color
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return t(`color_${normalizedColor}`, {
    defaultValue: color,
  });
};



  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        right: 'max(0px, calc((100vw - 1300px) / 2))',
        width: '150px',
        height: '100vh',
        backgroundColor: 'white',
        color: '#222',
        padding: '10px',
        overflowY: 'auto',
        borderLeft: '2px solid #555',
        zIndex: 1050,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // Improves visibility
      }}
    >
      <h3 style={{ fontSize: '14px', textAlign: 'center' }}>{t('basket')}</h3>
      <ul style={{ listStyle: 'none', padding: '0', fontSize: '12px' }}>
        {basketItems.map((item) => (
         <Link
          href={withCountry(`/product/${item.id}`)}
          key={item.id}
        >
            <li className="basketsect" style={{ marginBottom: '20px', textAlign: 'center' }}>
              <img
                src={item.image}
                alt={item.name}
                style={{ maxHeight: '100px', maxWidth: '100%' }}
              />

              {item.size && (
                <div className="basketsect" style={{ fontStyle: 'italic' }}>
                 {t('size_label', { size: item.size })}
                </div>
              )}
             {item.color && (
          <div className="basketsect" style={{ fontStyle: "italic" }}>
            {t("color_label", {
              color: getTranslatedColor(item.color),
            })}
          </div>
        )}
              <div className="basketsect" style={{ fontStyle: 'italic' }}>
                {t('quantity')}: {item.quantity || 1}
              </div>
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
};

export default BasketComponent;
