"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";
import { useRouter } from "next/navigation";

const ThemeForGamers = () => {
  const router = useRouter();
  const { isDesktop, isMobile, isTablet, isSmallMobile, isVerySmall } = useScreenSize();
  const [loadedImages, setLoadedImages] = useState({});

  const theme = {
    id: 2435,
    theme: "Products for gamers",
    image: "https://cdn.malidag.com/themes/1760454789206-a6058da7-395d-4dac-b84b-219ec8675270.webp",
  };

  useEffect(() => {
    const img = new Image();
    img.src = theme.image;
    img.onload = () => {
      setLoadedImages((prev) => ({ ...prev, [theme.id]: true }));
    };
  }, []);

  const handleDiscoverClick = () => {
    router.push("/themeForGamers");
  };

  return (
    <div
      style={{
        overflow: "hidden",
        width: isDesktop || isTablet || isMobile ? "270px" : "150px",
        height: isDesktop || isTablet || isMobile ? "400px" : "270px",
        backgroundColor: "#fdfdfd",
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
        Products for gamers
      </div>

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
          onClick={handleDiscoverClick}
          style={{
            width: "100%",
            height: isSmallMobile || isVerySmall ? "100%" : "auto",
            display: "block",
            opacity: loadedImages[theme.id] ? 1 : 1,
            objectFit: "cover",
            filter: "contrast(1.08) saturate(1.08) brightness(1.02)",
            cursor: "pointer",
          }}
        />
      </div>

      {(isDesktop || isMobile || isTablet) && (
        <div
          onClick={handleDiscoverClick}
          style={{
            color: "blue",
            marginTop: "4rem",
            fontSize: "0.8rem",
            fontWeight: "bold",
            textDecoration: "underline",
            marginLeft: "10px",
            cursor: "pointer",
          }}
        >
          discover now
        </div>
      )}
    </div>
  );
};

export default ThemeForGamers;