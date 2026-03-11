"use client";

import React, { useState, useEffect } from "react";
import "./recomendedItem.css";
import { useRouter } from "next/navigation";
import axios from "axios";

const BASE_URL = "https://api.malidag.com";
const CACHE_KEY = "recommendedItems_first20";
const MAX_CACHE_ITEMS = 20;

function RecommendedItem() {
  const router = useRouter();
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(`${BASE_URL}/crypto-prices`);
      const prices = await response.json();
      setCryptoPrices(prices || {});
    } catch (error) {
      console.error("❌ Error fetching crypto prices:", error);
    }
  };

  const fetchReviews = async (productId) => {
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

        setReviews((prev) => ({
          ...prev,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setReviews((prev) => ({
          ...prev,
          [productId]: { averageRating: null, reviewsArray: [] },
        }));
      } else {
        console.error("❌ Error fetching reviews:", error);
      }
    }
  };

  useEffect(() => {
    const loadCachedItems = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return false;

        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecommendedItems(parsed);
          setLoadingRecommendations(false);
          return true;
        }
      } catch (error) {
        console.error("❌ Error reading recommended cache:", error);
      }

      return false;
    };

    const fetchRecommendedItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/recommended-items?min=1&max=50`);
        const data = await response.json();

        const freshItems = (data.items || []);
        setRecommendedItems(freshItems);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify(freshItems.slice(0, MAX_CACHE_ITEMS))
        );

        await Promise.all([
          ...freshItems.map((item) => fetchReviews(item.itemId)),
          fetchCryptoPrices(),
        ]);
      } catch (error) {
        console.error("❌ Error fetching recommended items:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadCachedItems();
    fetchRecommendedItems();
  }, []);

  const convertToCrypto = (usdPrice, crypto) => {
    if (!crypto || !cryptoPrices[crypto]) return null;
    const cryptoPrice = parseFloat(cryptoPrices[crypto]);
    if (!cryptoPrice || isNaN(cryptoPrice)) return null;
    return (usdPrice / cryptoPrice).toFixed(2);
  };

  const toggleDetails = (itemId) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  return (
    <div className="recommended-items-container">
      <h2 className="recommended-title">Recommended Products</h2>

      <div className="recommended-grid">
        {loadingRecommendations && recommendedItems.length === 0 ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="recommended-item skeleton-card">
              <div className="rec-img skeleton-image" />
              <div className="recommended-info">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))
        ) : (
          recommendedItems.map((item) => {
            const ratingObj = reviews[item.itemId];
            const averageRating = ratingObj ? ratingObj.averageRating : null;
            const cryptoValue =
              item.item?.usdPrice && item.item?.cryptocurrency
                ? convertToCrypto(Number(item.item.usdPrice), item.item.cryptocurrency)
                : null;

            return (
              <div className="recommended-item" key={item.id}>
                <div className="rec-img">
                  <img
                    src={item.item?.images?.[0] || "/fallback.png"}
                    alt={item.item?.name || "Recommended item"}
                    className="recommended-image"
                    onClick={() => handleItemClick(item.id)}
                  />
                </div>

                <div className="recommended-info">
                  <p onClick={() => handleItemClick(item.id)} className="recommended-name">
                    {item.item?.name}
                  </p>

                  <div className="item-sta">
                    {averageRating
                      ? "★".repeat(Math.round(averageRating)) +
                        "☆".repeat(5 - Math.round(averageRating))
                      : "No rating"}
                  </div>

                  <div className="recommended-price">${item.item?.usdPrice}</div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="recommended-price">
                      {cryptoValue
                        ? `${cryptoValue} ${item.item.cryptocurrency}`
                        : "Price in crypto N/A"}
                    </div>

                    <div
                      style={{
                        color: "#cf7704",
                        fontSize: "14px",
                        marginLeft: "10px",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleDetails(item.id)}
                    >
                      view price
                    </div>
                  </div>

                  {expandedItemId === item.id && (
                    <div className="recommended-pi">
                      {cryptoPrices[item.item?.cryptocurrency]
                        ? `1 ${item.item.cryptocurrency} = $${Number(
                            cryptoPrices[item.item.cryptocurrency]
                          ).toFixed(5)}`
                        : "N/A"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RecommendedItem;