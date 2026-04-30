"use client";

import React, { useEffect, useState } from "react";
import "./SimilarItemId.css";

const API_BASE = "https://api.malidag.com";

const SimilarItemId = ({ itemId }) => {
  const [similarItems, setSimilarItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) return;

    const fetchSimilarItems = async () => {
      try {
        setLoading(true);

        const similarRes = await fetch(`${API_BASE}/api/similar-items/${itemId}`);
        const similarData = await similarRes.json();

        if (!similarRes.ok) {
          setSimilarItems([]);
          return;
        }

        const similarIds = similarData.similarItemIds || [];

        if (!similarIds.length) {
          setSimilarItems([]);
          return;
        }

        const itemsRes = await fetch(`${API_BASE}/items`);
        const allItems = await itemsRes.json();

        if (!itemsRes.ok || !Array.isArray(allItems)) {
          setSimilarItems([]);
          return;
        }

        const matchedItems = allItems.filter((product) =>
          similarIds.includes(String(product.itemId))
        );

        setSimilarItems(matchedItems);
      } catch (error) {
        console.error("Error loading similar items:", error);
        setSimilarItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarItems();
  }, [itemId]);

  if (loading) return <p className="similar-items-loading">Loading similar items...</p>;
  if (!similarItems.length) return null;

  const compactLayout = similarItems.length <= 3;

  return (
    <section className="similar-items-section">
      <div className="similar-items-header">
        <h2 className="similar-items-title">Get what's right for you.</h2>
        <p className="similar-items-subtitle">Compare similar options picked for this item.</p>
      </div>

      <div
        className={
          compactLayout
            ? "similar-items-scroll similar-items-scroll-wide"
            : "similar-items-scroll similar-items-scroll-normal"
        }
      >
        {similarItems.map((product) => {
          const image = product.item?.images?.[0];
          const name = product.item?.name;
          const brand = product.item?.brand;
          const price = product.item?.usdPrice;
          const productId = product.itemId;
          const itemId = product.id;

          return (
            <article
              key={productId}
              className={
                compactLayout
                  ? "similar-item-card similar-item-card-wide"
                  : "similar-item-card similar-item-card-normal"
              }
            >
              <div className="similar-item-image-wrap">
                {image && (
                  <img
                    src={encodeURI(image)}
                    alt={name || "Similar item"}
                    className="similar-item-image"
                  />
                )}
              </div>

              <div className="similar-item-info">
                {brand && <h3 className="similar-item-brand">{brand}</h3>}

                {name && <p className="similar-item-name">{name}</p>}

                {price && <p className="similar-item-price">${price}</p>}

                <button
                  type="button"
                  className="similar-item-buy-btn"
                  onClick={() => {
                    window.location.href = `/product/${itemId}`;
                  }}
                >
                  Buy now
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarItemId;