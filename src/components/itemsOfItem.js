"use client";

import React, { useEffect, useMemo, useState } from "react";
import colorSwatches from "../../lib/colors.json";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./itemOfItems.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";

function Item( { countryCode, itemClicked: itemClickedProp }) {
  const params = useParams();
  const router = useRouter();

  const itemClicked = itemClickedProp || params?.itemClicked;

  const withCountry = (path) => {
    const code = countryCode || params?.country || "fr";
    if (!path) return `/${code}`;
    return `/${code}${path.startsWith("/") ? path : `/${path}`}`;
  };

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

  const [selectedColor, setSelectedColor] = useState("all");
const [selectedSize, setSelectedSize] = useState(null);
const [selectedColorByItem, setSelectedColorByItem] = useState({});
const [filterOpen, setFilterOpen] = useState(false);

  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [bestSellersByCategory, setBestSellersByCategory] = useState({});

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
       const currentCountry = countryCode || params?.country || "fr";

const response = await axios.get(
  `https://api.malidag.com/items/${itemClicked}?country=${encodeURIComponent(currentCountry)}`
);

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
  },[itemClicked, countryCode, params?.country]);

  const formatTypeForUrl = (type) =>
  encodeURIComponent(String(type || "").toLowerCase().replace(/\s+/g, "-"));

const handleNavigateByType = (itemData) => {
  const type = itemData?.item?.type || "";
  const category = String(itemData?.category || "").toLowerCase();
  const gender = String(itemData?.item?.genre || "").toLowerCase();

  const formattedType = formatTypeForUrl(type);

  if (
    ["clothes", "toys", "accessories", "gear", "toy"].includes(category) &&
    ["boy", "girl", "babies", "babyboy", "babygirl", "kids", "kid"].includes(gender)
  ) {
    router.push(withCountry(`/itemOfKids/${gender}/${formattedType}`));
  } else if (category === "beauty") {
    router.push(withCountry(`/itemOfItems/${formattedType}`));
  } else if (category === "shoes") {
    router.push(withCountry(`/itemOfShoes/${gender}-${formattedType}`));
  } else if (category === "clothes" && gender === "women") {
    router.push(withCountry(`/item-of-women/${formattedType}`));
  } else if (category === "clothes" && gender === "men") {
    router.push(withCountry(`/item-of-men/${formattedType}`));
  } else if (category === "electronic") {
    router.push(withCountry(`/itemOfElectronic/${formattedType}`));
  } else if (category === "home_kitchen") {
    router.push(withCountry(`/itemOfHome/${formattedType}`));
  } else if (category === "pet_care") {
    router.push(withCountry(`/petCare/${gender}/${formattedType}`));
  } else if (category === "jewelry") {
    router.push(withCountry(`/jewelry/${formattedType}`));
  } else {
    router.push(withCountry(`/itemOfItems/${formattedType}`));
  }
};

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
  router.push(withCountry(`/product/${id}`));
};

 const gridClassName =
  isVeryVerySmall || isVerySmall || isSmallMobile || isMobile
    ? "items-grid items-grid-2"
    : "items-grid items-grid-4";


    const getColorSwatch = (colorName = "") => {
  const color = colorName.trim().toLowerCase();
  return colorSwatches[color] || null;
};

const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

const sortImages = (images = []) => {
  return [...images].sort((a, b) => {
    const posA =
      typeof a === "object" && typeof a?.position === "number"
        ? a.position
        : 999999;

    const posB =
      typeof b === "object" && typeof b?.position === "number"
        ? b.position
        : 999999;

    return posA - posB;
  });
};

const getColorOptions = (itemData) => {
  return Object.keys(itemData?.item?.imagesVariants || {});
};

const getDisplayImage = (itemData) => {
  const selectedColorForItem = selectedColorByItem[itemData.id];
  const variants = itemData?.item?.imagesVariants || {};

  if (
    selectedColorForItem &&
    Array.isArray(variants[selectedColorForItem])
  ) {
    return (
      getImageUrl(sortImages(variants[selectedColorForItem])?.[0]) ||
      "/fallback.png"
    );
  }

  const firstColor = Object.keys(variants)[0];

  if (firstColor && Array.isArray(variants[firstColor])) {
    return getImageUrl(sortImages(variants[firstColor])?.[0]) || "/fallback.png";
  }

  return getImageUrl(itemData?.item?.images?.[0]) || "/fallback.png";
};

const handleColorSelect = (itemId, color, e) => {
  e.stopPropagation();

  setSelectedColorByItem((prev) => ({
    ...prev,
    [itemId]: color,
  }));
};

const getAllSizes = () => {
  const allSizes = items.flatMap((itemData) => {
    const sizes = Object.values(itemData?.item?.size || {});
    return sizes
      .flat()
      .flatMap((size) => String(size).split(",").map((x) => x.trim()));
  });

  return [...new Set(allSizes.filter(Boolean))];
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

const displayedItems = useMemo(() => {
  return items.filter((itemData) => {
    const item = itemData?.item || {};

    const matchesColor =
      selectedColor === "all" ||
      Object.keys(item?.imagesVariants || {}).includes(selectedColor);

    const availableSizes = Object.values(item?.size || {})
      .flat()
      .flatMap((size) => String(size).split(",").map((x) => x.trim()));

    const matchesSize =
      !selectedSize || availableSizes.includes(selectedSize);

    return matchesColor && matchesSize;
  });
}, [items, selectedColor, selectedSize]);

 if (loading) {
  return (
    <div className="items-page-loading">
      <div className="items-loading-header">
        <div className="items-skeleton items-skeleton-title" />
        <div className="items-skeleton items-skeleton-subtitle" />
      </div>

      <div className="items-loading-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="items-loading-card">
            <div className="items-skeleton items-skeleton-image" />
            <div className="items-skeleton items-skeleton-line" />
            <div className="items-skeleton items-skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}

  const countryName = countryCode?.toUpperCase() || "your country";

if (!loading && items.length === 0) {
  return (
    <div className="items-empty-country">
      <div className="items-empty-icon">📦</div>

      <span className="items-empty-badge">
        {String(itemClicked).replaceAll("_", " ")}
      </span>

      <h2>No products available</h2>

      <p>
        We couldn't find any{" "}
        <strong>{String(itemClicked).replaceAll("_", " ")}</strong>{" "}
        products currently available for delivery to{" "}
        <strong>{countryName}</strong>.
      </p>

      <p>New arrivals are added regularly. Try another country or check back soon.</p>

      <button
        type="button"
        className="items-empty-btn"
        onClick={() => router.push(withCountry("/"))}
      >
        Continue Shopping
      </button>
    </div>
  );
}

 return (
  <div className="item-page">
    <div className="item-page-inner">

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

      <div className="items-main-layout">
       <aside className="items-related-sidebar">
  <div className="items-related-title">
    {t("related_categories")}
  </div>

  {categories.map((category) => (
    <div key={category} className="items-related-group">
      <button
        type="button"
        className="items-related-category"
        onClick={() => toggleDropdown(category)}
      >
        <span>{category}</span>
        <span className="items-dropdown-arrow">
          {dropdownOpen[category] ? "▲" : "▼"}
        </span>
      </button>

      <div
        className={`items-related-types ${
          dropdownOpen[category] ? "open" : ""
        }`}
      >
        {categorizedItems[category]
          ?.filter(
            (item, idx, arr) =>
              arr.findIndex(
                (x) =>
                  x.item?.type === item.item?.type &&
                  x.item?.genre === item.item?.genre
              ) === idx
          )
          .map((item) => (
            <button
              key={`${item.item?.genre || "all"}-${item.item?.type}`}
              type="button"
              className="items-related-type"
              onClick={() => handleNavigateByType(item)}
            >
              {item.item?.genre
                ? `${item.item.genre} ${item.item.type}`
                : item.item?.type}
            </button>
          ))}
      </div>
    </div>
  ))}

  <div className="items-mobile-filter-shell">
  <button
    type="button"
    className="items-filter-toggle"
    onClick={() => setFilterOpen((prev) => !prev)}
  >
    <span>Filters</span>
    <span>{filterOpen ? "▲" : "▼"}</span>
  </button>

  <div className={`items-filter-dropdown ${filterOpen ? "open" : ""}`}>
    <div className="items-filter-section">
      <h3>Colors</h3>

      <div className="items-color-options">
        <button
          type="button"
          className={`items-color-circle all ${
            selectedColor === "all" ? "active" : ""
          }`}
          onClick={() => setSelectedColor("all")}
        >
          All
        </button>

        {colors.map((color) => {
          const swatchColor = getColorSwatch(color);

          return (
            <button
              key={color}
              type="button"
              className={`items-color-circle ${
                selectedColor === color ? "active" : ""
              }`}
              title={color}
              style={swatchColor ? { background: swatchColor } : {}}
              onClick={() => setSelectedColor(color)}
            />
          );
        })}
      </div>
    </div>

    {getAllSizes().length > 0 && (
      <div className="items-filter-section">
        <h3>Sizes</h3>

        <div className="items-size-options">
          {getAllSizes().map((size) => (
            <button
              key={size}
              type="button"
              className={`items-size-btn ${
                selectedSize === size ? "active" : ""
              }`}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    )}

    {(selectedColor !== "all" || selectedSize) && (
      <button
        type="button"
        className="items-clear-filter"
        onClick={() => {
          setSelectedColor("all");
          setSelectedSize(null);
        }}
      >
        Clear filters
      </button>
    )}
  </div>
</div>
</aside>

        <div className="item-pge-container">
          <div className={gridClassName}>
           {displayedItems.map((itemData) => {
              const { itemId, id, item } = itemData;
              const isBestSeller =
                id === bestSellersByCategory[itemData.category];

              const {
                name,
                usdPrice,
                originalPrice,
                sold,
                videos,
              } = item;

              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating;

              const normalizedVideos = Array.isArray(videos)
                ? videos
                : [videos];

              const firstVideoUrl = normalizedVideos.find(
                (video) =>
                  typeof video === "string" && video.endsWith(".mp4")
              );

              return (
                <div key={id} className="itm-card">
                  <div className="item-media-wrap">
                    <div
                      className={`item-badge ${
                        isBestSeller ? "item-badge-best" : "item-badge-top"
                      }`}
                    >
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
                          src={getDisplayImage(itemData)}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/fallback.png";
                          }}
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

                  <div
                    className="item-details"
                    onClick={() => handleNavigate(id)}
                  >
                   <div className="item-brand-name">
                    <strong>{item?.brand || itemData?.details?.brand || "Malidag"}</strong>
                    <span>
                      {name?.length > 70 ? `${name.substring(0, 70)}...` : name}
                    </span>
                  </div>

                  {getColorOptions(itemData).length > 1 && (
                      <div className="items-card-colors" onClick={(e) => e.stopPropagation()}>
                        {getColorOptions(itemData).slice(0, 3).map((color) => {
                          const swatchColor = getColorSwatch(color);
                          const firstImage = getImageUrl(
                            sortImages(item?.imagesVariants?.[color] || [])?.[0]
                          );

                          return (
                            <button
                              key={color}
                              type="button"
                              className={`items-card-color-circle ${
                                selectedColorByItem[id] === color ? "active" : ""
                              }`}
                              title={color}
                              style={
                                swatchColor
                                  ? { background: swatchColor }
                                  : { backgroundImage: `url("${firstImage}")` }
                              }
                              onClick={(e) => handleColorSelect(id, color, e)}
                            />
                          );
                        })}

                        {getColorOptions(itemData).length > 3 && (
                          <button
                            type="button"
                            className="items-more-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(id);
                            }}
                          >
                            +{getColorOptions(itemData).length - 3} more
                          </button>
                        )}
                      </div>
                    )}

                    <div className="item-prices">
                      <div className="item-price-row">
                        <span className="item-price">${usdPrice}</span>

                        {originalPrice > 0 && (
                          <span className="item-original-price">
                            ${originalPrice}
                          </span>
                        )}

                        <span className="item-sold">
                          <span>{sold}</span>
                          <span className="item-sold-label">
                            {t("sold")}
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="item-type-stars"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemData(itemData);
                        router.push(
                          withCountry(`/product/${itemData.id}/review`)
                        );
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
  </div>
);
}

export default Item;