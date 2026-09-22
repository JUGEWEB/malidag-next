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
  const [loading, setLoading] = useState(true);
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

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const filtered = normalized.filter((i) => {
          const d = new Date(i.createdAt);
          return !isNaN(d) && d >= twoMonthsAgo;
        });

        setItems(filtered);

        const brands = [
  ...new Set(
    filtered
      .map(
        (itemData) =>
          itemData?.item?.brand ||
          itemData?.details?.brand
      )
      .filter(Boolean)
      .map((brand) =>
        String(brand).trim()
      )
  ),
];

        filtered.slice(0, 20).forEach((i) => fetchReviews(i.itemId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const relatedBrands = useMemo(() => {
  return [
    ...new Set(
      items
        .map(
          (itemData) =>
            itemData?.item?.brand ||
            itemData?.details?.brand
        )
        .filter(Boolean)
        .map((brand) =>
          String(brand).trim()
        )
    ),
  ];
}, [items]);


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
     {relatedBrands.length > 0 && (
  <section className="tp-brands">
    <div className="tp-brands-head">
      <div>
        <span className="tp-brands-eyebrow">
          Discover more
        </span>

        <h2 className="tp-brands-title">
          Related Brands
        </h2>
      </div>
    </div>

    <div className="tp-brand-list">
      {relatedBrands.map((brand) => (
        <button
          key={brand}
          type="button"
          className="tp-brand-pill"
          onClick={() =>
            router.push(
              `/brand/${encodeURIComponent(
                brand
              )}`
            )
          }
        >
          {brand}
          <span className="tp-brand-arrow">
            →
          </span>
        </button>
      ))}
    </div>
  </section>
)}

     {latestItems.length === 0 ? (
  <div className="tp-empty-state">
    <div className="tp-empty-icon">
      <span>✦</span>
    </div>

    <span className="tp-empty-label">
      New arrivals
    </span>

    <h2>
      Fresh finds are on the way
    </h2>

    <p>
      We don't have any new products to
      show right now, but we're always
      adding something new. Check back
      soon for the latest arrivals.
    </p>

    <button
      type="button"
      className="tp-empty-action"
      onClick={() => router.push("/")}
    >
      Continue shopping
      <span>→</span>
    </button>
  </div>
) : (
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
      )}
    </div>
  );
}