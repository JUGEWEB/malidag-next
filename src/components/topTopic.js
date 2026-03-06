"use client"

import React, { useState, useEffect } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useCheckoutStore } from "./checkoutStore";
import "./topTopic.css";
import { useRouter, usePathname } from "next/navigation";
import useScreenSize from "./useIsMobile";
import axios from "axios";

const BASE_URL = "https://api.malidag.com";

function TopTopic() {
   const router = useRouter();
  const [topItems, setTopItems] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reviews, setReviews] = useState({});
  const { isMobile, isTablet, isSmallMobile, isDesktop, isVerySmall } = useScreenSize();
  const { setItemData } = useCheckoutStore();

  const itemsPerSlide = 7;
  const itemsPerRow = isSmallMobile || isVerySmall ? 2 : isMobile ? 3 : 7;

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(`${BASE_URL}/crypto-prices`);
      const prices = await response.json();
      setCryptoPrices(prices);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
    }
  };

  const fetchReviews = async (productId) => {
  try {
    const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);
    if (response.data.success) {
      const reviewsArray = response.data.reviews || [];
      const totalRating = reviewsArray.reduce((acc, review) => {
        let rating = parseFloat(review.rating);
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
      // ✅ No reviews found, just skip
      setReviews((prevReviews) => ({
        ...prevReviews,
        [productId]: { averageRating: null, reviewsArray: [] },
      }));
    } else {
      console.error("Error fetching reviews:", error);
    }
  }
};


 useEffect(() => {
  const fetchTopItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/top-items?limit=100`);
      const sortedItems = await response.json();

      setTopItems(sortedItems);

      // Fetch reviews in parallel
      await Promise.all(sortedItems.map((item) => fetchReviews(item.itemId)));

      // Collect crypto symbols
      const symbols = [
        ...new Set(
          sortedItems
            .map((item) => item.item.cryptocurrency && `${item.item.cryptocurrency}USDT`)
            .filter(Boolean)
        ),
      ];

      await fetchCryptoPrices(symbols);
    } catch (error) {
      console.error("❌ Error fetching top items:", error);
    }
  };

  fetchTopItems();
}, []);


  const totalSlides = Math.ceil(topItems.length / itemsPerSlide);

  const handleNextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 0 ? totalSlides - 1 : prevSlide - 1));
  };

  const startIdx = currentSlide * itemsPerSlide;
  const currentItems = isDesktop
    ? topItems.slice(startIdx, startIdx + itemsPerSlide)
    : topItems;

  const convertToCrypto = (usdPrice, crypto) => {
    if (!cryptoPrices[crypto]) return null;
    const cryptoPrice = parseFloat(cryptoPrices[crypto]);
    return (usdPrice / cryptoPrice).toFixed(2);
  };

  const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  return (
    <div className="top-topic-caou">
      <div
        className="carousel-sli"
        style={{
          overflowX: isMobile || isSmallMobile || isVerySmall || isTablet ? "auto" : "hidden",
        }}
      >
        {currentItems.map((item) => {
          const ratingObj = reviews[item.itemId];
          const averageRating = ratingObj ? ratingObj.averageRating : null;

          return (
            <div key={item.id}>
              <div className="carousel-i">
                <img
                  src={item.item.images[0]}
                  alt={item.item.name}
                  onClick={() => handleItemClick(item.id)}
                  className="carousel-im"
                  style={{ cursor: "pointer" }}
                />
              </div>
              <div className="item-pr">${item.item.usdPrice}</div>
              <div className="recommended-price">
                {item.item.usdPrice && item.item.cryptocurrency
                  ? `${convertToCrypto(Number(item.item.usdPrice), item.item.cryptocurrency)} ${item.item.cryptocurrency}`
                  : "Price in crypto N/A"}
              </div>
              <div
                className="item-type-stars"
                onClick={() => {
    setItemData(item); // 🔥 Save to global store
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
                {item.item.name}
              </div>
            </div>
          );
        })}
      </div>
      {isDesktop && topItems.length > itemsPerSlide && (
        <div className="carousel-arr">
          <LeftOutlined onClick={handlePrevSlide} className="arrow-but" />
          <RightOutlined onClick={handleNextSlide} className="arrow-but" />
        </div>
      )}
    </div>
  );
}

export default TopTopic;
