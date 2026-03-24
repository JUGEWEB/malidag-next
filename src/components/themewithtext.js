"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";


const ThemeWithText = () => {
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } =
    useScreenSize();

  return (
    <div
      style={{
        overflow: "hidden",
        width: isSmallMobile || isVerySmall ? "100%" : "270px",
        height: isDesktop || isTablet || isMobile ? "400px" : "270px",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          padding: isDesktop || isMobile || isTablet ? "1.5rem" : "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isDesktop || isMobile || isTablet ? "1.5rem" : "0.9rem",
          fontWeight: "bold",
          color: "#333",
          backgroundColor: "#f9f9f9",
          textAlign: "center",
        }}
      >
        Explore our top brands and shop with brands
      </div>

      <div style={{ width: "100%", height: "190px" }}>
  <img
    src="https://cdn.malidag.com/themes/1760455026024-650422e1-19ca-4421-88d4-92baa31c4cb0.webp"
    alt="our top brands"
    loading="lazy"
    onLoad={() => setImageLoaded(true)}
    onError={() => console.log("Image failed to load")}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "opacity 0.3s ease",
      marginTop: "30px",
      display: "block",
    }}
  />
</div>
    </div>
  );
};

export default ThemeWithText;