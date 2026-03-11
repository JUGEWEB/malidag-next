"use client";

import React, { useState, useEffect, useRef } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "./electronic.css";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";

const BASE_URL = "https://api.malidag.com";
const MAX_ITEMS = 17;
const CACHED_ITEMS_COUNT = 10;
const CACHE_KEY = "electronic_first10";

function Electronic() {
  const [items, setItems] = useState([]);
  const router = useRouter();
  const scrollRef = useRef(null);
  const { isMobile, isSmallMobile, isVerySmall, isTablet } = useScreenSize();

  useEffect(() => {
    const loadCachedItems = () => {
      try {
        const cachedItems = localStorage.getItem(CACHE_KEY);
        if (!cachedItems) return;

        const parsedItems = JSON.parse(cachedItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setItems(parsedItems);
        }
      } catch (error) {
        console.error("Error reading electronic cache:", error);
      }
    };

    const fetchElectronicItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/items/category/electronic`);
        const data = await response.json();
        const freshItems = (data.items || []).slice(0, MAX_ITEMS);

        setItems(freshItems);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify(freshItems.slice(0, CACHED_ITEMS_COUNT))
        );
      } catch (error) {
        console.error("❌ Error fetching electronic items:", error);
      }
    };

    loadCachedItems();
    fetchElectronicItems();
  }, []);

  const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  const scrollCarousel = (direction) => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="fashion-carousel">
      <div ref={scrollRef} className="carousel-slides">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="carousel-item"
            style={{
              padding: (isSmallMobile || isVerySmall) ? "0px" : "2px",
              width: (isSmallMobile || isVerySmall)
                ? "calc(100% / 2)"
                : (isTablet || isMobile)
                ? "calc(100% / 4)"
                : "calc(100% / 6)",
            }}
          >
            <img
              src={item.item?.images?.[0] || "/fallback.png"}
              alt={item.item?.name || "Electronic Item"}
              className="carousel-imageof"
              onClick={() => handleItemClick(item.id)}
              style={{ cursor: "pointer" }}
            />
          </div>
        ))}
      </div>

      <div className="carousel-arrows">
        <LeftOutlined
          onClick={() => scrollCarousel("left")}
          className="arrow-button"
        />
        <RightOutlined
          onClick={() => scrollCarousel("right")}
          className="arrow-button"
        />
      </div>
    </div>
  );
}

export default Electronic;