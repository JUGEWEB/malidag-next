'use client';

import React, { useState, useEffect } from "react";
import "./recomendedItem.css";
import { useRouter } from "next/navigation";
import axios from "axios";

const BASE_URL = "https://api.malidag.com";
const CACHE_KEY = "recommendedItems_first20";
const MAX_CACHE_ITEMS = 20;

function MenFaRecommended() {
  const router = useRouter();
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const getCryptoIcon = (cryptocurrency) => {
    const cryptoIcons = {
      USDT: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
      USDC: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
      BUSD: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
    };

    return cryptoIcons[cryptocurrency] || "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png";
  };

  const renderStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

      if (response.data?.success) {
        const reviewsArray = Array.isArray(response.data.reviews)
          ? response.data.reviews
          : [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review?.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating,
            count: reviewsArray.length,
            reviewsArray,
          },
        }));
      } else {
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating: null,
            count: 0,
            reviewsArray: [],
          },
        }));
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating: null,
            count: 0,
            reviewsArray: [],
          },
        }));
      } else {
        console.error("Error fetching reviews:", error);
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

          Promise.all(
            parsed.map((item) => {
              const productId = item?.itemId;
              return productId ? fetchReviews(productId) : Promise.resolve();
            })
          ).catch((error) => {
            console.error("Error fetching cached reviews:", error);
          });

          return true;
        }
      } catch (error) {
        console.error("Error reading recommended cache:", error);
      }

      return false;
    };

    const fetchRecommendedItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/items`);
        const data = await response.json();

        const itemsArray = Array.isArray(data) ? data : [];

        const filteredItems = itemsArray.filter((item) => {
          const price = parseFloat(item?.item?.usdPrice ?? 0);
          const category = item?.category || "";
          const coin = item?.item?.cryptocurrency || "";

          return (
            category.toLowerCase() === "shoes" &&
            price >= 1 &&
            price <= 50 &&
            ["USDT", "USDC", "BUSD"].includes(coin)
          );
        });

        const shuffledItems = [...filteredItems].sort(() => 0.5 - Math.random());
        const selectedItems = shuffledItems.slice(0, 30);

        setRecommendedItems(selectedItems);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify(selectedItems.slice(0, MAX_CACHE_ITEMS))
        );

        await Promise.all(
          selectedItems.map((item) => {
            const productId = item?.itemId;
            return productId ? fetchReviews(productId) : Promise.resolve();
          })
        );
      } catch (error) {
        console.error("Error fetching recommended items:", error);
        setRecommendedItems([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadCachedItems();
    fetchRecommendedItems();
  }, []);

  const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  return (
    <div className="recommended-items-container">
      <h2 className="recommended-title">Recommended Products</h2>

      <div className="recommended-grid">
        {loadingRecommendations && recommendedItems.length === 0 ? (
          [...Array(8)].map((_, index) => (
            <div className="recommended-item skeleton-card" key={index}>
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
            const productId = item?.itemId;
            const reviewData = reviews[productId];
            const averageRating = reviewData?.averageRating;
            const reviewCount = reviewData?.count || 0;
            const stableCoin = item?.item?.cryptocurrency || "USDT";

            return (
              <div className="recommended-item" key={item?.id || productId}>
                <div className="rec-img">
                  <img
                    src={item?.item?.images?.[0] || "/fallback.png"}
                    alt={item?.item?.name || "Recommended item"}
                    className="recommended-image"
                    onClick={() => handleItemClick(item?.id)}
                  />
                </div>

                <div className="recommended-info">
                  <p
                    className="recommended-name"
                    onClick={() => handleItemClick(item?.id)}
                  >
                    {item?.item?.name || "Unnamed product"}
                  </p>

                  <div className="item-sta">
                    {averageRating ? renderStars(averageRating) : "No rating"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "6px",
                    }}
                  >
                    {averageRating
                      ? `${averageRating}/5 (${reviewCount} reviews)`
                      : "No reviews yet"}
                  </div>

                  <div className="recommended-price">
                    ${item?.item?.usdPrice || "0"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "6px",
                    }}
                  >
                    <div className="recommended-price">{stableCoin}</div>
                    <img
                      src={getCryptoIcon(stableCoin)}
                      alt={stableCoin}
                      style={{ width: "16px", height: "16px" }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MenFaRecommended;