'use client';

import React from "react";
import "./woFashion.css";
import { useRouter } from 'next/navigation';
import RecommendedItem from "./personalRecommend";

function MenFashion({ mtypes, groupedTypes, cryptoPrices }) {
  const router = useRouter();

  const handleItemClick = (id) => {
    router.push(`/productDetails/${id}`);
  };

  return (
    <div className="personal-care-container">

      <div style={{with: "100%", height: "400px" }}>
        <img src="https://api.malidag.com/learn/videos/1754140515701-man-in-white-and-light-tan-outfit.jpg" alt="men fashion" />
      </div>
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "12px",
          padding: "10px 15px",
          marginBottom: "20px",
          scrollbarWidth: "none",
        }}
        className="top-type-scroll"
      >
        {Object.keys(groupedTypes).map((type, idx) => (
          <div
            key={idx}
            onClick={() => router.push(`/men-top-topic/${type.toLowerCase()}`)}
            style={{
              flex: "0 0 auto",
              background: "#f0f0f0",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#333",
              whiteSpace: "nowrap",
            }}
          >
            Top {type}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
          padding: "10px 15px",
        }}
      >
        {Object.values(groupedTypes).flat().map(({ id, item }) => (
          <div
            key={id}
            onClick={() => handleItemClick(id)}
            style={{
              background: "#fff",
              padding: "10px",
              border: "1px solid #eee",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={item.images[0]}
              alt={item.name}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "contain",
                marginBottom: "8px",
              }}
            />
            <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px", color: "#333" }}>
              ${item.usdPrice}
            </div>
            <div style={{ fontSize: "12px", color: "#555", textAlign: "center" }}>
              {item.name.length > 60 ? `${item.name.substring(0, 60)}...` : item.name}
            </div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%" }}>
        <RecommendedItem />
      </div>
    </div>
  );
}

export default MenFashion;
