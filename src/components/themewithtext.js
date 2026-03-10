"use client";

import React, { useEffect, useState } from "react";
import useScreenSize from "./useIsMobile";

const CACHE_KEY = "theme_with_text_top_brand";
const CACHE_TTL = 1000 * 60 * 10; // 10 min

function getCache(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.timestamp) return null;

    const expired = Date.now() - parsed.timestamp > CACHE_TTL;
    if (expired) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

function setCache(key, data) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

const ThemeWithText = () => {
  const [theme, setTheme] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } =
    useScreenSize();

  useEffect(() => {
    const cachedTheme = getCache(CACHE_KEY);
    if (cachedTheme) {
      setTheme(cachedTheme);
    }

    const fetchTheme = async () => {
      try {
        const res = await fetch("https://api.malidag.com/themes/");
        const data = await res.json();
        const allThemes = data?.themes || [];

        const selected = allThemes.find((t) =>
          t.theme?.toLowerCase().includes("explore our top brand")
        );

        if (selected) {
          setTheme(selected);
          setCache(CACHE_KEY, selected);
        }
      } catch (error) {
        console.error("Error fetching themes:", error);
      }
    };

    fetchTheme();
  }, []);

  useEffect(() => {
    if (!theme?.image) return;

    const img = new Image();
    img.src = theme.image;
    img.onload = () => {
      setImageLoaded(true);
    };
  }, [theme]);

  if (!theme) return null;

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
        {theme.image && (
          <img
            src={theme.image}
            alt={theme.theme}
            loading="lazy"
            style={{
              maxWidth: "100%",
              height: "auto",
              objectFit: "cover",
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.3s ease",
              marginTop: "30px",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ThemeWithText;