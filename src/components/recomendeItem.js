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
  const [reviews, setReviews] = useState({});
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

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
          ? (totalRating / reviewsArray.length).toFixed(1)
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch {
      setReviews((prev) => ({
        ...prev,
        [productId]: {
          averageRating: 4.3,
          reviewsArray: Array(133).fill({ rating: 4.3 }),
          fallback: true,
        },
      }));
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

        const freshItems = data.items || [];

        setRecommendedItems(freshItems);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify(freshItems.slice(0, MAX_CACHE_ITEMS))
        );
      } catch (error) {
        console.error("❌ Error fetching recommended items:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadCachedItems();
    fetchRecommendedItems();
  }, []);

  useEffect(() => {
    recommendedItems.forEach((item) => {
      if (item?.itemId && !reviews[item.itemId]) {
        fetchReviews(item.itemId);
      }
    });
  }, [recommendedItems]);

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  const getStockText = (item) => {
    const stock = Number(item?.details?.numberItemText || item?.item?.numberOfItems);

    if (!stock || stock >= 100) return null;

    return `Only ${stock} left in stock`;
  };

  const getSoldText = (item) => {
    const sold = Number(item?.item?.sold || item?.details?.soldText);

    if (!sold || sold <= 0) return null;

    return `${sold}+ sold`;
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
            const averageRating = ratingObj?.averageRating || 4.3;
            const reviewCount = ratingObj?.reviewsArray?.length || 133;
            const roundedRating = Math.round(averageRating);
            const stockText = getStockText(item);
            const soldText = getSoldText(item);

            return (
              <div className="recommended-item" key={item.id}>
                <div className="rec-img" onClick={() => handleItemClick(item.id)}>
                  <img
                    src={item.item?.images?.[0] || "/fallback.png"}
                    alt={item.item?.name || "Recommended item"}
                    className="recommended-image"
                  />
                </div>

                <div className="recommended-info">
                  <p
                    onClick={() => handleItemClick(item.id)}
                    className="recommended-name"
                  >
                    {item.item?.name}
                  </p>

                  <div className="item-sta">
                    {"★".repeat(roundedRating)}
                    {"☆".repeat(5 - roundedRating)}
                    <span className="review-count"> ({reviewCount} reviews)</span>
                  </div>

                  {soldText && <div className="recommended-sold">{soldText}</div>}

                  {stockText && (
                    <div className="recommended-stock">{stockText}</div>
                  )}

                  <div className="recommended-price">
                    ${item.item?.usdPrice}
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

export default RecommendedItem;