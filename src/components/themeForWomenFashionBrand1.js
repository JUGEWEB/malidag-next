"use client";

import React, { useContext, useCallback } from "react";
import { AppContext } from "./appContext";
import useScreenSize from "./useIsMobile";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const theme = {
  id: 456,
  theme: "Women fashion",
  image:
    "https://cdn.malidag.com/themes/1760454830463-0a9bff23-526a-40ba-a2b9-be41271c845f.webp",
};

const ThemeForWomenFashionBrand1 = () => {
  const router = useRouter();
  const { isDesktop, isMobile, isTablet, isSmallMobile, isVerySmall } =
    useScreenSize();
    const { t } = useTranslation();

    const { country } = useContext(AppContext);

const countryCode = country?.code;

const withCountry = useCallback(
  (path) => {
    if (!countryCode) return path;
    return `/${countryCode}${path.startsWith("/") ? path : `/${path}`}`;
  },
  [countryCode]
);

 const handleDiscoverClick = () => {
  router.push(withCountry("/women-fashion"));
  window.scrollTo(0, 0);
};

return (
  <div
    style={{
      overflow: "hidden",
      width: "100%",
      maxWidth: "100%",
      height: isDesktop || isTablet || isMobile ? "500px" : "270px",
      position: "relative",
      marginTop: isSmallMobile || isVerySmall ? "0rem" : "1rem",
      marginBottom: isSmallMobile || isVerySmall ? "0rem" : "1rem",
    }}
  >
   <Link
  href={withCountry("/women-fashion")}
  onClick={() => window.scrollTo(0, 0)}
>
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
            width: "1200px",
            maxWidth: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "brightness(0.72)",
            transform: "scale(1.02)",
          }}
        />

        {/* Overlay */}
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
            {t("women_fashion")}
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
            {t("women_fashion_subtitle")}
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

export default ThemeForWomenFashionBrand1;