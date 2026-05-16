"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./itemOfShoes.css";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import colorSwatches from "../../lib/colors.json";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

function ItemOfShoes({ itemClicked }) {
  const router = useRouter();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [items, setItems] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [beautyImages, setBeautyImages] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("all");
const [selectedColorByItem, setSelectedColorByItem] = useState({});
const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});
const [brandThemes, setBrandThemes] = useState([]);
const [filtersOpen, setFiltersOpen] = useState(false);
const [basketItems, setBasketItems] = useState([]);
const [messageApi, contextHolder] = message.useMessage();

const getColorSwatch = (colorName = "") => {
  const color = colorName.trim().toLowerCase();
  return colorSwatches[color] || color;
};

const colors = useMemo(() => {
  const allColors = [];

  items.forEach((itemData) => {
    Object.keys(itemData?.item?.imagesVariants || {}).forEach((color) => {
      allColors.push(color);
    });
  });

  return [...new Set(allColors)];
}, [items]);

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
  const fetchBrandThemes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/brands/themes`);
      setBrandThemes(response.data || []);
    } catch (error) {
      console.error("Failed to fetch brand themes:", error);
    }
  };

  fetchBrandThemes();
}, []);

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

        filteredItems.forEach((item) => {
          fetchReviews(item.itemId);
        });
      } catch (error) {
        console.error("Error fetching items:", error);
        if (!itemClicked || typeof itemClicked !== "string") {
          setItems([]);
          setLoading(false);
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [itemClicked]);

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

  const brands = useMemo(() => {
    return [
      ...new Set(
        items
          .map((entry) => entry?.item?.brand?.trim())
          .filter(Boolean)
      ),
    ];
  }, [items]);

  const sortImages = (images = []) =>
  [...images].sort((a, b) => {
    const posA = typeof a === "object" && typeof a?.position === "number" ? a.position : 999999;
    const posB = typeof b === "object" && typeof b?.position === "number" ? b.position : 999999;
    return posA - posB;
  });

const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

const getColorOptions = (itemData) =>
  Object.keys(itemData?.item?.imagesVariants || {});

const getCurrentImages = (itemData) => {
  const variants = itemData?.item?.imagesVariants || {};
  const selectedColorForItem = selectedColorByItem[itemData.id];

  if (selectedColorForItem && Array.isArray(variants[selectedColorForItem])) {
    return sortImages(variants[selectedColorForItem]);
  }

  const firstColor = Object.keys(variants)[0];

  if (firstColor && Array.isArray(variants[firstColor])) {
    return sortImages(variants[firstColor]);
  }

  return itemData?.item?.images || [];
};

const getDisplayImage = (itemData) => {
  const images = getCurrentImages(itemData);
  const index = selectedImageIndexByItem[itemData.id] || 0;

  return (
    getImageUrl(images[index]) ||
    getImageUrl(itemData?.item?.images?.[0]) ||
    "/fallback.png"
  );
};

const handleColorSelect = (itemId, color, e) => {
  e.stopPropagation();

  setSelectedColorByItem((prev) => ({
    ...prev,
    [itemId]: color,
  }));

  setSelectedImageIndexByItem((prev) => ({
    ...prev,
    [itemId]: 0,
  }));
};

const handleImageArrow = (itemData, direction, e) => {
  e.stopPropagation();

  const images = getCurrentImages(itemData);
  if (images.length <= 1) return;

  setSelectedImageIndexByItem((prev) => {
    const current = prev[itemData.id] || 0;
    const next =
      direction === "next"
        ? (current + 1) % images.length
        : (current - 1 + images.length) % images.length;

    return { ...prev, [itemData.id]: next };
  });
};

 const displayedItems = useMemo(() => {
  return items.filter((itemData) => {
    const matchesSize =
      !selectedSize ||
      Object.values(itemData?.item?.size || {})
        .flat()
        .some((s) =>
          String(s)
            .split(",")
            .map((x) => x.trim())
            .includes(selectedSize)
        );

    const matchesColor =
      selectedColor === "all" ||
      Object.keys(itemData?.item?.imagesVariants || {}).includes(selectedColor);

    return matchesSize && matchesColor;
  });
}, [items, selectedSize, selectedColor]);

  const allSizes = getAllSizes(items);


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

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(() => {
    fetchUserBasket();
  });

  return () => unsubscribe();
}, []);

const getBasketQuantity = (itemId) => {
  const basketItem = basketItems.find((item) => item.itemId === itemId);
  return Number(basketItem?.quantity || 0);
};

const isItemInBasket = (itemId) => getBasketQuantity(itemId) > 0;

const handleAddToBasket = async (itemData, e) => {
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/";

    router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    return;
  }

  try {
    const item = itemData?.item || {};
    const colorOptions = getColorOptions(itemData);

    const selectedColorForBasket =
      selectedColorByItem[itemData.id] || colorOptions?.[0] || null;

    const variantImages = item?.imagesVariants?.[selectedColorForBasket] || [];

    const basketImage =
      getImageUrl(sortImages(variantImages)?.[0]) ||
      getImageUrl(item?.images?.[0]);

    const basketItem = {
      userId: currentUser.uid,
      item: {
        id: itemData.id,
        itemId: itemData.itemId,
        name: item.name,
        price: Number(item.usdPrice || 0),
        color: selectedColorForBasket,
        size: selectedSize || null,
        image: basketImage,
        brand: item.brand,
        brandPrice: item.brandPrice,
        quantity: 1,
      },
    };

    const response = await axios.post(BASKET_API, basketItem);

    if (response.status === 200 || response.status === 201) {
      await fetchUserBasket();
     setTimeout(() => {
  messageApi.success(`${item.name} added to cart`);
}, 0);
    } else {
     setTimeout(() => {
  messageApi.error("Failed to add to cart");
}, 0);
    }
  } catch (error) {
    console.error("Error adding item to basket:", error);
   setTimeout(() => {
  messageApi.error("Error adding to cart");
}, 0);
  }
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

      <section className={`shoe-toolbar ${filtersOpen ? "open" : ""}`}>
  <button
    type="button"
    className="shoe-filter-toggle"
    onClick={() => setFiltersOpen((prev) => !prev)}
  >
    Filters
    {(selectedSize || selectedColor !== "all") && (
      <span className="shoe-filter-active-dot" />
    )}
  </button>

  <div className="shoe-filter-content">
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

    <div className="shoe-color-filter">
      <span className="shoe-section-kicker">Colors</span>

      <div className="shoe-color-list">
        <button
          type="button"
          className={`shoe-color-chip all ${
            selectedColor === "all" ? "active" : ""
          }`}
          onClick={() => setSelectedColor("all")}
        >
          All
        </button>

        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`shoe-color-chip ${
              selectedColor === color ? "active" : ""
            }`}
            title={color}
            style={{ background: getColorSwatch(color) }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>

    <div className="shoe-toolbar-side">
      {(selectedSize || selectedColor !== "all") && (
        <button
          type="button"
          className="shoe-clear-btn"
          onClick={() => {
            setSelectedSize(null);
            setSelectedColor("all");
          }}
        >
          {t("clear_filter") || "Clear filter"}
        </button>
      )}
    </div>
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
                sold,
                videos,
                genre,
                type,
                brand,
              } = item;

              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating;

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

                const colorOptions = getColorOptions(itemData);
                  const selectedColorForItem = selectedColorByItem[id];
                  const displayImage = getDisplayImage(itemData);
                  const currentImages = getCurrentImages(itemData);
                  const visibleColorOptions = colorOptions.slice(0, 4);
              const hiddenColorCount = Math.max(colorOptions.length - 4, 0);

              const brandDelivery =
                brandThemes?.find(
                  (x) =>
                    x?.brandName?.trim()?.toLowerCase() ===
                    (item?.brand || "")?.trim()?.toLowerCase()
                )?.delivery || null;

              return (
                <article key={id} className="shoe-card">
                  <div className="shoe-card-media">

                    {currentImages.length > 1 && (
                    <button
                      type="button"
                      className="shoe-image-arrow shoe-image-arrow-left"
                      onClick={(e) => handleImageArrow(itemData, "prev", e)}
                    >
                      ‹
                    </button>
                  )}

                  {currentImages.length > 1 && (
                  <button
                    type="button"
                    className="shoe-image-arrow shoe-image-arrow-right"
                    onClick={(e) => handleImageArrow(itemData, "next", e)}
                  >
                    ›
                  </button>
                )}
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
                         src={displayImage}
                          alt={name}
                          onClick={() => handleNavigate(id)}
                        />

                        <div className="shoe-card-badges">
                          <span className="shoe-card-badge shoe-card-badge-dark">
                            { "Premium"}
                          </span>
                         
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

                        {colorOptions.length > 1 && (
                  <div className="shoe-card-colors" onClick={(e) => e.stopPropagation()}>
                    {visibleColorOptions.map((color) => {
                      const swatchColor = getColorSwatch(color);
                      const variantImages = sortImages(item?.imagesVariants?.[color] || []);
                      const firstVariantImage = getImageUrl(variantImages?.[0]);

                      return (
                        <button
                          key={color}
                          type="button"
                          className={`shoe-card-color-circle ${
                            selectedColorForItem === color ? "active" : ""
                          }`}
                          title={color}
                          onClick={(e) => handleColorSelect(id, color, e)}
                          style={
                            swatchColor
                              ? { background: swatchColor }
                              : { backgroundImage: `url("${firstVariantImage}")` }
                          }
                        />
                      );
                    })}

                    {hiddenColorCount > 0 && (
                      <button
                        type="button"
                        className="shoe-more-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(id);
                        }}
                      >
                        +{hiddenColorCount} more
                      </button>
                    )}
                  </div>
                )}

                        <div  onClick={(e) => {
                          e.stopPropagation();
                          handleReviewNavigate(itemData);
                        }} className="shoe-card-rating">
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

                     <div className="shoe-delivery-info">
                      {brandDelivery?.isFree && (
                        <span className="shoe-free-delivery">Free delivery</span>
                      )}

                      <span className="shoe-delivery-date">
                        Get it by {brandDelivery?.estimatedDaysMax || 7} days
                      </span>
                    </div>

                        {Number(item.numberOfItems || 0) > 0 && (
                          <div
                            className={
                              Number(item.numberOfItems) <= 23
                                ? "shoe-stock-badge low"
                                : "shoe-stock-badge"
                            }
                          >
                            {Number(item.numberOfItems) <= 23
                              ? `Only ${item.numberOfItems} items left in stock`
                              : `${item.numberOfItems} items in stock`}
                          </div>
                        )}

                      <div className="shoe-card-meta">
                        <span>{genre || "Fashion"}</span>
                        <span>
                          {Number(sold || 0)} {t("sold")}
                        </span>
                      </div>
                    </div>

                    <div className="shoe-card-actions">

                     {isItemInBasket(itemId) ? (
  <button
    type="button"
    className="shoe-added-cart-btn"
    onClick={(e) => {
      e.stopPropagation();
      router.push("/basket");
    }}
  >
    🛒 {getBasketQuantity(itemId)}
  </button>
) : (
  <button
    type="button"
    className="shoe-primary-btn"
    onClick={(e) => handleAddToBasket(itemData, e)}
  >
    Add to cart
  </button>
)}
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