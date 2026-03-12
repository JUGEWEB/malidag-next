"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import "./shoesTopTopic.css";
import AnalyseReview from "./analyseReview";

const BASE_URL = "https://api.malidag.com";

const ShoesTopTopic = () => {
  const params = useParams();
  const router = useRouter();

  const type = params?.type || "";
  const genre = params?.genre || "";

  const [topShoesItems, setTopShoesItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemProductId, setSelectedItemProductId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopShoesItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = Array.isArray(response.data) ? response.data : [];

        const filteredItems = data.filter((product) => {
          const category = product?.category?.toLowerCase?.() || "";
          const productType = product?.item?.type?.toLowerCase?.() || "";
          const productGenre = product?.item?.genre?.toLowerCase?.() || "";
          const sold = Number(product?.item?.sold || 0);

          return (
            category === "shoes" &&
            productType === type.toLowerCase() &&
            productGenre === genre.toLowerCase() &&
            sold >= 100
          );
        });

        setTopShoesItems(filteredItems);
      } catch (error) {
        console.error("Error fetching top shoes items:", error);
        setTopShoesItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (!type || !genre) {
      setLoading(false);
      return;
    }

    fetchTopShoesItems();
  }, [type, genre]);

  const openModal = (item, event) => {
    setSelectedItem(item);
    setSelectedItemId(item.id);
    setSelectedItemProductId(item.itemId);

    const rect = event.target.getBoundingClientRect();
    setModalPosition({
      top: rect.top + window.scrollY + 30,
      left: rect.left + window.scrollX + 10,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setSelectedItemId(null);
    setSelectedItemProductId(null);
    setModalOpen(false);
  };

  const handleRatingClick = () => {
    if (selectedItemId) {
      router.push(`/product/${selectedItemId}`);
    } else {
      console.error("Error: Product ID is undefined");
    }
  };

 if (loading) {
  return (
    <div className="topic-page">
      <div className="topic-shell">
        <div className="topic-loading">
          <div className="topic-loading-title" />
          <div className="topic-loading-subtitle" />

          <div className="topic-loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="topic-skeleton-card">
                <div className="topic-skeleton-image" />
                <div className="topic-skeleton-line topic-skeleton-line-lg" />
                <div className="topic-skeleton-line" />
                <div className="topic-skeleton-line topic-skeleton-line-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="topic-page">
    <div className="topic-shell">
      <section className="topic-hero">
        <div className="topic-hero-copy">
          <span className="topic-kicker">Top Performing Footwear</span>
          <h1 className="topic-title">
            {genre} {type.replace(/-/g, " ")}
          </h1>
          <p className="topic-subtitle">
            A curated selection of best-selling shoes with strong demand,
            standout reviews, and proven customer interest.
          </p>

          <div className="topic-hero-stats">
            <div className="topic-stat">
              <strong>{topShoesItems.length}</strong>
              <span>Top items</span>
            </div>
            <div className="topic-stat">
              <strong>{genre}</strong>
              <span>Audience</span>
            </div>
            <div className="topic-stat">
              <strong>{type.replace(/-/g, " ")}</strong>
              <span>Category</span>
            </div>
          </div>
        </div>

        <div className="topic-hero-side">
          <div className="topic-hero-panel">
            <span className="topic-panel-kicker">Selection rule</span>
            <strong>Sold 100+ units</strong>
            <p>Only strong-selling products appear in this ranking.</p>
          </div>
        </div>
      </section>

      <section className="topic-results-section">
        <div className="topic-section-head">
          <div>
            <span className="topic-section-kicker">Ranked Products</span>
            <h2>Top sellers board</h2>
          </div>
          <span className="topic-results-meta">
            {topShoesItems.length} results
          </span>
        </div>

        {topShoesItems.length === 0 ? (
          <div className="topic-empty">
            <h3>No top-selling items found</h3>
            <p>
              We could not find products matching {genre}{" "}
              {type.replace(/-/g, " ")} with strong sales performance.
            </p>
          </div>
        ) : (
          <div className="topic-grid">
            {topShoesItems.map(({ itemId, id, item }, index) => (
              <article key={id} className="topic-card">
                <div className="topic-card-media">
                  <img
                    src={item?.images?.[0] || "/placeholder.jpg"}
                    alt={item?.name || "Product image"}
                    className="topic-card-image"
                    onClick={() => router.push(`/product/${id}`)}
                  />

                  <div className="topic-rank-badge">
                    #{index + 1}
                  </div>

                  <div className="topic-sales-badge">
                    {Number(item?.sold || 0)} sold
                  </div>
                </div>

                <div className="topic-card-body">
                  <div
                    className="topic-card-main"
                    onClick={() => router.push(`/product/${id}`)}
                  >
                    <h3 className="topic-card-title">
                      {item?.name || "Unnamed product"}
                    </h3>

                    <div className="topic-card-meta">
                      <span>{genre}</span>
                      <span>{type.replace(/-/g, " ")}</span>
                    </div>
                  </div>

                  <div className="topic-card-actions">
                    <button
                      className="topic-secondary-btn"
                      onClick={(e) => openModal({ id, itemId, item }, e)}
                    >
                      Reviews & Analysis
                    </button>

                    <button
                      className="topic-primary-btn"
                      onClick={() => router.push(`/product/${id}`)}
                    >
                      View Product
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {modalOpen && selectedItemProductId && (
        <div className="topic-modal-backdrop" onClick={closeModal}>
          <div
            className="topic-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="topic-modal-close" onClick={closeModal}>
              ×
            </button>

            <div className="topic-modal-head">
              <span className="topic-section-kicker">Review Insight</span>
              <h3>Product analysis</h3>
            </div>

            <AnalyseReview
              productId={selectedItemProductId}
              id={selectedItemId}
              onRatingClick={handleRatingClick}
            />
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default ShoesTopTopic;