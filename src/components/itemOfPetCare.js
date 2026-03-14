"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import "./itemOfPetcare.css";
import { useCheckoutStore } from "./checkoutStore";

function ItemOfPetCare() {
  const params = useParams();
  const router = useRouter();
  const { gender, type } = params;

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [beautyImages, setBeautyImages] = useState([]);
  const [reviews, setReviews] = useState({});

  const { isMobile, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall } =
    useScreenSize();

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
    const fetchBeautyImages = async () => {
      try {
        const response = await axios.get("https://api.malidag.com/women/images");

        const filteredImages = response.data.filter(
          (image) => image.type?.toLowerCase() === String(type).toLowerCase()
        );

        setBeautyImages(filteredImages);
      } catch (error) {
        console.error("Error fetching beauty images:", error);
      }
    };

    if (type) {
      fetchBeautyImages();
    }
  }, [type]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`https://api.malidag.com/items/${type}`);
        const fetchedItems = response.data.items || [];

        const filteredItems = fetchedItems.filter(
          (item) =>
            item.item.genre?.toLowerCase() === String(gender).toLowerCase() &&
            item.category === "Pet care"
        );

        setItems(filteredItems);

        const uniqueCategories = [
          ...new Set(filteredItems.map((item) => item.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);

        filteredItems.forEach((item) => {
          fetchReviews(item.itemId);
        });
      } catch (error) {
        console.error("Error fetching pet care items:", error);
      } finally {
        setLoading(false);
      }
    };

    if (type && gender) {
      fetchItems();
    }
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
    return [...categoryItems]
      .sort((a, b) => (b.item.sold || 0) - (a.item.sold || 0))
      .slice(0, 4);
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
    ? "pet-grid cols-1"
    : isVerySmall || isSmallMobile
    ? "pet-grid cols-2"
    : isMobile || isTablet
    ? "pet-grid cols-3"
    : "pet-grid cols-desktop";

  if (loading) {
    return <div className="loading-message">{t("loading")}</div>;
  }

  return (
    <div className="pet-page">
      <div className="pet-shell">
        <header className="pet-topbar">
          <div className="pet-topbar__inner">
            <div className="pet-title-wrap">
              <p className="pet-eyebrow">Malidag Pet Care</p>
              <h1 className="pet-title">
                {gender} / {type}
              </h1>
            </div>

            <div className="pet-categories">
              <span className="pet-categories__label">
                {t("related_categories")}
              </span>

              <div className="pet-categories__list">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`pet-category-chip ${
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

          <div className="pet-mega-layer">
            {categories.map((category) =>
              dropdownOpen[category] ? (
                <div key={category} className="pet-mega-menu">
                  <div className="pet-mega-menu__section">
                    <h3 className="pet-mega-menu__title">Malidag {category}</h3>

                    <div className="pet-type-list">
                      {categorizedItems[category]
                        ?.map((item) => item.item.type)
                        .filter((value, idx, arr) => arr.indexOf(value) === idx)
                        .map((typeItem, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="pet-type-item"
                          >
                            {typeItem}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="pet-mega-menu__section pet-mega-menu__section--hot">
                    <h3 className="pet-mega-menu__title">{t("hot_label")}</h3>

                    <div className="pet-hot-grid">
                      {getHotItems(categorizedItems[category] || []).map(
                        (hotItem, idx) => (
                          <article key={idx} className="pet-hot-card">
                            <img
                              src={hotItem.item.images?.[0]}
                              alt={hotItem.item.name}
                              onClick={() =>
                                handleNavigate(hotItem.id || hotItem.itemId)
                              }
                              className="pet-hot-card__image"
                            />
                            <div className="pet-hot-card__body">
                              <div className="pet-hot-card__name">
                                {hotItem.item.name}
                              </div>
                              <div className="pet-hot-card__sold">
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

        <section className="pet-products-section">
          <div className={gridClass}>
            {items.map((itemData) => {
              const { itemId, id, item } = itemData;
              const { name, usdPrice, originalPrice, sold, videos, images } = item;

              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating || null;

              const normalizedVideos = Array.isArray(videos)
                ? videos
                : videos
                ? [videos]
                : [];

              const firstVideoUrl = normalizedVideos.find(
                (video) => typeof video === "string" && video.endsWith(".mp4")
              );

              return (
                <article key={id} className="pet-card">
                  <div className="pet-card__media">
                    {activeVideoId === id && firstVideoUrl ? (
                      <video
                        src={firstVideoUrl}
                        controls
                        autoPlay
                        onEnded={handleVideoStop}
                        className="pet-card__video"
                      />
                    ) : (
                      <>
                        <img
                          className="pet-card__image"
                          src={images?.[0]}
                          alt={name}
                          onClick={() => handleNavigate(id)}
                        />

                        {firstVideoUrl && (
                          <button
                            type="button"
                            className="pet-card__play"
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
                    className="pet-card__body"
                    onClick={() => handleNavigate(id)}
                  >
                    <h3 className="pet-card__name" title={name}>
                      {name.length > 32 ? `${name.substring(0, 32)}...` : name}
                    </h3>

                    <div className="pet-card__prices">
                      <div className="pet-price-row">
                        <span className="pet-price-current">
                          ${Number(usdPrice || 0).toFixed(2)}
                        </span>

                        {Number(originalPrice) > 0 && (
                          <span className="pet-price-original">
                            ${Number(originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="pet-sold">
                        {sold} {t("sold")}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pet-rating"
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
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ItemOfPetCare;