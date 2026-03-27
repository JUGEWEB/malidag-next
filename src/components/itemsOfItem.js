"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./itemOfItems.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";

function Item() {
  const params = useParams();
  const router = useRouter();
  const itemClicked = params?.itemClicked;

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [beautyImages, setBeautyImages] = useState([]);
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

  const [bestSellersByCategory, setBestSellersByCategory] = useState({});

  const stablecoinIcons = {
    usdt: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
    usdc: "https://api.malidag.com/learn/videos/1769909942070-0xaf88d065e77c8cc2239327c5edb3a432268e5831.png",
    busd: "https://api.malidag.com/learn/videos/1773502639247-BUSD.png",
  };

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
        const response = await axios.get("https://api.malidag.com/beauty/images");

        const filteredImages = response.data.filter(
          (image) => image.type.toLowerCase() === itemClicked.toLowerCase()
        );

        setBeautyImages(filteredImages);
      } catch (error) {
        console.error("Error fetching beauty images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBeautyImages();
  }, [itemClicked]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`https://api.malidag.com/items/${itemClicked}`);
        const fetchedItems = response.data.items || [];

        setItems(fetchedItems);

        const uniqueCategories = [...new Set(fetchedItems.map((item) => item.category))];
        setCategories(uniqueCategories);

        const bestSellerMap = {};

uniqueCategories.forEach((category) => {
  const categoryItems = fetchedItems.filter((item) => item.category === category);

  if (categoryItems.length > 0) {
    const bestSeller = [...categoryItems].sort(
      (a, b) => Number(b.item?.sold || 0) - Number(a.item?.sold || 0)
    )[0];

    if (bestSeller?.id) {
      bestSellerMap[category] = bestSeller.id;
    }
  }
});

setBestSellersByCategory(bestSellerMap);

        fetchedItems.forEach((item) => {
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

  const toggleDropdown = (category) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const categorizedItems = categories.reduce((acc, category) => {
    acc[category] = items.filter((item) => item.category === category);
    return acc;
  }, {});

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

  const getStablecoinIcon = (crypto) => {
    if (!crypto) return stablecoinIcons.usdt;
    return stablecoinIcons[crypto.toLowerCase()] || stablecoinIcons.usdt;
  };

  const getStablecoinPrice = (usdPrice) => {
    return Number(usdPrice).toFixed(2);
  };

  const gridClassName = isVeryVerySmall
    ? "items-grid items-grid-1"
    : isVerySmall
    ? "items-grid items-grid-2"
    : isSmallMobile
    ? "items-grid items-grid-2"
    : isMobile
    ? "items-grid items-grid-3"
    : isTablet
    ? "items-grid items-grid-3"
    : "items-grid items-grid-3";

  if (loading) {
    return <div className="loading-message">{t("loading")}</div>;
  }

  return (
    <div className="item-page">
      <div className="item-page-inner">
        <div className="items-topbar">
          <div className="items-topbar-inner">
            <div className="items-brand-title">Malidag {itemClicked}.</div>

            <div className="items-related-label">{t("related_categories")}</div>

            <div className="items-categories">
              {categories.map((category, index) => (
                <button
                  key={index}
                  type="button"
                  className="items-category-btn"
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

        <div className="items-dropdown-wrap">
          {categories.map((category) =>
            dropdownOpen[category] ? (
              <div key={category} className="items-dropdown-panel">
                <div className="items-dropdown-grid">
                  <div className="stable-catgory-types">
                    <strong>Malidag {category}</strong>

                    {categorizedItems[category]
                      ?.map((item) => item.item.type)
                      .filter((type, idx, arr) => arr.indexOf(type) === idx)
                      .map((type, idx) => (
                        <div key={idx} className="stable-tpe-item">
                          {type}
                        </div>
                      ))}
                  </div>

                  <div className="items-hot-side">
                    <div className="items-hot-title">{t("hot_label")}</div>

                    <div className="items-hot-grid">
                      {getHotItems(categorizedItems[category] || []).map((hotItem, idx) => (
                        <div
                          key={idx}
                          className="items-hot-card"
                          onClick={() => handleNavigate(hotItem.id)}
                        >
                          <img
                            src={hotItem.item.images[0]}
                            alt={hotItem.item.name}
                            className="stable-ht-item-image"
                          />
                          <div className="stable-ht-item-name">{hotItem.item.name}</div>
                          <div className="stable-ht-item-sold">
                            {hotItem.item.sold} {t("sold")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          )}
        </div>

        <div className="beauty-images-container">
          {beautyImages.length > 0 ? (
            beautyImages.map((img, index) => (
              <img
                key={index}
                src={img.imageUrl}
                alt={itemClicked}
                className="beauty-image"
              />
            ))
          ) : (
            <p className="empty-beauty-images" />
          )}
        </div>

        <div className="item-pge-container">
          <div className={gridClassName}>
            {items.map((itemData) => {
              const { itemId, id, item } = itemData;
              const isBestSeller = id === bestSellersByCategory[itemData.category];
              const { name, usdPrice, originalPrice, cryptocurrency, sold, videos } = item;

              const crypto = String(cryptocurrency || "USDT").toUpperCase();
              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating;

              const itemPriceInStablecoin = getStablecoinPrice(usdPrice);

              const normalizedVideos = Array.isArray(videos) ? videos : [videos];
              const firstVideoUrl = normalizedVideos.find(
                (video) => typeof video === "string" && video.endsWith(".mp4")
              );

              return (
                <div key={id} className="itm-card">
                  <div className="item-media-wrap">
                    <div className={`item-badge ${isBestSeller ? "item-badge-best" : "item-badge-top"}`}>
                      {isBestSeller ? t("best_seller") : t("topIt")}
                    </div>
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
                          src={item.images[0]}
                          alt={name}
                          onClick={() => handleNavigate(id)}
                        />

                        {firstVideoUrl && (
                          <button
                            type="button"
                            className="play-button"
                            onClick={() => handleVideoPlay(id)}
                            aria-label="Play product video"
                          >
                            ▶
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="item-details" onClick={() => handleNavigate(id)}>
                    <div className="item-name" title={name}>
                      {name.length > 70 ? `${name.substring(0, 70)}...` : name}
                    </div>

                    <div className="item-prices">
                      <div className="item-price-row">
                        <span className="item-price">${usdPrice}</span>

                        {originalPrice > 0 && (
                          <span className="item-original-price">${originalPrice}</span>
                        )}

                        <span className="item-sold">
                          <span>{sold}</span>
                          <span className="item-sold-label">{t("sold")}</span>
                        </span>
                      </div>

                      <div className="item-crypto">
                        <img
                          src={getStablecoinIcon(crypto)}
                          alt={crypto}
                          className="crypto-icon"
                        />
                        <span className="item-crypto-price">
                          {itemPriceInStablecoin} {crypto}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
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
                    </button>
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

export default Item;