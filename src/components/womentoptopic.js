"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import "./WomenTopTopic.css";
import AnalyseReview from "./analyseReview";

const BASE_URL = "https://api.malidag.com";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

const formatTypeLabel = (value = "") =>
  String(value)
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const WomenTopTopic = () => {
  const params = useParams();
  const router = useRouter();
  const type = params?.type || "";

  const [topBeautyItems, setTopBeautyItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemProductId, setSelectedItemProductId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);

  const readableType = useMemo(() => formatTypeLabel(type), [type]);

  const fetchReviews = async (productId) => {
    if (!productId) return;

    try {
      const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

      if (response?.data?.success) {
        const reviewsArray = response.data.reviews || [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review?.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

        setReviews((prevReviews) => ({
          ...prevReviews,
          [productId]: {
            averageRating,
            reviewsArray,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    const fetchTopBeautyItems = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${BASE_URL}/items`);

        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.items)
          ? response.data.items
          : [];

        const normalizedType = normalize(type);

        const filteredItems = data
          .filter((itemData) => {
            const genre = normalize(itemData?.item?.genre);
            const itemType = normalize(itemData?.item?.type);
            const sold = Number(itemData?.item?.sold || 0);

            return genre === "women" && itemType === normalizedType && sold >= 100;
          })
          .sort((a, b) => Number(b?.item?.sold || 0) - Number(a?.item?.sold || 0));

        setTopBeautyItems(filteredItems);

        filteredItems.forEach((itemData) => {
          if (itemData?.itemId) {
            fetchReviews(itemData.itemId);
          }
        });
      } catch (error) {
        console.error("Error fetching top women items:", error);
        setTopBeautyItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (type) {
      fetchTopBeautyItems();
    } else {
      setTopBeautyItems([]);
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const handleCloseOnOutsideClick = (event) => {
      if (
        modalOpen &&
        !event.target.closest(".modal-content") &&
        !event.target.closest(".item-starstop")
      ) {
        closeModal();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleCloseOnOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleCloseOnOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modalOpen]);

  const openModal = (item) => {
  setSelectedItem(item);
  setSelectedItemId(item?.id || null);
  setSelectedItemProductId(item?.itemId || null);
  setModalOpen(true);
};

  const closeModal = () => {
    setSelectedItem(null);
    setSelectedItemId(null);
    setSelectedItemProductId(null);
    setModalOpen(false);
  };

  const handleRatingClick = (rating) => {
    console.log(`User selected ${rating} stars for product ID: ${selectedItemId}`);

    if (selectedItemId) {
      router.push(`/product/${selectedItemId}`);
    } else {
      console.error("Error: Product ID is undefined");
    }
  };

  if (loading) {
    return (
      <div className="beauty-top-container">
        <h2 className="beauty-top-title">{readableType} - Top Items</h2>
        <div className="loading-message">Loading {readableType} top items...</div>
      </div>
    );
  }

  return (
    <div className="beauty-top-container">
      <h2 className="beauty-top-title">{readableType} - Top Items</h2>

      <div className="ms-grid">
        {topBeautyItems.length === 0 ? (
          <div className="empty-state">
            <p>No top-selling items found for {readableType}.</p>
          </div>
        ) : (
          topBeautyItems.map((itemData) => {
            const { id, itemId, item } = itemData;
            const reviewsData = reviews[itemId] || {};
            const finalRating = reviewsData?.averageRating || null;
            const soldCount = Number(item?.sold || 0);
            const imageSrc = item?.images?.[0] || itemData?.image_url || "";

            return (
              <div key={id} className="m-card">
                <div className="m-image-wrap">
                  <img
                    src={imageSrc}
                    alt={item?.name || "Product image"}
                    className="m-image"
                    onClick={() => router.push(`/product/${id}`)}
                  />
                </div>

                <div className="m-details">
                  <div className="name-rating-wrapper">
                    <div
                      className="m-name"
                      onClick={() => router.push(`/product/${id}`)}
                      title={item?.name || ""}
                    >
                      {item?.name?.length > 80
                        ? `${item.name.slice(0, 80)}...`
                        : item?.name || "Unnamed product"}
                    </div>

                   <button
                    type="button"
                    className="item-starstop"
                    onClick={() => openModal({ id, itemId, item })}
                    title="View reviews"
                  >
                    {finalRating
                      ? "★".repeat(Math.round(finalRating)) +
                        "☆".repeat(5 - Math.round(finalRating))
                      : "No rating"}
                  </button>
                  </div>

                  <div className="m-meta-row">
                    <p className="m-sold">Sold: {soldCount} items</p>
                    {!!item?.usdPrice && <p className="m-price">${item.usdPrice}</p>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && selectedItemProductId && (
  <div className="review-modal-overlay" onClick={closeModal}>
    <div
      className="review-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="review-modal-close"
        onClick={closeModal}
        aria-label="Close modal"
      >
        ×
      </button>

      {selectedItem?.item?.name && (
        <div className="review-modal-header">
          <h3 className="review-modal-title">{selectedItem.item.name}</h3>
          <p className="review-modal-subtitle">Customer reviews and rating details</p>
        </div>
      )}

      <div className="review-modal-body">
        <AnalyseReview
          productId={selectedItemProductId}
          id={selectedItemId}
          onRatingClick={handleRatingClick}
        />
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default WomenTopTopic;