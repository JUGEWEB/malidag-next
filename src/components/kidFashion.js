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

  const getSafeImage = (src) => {
    return src && String(src).trim() ? src : "https://via.placeholder.com/300x300?text=Kids+Fashion";
  };

  return (
    <div className="personal-care-container">
      <div className="kids-hero">
        <div className="kids-hero-badge">{t("new_collection") || "New Collection"}</div>
        <h2 className="personal-care-title">
          {t("kid_fashion") || "Kid Fashion"}
        </h2>
        <p className="kids-hero-subtitle">
          {t("kids_fashion_subtitle") ||
            "Soft styles, playful colors, and adorable looks for every little star."}
        </p>
      </div>

      <div className="beauty-category">
        {mtypes.length === 0 ? (
          <div className="empty-state">
            {t("no_kid_fashion_types") || "No kid fashion types found."}
          </div>
        ) : (
          mtypes.map((typeObj, idx) => (
            <div
              key={typeObj?._id || idx}
              className="type-section"
            >
              <div className="type-image-id">
                <img
                  src={getSafeImage(typeObj?.image)}
                  alt={typeObj?.type || "Category"}
                  className="type-image-imgid"
                />
              </div>

              <h3 className="type-title">
                {typeObj?.type || "Category"}
              </h3>
            </div>
          ))
        )}
      </div>

      {Object.keys(types).length === 0 ? (
        <div className="empty-state">
          {t("no_kid_fashion_products") || "No kid fashion products found."}
        </div>
      ) : (
        Object.entries(types).map(([key, group]) => {
          const type = group?.type || key;
          const genre = group?.genre || "";
          const items = Array.isArray(group?.items) ? group.items : [];

          return (
            <section className="type-secti" key={type}>
              <div className="section-head">
                <h3 className="type-tit">
                  <span className="section-genre">{genre ? `${genre} ` : ""}</span>
                  {type} {t("top_topic") || "Top Picks"}
                </h3>

                <button type="button" className="see-more-btn">
                  {t("see_more") || "See more"}
                </button>
              </div>

              <div className="items-contain">
                {items.map(({ id, item = {} }) => (
                  <div className="c" key={id}>
                    <div className="ca">
                      <div className="item-ca">
                        <img
                          src={getSafeImage(item?.images?.[0])}
                          alt={item?.name || "Product"}
                          className="item-ima"
                          onClick={() => handleItemClick(id)}
                        />
                      </div>

                      <div onClick={() => handleItemClick(id)} className="item-content">
                        <div className="item-top-row">
                          <div className="item-pri">${item?.usdPrice || "0.00"}</div>
                        </div>

                        <div className="item-name">
                          {(item?.name || "").length > 90
                            ? `${item.name.substring(0, 90)}...`
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
            </section>
          );
        })
      )}

      <RecommendedItem />
    </div>
  );
}

export default KidFashion;