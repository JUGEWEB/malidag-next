"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./itemOfWomen.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";

const STABLE_COINS = ["USDT", "USDC", "BUSD"];

function ItemOfWomen() {
  const router = useRouter();
  const params = useParams();
  const { itemClicked } = params;

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [beautyImages, setBeautyImages] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [reviews, setReviews] = useState({});

  const { isMobile, isDesktop, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall } =
    useScreenSize();

  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(`https://api.malidag.com/get-reviews/${productId}`);
      if (response.data.success) {
        const reviewsArray = response.data.reviews || [];
        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

        setReviews((prevReviews) => ({
          ...prevReviews,
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
          (image) => (image.type || "").toLowerCase() === (itemClicked || "").toLowerCase()
        );
        setBeautyImages(filteredImages);
      } catch (error) {
        console.error("Error fetching beauty images:", error);
      }
    };

    fetchBeautyImages();
  }, [itemClicked]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`https://api.malidag.com/items/${itemClicked}`);
        const fetchedItems = response.data.items || [];

        const filteredItems = fetchedItems.filter(
          (item) => (item?.item?.genre || "").toLowerCase() === "women"
        );

        setItems(filteredItems);

        const uniqueCategories = [...new Set(filteredItems.map((item) => item.category).filter(Boolean))];
        setCategories(uniqueCategories);

        filteredItems.forEach((item) => {
          fetchReviews(item.itemId);
        });
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [itemClicked]);

  const getAllSizes = (items) => {
    const allSizes = items.map((item) => {
      const sizes = Object.values(item?.item?.size || {});
      return sizes.flat().map((size) => size.split(",").map((s) => s.trim())).flat();
    });

    return [...new Set(allSizes.flat().filter(Boolean))];
  };

  const filterItemsBySize = (size) => {
    return items.filter((item) => {
      const availableSizes = Object.values(item?.item?.size || {}).flat();
      return availableSizes.some((s) => s.split(",").map((x) => x.trim()).includes(size));
    });
  };

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

  const displayedItems = selectedSize ? filterItemsBySize(selectedSize) : items;

  if (loading) return <div className="item-loading">{t("loading")}</div>;

  return (
    <div className="women-item-page">
      <div className="women-item-shell">
        <section className="women-item-topbar">
          <div className="women-item-breadcrumb">
            <span>Malidag</span>
            <span className="dot">•</span>
            <span className="current">{itemClicked}</span>
          </div>

          <div className="women-item-related">
            <span className="women-item-related-label">{t("related_categories")}</span>

            <div className="women-item-category-pills">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className="category-pill"
                  onClick={() => toggleDropdown(category)}
                >
                  {category}
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
        </section>

        {categories.some((category) => dropdownOpen[category]) && (
          <section className="women-item-dropdown-panel">
            {categories.map((category) =>
              dropdownOpen[category] ? (
                <div key={category} className="women-item-dropdown-content">
                  <div className="dropdown-types">
                    <strong className="dropdown-title">Malidag {category}</strong>

                    <div className="dropdown-type-list">
                      {categorizedItems[category]
                        ?.map((item) => item?.item?.type)
                        .filter((type, idx, arr) => type && arr.indexOf(type) === idx)
                        .map((type, idx) => (
                          <div key={idx} className="dropdown-type-chip">
                            {type}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="dropdown-hot">
                    <strong className="dropdown-title">{t("hot_label")}</strong>

                    <div className="dropdown-hot-grid">
                      {getHotItems(categorizedItems[category] || []).map((hotItem, idx) => (
                        <div key={idx} className="hot-item-card">
                          <img
                            src={hotItem?.item?.images?.[0]}
                            alt={hotItem?.item?.name}
                            onClick={() => handleNavigate(hotItem.id)}
                            className="hot-item-image"
                          />
                          <div className="hot-item-name">{hotItem?.item?.name}</div>
                          <div className="hot-item-sold">
                            {hotItem?.item?.sold} {t("sold")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </section>
        )}

        {beautyImages.length > 0 && (
          <section className="women-item-hero">
            {beautyImages.map((img, index) => (
              <div key={index} className="women-item-hero-frame">
      <img
        src={img.imageUrl}
        alt={itemClicked}
        className="women-item-hero-image"
      />
    </div>
            ))}
          </section>
        )}

        {!isDesktop && (
          <aside className="size-filter-card mobile">
            <div className="size-filter-container">
              <h3>{t("filter_by_size")}</h3>

              <div className="sizes-list">
                {getAllSizes(items).map((size) => (
                  <button
                    key={size}
                    className={`size-button ${selectedSize === size ? "active" : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {selectedSize && (
                <button className="clear-filter" onClick={() => setSelectedSize(null)}>
                  {t("clear_filter")}
                </button>
              )}
            </div>
          </aside>
        )}

        <div className="women-item-content">
          {isDesktop && (
            <aside className="size-filter-card desktop">
              <div className="size-filter-container">
                <h3>{t("filter_by_size")}</h3>

                <div className="sizes-list">
                  {getAllSizes(items).map((size) => (
                    <button
                      key={size}
                      className={`size-button ${selectedSize === size ? "active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {selectedSize && (
                  <button className="clear-filter" onClick={() => setSelectedSize(null)}>
                    {t("clear_filter")}
                  </button>
                )}
              </div>
            </aside>
          )}

          <div
            className="women-items-grid"
            style={{
              gridTemplateColumns: isVeryVerySmall
                ? "repeat(1, 1fr)"
                : isVerySmall || isSmallMobile
                ? "repeat(2, 1fr)"
                : isMobile || isTablet
                ? "repeat(3, 1fr)"
                : "repeat(3, 1fr)",
            }}
          >
            {displayedItems.map((itemData) => {
              const { itemId, id, item } = itemData;
              const {
                name,
                usdPrice,
                originalPrice,
                cryptocurrency,
                sold,
                videos,
              } = item;

              const safeCrypto = STABLE_COINS.includes(cryptocurrency) ? cryptocurrency : "USDT";
              const itemPriceInCrypto = Number(usdPrice || 0).toFixed(2);
              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating || null;

              const normalizedVideos = Array.isArray(videos) ? videos : [videos];
              const firstVideoUrl = normalizedVideos.find(
                (video) => typeof video === "string" && video.endsWith(".mp4")
              );

              return (
                <div key={id} className="itm-card">
                  <div className="item-media-box">
                    {activeVideoId === id && firstVideoUrl ? (
                      <video
                        src={firstVideoUrl}
                        controls
                        autoPlay
                        onEnded={handleVideoStop}
                        className="item-video"
                      />
                    ) : (
                      <>
                        <img
                          className="item-imageof"
                          src={item?.images?.[0]}
                          alt={name}
                          onClick={() => handleNavigate(id)}
                        />

                        {firstVideoUrl && (
                          <button
                            className="play-button"
                            onClick={() => handleVideoPlay(id)}
                            type="button"
                          >
                            ▶
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="item-details" onClick={() => handleNavigate(id)}>
                    <div className="item-name" title={name}>
                      {name?.length > 42 ? `${name.substring(0, 42)}...` : name}
                    </div>

                    <div className="item-prices">
                      <div className="item-price-row">
                        <span className="item-price">${usdPrice}</span>

                        {Number(originalPrice) > 0 && (
                          <span className="item-original-price">${originalPrice}</span>
                        )}

                        <span className="item-sold">
                          {sold} <strong>{t("sold")}</strong>
                        </span>
                      </div>

                      <div className="item-crypto">
                        <span className="stable-badge">{safeCrypto}</span>
                        <span className="item-crypto-price">
                          {itemPriceInCrypto} {safeCrypto}
                        </span>
                      </div>
                    </div>

                    <div
                      className="item-type-stars"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemData(itemData);
                        router.push("/reviewPage");
                      }}
                      title={t("view_reviews")}
                    >
                      {finalRating
                        ? "★".repeat(Math.round(finalRating)) +
                          "☆".repeat(5 - Math.round(finalRating))
                        : t("no_rating")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemOfWomen;