"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";
import personalCareThemes from "./personnalCareThemes";
import { useRouter } from "next/navigation";

const ThemeForPersonnalCare = () => {
  const router = useRouter();
  const { isSmallMobile, isVerySmall } = useScreenSize();
  const [loadedImages, setLoadedImages] = useState({});

  const isSmall = isSmallMobile || isVerySmall;

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
        width: isSmall ? "100%" : "270px",
        height: isSmall ? "100%" : "400px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
        padding: "10px",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: "25px",
          fontWeight: "bold",
          color: "#333",
          marginBottom: "14px",
          textAlign: "center",
        }}
      >
        Personal care for you
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          width: "100%",
          gap: "12px",
          gridTemplateColumns: "repeat(2, 1fr)",
          justifyItems: "center",
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
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <img
              src={theme.url}
              alt={theme.type}
              loading="lazy"
              style={{
                width: isSmall ? "100%" : "100px",
                height: isSmall ? "185px" : "100px",
                objectFit: "cover",
                opacity: loadedImages[theme.id] ? 1 : 0,
                transition: "opacity 0.3s ease",
                filter: "contrast(1.08) saturate(1.08) brightness(1.02)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: "6px",
                backgroundColor: "#fff",
              }}
            />

            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#555",
                marginTop: "6px",
                textAlign: "center",
              }}
            >
              {theme.type}
            </div>
          </div>
        ))}
      </div>

      {/* Discover */}
      <div
        onClick={() => router.push("/beauty")}
        style={{
          fontSize: "0.85rem",
          fontWeight: "bold",
          color: "#15803d",
          marginTop: "20px",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        Discover now
      </div>
    </div>
  );
};

export default ThemeForPersonnalCare;