"use client";

import React, { useEffect, useState } from "react";

const SimilarItemId = ({ itemId }) => {
  const [similarItems, setSimilarItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) return;

    const fetchSimilarItems = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `https://api.malidag.com/api/similar-items/${itemId}/full`
        );

        const contentType = res.headers.get("content-type");

        const data = contentType?.includes("application/json")
          ? await res.json()
          : [];

        if (!res.ok) {
          console.error("Failed to fetch similar items:", data);
          setSimilarItems([]);
          return;
        }

        setSimilarItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching similar items:", error);
        setSimilarItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarItems();
  }, [itemId]);

  if (loading) return <p>Loading similar items...</p>;

  if (!similarItems.length) return null;

  return (
    <div className="similar-items-section">
      <h2 className="similar-items-title">Similar Items</h2>

      <div className="similar-items-grid">
        {similarItems.map((product) => (
          <div
            key={product.id || product.itemId}
            className="similar-item-card"
          >
            <img
              src={product.item?.image || product.image}
              alt={product.item?.name || "Similar item"}
              className="similar-item-image"
            />

            <h3 className="similar-item-name">
              {product.item?.name}
            </h3>

            <p className="similar-item-price">
              ${product.item?.price}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarItemId;