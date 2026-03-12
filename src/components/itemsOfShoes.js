"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./itemOfShoes.css";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";

const BASE_URL = "https://api.malidag.com";
const STABLE_COINS = new Set(["USDT", "USDC", "BUSD"]);

function ItemOfShoes({ itemClicked }) {
  const router = useRouter();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [beautyImages, setBeautyImages] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);

  const brandUrls = {
    adidas: "https://cdn.malidag.com/brand-logos/1760351238093-o8o8u03t57.png",
    blaasploa: "https://cdn.malidag.com/brand-logos/1760350881442-21d07lv31mz.png",
    kickers: "https://cdn.malidag.com/brand-logos/1760351836064-85ubmyqapww.png",
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

      if (response.data?.success) {
        const reviewsArray = Array.isArray(response.data.reviews)
          ? response.data.reviews
          : [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review?.rating);
          return acc + (Number.isNaN(rating) ? 4 : rating);
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
      if (!itemClicked || typeof itemClicked !== "string") {
        setBeautyImages([]);
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/shoes/images`);
        const filteredImages = Array.isArray(response.data)
          ? response.data.filter(
              (image) => image.type?.toLowerCase() === itemClicked.toLowerCase()
            )
          : [];

        setBeautyImages(filteredImages);
      } catch (error) {
        console.error("Error fetching beauty images:", error);
      }
    };

    fetchBeautyImages();
  }, [itemClicked]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!itemClicked || typeof itemClicked !== "string") {
        setItems([]);
        setCategories([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [gender, ...typeParts] = itemClicked.split("-");
        const type = typeParts.join("-");

        const response = await axios.get(`${BASE_URL}/items/${type}`);
        const fetchedItems = response?.data?.items || [];

        const filteredItems = fetchedItems.filter((entry) => {
          const genre = entry?.item?.genre?.toLowerCase()?.trim();
          return genre === gender.toLowerCase().trim();
        });

        setItems(filteredItems);

        const uniqueCategories = [
          ...new Set(
            filteredItems
              .map((item) => item.category?.toLowerCase()?.trim())
              .filter(Boolean)
          ),
        ];

        setCategories(uniqueCategories);

        filteredItems.forEach((item) => {
          fetchReviews(item.itemId);
        });
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
        setCategories([]);
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

  const getAllSizes = (itemsList) => {
    const allSizes = itemsList.map((entry) => {
      const sizes = Object.values(entry?.item?.size || {});
      return sizes
        .flat()
        .map((size) => String(size).split(",").map((s) => s.trim()))
        .flat();
    });

    return [...new Set(allSizes.flat().filter(Boolean))];
  };

  const filterItemsBySize = (size) => {
    return items.filter((entry) => {
      const availableSizes = Object.values(entry?.item?.size || {}).flat();
      return availableSizes.some((s) =>
        String(s)
          .split(",")
          .map((x) => x.trim())
          .includes(size)
      );
    });
  };

  const categorizedItems = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = items.filter(
        (item) => item.category?.toLowerCase()?.trim() === category
      );
      return acc;
    }, {});
  }, [categories, items]);

  const brands = useMemo(() => {
    return [
      ...new Set(
        items
          .map((entry) => entry?.item?.brand?.trim())
          .filter(Boolean)
      ),
    ];
  }, [items]);

  const displayedItems = selectedSize ? filterItemsBySize(selectedSize) : items;
  const allSizes = getAllSizes(items);

  const getHotItems = (categoryItems = []) => {
    return [...categoryItems]
      .sort((a, b) => (b?.item?.sold || 0) - (a?.item?.sold || 0))
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

  const handleBrandNavigate = (brandName) => {
    if (!brandName) return;

    const brandSlug = brandName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    router.push(`/brand/theme1/${brandSlug}`);
  };

  const handleReviewNavigate = (itemData) => {
    setItemData(itemData);
    router.push("/reviewPage");
  };

  const formatStablePrice = (usdPrice, cryptocurrency) => {
    const coin = String(cryptocurrency || "USDT").toUpperCase();
    const value = Number(usdPrice || 0);

    if (STABLE_COINS.has(coin)) {
      return `${value.toFixed(2)} ${coin}`;
    }

    return t("price_unavailable");
  };

  const pageTitle = itemClicked
    ? `Malidag ${itemClicked.replace(/-/g, " ")}`
    : "Malidag Shoes";

 if (loading) {
  return (
    <div className="shoe-page">
      <div className="shoe-shell">
        <div className="shoe-loading-wrap">
          <div className="shoe-loading-line shoe-loading-line-lg" />
          <div className="shoe-loading-line shoe-loading-line-sm" />
          <div className="shoe-loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shoe-skeleton-card">
                <div className="shoe-skeleton-media" />
                <div className="shoe-skeleton-line shoe-skeleton-line-short" />
                <div className="shoe-skeleton-line" />
                <div className="shoe-skeleton-line shoe-skeleton-line-tiny" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="shoe-page">
    <div className="shoe-shell">
      <section className="shoe-hero">
        <div className="shoe-hero-copy">
          <div className="shoe-hero-topline">
            <span className="shoe-kicker">Malidag Footwear</span>
            <span className="shoe-kicker-muted">
              {displayedItems.length} {t("items") || "items"}
            </span>
          </div>

          <h1 className="shoe-hero-title">{pageTitle}</h1>

          <p className="shoe-hero-text">
            Explore premium sneakers and statement footwear with clean styling,
            size filtering, brand discovery, stable coin pricing, and fast product access.
          </p>

          <div className="shoe-hero-stats">
            <div className="shoe-stat">
              <span className="shoe-stat-value">{brands.length}</span>
              <span className="shoe-stat-label">{t("brands") || "Brands"}</span>
            </div>
            <div className="shoe-stat">
              <span className="shoe-stat-value">{allSizes.length}</span>
              <span className="shoe-stat-label">{t("sizes") || "Sizes"}</span>
            </div>
            <div className="shoe-stat">
              <span className="shoe-stat-value">{items.length}</span>
              <span className="shoe-stat-label">{t("products") || "Products"}</span>
            </div>
          </div>
        </div>

        {beautyImages.length > 0 ? (
          <div className="shoe-hero-visual">
            <img
              src={beautyImages[0].imageUrl}
              alt={itemClicked || "Shoes collection"}
              className="shoe-hero-image"
            />
            <div className="shoe-hero-gradient" />

            <div className="shoe-hero-floating-panel">
              <span className="shoe-floating-label">
                {selectedSize
                  ? `${t("selected") || "Selected"}: ${selectedSize}`
                  : t("footwear_collection") || "Footwear Collection"}
              </span>
              <strong>{itemClicked?.replace(/-/g, " ") || "Shoes"}</strong>
            </div>
          </div>
        ) : (
          <div className="shoe-hero-placeholder">
            <div className="shoe-hero-placeholder-inner">
              <span className="shoe-placeholder-kicker">Malidag</span>
              <strong>Curated Footwear</strong>
            </div>
          </div>
        )}
      </section>

      {beautyImages.length > 1 && (
        <section className="shoe-gallery-strip">
          {beautyImages.slice(0, 3).map((img, index) => (
            <div key={index} className="shoe-gallery-card">
              <img
                src={img.imageUrl}
                alt={`${itemClicked}-${index}`}
                className="shoe-gallery-image"
              />
            </div>
          ))}
        </section>
      )}

      <section className="shoe-toolbar">
        <div className="shoe-toolbar-main">
          <div className="shoe-section-heading">
            <span className="shoe-section-kicker">{t("filter_by_size")}</span>
            <h2>{t("choose_size") || "Choose your size"}</h2>
          </div>

          <div className="shoe-size-list">
            {allSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`shoe-size-chip ${selectedSize === size ? "active" : ""}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="shoe-toolbar-side">
          <div className="shoe-toolbar-info">
            <span>{t("results") || "Results"}</span>
            <strong>{displayedItems.length}</strong>
          </div>

          {selectedSize && (
            <button
              type="button"
              className="shoe-clear-btn"
              onClick={() => setSelectedSize(null)}
            >
              {t("clear_filter") || "Clear filter"}
            </button>
          )}
        </div>
      </section>

      <section className="shoe-brand-section">
        <div className="shoe-section-heading shoe-section-heading-row">
          <div>
            <span className="shoe-section-kicker">{t("brands") || "Brands"}</span>
            <h2>Shop by brand</h2>
          </div>
          <span className="shoe-section-meta">{brands.length} results</span>
        </div>

        {brands.length === 0 ? (
          <div className="shoe-empty-card">
            {t("no_brands_found") || "No brands found."}
          </div>
        ) : (
          <div className="shoe-brand-grid">
            {brands.map((brandName) => {
              const brandKey = brandName.toLowerCase().trim();
              const brandLogo = brandUrls[brandKey];

              return (
                <button
                  key={brandName}
                  type="button"
                  className="shoe-brand-tile"
                  onClick={() => handleBrandNavigate(brandName)}
                >
                  <div className="shoe-brand-tile-top">
                    {brandLogo ? (
                      <img
                        src={brandLogo}
                        alt={brandName}
                        className="shoe-brand-logo"
                      />
                    ) : (
                      <div className="shoe-brand-monogram">
                        {brandName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="shoe-brand-tile-bottom">
                    <span className="shoe-brand-label">{brandName}</span>
                    <span className="shoe-brand-link">
                      {t("view_more") || "Explore"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="shoe-products-section">
        <div className="shoe-section-heading shoe-section-heading-row">
          <div>
            <span className="shoe-section-kicker">{t("hot_label") || "Products"}</span>
            <h2>Curated product selection</h2>
          </div>
          <span className="shoe-section-meta">{displayedItems.length} results</span>
        </div>

        {displayedItems.length === 0 ? (
          <div className="shoe-empty-card">
            {t("no_products_found") || "No products found."}
          </div>
        ) : (
          <div className="shoe-product-grid">
            {displayedItems.map((itemData) => {
              const { itemId, id, item } = itemData;
              const {
                name,
                usdPrice,
                originalPrice,
                cryptocurrency,
                sold,
                videos,
                genre,
                type,
                brand,
              } = item;

              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating;
              const crypto = String(cryptocurrency || "USDT").toUpperCase();

              const normalizedVideos = Array.isArray(videos)
                ? videos
                : videos
                ? [videos]
                : [];

              const firstVideoUrl = normalizedVideos.find(
                (video) => typeof video === "string" && video.endsWith(".mp4")
              );

              const ratingNumber = finalRating
                ? Math.round(Number(finalRating))
                : 0;

              return (
                <article key={id} className="shoe-card">
                  <div className="shoe-card-media">
                    {activeVideoId === id && firstVideoUrl ? (
                      <video
                        src={firstVideoUrl}
                        controls
                        autoPlay
                        onEnded={handleVideoStop}
                        className="shoe-card-video"
                      />
                    ) : (
                      <>
                        <img
                          className="shoe-card-image"
                          src={item?.images?.[0]}
                          alt={name}
                          onClick={() => handleNavigate(id)}
                        />

                        <div className="shoe-card-badges">
                          <span className="shoe-card-badge shoe-card-badge-dark">
                            {type || "Premium"}
                          </span>
                          {brand && (
                            <span className="shoe-card-badge">
                              {brand}
                            </span>
                          )}
                        </div>

                        {firstVideoUrl && (
                          <button
                            type="button"
                            className="shoe-video-btn"
                            onClick={() => handleVideoPlay(id)}
                            aria-label="Play product video"
                          >
                            ▶
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="shoe-card-body">
                    <div
                      className="shoe-card-content"
                      onClick={() => handleNavigate(id)}
                    >
                      <div className="shoe-card-header">
                        <div className="shoe-card-title" title={name}>
                          {name?.length > 52
                            ? `${name.substring(0, 52)}...`
                            : name}
                        </div>

                        <div className="shoe-card-rating">
                          <span className="shoe-rating-stars">
                            {ratingNumber > 0
                              ? "★".repeat(ratingNumber) +
                                "☆".repeat(5 - ratingNumber)
                              : "☆☆☆☆☆"}
                          </span>
                          <span className="shoe-rating-value">
                            {finalRating || t("no_rating") || "No rating"}
                          </span>
                        </div>
                      </div>

                      <div className="shoe-card-price-row">
                        <div className="shoe-card-price-main">
                          ${Number(usdPrice || 0).toFixed(2)}
                        </div>

                        {Number(originalPrice) > 0 && (
                          <div className="shoe-card-price-old">
                            ${Number(originalPrice).toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="shoe-card-stable">
                        <img
                          src={`https://raw.githubusercontent.com/atomiclabs/cryptocurrency-icons/master/svg/color/${crypto.toLowerCase()}.svg`}
                          alt={cryptocurrency}
                          className="shoe-card-crypto"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "https://cryptologos.cc/logos/binance-usd-busd-logo.png";
                          }}
                        />
                        <span>{formatStablePrice(usdPrice, cryptocurrency)}</span>
                      </div>

                      <div className="shoe-card-meta">
                        <span>{genre || "Fashion"}</span>
                        <span>
                          {Number(sold || 0)} {t("sold")}
                        </span>
                      </div>
                    </div>

                    <div className="shoe-card-actions">
                      <button
                        type="button"
                        className="shoe-secondary-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewNavigate(itemData);
                        }}
                        title={t("view_reviews")}
                      >
                        {t("view_reviews") || "View reviews"}
                      </button>

                      <button
                        type="button"
                        className="shoe-primary-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(id);
                        }}
                      >
                        {t("view_product") || "View product"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  </div>
);
}

export default ItemOfShoes;