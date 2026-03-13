"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RecommendedItem from "./personalRecommend";
import { useTranslation } from "react-i18next";
import "./kidFashion.css";

function KidFashion({ mtypes = [], types = {} }) {
  const router = useRouter();
  const { t } = useTranslation();

  const renderStars = (rating) => {
    const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

    return (
      <div className="stars-container">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`star ${i < safeRating ? "filled" : "empty"}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleItemClick = (id) => {
    if (!id) return;
    router.push(`/product/${id}`);
  };

  return (
    <div className="personal-care-container">
      <h2 className="personal-care-title">
        {t("kid_fashion") || "Kid Fashion"}
      </h2>

      <div className="beauty-category">
        {mtypes.length === 0 ? (
          <div>{t("no_kid_fashion_types") || "No kid fashion types found."}</div>
        ) : (
          mtypes.map((typeObj, idx) => (
            <div key={idx} className="type-section">
              <div className="type-image-id">
                <img
                  src={typeObj?.imageUrl || typeObj?.image || "/placeholder.png"}
                  alt={typeObj?.type || "Category"}
                  className="type-image-imgid"
                />
              </div>

              <h3
                className="type-title"
                style={{
                  color: "green",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "20px",
                }}
              >
                {typeObj?.type || "Category"}
              </h3>
            </div>
          ))
        )}
      </div>

      {Object.keys(types).length === 0 ? (
        <div>{t("no_kid_fashion_types") || "No kid fashion products found."}</div>
      ) : (
        Object.entries(types).map(([key, group]) => {
          const type = group?.type || key;
          const genre = group?.genre || "";
          const items = Array.isArray(group?.items) ? group.items : [];

          return (
            <div className="type-secti" key={type}>
              <h3 className="type-tit" style={{ display: "flex" }}>
                {genre ? `${genre} ` : ""}
                {type} {t("top_topic")}
                <div
                  style={{
                    marginLeft: "10px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "green",
                    marginTop: "10px",
                    cursor: "pointer",
                  }}
                >
                  {t("see_more")}
                </div>
              </h3>

              <div className="items-contain">
                {items.map(({ id, item = {} }) => (
                  <div className="c" key={id}>
                    <div className="ca">
                      <div className="item-ca">
                        <img
                          src={item?.images?.[0] || "/placeholder.png"}
                          alt={item?.name || "Product"}
                          className="item-ima"
                          onClick={() => handleItemClick(id)}
                        />
                      </div>

                      <div onClick={() => handleItemClick(id)} className="item-">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="item-pri">${item?.usdPrice || "0.00"}</div>
                        </div>

                        <div>
                          {(item?.name || "").length > 150
                            ? `${item.name.substring(0, 150)}...`
                            : item?.name || "Unnamed product"}
                        </div>

                        <div className="item-rating">
                          {renderStars(item?.rating || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <RecommendedItem />
    </div>
  );
}

export default KidFashion;