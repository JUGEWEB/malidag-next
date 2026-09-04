"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import "./type.css";

const Type = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const {
    isMobile,
    isDesktop,
    isTablet,
    isSmallMobile,
    isVerySmall,
  } = useScreenSize();

  const getSavedCountryCode = () => {
    try {
      const savedCountry = localStorage.getItem("selectedCountry");

      if (!savedCountry) return null;

      const parsedCountry = JSON.parse(savedCountry);

      return parsedCountry?.code || null;
    } catch (err) {
      console.error("Invalid selectedCountry:", err);
      return null;
    }
  };

  const handleTypeClick = () => {
    const countryCode = getSavedCountryCode();

    if (!countryCode) return;

    router.push(`/${countryCode}/type-page`);
  };

  const handleNewsClick = () => {
  const countryCode = getSavedCountryCode();

  if (!countryCode) return;

  router.push(`/${countryCode}/malidag-news`);
};

const countryCode = getSavedCountryCode();

const isCountryHome =
  countryCode &&
  (pathname === `/${countryCode}` ||
    pathname === `/${countryCode}/`);

// "/" is the landing/country-selection page
if (pathname === "/") {
  return null;
}

// Mobile: hide on inner pages, but NOT /fr, /br, /gb
if (
  (isMobile || isSmallMobile || isVerySmall) &&
  !isCountryHome
) {
  return null;
}

  return (
    <div
      className="type-scroll-container"
      style={{
        marginLeft: isDesktop || isTablet ? "0px" : "20px",
        width: isDesktop || isTablet ? "60%" : "100%",
        color: "white",
      }}
    >
      <div className="type-scroll">
        <div
          className="type-item"
          onClick={handleTypeClick}
        >
         {t("type_new")}
        </div>

        <div
          className="type-itemT"
          onClick={handleNewsClick}
        >
         {t("madix_news")}
        </div>
      </div>
    </div>
  );
};

export default Type;