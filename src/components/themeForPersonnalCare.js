"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";
import personalCareThemes from "./personnalCareThemes";
import { useRouter } from "next/navigation";

const ThemeForPersonnalCare = () => {
  const router = useRouter();
  const { isDesktop, isMobile, isSmallMobile, isTablet, isVerySmall } =
    useScreenSize();
  const [loadedImages, setLoadedImages] = useState({});

  useEffect(() => {
    personalCareThemes.forEach((theme) => {
      const img = new Image();
      img.src = theme.url;
      img.onload = () => {
        setLoadedImages((prev) => ({ ...prev, [theme.id]: true }));
      };
    });
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: isSmallMobile || isVerySmall ? "100%" : "270px",
        height: isSmallMobile || isVerySmall ? "100%" : "400px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          fontSize: "25px",
          fontWeight: "bold",
          color: "#333",
          marginBottom: "10px",
          textAlign: "center",
        }}
      >
        Personal care for you
      </div>

      <div
        style={{
          display: "grid",
          width: "100%",
          gap: "1px",
          justifyContent: "space-between",
          gridTemplateColumns: "repeat(2, 1fr)",
          alignItems: "center",
          height: "auto",
        }}
      >
        {personalCareThemes.map((theme) => (
          <div
            key={theme.id}
            onClick={() =>
              router.push(`/itemOfItems/${encodeURIComponent(theme.type)}`)
            }
            style={{
              width: "100%",
              height: "auto",
              textAlign: "center",
              minHeight: "100%",
              cursor: "pointer",
            }}
          >
            <img
              src={theme.url}
              alt={theme.type}
              loading="lazy"
              style={{
                width: isSmallMobile || isVerySmall ? "100%" : "100px",
                height: isSmallMobile || isVerySmall ? "185px" : "100px",
                objectFit: "cover",
                opacity: loadedImages[theme.id] ? 1 : 0,
                transition: "opacity 0.3s ease",
                filter: "contrast(1)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: "5px",
                backgroundColor: "#fff",
              }}
            />
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#555",
                marginTop: "6px",
              }}
            >
              {theme.type}
            </div>
          </div>
        ))}
      </div>

      <div
        onClick={() => router.push("/beauty")}
        style={{
          fontSize: "0.8rem",
          fontWeight: "bold",
          color: "blue",
          marginTop: "2rem",
          textAlign: "start",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        Discover Now
      </div>
    </div>
  );
};

export default ThemeForPersonnalCare;