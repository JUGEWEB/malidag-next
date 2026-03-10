"use client";

import React from "react";
import useScreenSize from "./useIsMobile";
import { useRouter } from "next/navigation";
import Link from "next/link";

const theme = {
  id: 456,
  theme: "Women fashion",
  image:
    "https://cdn.malidag.com/themes/1760454830463-0a9bff23-526a-40ba-a2b9-be41271c845f.webp",
};

const ThemeForWomenFashion = () => {
  const router = useRouter();
  const { isDesktop, isMobile, isTablet, isSmallMobile, isVerySmall } =
    useScreenSize();

  const handleDiscoverClick = () => {
    router.push("/women-fashion");
    window.scrollTo(0, 0);
  };

  return (
    <div
      style={{
        overflow: "hidden",
        width: isDesktop || isTablet || isMobile ? "270px" : "100%",
        height: isSmallMobile || isVerySmall ? "100%" : "400px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
        backgroundColor: "#fdfdfd",
        borderRadius: "0px",
        marginTop: isSmallMobile || isVerySmall ? "0rem" : "1rem",
        marginBottom: isSmallMobile || isVerySmall ? "0rem" : "1rem",
      }}
    >
      <div
        style={{
          padding: "1rem",
          fontSize: isDesktop || isTablet || isMobile ? "1.5rem" : "1rem",
          fontWeight: "bold",
          color: "#333",
          backgroundColor: "#fafafa",
          textAlign: "center",
          borderBottom: "1px solid #eee",
        }}
      >
        Women fashion
      </div>

      <div
        style={{
          width: "100%",
          height: "auto",
          backgroundColor: "#ddd5",
        }}
      >
        <Link href="/women-fashion" onClick={() => window.scrollTo(0, 0)}>
          <img
            src={theme.image}
            alt={theme.theme}
            loading="lazy"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "cover",
            }}
          />
        </Link>
      </div>

      {(isDesktop || isTablet || isMobile) && (
        <div
          onClick={handleDiscoverClick}
          style={{
            color: "blue",
            marginTop: "1rem",
            fontSize: "0.8rem",
            textDecoration: "underline",
            marginLeft: "1rem",
            cursor: "pointer",
          }}
        >
          discover now
        </div>
      )}
    </div>
  );
};

export default ThemeForWomenFashion;