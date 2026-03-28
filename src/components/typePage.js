"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DownOutlined, PlayCircleOutlined, UpOutlined } from "@ant-design/icons";
import axios from "axios";
import "./typePage.css";
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "./checkoutStore";

const BASE_URL = "https://api.malidag.com";

const normalizeItems = (data) => {
  const items =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];

  return items.filter(
    (item) =>
      item &&
      item.category &&
      item.item &&
      item.item.type &&
      Array.isArray(item.item.images)
  );
};

export default function TypePage() {
  const router = useRouter();
  const { setItemData } = useCheckoutStore();

  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reviews, setReviews] = useState({});

  const fetchReviews = async (id) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/get-reviews/${id}`);

      if (data.success) {
        const arr = data.reviews || [];
        const avg = arr.length
          ? (
              arr.reduce((a, r) => a + (parseFloat(r.rating) || 4), 0) / arr.length
            ).toFixed(1)
          : null;

        setReviews((prev) => ({
          ...prev,
          [id]: { averageRating: avg },
        }));
      }
    } catch {
      setReviews((prev) => ({
        ...prev,
        [id]: { averageRating: null },
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/items`);
        const normalized = normalizeItems(data);

        setAllItems(normalized);

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const filtered = normalized.filter((i) => {
          const d = new Date(i.createdAt);
          return !isNaN(d) && d >= twoMonthsAgo;
        });

        setItems(filtered);
        setCategoryTypes([
          ...new Set(normalized.map((i) => i.item.type.toLowerCase())),
        ]);

        filtered.slice(0, 20).forEach((i) => fetchReviews(i.itemId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleDropdown = (type) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const getItemsByType = (type) =>
    allItems.filter((i) => i.item.type.toLowerCase() === type).slice(0, 8);

  const handleItemClick = (id) => router.push(`/product/${id}`);

  const renderStars = (rating) => {
    const safeRating = Math.round(Number(rating) || 0);

    return (
      <div className="tp-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < safeRating ? "tp-star filled" : "tp-star"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const latestItems = useMemo(() => items, [items]);

  if (loading) {
    return (
      <div className="tp-loading-wrap">
        <div className="tp-loader" />
      </div>
    );
  }

  return (
    <div className="tp-page">
      <div className="tp-topbar">
        <div className="tp-topbar-head">
          <h2 className="tp-title">Shop by Type</h2>
          <p className="tp-subtitle">Explore fresh arrivals across related product types</p>
        </div>

        <div className="tp-type-pills">
          {categoryTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`tp-type-pill ${dropdownOpen[type] ? "active" : ""}`}
              onClick={() => toggleDropdown(type)}
            >
              <span>{type}</span>
              {dropdownOpen[type] ? <UpOutlined /> : <DownOutlined />}
            </button>
          ))}
        </div>
      </div>

      <div className="tp-dropdown-area">
        {categoryTypes.map(
          (type) =>
            dropdownOpen[type] && (
              <div key={type} className="tp-dropdown-card">
                <div className="tp-dropdown-header">
                  <h3>{type}</h3>
                  <span>{getItemsByType(type).length} items</span>
                </div>

                <div className="tp-related-grid">
                  {getItemsByType(type).map((item) => (
                    <div
                      key={item.id}
                      className="tp-related-item"
                      onClick={() => handleItemClick(item.id)}
                    >
                      <div className="tp-related-image-wrap">
                        <img
                          src={item.item.images[0]}
                          alt={item.item.name}
                          className="tp-related-image"
                        />
                      </div>
                      <div className="tp-related-name">
                        {item.item.name.length > 38
                          ? `${item.item.name.slice(0, 38)}...`
                          : item.item.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
      </div>

      <div className="tp-grid">
        {latestItems.map((itemData) => {
          const { itemId, id, item } = itemData;
          const rating = reviews[itemId]?.averageRating;

          const video = Array.isArray(item.videos)
            ? item.videos.find((v) => v?.endsWith(".mp4"))
            : item.videos?.endsWith(".mp4")
            ? item.videos
            : null;

          return (
            <div key={id} className="tp-card">
              <div className="tp-media">
                {video && <div className="tp-badge">Video</div>}

                {activeVideoId === id && video ? (
                  <video
                    src={video}
                    controls
                    autoPlay
                    className="tp-video"
                    onEnded={() => setActiveVideoId(null)}
                  />
                ) : (
                  <>
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="tp-image"
                      onClick={() => handleItemClick(id)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/fallback.png";
                      }}
                    />

                    {video && (
                      <button
                        type="button"
                        className="tp-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoId(id);
                        }}
                      >
                        <PlayCircleOutlined />
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="tp-info">
                <div className="tp-name" onClick={() => handleItemClick(id)}>
                  {item.name.length > 58 ? `${item.name.slice(0, 58)}...` : item.name}
                </div>

                <div className="tp-price-row">
                  <span className="tp-price">${Number(item.usdPrice || 0).toFixed(2)}</span>
                  <span className="tp-new-badge">New</span>
                </div>

                <div className="tp-rating-row">
                  {rating ? (
                    <>
                      {renderStars(rating)}
                      <span className="tp-rating-value">{rating}/5</span>
                    </>
                  ) : (
                    <span className="tp-no-reviews">No reviews yet</span>
                  )}
                </div>

                <button
                  type="button"
                  className="tp-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemData(itemData);
                    router.push("/review");
                  }}
                >
                  Buy Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}