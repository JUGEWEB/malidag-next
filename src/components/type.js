"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import useScreenSize from "./useIsMobile";
import "./type.css";

const Type = () => {
  const router = useRouter();
  const pathname = usePathname();

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
          New
        </div>

        <div
          className="type-itemT"
          onClick={handleNewsClick}
        >
          Madix News
        </div>
      </div>
    </div>
  );
};

export default Type;