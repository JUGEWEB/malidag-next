'use client';

import React, { useState, useEffect, useRef } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "./fashionForAll.css";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";

const BASE_URL = "https://api.malidag.com";
const MAX_ITEMS = 17;
const CACHED_ITEMS_COUNT = 10;
const CACHE_KEY = "fashionForAll_first10";
const CACHE_TIME_KEY = "fashionForAll_first10_time";
const CACHE_TTL = 1000 * 60 * 30; // 30 min

function FashionForAll() {
  const [items, setItems] = useState([]);
  const { isMobile, isSmallMobile, isVerySmall, isTablet } = useScreenSize();
  const router = useRouter();
  const scrollRef = useRef(null);

  useEffect(() => {
    const loadCachedItems = () => {
      try {
        const cachedItems = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        if (!cachedItems || !cachedTime) return false;

        const isExpired = Date.now() - Number(cachedTime) > CACHE_TTL;
        if (isExpired) return false;

        const parsedItems = JSON.parse(cachedItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setItems(parsedItems);
          return true;
        }

        return false;
      } catch (error) {
        console.error("Error reading cache:", error);
        return false;
      }
    };

    const fetchFashionItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/items/category/shoes`);
        const data = await response.json();
        const fashionItems = (data.items || data || []).slice(0, MAX_ITEMS);

        setItems(fashionItems);

        const first10 = fashionItems.slice(0, CACHED_ITEMS_COUNT);
        localStorage.setItem(CACHE_KEY, JSON.stringify(first10));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } catch (error) {
        console.error("Error fetching fashion items:", error);
      }
    };

    loadCachedItems();
    fetchFashionItems();
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

export default FashionForAll;