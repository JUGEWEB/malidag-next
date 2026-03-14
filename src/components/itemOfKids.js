"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import useScreenSize from "./useIsMobile";
import "./itemOfKid.css";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";

function ItemOfKids() {
  const params = useParams();
  const router = useRouter();
  const { gender, type } = params;

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reviews, setReviews] = useState({});

  const {
    isMobile,
    isTablet,
    isSmallMobile,
    isVerySmall,
    isVeryVerySmall,
  } = useScreenSize();

  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(
        `https://api.malidag.com/get-reviews/${productId}`
      );

      if (response.data.success) {
        const reviewsArray = response.data.reviews || [];
        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`https://api.malidag.com/items/${type}`);
        const fetchedItems = response.data.items || [];

        const filteredItems = fetchedItems.filter(
          (item) => item.item.genre?.toLowerCase() === String(gender).toLowerCase()
        );

        setItems(filteredItems);

        filteredItems.forEach((item) => {
          fetchReviews(item.itemId);
        });

        const uniqueCategories = [
          ...new Set(filteredItems.map((item) => item.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [type, gender]);

  const toggleDropdown = (category) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const categorizedItems = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = items.filter((item) => item.category === category);
      return acc;
    }, {});
  }, [categories, items]);

  const getHotItems = (categoryItems) => {
    return [...categoryItems].sort((a, b) => b.item.sold - a.item.sold).slice(0, 4);
  };

  const handleVideoPlay = (id) => {
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleNavigate = (id) => {
    router.push(`/product/${id}`);
  };

  const gridClass = isVeryVerySmall
    ? "items-grid cols-1"
    : isVerySmall || isSmallMobile
    ? "items-grid cols-2"
    : isMobile || isTablet
    ? "items-grid cols-3"
    : "items-grid cols-desktop";

  if (loading) {
    return <div className="loading-message">{t("loading")}</div>;
  }

  return (
    <div className="shop-page">
      <div className="shop-shell">
        <header className="shop-topbar">
          <div className="shop-topbar__inner">
            <div className="shop-title-wrap">
              <p className="shop-eyebrow">Malidag Sky Collection</p>
              <h1 className="shop-title">
                {gender} / {type}
              </h1>
              <p className="shop-subtitle">
                Soft luxury pieces, refined details, and elevated essentials.
              </p>
            </div>

            <div className="shop-categories">
              <span className="shop-categories__label">
                {t("related_categories")}
              </span>

              <div className="shop-categories__list">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`category-chip ${
                      dropdownOpen[category] ? "is-active" : ""
                    }`}
                    onClick={() => toggleDropdown(category)}
                  >
                    <span>{category}</span>
                    <span
                      className={`dropdown-arrow ${
                        dropdownOpen[category] ? "arrow-open" : "arrow-closed"
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mega-menu-layer">
            {categories.map((category) =>
              dropdownOpen[category] ? (
                <div key={category} className="mega-menu">
                  <div className="mega-menu__section">
                    <h3 className="mega-menu__title">Malidag {category}</h3>

                    <div className="mega-menu__type-list">
                      {categorizedItems[category]
                        ?.map((item) => item.item.type)
                        .filter((type, idx, arr) => arr.indexOf(type) === idx)
                        .map((type, idx) => (
                          <button
                            key={idx}
                            className="mega-menu__type-item"
                            type="button"
                          >
                            {type}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="mega-menu__section mega-menu__section--hot">
                    <h3 className="mega-menu__title">{t("hot_label")}</h3>

                    <div className="mega-menu__hot-grid">
                      {getHotItems(categorizedItems[category] || []).map(
                        (hotItem, idx) => (
                          <article key={idx} className="hot-card">
                            <img
                              src={hotItem.item.images?.[0]}
                              alt={hotItem.item.name}
                              onClick={() =>
                                handleNavigate(hotItem.id || hotItem.itemId)
                              }
                              className="hot-card__image"
                            />
                            <div className="hot-card__body">
                              <div className="hot-card__name">
                                {hotItem.item.name}
                              </div>
                              <div className="hot-card__sold">
                                {hotItem.item.sold} {t("sold")}
                              </div>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </header>

        <section className="products-section">
          <div className={gridClass}>
            {items.map((itemData) => {
              const { itemId, id, item } = itemData;
              const {
                name,
                usdPrice,
                originalPrice,
                cryptocurrency,
                sold,
                videos,
                images,
              } = item;

              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating || null;

              const normalizedVideos = Array.isArray(videos) ? videos : [videos];
              const firstVideoUrl = normalizedVideos.find(
                (video) => typeof video === "string" && video.endsWith(".mp4")
              );

              return (
                <article key={id} className="product-card">
                  <div className="product-card__media">
                    {activeVideoId === id && firstVideoUrl ? (
                      <video
                        src={firstVideoUrl}
                        controls
                        autoPlay
                        onEnded={handleVideoStop}
                        className="product-card__video"
                      />
                    ) : (
                      <>
                        <img
                          className="product-card__image"
                          src={images?.[0]}
                          alt={name}
                          onClick={() => handleNavigate(id)}
                        />

                        {firstVideoUrl && (
                          <button
                            type="button"
                            className="product-card__play"
                            onClick={() => handleVideoPlay(id)}
                            aria-label="Play product video"
                          >
                            ▶
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div
                    className="product-card__body"
                    onClick={() => handleNavigate(id)}
                  >
                    <div className="product-card__topline">
                      <span className="product-card__currency-badge">
                        {cryptocurrency || "USDT"} accepted
                      </span>
                      <span className="product-card__sold">
                        {sold} {t("sold")}
                      </span>
                    </div>

                    <h3 className="product-card__name" title={name}>
                      {name.length > 52 ? `${name.substring(0, 52)}...` : name}
                    </h3>

                    <div className="product-card__bottom">
                      <div className="price-block">
                        <span className="price-current">
                          ${Number(usdPrice || 0).toFixed(2)}
                        </span>

                        {Number(originalPrice) > 0 && (
                          <span className="price-original">
                            ${Number(originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="rating-pill"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemData(itemData);
                          router.push("/reviewPage");
                        }}
                        title={t("view_reviews")}
                      >
                        {finalRating
                          ? `${Number(finalRating).toFixed(1)} ★`
                          : t("no_rating")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ItemOfKids;