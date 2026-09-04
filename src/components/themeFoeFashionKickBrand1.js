"use client";

import React, { useEffect, useState, useContext, useCallback } from "react";
import useScreenSize from "./useIsMobile";
import Link from "next/link";
import { AppContext } from "./appContext";
import { useTranslation } from "react-i18next";

const ThemeForFashionKickBrand1 = () => {
  const { isDesktop, isMobile, isTablet, isSmallMobile, isVerySmall } = useScreenSize();
  const [loadedImages, setLoadedImages] = useState({});
   const { country } = useContext(AppContext);
   const { t } = useTranslation();

   const countryCode = country?.code;

  const withCountry = useCallback(
    (path) => {
      if (!countryCode) return path;
      return `/${countryCode}${path.startsWith("/") ? path : `/${path}`}`;
    },
    [countryCode]
  );

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
      width: "600px",
      height: isDesktop || isTablet || isMobile ? "400px" : "270px",
      position: "relative",
    }}
  >
     <Link href={withCountry("/fashionkick")}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {/* Background Image */}
        <img
          src={theme.image}
          alt={theme.theme}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "brightness(0.72)",
            transform: "scale(1.02)",
          }}
        />

        {/* Dark Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.45))",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "20px",
            color: "white",
            zIndex: 2,
          }}
        >
          <h1
            style={{
              fontSize: isDesktop
                ? "64px"
                : isTablet
                ? "48px"
                : "30px",
              fontWeight: "800",
              margin: "0",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
           {t("fashion_kick")}
          </h1>

          <p
            style={{
              fontSize: isDesktop ? "22px" : "16px",
              marginTop: "15px",
              maxWidth: "650px",
              lineHeight: "1.6",
              opacity: 0.95,
            }}
          >
           {t("fashion_kick_subtitle")}
          </p>

          <button
            style={{
              marginTop: "30px",
              padding: "15px 38px",
              borderRadius: "40px",
              border: "none",
              background: "#ffffff",
              color: "#000",
              fontSize: "15px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
           {t("discover_now")}
          </button>
        </div>
      </div>
    </Link>
  </div>
);

};

export default ThemeForFashionKickBrand1;
