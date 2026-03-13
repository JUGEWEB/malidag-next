'use client';

import React from "react";
import "./menFashion.css";
import { useRouter } from "next/navigation";
import RecommendedItem from "./personalRecommend";

function MenFashion({ mtypes, groupedTypes, cryptoPrices }) {
  const router = useRouter();

  const handleItemClick = (id) => {
    router.push(`/product/${id}`);
  };

  const allItems = Object.values(groupedTypes || {}).flat();

  return (
    <div className="men-fashion-page">
      <section className="men-hero">
        <img
          src="https://api.malidag.com/learn/videos/1754140515701-man-in-white-and-light-tan-outfit.jpg"
          alt="men fashion"
          className="men-hero-image"
        />
        <div className="men-hero-overlay">
          <div className="men-hero-content">
            <span className="men-hero-badge">Men's Fashion</span>
            <h1>Fresh Fits for Every Day</h1>
            <p>Discover sneakers, socks, outfits, and trending essentials.</p>
          </div>
        </div>
      </section>

      <section className="men-types-section">
        <div className="section-header">
          <h2>Shop by Type</h2>
        </div>

        <div className="men-types-row">
          {Object.keys(groupedTypes || {}).map((type, idx) => (
            <button
              key={idx}
              className="type-chip"
              onClick={() => router.push(`/item-of-men/${type.toLowerCase()}`)}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="men-products-section">
        <div className="section-header">
          <h2>Trending Products</h2>
          <span>{allItems.length} items</span>
        </div>

        <div className="men-products-grid">
          {allItems.map(({ id, item }) => (
            <article
              key={id}
              className="product-card"
              onClick={() => handleItemClick(id)}
            >
              <div className="product-image-wrap">
                <img
                  src={item?.images?.[0]}
                  alt={item?.name}
                  className="product-image"
                />
              </div>

              <div className="product-info">
                <div className="product-price-row">
                  <span className="product-price">${item?.usdPrice}</span>
                  {item?.originalPrice && (
                    <span className="product-old-price">${item.originalPrice}</span>
                  )}
                </div>

                <h3 className="product-title">
                  {item?.name?.length > 60
                    ? `${item.name.substring(0, 60)}...`
                    : item?.name}
                </h3>

                <div className="product-meta">
                  <span>{item?.cryptocurrency || "USDT"}</span>
                  <span>{item?.sold ? `${item.sold} sold` : "New"}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="recommended-section">
        <RecommendedItem />
      </section>
    </div>
  );
}

export default MenFashion;