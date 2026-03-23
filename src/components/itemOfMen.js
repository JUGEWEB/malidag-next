"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import "./itemOfmen.css";

const BASE_URL = "https://api.malidag.com";

const brandUrls = {
  addidas: "https://cdn.malidag.com/brand-logos/1760351238093-o8o8u03t57.png",
  blaasploa: "https://cdn.malidag.com/brand-logos/1760350881442-21d07lv31mz.png",
  kickers: "https://cdn.malidag.com/brand-logos/1760351836064-85ubmyqapww.png",
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const parseSizes = (sizeObject) => {
  if (!sizeObject || typeof sizeObject !== "object") return [];

  return [
    ...new Set(
      Object.values(sizeObject)
        .flat()
        .flatMap((entry) =>
          String(entry || "")
            .split(",")
            .map((size) => size.trim())
            .filter(Boolean)
        )
    ),
  ];
};

const getFirstVideoUrl = (videos) => {
  const normalized = Array.isArray(videos) ? videos : videos ? [videos] : [];
  return normalized.find(
    (video) => typeof video === "string" && video.toLowerCase().endsWith(".mp4")
  );
};

const formatPrice = (price) => `$${Number(price || 0).toFixed(2)}`;

const getRatingView = (averageRating) => {
  const numeric = Number(averageRating);
  if (!numeric || Number.isNaN(numeric)) {
    return {
      value: null,
      rounded: 0,
      stars: "☆☆☆☆☆",
    };
  }

  const rounded = Math.max(0, Math.min(5, Math.round(numeric)));

  return {
    value: numeric.toFixed(1),
    rounded,
    stars: "★".repeat(rounded) + "☆".repeat(5 - rounded),
  };
};

function ItemOfMen() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const itemClicked =
    typeof params?.itemClicked === "string" ? params.itemClicked : "";

  const [items, setItems] = useState([]);
  const [beautyImages, setBeautyImages] = useState([]);
  const [reviews, setReviews] = useState({});
  const [selectedSize, setSelectedSize] = useState("");
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});

  const pageTitle = useMemo(() => {
    return itemClicked ? itemClicked.replace(/-/g, " ") : "Menswear";
  }, [itemClicked]);

  const getColorOptions = (imagesVariants) => {
    if (!imagesVariants || typeof imagesVariants !== "object") return [];
    return Object.keys(imagesVariants);
  };

  const getColorSwatch = (colorName = "") => {
    const color = String(colorName).trim().toLowerCase();

    const swatches = {
      black: "#111111",
      white: "#f8f8f8",
      red: "#dc2626",
      blue: "#2563eb",
      green: "#16a34a",
      yellow: "#eab308",
      pink: "#ec4899",
      purple: "#9333ea",
      orange: "#f97316",
      brown: "#92400e",
      grey: "#9ca3af",
      gray: "#9ca3af",
      silver: "#c0c0c0",
      gold: "#d4af37",
      beige: "#d6c7a1",
      cream: "#f5f0dc",
      ivory: "#fffff0",
      navy: "#1e3a8a",
      "sky blue": "#38bdf8",
      skyblue: "#38bdf8",
      maroon: "#7f1d1d",
      olive: "#556b2f",
      khaki: "#c3b091",
      multicolor:
        "linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #3b82f6, #a855f7)",
      transparent:
        "linear-gradient(135deg, #ddd 25%, #fff 25%, #fff 50%, #ddd 50%, #ddd 75%, #fff 75%, #fff 100%)",
    };

    return swatches[color] || "#d1d5db";
  };

  const getDiscountPercentage = (usdPrice, originalPrice) => {
    const current = Number(usdPrice || 0);
    const original = Number(originalPrice || 0);

    if (!original || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  const fetchReviews = useCallback(async (productId) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/get-reviews/${productId}`);
      const reviewsArray = Array.isArray(data?.reviews) ? data.reviews : [];

      const totalRating = reviewsArray.reduce((sum, review) => {
        const rating = parseFloat(review?.rating);
        return sum + (Number.isNaN(rating) ? 4 : rating);
      }, 0);

      const averageRating =
        reviewsArray.length > 0 ? totalRating / reviewsArray.length : null;

      return [
        productId,
        {
          averageRating,
          reviewsArray,
        },
      ];
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      return [
        productId,
        {
          averageRating: null,
          reviewsArray: [],
        },
      ];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      if (!itemClicked) {
        setItems([]);
        setBeautyImages([]);
        setReviews({});
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [itemsResponse, imagesResponse] = await Promise.allSettled([
          axios.get(`${BASE_URL}/items/${itemClicked}`),
          axios.get(`${BASE_URL}/men/images`),
        ]);

        if (!isMounted) return;

        const fetchedItems =
          itemsResponse.status === "fulfilled"
            ? itemsResponse.value?.data?.items || []
            : [];

        const menItems = fetchedItems.filter(
          (entry) => normalizeText(entry?.item?.genre) === "men"
        );

        const fetchedImages =
          imagesResponse.status === "fulfilled" &&
          Array.isArray(imagesResponse.value?.data)
            ? imagesResponse.value.data.filter(
                (image) =>
                  normalizeText(image?.type) === normalizeText(itemClicked)
              )
            : [];

        setItems(menItems);
        setBeautyImages(fetchedImages);

        const reviewEntries = await Promise.all(
          menItems.map((entry) => fetchReviews(entry?.itemId))
        );

        if (!isMounted) return;

        setReviews(Object.fromEntries(reviewEntries));
      } catch (error) {
        console.error("Error loading page data:", error);
        if (!isMounted) return;
        setItems([]);
        setBeautyImages([]);
        setReviews({});
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [itemClicked, fetchReviews]);

  useEffect(() => {
    const initialColors = {};

    items.forEach((entry) => {
      const colorKeys = Object.keys(entry?.item?.imagesVariants || {});
      if (colorKeys.length > 0) {
        initialColors[entry.id] = colorKeys[0];
      }
    });

    setSelectedColorByItem(initialColors);
  }, [items]);

  const allSizes = useMemo(() => {
    return [...new Set(items.flatMap((entry) => parseSizes(entry?.item?.size)))];
  }, [items]);

  const brands = useMemo(() => {
    return [
      ...new Set(items.map((entry) => entry?.item?.brand?.trim()).filter(Boolean)),
    ];
  }, [items]);

  const displayedItems = useMemo(() => {
    if (!selectedSize) return items;

    return items.filter((entry) =>
      parseSizes(entry?.item?.size).includes(selectedSize)
    );
  }, [items, selectedSize]);

  const openFilter = useCallback(() => setIsFilterOpen(true), []);
  const closeFilter = useCallback(() => setIsFilterOpen(false), []);

  const clearFilter = useCallback(() => {
    setSelectedSize("");
    setIsFilterOpen(false);
  }, []);

  const handleNavigate = useCallback(
    (id) => {
      if (!id) return;
      router.push(`/product/${id}`);
    },
    [router]
  );

  const handleColorSelect = useCallback((itemId, color, e) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  }, []);

  const getDisplayImage = useCallback(
    (entry) => {
      const selectedColor = selectedColorByItem[entry.id];
      const variants = entry?.item?.imagesVariants || {};

      if (selectedColor && variants[selectedColor]?.[0]) {
        return variants[selectedColor][0];
      }

      return entry?.item?.images?.[0] || "/placeholder.png";
    },
    [selectedColorByItem]
  );

  const handleBrandNavigate = useCallback(
    (brandName) => {
      if (!brandName) return;
      router.push(`/brand/theme1/${slugify(brandName)}`);
    },
    [router]
  );

  const handleSelectSize = useCallback((size) => {
    setSelectedSize(size);
    setIsFilterOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="men-page">
        <div className="men-shell">
          <div className="men-loading-wrap">
            <div className="men-loading-title" />
            <div className="men-loading-subtitle" />
            <div className="men-skeleton-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="men-skeleton-card">
                  <div className="men-skeleton-media" />
                  <div className="men-skeleton-line men-skeleton-line-short" />
                  <div className="men-skeleton-line" />
                  <div className="men-skeleton-line men-skeleton-line-tiny" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="men-page">
      <div className="men-shell">
        <header className="men-topbar">
          <div className="men-topbar-left">
            <h1 className="men-page-title">{pageTitle}</h1>
            <span className="men-page-count">
              {displayedItems.length} {t("products") || "products"}
            </span>
          </div>

          <div className="men-topbar-right">
            <button
              type="button"
              className="men-filter-btn"
              onClick={openFilter}
            >
              {selectedSize
                ? `${t("size") || "Size"}: ${selectedSize}`
                : t("filter_by_size") || "Filter"}
            </button>

            {selectedSize && (
              <button
                type="button"
                className="men-clear-btn"
                onClick={clearFilter}
              >
                {t("clear_filter") || "Clear"}
              </button>
            )}
          </div>
        </header>

        {beautyImages[0]?.imageUrl && (
          <section className="men-banner">
            <img
              src={beautyImages[0].imageUrl}
              alt={pageTitle}
              className="men-banner-image"
            />
          </section>
        )}

        {brands.length > 0 && (
          <section className="men-brand-section">
            <div className="men-section-head">
              <h2 className="men-section-title">
                {t("browse_by_brand") || "Browse by brand"}
              </h2>
            </div>

            <div className="men-brand-strip">
              {brands.map((brandName) => {
                const brandKey = normalizeText(brandName);
                const brandLogo = brandUrls[brandKey];

                return (
                  <button
                    key={brandName}
                    type="button"
                    className="men-brand-chip"
                    onClick={() => handleBrandNavigate(brandName)}
                    aria-label={`View ${brandName} brand page`}
                  >
                    {brandLogo ? (
                      <img
                        src={brandLogo}
                        alt={brandName}
                        className="men-brand-chip-logo"
                      />
                    ) : (
                      <span className="men-brand-chip-text">{brandName}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {displayedItems.length === 0 ? (
          <div className="men-empty-card">
            {t("no_products_found") || "No products found."}
          </div>
        ) : (
          <section className="men-products-wrap">
            <div className="men-section-head">
              <h2 className="men-section-title">
                {t("products") || "Products"}
              </h2>
            </div>

            <div className="men-product-grid compact men-product-grid-list">
              {displayedItems.map((itemData) => {
                const { itemId, id, item = {} } = itemData;
                const {
                  name,
                  usdPrice,
                  originalPrice,
                  sold,
                  videos,
                  brand,
                  images = [],
                  imagesVariants = {},
                } = item;

                const firstVideoUrl = getFirstVideoUrl(videos);
                const ratingData = getRatingView(reviews[itemId]?.averageRating);
                const colorOptions = getColorOptions(imagesVariants);
                const selectedColor = selectedColorByItem[id];
                const displayImage = getDisplayImage(itemData);
                const discountPercentage = getDiscountPercentage(
                  usdPrice,
                  originalPrice
                );

                return (
                  <article key={id} className="men-list-card">
                    <div className="men-list-media">
                      {activeVideoId === id && firstVideoUrl ? (
                        <video
                          src={firstVideoUrl}
                          controls
                          autoPlay
                          onEnded={() => setActiveVideoId(null)}
                          className="men-card-video"
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            className="men-card-image-button"
                            onClick={() => handleNavigate(id)}
                            aria-label={`View ${name || "product"}`}
                          >
                            <img
                              className="men-list-image"
                              src={displayImage || images[0] || "/placeholder.png"}
                              alt={name || "Product image"}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/placeholder.png";
                              }}
                            />
                          </button>

                          {brand && (
                            <div className="men-list-topbar">
                              <span className="men-list-brand">{brand}</span>
                            </div>
                          )}

                          {firstVideoUrl && (
                            <button
                              type="button"
                              className="men-video-btn men-list-video-btn"
                              onClick={() => setActiveVideoId(id)}
                              aria-label={`Play video for ${name || "product"}`}
                            >
                              ▶
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="men-list-details">
                      <button
                        type="button"
                        className="men-list-content men-reset-button"
                        onClick={() => handleNavigate(id)}
                      >
                        {colorOptions.length > 1 && (
                          <div
                            className="men-list-color-block"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <div className="men-list-color-top">
                              {discountPercentage > 0 && (
                                <span className="men-list-discount">
                                  -{discountPercentage}% off
                                </span>
                              )}

                              <div className="men-list-color-label">
                                Color: <span>{selectedColor}</span>
                              </div>
                            </div>

                            <div className="men-list-color-options">
                              {colorOptions.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`men-list-color-circle ${
                                    selectedColor === color ? "active" : ""
                                  }`}
                                  title={color}
                                  aria-label={`Select ${color}`}
                                  style={{ background: getColorSwatch(color) }}
                                  onClick={(e) => handleColorSelect(id, color, e)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {colorOptions.length <= 1 && discountPercentage > 0 && (
                          <div className="men-list-color-top">
                            <span className="men-list-discount">
                              -{discountPercentage}% off
                            </span>
                          </div>
                        )}

                        <div className="men-list-price-row">
                          <div className="men-list-price-main">
                            {formatPrice(usdPrice)}
                          </div>

                          {Number(originalPrice) > 0 && (
                            <div className="men-list-price-old">
                              {formatPrice(originalPrice)}
                            </div>
                          )}
                        </div>

                        <div className="men-list-title" title={name}>
                          {name?.length > 80 ? `${name.slice(0, 80)}...` : name}
                        </div>

                        <div className="men-list-meta">
                          <span className="men-rating-inline">
                            {ratingData.value || "—"} · {ratingData.stars}
                          </span>
                          <span>
                            {Number(sold || 0)} {t("sold") || "sold"}
                          </span>
                        </div>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className={`men-filter-drawer-wrap ${isFilterOpen ? "open" : ""}`}>
        <div className="men-filter-backdrop" onClick={closeFilter} />

        <aside className="men-filter-drawer" aria-label="Size filter drawer">
          <div className="men-filter-head">
            <h3>{t("choose_size") || "Choose size"}</h3>

            <button
              type="button"
              className="men-filter-close"
              onClick={closeFilter}
              aria-label="Close filter drawer"
            >
              ✕
            </button>
          </div>

          <div className="men-filter-sizes">
            {allSizes.length === 0 ? (
              <div className="men-empty-card">
                {t("no_sizes_found") || "No sizes found."}
              </div>
            ) : (
              allSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`men-size-block ${
                    selectedSize === size ? "active" : ""
                  }`}
                  onClick={() => handleSelectSize(size)}
                >
                  {size}
                </button>
              ))
            )}
          </div>

          {selectedSize && (
            <div className="men-filter-footer">
              <button
                type="button"
                className="men-clear-btn"
                onClick={clearFilter}
              >
                {t("clear_filter") || "Clear filter"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ItemOfMen;