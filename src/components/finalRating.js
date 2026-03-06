"use client";

import { useState, useEffect } from "react";

const useFinalRating = (productId) => {
  const [finalRating, setFinalRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ratingPercentages, setRatingPercentages] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    fetch(`https://api.malidag.com/get-reviews/${productId}`)
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          const reviewsArray = data.reviews;

          const calculateFinalRating = (reviews) => {
            const totalRating = reviews.reduce((acc, review) => {
              let rating = parseFloat(review.rating);
              return acc + (isNaN(rating) ? 5 : rating);
            }, 0);
            return reviews.length ? (totalRating / reviews.length).toFixed(2) : NaN;
          };

          const ratingCounts = [0, 0, 0, 0, 0];
          reviewsArray.forEach((review) => {
            let rating = parseFloat(review.rating);
            if (!isNaN(rating) && rating >= 1 && rating <= 5) {
              ratingCounts[Math.round(rating) - 1]++;
            } else {
              ratingCounts[4]++;
            }
          });

          const totalReviews = reviewsArray.length;
          const percentages = ratingCounts.map((count) => ((count / totalReviews) * 100).toFixed(2));

          setRatingPercentages(percentages);

          setFinalRating(calculateFinalRating(reviewsArray));
        } else {
          setError("No reviews found for this Product ID");
        }
      })
      .catch((error) => {
        setLoading(false);
        setError("Error fetching reviews");
        console.error("Error fetching reviews:", error);
      });
  }, [productId]);

  return { finalRating, loading, error, ratingPercentages };
};

export default useFinalRating;
