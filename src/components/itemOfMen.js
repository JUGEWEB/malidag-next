"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";
import "./itemOfmen.css";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

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

const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  if (typeof imageEntry === "object" && imageEntry.imageUrl) return imageEntry.imageUrl;
  return "";
};

const sortImages = (images = []) => {
  if (!Array.isArray(images)) return [];

  return [...images].sort((a, b) => {
    const posA = typeof a === "object" && typeof a?.position === "number" ? a.position : 999999;
    const posB = typeof b === "object" && typeof b?.position === "number" ? b.position : 999999;
    return posA - posB;
  });
};

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
  const [selectedColor, setSelectedColor] = useState("all");
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [messageApi, contextHolder] = message.useMessage();
const [basketItems, setBasketItems] = useState([]);
const [brandThemes, setBrandThemes] = useState([]);

  const pageTitle = useMemo(() => {
    return itemClicked ? itemClicked.replace(/-/g, " ") : "Menswear";
  }, [itemClicked]);

  const fetchUserBasket = async () => {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    setBasketItems([]);
    return;
  }

  try {
    const response = await axios.get(`${BASE_URL}/basket/${currentUser.uid}`);
    setBasketItems(response.data.basket || []);
  } catch (error) {
    console.error("Error fetching basket:", error);
    setBasketItems([]);
  }
};

const getBasketQuantity = (itemId) => {
  const basketItem = basketItems.find(
    (entry) =>
      String(entry?.itemId || entry?.item?.itemId || entry?.id) === String(itemId)
  );

  return Number(basketItem?.quantity || basketItem?.item?.quantity || 0);
};

const isItemInBasket = (itemId) => {
  return getBasketQuantity(itemId) > 0;
};

const handleAddToBasket = async (itemData, e) => {
  e.preventDefault();
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/men";

    router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    return;
  }

  try {
    const item = itemData?.item || {};
    const colorOptions = getColorOptions(item?.imagesVariants);
    const selectedColorForBasket =
      selectedColorByItem[itemData.id] || colorOptions?.[0] || null;

    const variantImages = item?.imagesVariants?.[selectedColorForBasket] || [];

    const basketImage =
      getImageUrl(sortImages(variantImages)?.[0]) ||
      getImageUrl(item?.images?.[0]) ||
      "/placeholder.png";

    const basketItem = {
      userId: currentUser.uid,
      item: {
        id: itemData.id,
        itemId: itemData.itemId,
        name: item.name || itemData?.details?.itemName || "Product",
        price: Number(item.usdPrice || 0),
        color: selectedColorForBasket,
        size: selectedSize || null,
        image: basketImage,
        brand: item.brand || itemData?.details?.brand,
        brandPrice: item.brandPrice,
        quantity: 1,
      },
    };

    const response = await axios.post(BASKET_API, basketItem);

    if (response.status === 200 || response.status === 201) {
      await fetchUserBasket();
      messageApi.success(`${basketItem.item.name} added to cart`);
    } else {
      messageApi.error("Failed to add to cart");
    }
  } catch (error) {
    console.error("Error adding item to basket:", error);
    messageApi.error("Error adding to cart");
  }
};

  const getColorOptions = (imagesVariants) => {
    if (!imagesVariants || typeof imagesVariants !== "object") return [];
    return Object.keys(imagesVariants).filter(Boolean);
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
    if (!productId) {
      return [
        productId,
        {
          averageRating: null,
          reviewsArray: [],
        },
      ];
    }

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

        setReviews(Object.fromEntries(reviewEntries.filter(([key]) => key)));
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
      if (colorKeys.length > 0 && !selectedColorByItem[entry.id]) {
        initialColors[entry.id] = colorKeys[0];
      }
    });

    if (Object.keys(initialColors).length > 0) {
      setSelectedColorByItem((prev) => ({ ...initialColors, ...prev }));
    }
  }, [items]);

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(() => {
    fetchUserBasket();
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const fetchBrandThemes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/brands/themes`);
      const data = await res.json();
      setBrandThemes(data || []);
    } catch (err) {
      console.error("Failed to fetch brand themes", err);
    }
  };

  fetchBrandThemes();
}, []);

  const allSizes = useMemo(() => {
    return [...new Set(items.flatMap((entry) => parseSizes(entry?.item?.size)))];
  }, [items]);

  const allColors = useMemo(() => {
    return [
      ...new Set(
        items.flatMap((entry) => getColorOptions(entry?.item?.imagesVariants))
      ),
    ];
  }, [items]);

  const brands = useMemo(() => {
    return [
      ...new Set(items.map((entry) => entry?.item?.brand?.trim()).filter(Boolean)),
    ];
  }, [items]);

  const displayedItems = useMemo(() => {
    return items.filter((entry) => {
      const itemColors = getColorOptions(entry?.item?.imagesVariants);
      const matchesSize = !selectedSize || parseSizes(entry?.item?.size).includes(selectedSize);
      const matchesColor = selectedColor === "all" || itemColors.includes(selectedColor);

      return matchesSize && matchesColor;
    });
  }, [items, selectedSize, selectedColor]);

  const openFilter = useCallback(() => setIsFilterOpen(true), []);
  const closeFilter = useCallback(() => setIsFilterOpen(false), []);

  const clearFilter = useCallback(() => {
    setSelectedSize("");
    setSelectedColor("all");
    setIsFilterOpen(false);
  }, []);

  const handleNavigate = useCallback(
    (id) => {
      if (!id) return;
      router.push(`/product/${id}`);
    },
    [router]
  );

  const handleReviewNavigate = useCallback(
    (id, event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!id) return;
      router.push(`/product/${id}/review`);
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

  const getCurrentImages = useCallback(
    (entry) => {
      const selectedItemColor = selectedColorByItem[entry.id];
      const variants = entry?.item?.imagesVariants || {};

      if (selectedItemColor && Array.isArray(variants[selectedItemColor])) {
        return sortImages(variants[selectedItemColor]);
      }

      const firstColor = Object.keys(variants)[0];
      if (firstColor && Array.isArray(variants[firstColor])) {
        return sortImages(variants[firstColor]);
      }

      return sortImages(entry?.item?.images || []);
    },
    [selectedColorByItem]
  );

  const getDisplayImage = useCallback(
    (entry) => {
      const currentImages = getCurrentImages(entry);
      const primaryImage = getImageUrl(currentImages[0]);
      const fallbackImage = getImageUrl(entry?.item?.images?.[0]);

      return primaryImage || fallbackImage || "/placeholder.png";
    },
    [getCurrentImages]
  );

  const getColorPreviewImage = useCallback(
    (entry, color) => {
      const variantImages = sortImages(entry?.item?.imagesVariants?.[color] || []);
      return getImageUrl(variantImages[0]);
    },
    []
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

  const handleSelectColorFilter = useCallback((color) => {
    setSelectedColor(color);
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
      {contextHolder}
      <div className="men-shell">

         <div className="men-topbar-left">
            <h1 className="men-page-title">{pageTitle}</h1>
            <span className="men-page-count">
              {displayedItems.length} {t("products") || "products"}
            </span>
          </div>
        <header className="men-topbar">

          <div className="men-topbar-right">
            <button
              type="button"
              className="men-filter-btn"
              onClick={openFilter}
            >
              {selectedSize || selectedColor !== "all"
                ? `${selectedSize ? `${t("size") || "Size"}: ${selectedSize}` : ""}${
                    selectedSize && selectedColor !== "all" ? " · " : ""
                  }${selectedColor !== "all" ? `Color: ${selectedColor}` : ""}`
                : t("filters") || "Filter"}
            </button>

            {(selectedSize || selectedColor !== "all") && (
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
              src={getImageUrl(beautyImages[0]) || beautyImages[0].imageUrl}
              alt={pageTitle}
              className="men-banner-image"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = "none";
              }}
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
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = "none";
                        }}
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
                const { itemId, id, item = {}, details = {} } = itemData;
                const {
                  name,
                  usdPrice,
                  originalPrice,
                  sold,
                  videos,
                  brand,
                  images = [],
                  imagesVariants = {},
                  numberOfItems,
                } = item;

                const firstVideoUrl = getFirstVideoUrl(videos);
                const reviewsData = reviews[itemId] || {};
                const ratingData = getRatingView(reviewsData.averageRating);
                const reviewCount = reviewsData.reviewsArray?.length || 0;
                const colorOptions = getColorOptions(imagesVariants);
                const selectedColorForItem = selectedColorByItem[id];
                const displayImage = getDisplayImage(itemData);
                const discountPercentage = getDiscountPercentage(
                  usdPrice,
                  originalPrice
                );
                const productName = name || details?.itemName || "Product";
                const productBrand = brand || details?.brand;

                const brandDelivery =
  brandThemes?.find(
    (x) =>
      x?.brandName?.trim()?.toLowerCase() ===
      (productBrand || "")?.trim()?.toLowerCase()
  )?.delivery || null;

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
                            aria-label={`View ${productName}`}
                          >
                            <img
                              className="men-list-image"
                              src={displayImage || getImageUrl(images[0]) || "/placeholder.png"}
                              alt={productName}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/placeholder.png";
                              }}
                            />
                          </button>

                          {productBrand && (
                            <div className="men-list-topbar">
                              <span className="men-list-brand">{productBrand}</span>
                            </div>
                          )}

                          {firstVideoUrl && (
                            <button
                              type="button"
                              className="men-video-btn men-list-video-btn"
                              onClick={() => setActiveVideoId(id)}
                              aria-label={`Play video for ${productName}`}
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
                        {colorOptions.length > 0 && (
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
                                Color: <span>{selectedColorForItem || colorOptions[0]}</span>
                              </div>
                            </div>

                            <div className="men-list-color-options">
                              {colorOptions.map((color) => {
                                const previewImage = getColorPreviewImage(itemData, color);

                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`men-list-color-circle ${
                                      selectedColorForItem === color ? "active" : ""
                                    }`}
                                    title={color}
                                    aria-label={`Select ${color}`}
                                    style={
                                      previewImage
                                        ? { backgroundImage: `url("${previewImage}")` }
                                        : { background: getColorSwatch(color) }
                                    }
                                    onClick={(e) => handleColorSelect(id, color, e)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {colorOptions.length === 0 && discountPercentage > 0 && (
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

                        <div className="men-list-title" title={productName}>
                          {productName?.length > 80 ? `${productName.slice(0, 80)}...` : productName}
                        </div>

                        <div className="men-list-meta">
                          <span
                            className="men-rating-inline"
                            onClick={(event) => handleReviewNavigate(id, event)}
                            title={t("view_reviews") || "View reviews"}
                          >
                            {ratingData.value || "—"} · {ratingData.stars}
                            {reviewCount > 0 ? ` (${reviewCount})` : ""}
                          </span>
                          <span>
                            {Number(sold || 0)} {t("sold") || "sold"}
                          </span>
                        </div>

                        {Number(numberOfItems || 0) > 0 && (
                          <div className="men-list-meta">
                            <span>{numberOfItems} items in stock</span>
                          </div>
                        )}
                      </button>

                      <div className="men-delivery-info">
                          {brandDelivery?.isFree && <span>Free delivery</span>}

                          <span>
                            Get it by{" "}
                            {(() => {
                              const date = new Date();
                              date.setDate(date.getDate() + (brandDelivery?.estimatedDaysMin || 7));
                              return date.toLocaleDateString("en-US", {
                                weekday: "long",
                                day: "numeric",
                              });
                            })()}
                          </span>
                        </div>

                        {isItemInBasket(itemId) ? (
                          <button
                            type="button"
                            className="men-cart-action-btn added"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push("/basket");
                            }}
                          >
                            🛒 {getBasketQuantity(itemId)}
                          </button>
                        ) : (
                          <button
                            type="button"
                           className="men-cart-action-btn"
                            onClick={(e) => handleAddToBasket(itemData, e)}
                          >
                            Add to cart
                          </button>
                        )}
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

        <aside className="men-filter-drawer" aria-label="Product filter drawer">
          <div className="men-filter-head">
            <h3>{t("filters") || "Filters"}</h3>

            <button
              type="button"
              className="men-filter-close"
              onClick={closeFilter}
              aria-label="Close filter drawer"
            >
              ✕
            </button>
          </div>

          <div className="men-section-head">
            <h2 className="men-section-title">{t("choose_size") || "Choose size"}</h2>
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

          {allColors.length > 0 && (
            <>
              <div className="men-section-head" style={{ marginTop: 20 }}>
                <h2 className="men-section-title">Colors</h2>
              </div>

              <div className="men-list-color-options">
                <button
                  type="button"
                  className={`men-list-color-circle ${selectedColor === "all" ? "active" : ""}`}
                  title="All colors"
                  aria-label="Show all colors"
                  style={{ background: "#ffffff" }}
                  onClick={() => handleSelectColorFilter("all")}
                />

                {allColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`men-list-color-circle ${selectedColor === color ? "active" : ""}`}
                    title={color}
                    aria-label={`Filter ${color}`}
                    style={{ background: getColorSwatch(color) }}
                    onClick={() => handleSelectColorFilter(color)}
                  />
                ))}
              </div>
            </>
          )}

          {(selectedSize || selectedColor !== "all") && (
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