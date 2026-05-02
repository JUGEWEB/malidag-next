"use client";

import React, { useEffect, useState } from "react";
import { Carousel } from "antd";
import "./SimilarItemAds.css";

const API_BASE = "https://api.malidag.com";

const SimilarItemAds = ({ itemId }) => {
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
        console.error("Error loading similar item ads:", error);
        setSimilarItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarItems();
  }, [itemId]);

  if (loading) return null;
  if (!similarItems.length) return null;

 return (
  <section className="similar-ads-section">
    <Carousel
  autoplay
  autoplaySpeed={15000}   // 15 seconds per slide
  speed={800}            // transition animation (ms)
  dots
>
      {similarItems.map((product) => {
        const image = product.item?.images?.[0];
        const name = product.item?.name || "this item";
        const brand = product.item?.brand || "Malidag";
        const price = product.item?.usdPrice || "0";
        const routeId = product.id;

        return (
          <div key={product.itemId}>
            <article
              className="similar-ad-slide"
              onClick={() => {
                window.location.href = `/product/${routeId}`;
              }}
            >
              <img
                src={encodeURI(image || "/fallback.png")}
                alt={name}
                className="similar-ad-slide-image"
              />

              <div className="similar-ad-slide-text">
                <span>Buy {name}</span>
                <span>/</span>
                <span>{brand} </span>
                <span>for only</span>
                <strong>${price}</strong>
              </div>
            </article>
          </div>
        );
      })}
    </Carousel>
  </section>
);
};

export default SimilarItemAds;