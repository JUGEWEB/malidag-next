"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./beautyTopTopic.css"

import AnalyseReview from "./analyseReview";

const BASE_URL = "https://api.malidag.com";

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
};

const normalizeItemsResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const BeautyTopTopic = ({ type }) => {
  const [topBeautyItems, setTopBeautyItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemProductId, setSelectedItemProductId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  const { t, i18n } = useTranslation();
  const router = useRouter();

  const safeType = typeof type === "string" ? type : "";
  const formattedType = safeType.replace(/-/g, " ");
  const normalizedType = normalizeText(safeType);
  console.log("type: " , safeType)
  console.log("typez: " , type)

  const fetchReviews = async (id) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/get-reviews/${id}`);
      const arr = Array.isArray(data?.reviews) ? data.reviews : [];

      const avg = arr.length
        ? (
            arr.reduce((sum, review) => {
              return sum + (parseFloat(review?.rating) || 0);
            }, 0) / arr.length
          ).toFixed(1)
        : null;

      setReviews((prev) => ({
        ...prev,
        [id]: { averageRating: avg },
      }));
    } catch (error) {
      setReviews((prev) => ({
        ...prev,
        [id]: { averageRating: null },
      }));
    }
  };

  const fetchTranslation = async (id, lang) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/translate-item/${id}?lang=${lang}`
      );

      if (data?.translatedItem) {
        setTranslations((prev) => ({
          ...prev,
          [id]: data.translatedItem,
        }));
      }
    } catch (error) {
      // silent fail
    }
  };

  const getTranslatedName = (item, itemId) => {
    return translations[itemId]?.name || item?.name || "";
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
    setSelectedItemId(null);
    setSelectedItemProductId(null);
  };

  const handleRatingClick = (e, itemId, productId) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setModalPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + 40,
    });

    setSelectedItem(itemId);
    setSelectedItemId(itemId);
    setSelectedItemProductId(productId);
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchTopBeautyItems = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${BASE_URL}/items`);
        const data = normalizeItemsResponse(response?.data);

        const mappedItems = data
          .filter((itemData) => itemData && itemData.item)
          .map((itemData) => {
            const category = normalizeText(itemData?.category);
            const itemType = normalizeText(itemData?.item?.type);
            const sold = Number(itemData?.item?.sold ?? 0);

            return {
              ...itemData,
              id: itemData?.id || itemData?._id || itemData?.itemId,
              _normalizedCategory: category,
              _normalizedType: itemType,
              _soldNumber: Number.isNaN(sold) ? 0 : sold,
            };
          });

        // primary: beauty + type
        let filteredItems = mappedItems.filter((itemData) => {
          const categoryLooksBeauty =
            itemData._normalizedCategory === "beauty" ||
            itemData._normalizedCategory.includes("beauty");

          return (
            categoryLooksBeauty &&
            itemData._normalizedType === normalizedType
          );
        });

        // fallback 1: type only
        if (!filteredItems.length) {
          filteredItems = mappedItems.filter(
            (itemData) => itemData._normalizedType === normalizedType
          );
        }

        // fallback 2: partial type match
        if (!filteredItems.length && normalizedType) {
          filteredItems = mappedItems.filter((itemData) => {
            return (
              itemData._normalizedType.includes(normalizedType) ||
              normalizedType.includes(itemData._normalizedType)
            );
          });
        }

        // sort by sold desc instead of hard requiring >= 100
        filteredItems = filteredItems
          .sort((a, b) => b._soldNumber - a._soldNumber)
          .slice(0, 24);

        const lang = i18n.language || "en";

        filteredItems.forEach((itemData) => {
          if (itemData?.itemId) {
            fetchTranslation(itemData.itemId, lang);
            fetchReviews(itemData.itemId);
          }
        });

        setTopBeautyItems(filteredItems);

        console.log("BeautyTopTopic debug:", {
          routeType: safeType,
          normalizedType,
          totalItems: data.length,
          matchedItems: filteredItems.length,
          sampleMatches: filteredItems.slice(0, 5),
        });
      } catch (error) {
        console.error("Error fetching top beauty items:", error);
        setTopBeautyItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (safeType) {
      fetchTopBeautyItems();
    } else {
      setTopBeautyItems([]);
      setLoading(false);
    }
  }, [safeType, normalizedType, i18n.language]);

  const titleText = useMemo(() => {
    return formattedType ? `${t(formattedType)} - ${t("top_items")}` : t("top_items");
  }, [formattedType, t]);

  if (loading) {
    return (
      <div className="loading-message">
        {t("loading")} {formattedType ? t(formattedType) : ""} {t("top_items")}...
      </div>
    );
  }

  return (
    <div className="beauty-top-container">
      <h2 className="beauty-top-title">{titleText}</h2>

      <div className="ms-grid">
        {topBeautyItems.length === 0 ? (
          <p>{t("no_top_selling_items", { type: t(formattedType || safeType || "items") })}</p>
        ) : (
          topBeautyItems.map((itemData) => {
            const { id, itemId, item } = itemData;

            const reviewsData = reviews[itemId] || {};
            const finalRating = reviewsData?.averageRating ?? t("no_rating");
            const translatedName = getTranslatedName(item, itemId);
            const imageSrc = item?.images?.[0] || "/fallback.png";
            const productLinkId = id || itemId;

            return (
              <div key={productLinkId} className="m-card">
                <img
                  src={imageSrc}
                  alt={translatedName || item?.name || "product image"}
                  className="m-image"
                  onClick={() => router.push(`/product/${productLinkId}`)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/fallback.png";
                  }}
                />

                <div className="m-details">
                  <div className="rating-name-wrapper">
                    <div
                      className="item-stars"
                      onClick={(e) => handleRatingClick(e, itemId, productLinkId)}
                    >
                      {finalRating !== t("no_rating") && !isNaN(Number(finalRating))
                        ? "★".repeat(Math.round(Number(finalRating))) +
                          "☆".repeat(5 - Math.round(Number(finalRating)))
                        : t("no_rating")}
                    </div>

                    <h3
                      className="m-name"
                      onClick={() => router.push(`/product/${productLinkId}`)}
                    >
                      {translatedName.length > 80
                        ? `${translatedName.slice(0, 80)}...`
                        : translatedName}
                    </h3>
                  </div>

                  <p className="m-sold">
                    {t("sold")}: {itemData?._soldNumber ?? 0} {t("items")}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && selectedItemProductId && (
        <div
          className="modal-content"
          style={{
            position: "absolute",
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
            zIndex: 1000,
            color: "black",
          }}
        >
          <span className="close-btn" onClick={closeModal}>
            &times;
          </span>

          <AnalyseReview
            productId={selectedItemProductId}
            id={selectedItemId}
            onRatingClick={handleRatingClick}
          />
        </div>
      )}
    </div>
  );
};

export default BeautyTopTopic;