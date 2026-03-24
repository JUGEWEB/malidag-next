"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";
import { useRouter } from "next/navigation";

const theme = {
  id: 456,
  theme: "Home and kitchen",
  image:
    "https://cdn.malidag.com/themes/1760454730252-d5988e60-265a-464e-8553-f0c54c74233d.webp",
};

const ThemeForHomeAndKitchen = () => {
  const router = useRouter();
  const { isDesktop, isMobile, isTablet, isSmallMobile, isVerySmall } =
    useScreenSize();
  const [brandCount, setBrandCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBrandCount(parseInt(localStorage.getItem("brandCount")) || 0);
    }
  }, []);

  const handleDiscoverClick = () => {
    router.push("/itemHome");
    window.scrollTo(0, 0);
  };

  return (
    <div
      style={{
        overflow: "hidden",
        width: isDesktop || isTablet || isMobile ? "270px" : "100%",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
        height: isDesktop || isTablet || isMobile ? "400px" : "270px",
        backgroundColor: "#fdfdfd",
        marginTop: isSmallMobile || isVerySmall ? "0rem" : "1rem",
        marginBottom: isSmallMobile || isVerySmall ? "0rem" : "1rem",
         padding: isSmallMobile || isVerySmall ? "5px" : "0",
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
        Home and kitchen
      </div>

      <div style={{ width: "100%", backgroundColor: "#ddd5" }}>
        <img
          src={theme.image}
          alt={theme.theme}
          loading="lazy"
          onClick={handleDiscoverClick}
          style={{
            width: "100%",
            height:
              isDesktop || isTablet || isMobile
                ? brandCount === 0
                  ? "400px"
                  : "auto"
                : "auto",
            display: "block",
            objectFit: "cover",
            filter: "contrast(1.08) saturate(1.08) brightness(1.02)",
            cursor: "pointer",
          }}
        />
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

export default ThemeForHomeAndKitchen;