"use client";

import React, { useState, useEffect, useRef } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useCheckoutStore } from "./checkoutStore";
import "./topTopic.css";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";
import axios from "axios";

const BASE_URL = "https://api.malidag.com";
const MAX_ITEMS = 100;
const CACHED_ITEMS_COUNT = 10;
const CACHE_KEY = "topTopic_first10";

function TopTopic() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [topItems, setTopItems] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [reviews, setReviews] = useState({});
  const { isMobile, isTablet, isSmallMobile, isVerySmall } = useScreenSize();
  const { setItemData } = useCheckoutStore();

  const itemWidth = isSmallMobile || isVerySmall
    ? "calc(100% / 2)"
    : isMobile || isTablet
    ? "calc(100% / 3)"
    : "calc(100% / 7)";

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(`${BASE_URL}/crypto-prices`);
      const prices = await response.json();
      setCryptoPrices(prices || {});
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
    }
  };

  const fetchReviewsForItems = async (items) => {
    try {
      await Promise.all(
        items.map(async (item) => {
          const productId = item.itemId;
          if (!productId) return;

          try {
            const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

            if (response.data.success) {
              const reviewsArray = response.data.reviews || [];
              const totalRating = reviewsArray.reduce((acc, review) => {
                const rating = parseFloat(review.rating);
                return acc + (isNaN(rating) ? 4 : rating);
              }, 0);

              const averageRating = reviewsArray.length
                ? (totalRating / reviewsArray.length).toFixed(2)
                : null;

              setReviews((prevReviews) => ({
                ...prevReviews,
                [productId]: { averageRating, reviewsArray },
              }));
            }
          } catch (error) {
            if (error.response && error.response.status === 404) {
              setReviews((prevReviews) => ({
                ...prevReviews,
                [productId]: { averageRating: null, reviewsArray: [] },
              }));
            } else {
              console.error("Error fetching reviews:", error);
            }
          }
        })
      );
    } catch (error) {
      console.error("Error fetching review batch:", error);
    }
  };

  useEffect(() => {
    const loadCachedItems = () => {
      try {
        const cachedItems = localStorage.getItem(CACHE_KEY);
        if (!cachedItems) return;

        const parsedItems = JSON.parse(cachedItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setTopItems(parsedItems);
        }
      } catch (error) {
        console.error("Error reading top-topic cache:", error);
      }
    };

    const fetchTopItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/top-items?limit=${MAX_ITEMS}`);
        const sortedItems = await response.json();

        const freshItems = Array.isArray(sortedItems) ? sortedItems : [];
        setTopItems(freshItems);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify(freshItems.slice(0, CACHED_ITEMS_COUNT))
        );

        await Promise.all([
          fetchReviewsForItems(freshItems),
          fetchCryptoPrices(),
        ]);
      } catch (error) {
        console.error("Error fetching top items:", error);
      }
    };

    loadCachedItems();
    fetchTopItems();
  }, []);

  const convertToCrypto = (usdPrice, crypto) => {
    if (!crypto || !cryptoPrices[crypto]) return null;
    const cryptoPrice = parseFloat(cryptoPrices[crypto]);
    if (!cryptoPrice || isNaN(cryptoPrice)) return null;
    return (usdPrice / cryptoPrice).toFixed(2);
  };

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
    <div className="top-topic-caou">
      <div ref={scrollRef} className="carousel-sli">
        {topItems.map((item, index) => {
          const ratingObj = reviews[item.itemId];
          const averageRating = ratingObj ? ratingObj.averageRating : null;
          const cryptoValue =
            item.item?.usdPrice && item.item?.cryptocurrency
              ? convertToCrypto(Number(item.item.usdPrice), item.item.cryptocurrency)
              : null;

          return (
            <div
              key={item.id || index}
              className="top-topic-card"
              style={{ width: itemWidth, flex: "0 0 auto" }}
            >
              <div className="carousel-i">
                <img
                  src={item.item?.images?.[0] || "/fallback.png"}
                  alt={item.item?.name || "Top item"}
                  onClick={() => handleItemClick(item.id)}
                  className="carousel-im"
                  style={{ cursor: "pointer" }}
                />
              </div>

              <div className="item-pr">${item.item?.usdPrice}</div>

              <div className="recommended-price">
                {cryptoValue
                  ? `${cryptoValue} ${item.item.cryptocurrency}`
                  : "Price in crypto N/A"}
              </div>

              <div
                className="item-type-stars"
                onClick={() => {
                  setItemData(item);
                  router.push("/reviewPage");
                }}
                title="View reviews of this item"
              >
                {averageRating
                  ? "★".repeat(Math.round(averageRating)) +
                    "☆".repeat(5 - Math.round(averageRating))
                  : "No rating"}
              </div>

              <div onClick={() => handleItemClick(item.id)} className="item-n">
                {item.item?.name}
              </div>
            </div>
          );
        })}
      </div>

      <div className="carousel-arr">
        <LeftOutlined onClick={() => scrollCarousel("left")} className="arrow-but" />
        <RightOutlined onClick={() => scrollCarousel("right")} className="arrow-but" />
      </div>
    </div>
  );
}

export default TopTopic;