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

  const pageTitle = useMemo(() => {
    return itemClicked ? itemClicked.replace(/-/g, " ") : "Menswear";
  }, [itemClicked]);

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
          imagesResponse.status === "fulfilled" && Array.isArray(imagesResponse.value?.data)
            ? imagesResponse.value.data.filter(
                (image) => normalizeText(image?.type) === normalizeText(itemClicked)
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

  const allSizes = useMemo(() => {
    return [...new Set(items.flatMap((entry) => parseSizes(entry?.item?.size)))];
  }, [items]);

  const brands = useMemo(() => {
    return [
      ...new Set(
        items
          .map((entry) => entry?.item?.brand?.trim())
          .filter(Boolean)
      ),
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

  const handleBrandNavigate = useCallback(
    (brandName) => {
      if (!brandName) return;
      router.push(`/brand/theme1/${slugify(brandName)}`);
    },
    [router]
  );

  const handleReviewNavigate = useCallback(
    (itemData) => {
      setItemData(itemData);
      router.push("/reviewPage");
    },
    [router, setItemData]
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

          <div className="men-product-grid compact">
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
              } = item;

              const firstVideoUrl = getFirstVideoUrl(videos);
              const ratingData = getRatingView(reviews[itemId]?.averageRating);

              return (
                <article key={id} className="men-card">
                  <div className="men-card-media">
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
                            className="men-card-image"
                            src={images[0] || "/placeholder.png"}
                            alt={name || "Product image"}
                          />
                        </button>

                        {brand && (
                          <div className="men-card-topbar">
                            <span className="men-tag men-tag-strong">
                              {brand}
                            </span>
                          </div>
                        )}

                        {firstVideoUrl && (
                          <button
                            type="button"
                            className="men-video-btn"
                            onClick={() => setActiveVideoId(id)}
                            aria-label={`Play video for ${name || "product"}`}
                          >
                            ▶
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="men-card-body">
                    <button
                      type="button"
                      className="men-card-content men-reset-button"
                      onClick={() => handleNavigate(id)}
                    >
                      <div className="men-card-title" title={name}>
                        {name?.length > 42 ? `${name.slice(0, 42)}...` : name}
                      </div>

                      <div className="men-card-price-row">
                        <div className="men-card-price-main">
                          {formatPrice(usdPrice)}
                        </div>

                        {Number(originalPrice) > 0 && (
                          <div className="men-card-price-old">
                            {formatPrice(originalPrice)}
                          </div>
                        )}
                      </div>

                      <div className="men-card-meta compact">
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