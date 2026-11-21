
"use client";

import { useEffect, useState } from "react";

export default function useProductReviews(
  topItems,
  brandItems,
  bestSeller
) {
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    const products = [
      ...topItems,
      ...brandItems,
      ...(bestSeller ? [bestSeller] : []),
    ];

    const productIds = [
      ...new Set(
        products.map((item) => item?.itemId).filter(Boolean)
      ),
    ];

    let cancelled = false;

    productIds.forEach(async (productId) => {
      try {
        const response = await fetch(
          `https://api.malidag.com/get-reviews/${productId}`
        );

        const data = await response.json();
        const reviewList = Array.isArray(data?.reviews)
          ? data.reviews
          : [];

        const total = reviewList.reduce(
          (sum, review) => sum + Number(review?.rating || 0),
          0
        );

        const rating = reviewList.length
          ? total / reviewList.length
          : 0;

        if (!cancelled) {
          setReviews((previous) => ({
            ...previous,
            [productId]: {
              rating,
              count: reviewList.length,
              reviews: reviewList,
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);

        if (!cancelled) {
          setReviews((previous) => ({
            ...previous,
            [productId]: {
              rating: 0,
              count: 0,
              reviews: [],
            },
          }));
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [topItems, brandItems, bestSeller]);

  return reviews;
}
