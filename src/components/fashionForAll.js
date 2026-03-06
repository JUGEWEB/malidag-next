'use client';

import React, { useState, useEffect } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "./fashionForAll.css";
import { useRouter } from 'next/navigation';
import useScreenSize from "./useIsMobile";

const BASE_URL = "https://api.malidag.com"; 
const ITEMS_PER_SLIDE = 6; 
const MAX_ITEMS = 17; 

function FashionForAll() {
  const [items, setItems] = useState([]);
  const { isMobile, isDesktop, isSmallMobile, isVerySmall, isTablet } = useScreenSize();
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchFashionItems = async () => {
      try {
        // ✅ Call backend search endpoint instead of fetching all items
        const response = await fetch(`${BASE_URL}/items/category/shoes`);
        const data = await response.json();

        // In case backend response is wrapped in { items: [...] }
        const fashionItems = data.items || data;

        setItems(fashionItems.slice(0, MAX_ITEMS));
      } catch (error) {
        console.error("Error fetching fashion items:", error);
      }
    };

    fetchFashionItems();
  }, []);

  // Calculate total slides
  const totalSlides = Math.ceil(items.length / ITEMS_PER_SLIDE);

  // Get items for the current slide
  const startIndex = currentSlide * ITEMS_PER_SLIDE;
  const endIndex = startIndex + ITEMS_PER_SLIDE;
  const currentItems = items.slice(startIndex, endIndex);

  // Navigation handlers
  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  // Handle item click
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
                : "calc(100% / 6)"
            }}
          >
            <img
              src={item.item?.images?.[0]} 
              alt={item.item?.name || "Fashion Item"}
              onClick={() => handleItemClick(item.id)} 
              className="carousel-image"
              style={{ cursor: "pointer" }}
            />
          </div>
        ))}
      </div>

      {((isMobile || !isTablet || isSmallMobile || isVerySmall)) && (
        <div className="carousel-arrows">
          <LeftOutlined onClick={handlePrevSlide} className="arrow-button" />
          <RightOutlined onClick={handleNextSlide} className="arrow-button" />
        </div>
      )}
    </div>
  );
}

export default FashionForAll;
