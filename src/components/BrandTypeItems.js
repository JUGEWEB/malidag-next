"use client";

import React, { useEffect, useState } from "react";
import "./BrandTypeItems.css";

const API_BASE = "https://api.malidag.com";

const BrandTypeItems = ({ brandType, brandName }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brandType || !brandName) return;

    const fetchItems = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_BASE}/api/brands/${brandType}/${brandName}/items`
        );

        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          console.error("Failed to fetch brand items:", data);
          setItems([]);
          return;
        }

        setItems(data);
      } catch (err) {
        console.error("Error fetching brand items:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [brandType, brandName]);

  if (loading) return <p className="brand-items-loading">Loading items...</p>;
  if (!items.length) return null;

  const isGridMode = items.length >= 4;


  return (
    <section className="brand-items-section">
      <h2 className="brand-items-title">
        More from {brandName}
      </h2>

      <div className={`brand-items-grid ${isGridMode ? "grid-mode" : "wide-mode"}`}>
        {items.map((product) => {
          const image = product.item?.images?.[0];
          const name = product.item?.name;
          const brand = product.item?.brand;
          const price = product.item?.usdPrice;
          const productId = product.itemId;

          return (
           <article
            key={productId}
            className={`brand-item-card ${isGridMode ? "grid-card" : "wide-card"}`}
            >
              <div className="brand-item-image-wrap">
                {image && (
                  <img
                    src={encodeURI(image)}
                    alt={name || "Item"}
                    className="brand-item-image"
                  />
                )}
              </div>

              <div className="brand-item-info">
                {brand && <h3 className="brand-item-brand">{brand}</h3>}
                {name && <p className="brand-item-name">{name}</p>}
                {price && <p className="brand-item-price">${price}</p>}

                <button
                  className="brand-item-btn"
                  onClick={() => {
                    window.location.href = `/item/${productId}`;
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

export default BrandTypeItems;