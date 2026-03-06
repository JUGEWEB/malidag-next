"use client";

import React, { useState, useEffect } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "./electronic.css";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";

const BASE_URL = "https://api.malidag.com";
const ITEMS_PER_SLIDE = 6;
const MAX_ITEMS = 17;

function Electronic() {
  const [items, setItems] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { isMobile, isDesktop, isSmallMobile, isVerySmall, isTablet } = useScreenSize();

  useEffect(() => {
    const fetchElectronicItems = async () => {
      try {
        // ✅ Call backend search API directly (MongoDB filters for us)
        const response = await fetch(`${BASE_URL}/items/category/electronic`);
        const data = await response.json();

        // API returns { items: [...] }
        setItems((data.items || []).slice(0, MAX_ITEMS));
      } catch (error) {
        console.error("❌ Error fetching electronic items:", error);
      }
    };

    fetchElectronicItems();
  }, []);

  // Slides
  const totalSlides = Math.ceil(items.length / ITEMS_PER_SLIDE);
  const startIndex = currentSlide * ITEMS_PER_SLIDE;
  const endIndex = startIndex + ITEMS_PER_SLIDE;
  const currentItems = items.slice(startIndex, endIndex);

  // Navigation
  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  return (
    <div className="fashion-carousel">
      <div
        className="carousel-slides"
        style={{ overflowX: (isMobile || isSmallMobile || isTablet) ? "auto" : "" }}
      >
        {currentItems.map((item, index) => (
          <div
            key={item.id || index}
            className="carousel-item"
            style={{
              overflowX: (isMobile || isSmallMobile || isTablet || isVerySmall) ? "auto" : "",
              padding: (isSmallMobile || isVerySmall) ? "0px" : "2px",
              width: (isSmallMobile || isVerySmall)
                ? "calc(100% / 2)"
                : (isTablet || isMobile)
                ? "calc(100% / 4)"
                : "calc(100% / 6)",
            }}
          >
            <img
              src={item.item?.images?.[0]}
              alt={item.item?.name || "Electronic Item"}
              className="carousel-imageof"
              onClick={() => handleItemClick(item.id)}
            />
          </div>
        ))}
      </div>

      {/* ✅ Arrows only on desktop */}
      {isDesktop && totalSlides > 1 && (
        <div className="carousel-arrows">
          <LeftOutlined onClick={handlePrevSlide} className="arrow-button" />
          <RightOutlined onClick={handleNextSlide} className="arrow-button" />
        </div>
      )}
    </div>
  );
}

export default Electronic;
