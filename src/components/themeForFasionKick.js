"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";
import Link from "next/link";

const ThemeForFashionKick = () => {
  const { isDesktop, isMobile, isTablet, isSmallMobile, isVerySmall } = useScreenSize();
  const [loadedImages, setLoadedImages] = useState({});

  const theme = {
    id: 1,
    theme: "Fashion's kick",
    image: "https://cdn.malidag.com/themes/1760454565150-92293723-212a-4179-bfe8-53e9d9c40c5b.webp",
  };

  useEffect(() => {
    const img = new Image();
    img.src = theme.image;
    img.onload = () => {
      setLoadedImages((prev) => ({ ...prev, [theme.id]: true }));
    };
  }, []);

  return (
    <div
      style={{
        overflow: "hidden",
        width: isDesktop || isTablet || isMobile ? "270px" : "150px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
        backgroundColor: "#fdfdfd",
        height: isDesktop || isTablet || isMobile ? "400px" : "270px",
        borderRadius: "0px",
      }}
    >
      <div
        style={{
          padding: "10px",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#333",
          backgroundColor: "#fafafa",
          textAlign: "center",
          borderBottom: "1px solid #eee",
        }}
      >
        Fashion Kick
      </div>

      {/* Wrap image with Link */}
      <Link href="/fashionkick">
        <div
          style={{
            width: isSmallMobile || isVerySmall ? "150px" : "100%",
            height: isSmallMobile || isVerySmall ? "170px" : "auto",
            backgroundColor: "#ddd5",
          }}
        >
          <img
            src={theme.image}
            alt={theme.theme}
            loading="lazy"
            style={{
              width: "100%",
              height: isSmallMobile || isVerySmall ? "100%" : "300px",
              display: "block",
              opacity: loadedImages[theme.id] ? 1 : 1,
              cursor: "pointer",
              objectFit: "cover",
              transition: "opacity 0.3s ease-in-out",
            }}
          />
        </div>
      </Link>

      {/* Discover Now link */}
      {(isDesktop || isTablet || isMobile) && (
        <Link
          href="/fashionkick"
          style={{
            color: "blue",
            marginTop: "1rem",
            fontSize: "0.8rem",
            textDecoration: "underline",
            cursor: "pointer",
            marginLeft: "1rem",
            display: "inline-block",
          }}
        >
          discover now
        </Link>
      )}
    </div>
  );
};

export default ThemeForFashionKick;
