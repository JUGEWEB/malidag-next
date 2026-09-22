"use client";

import React, { useEffect, useMemo, useState } from "react";
import colorSwatches from "../../lib/colors.json";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./itemOfItems.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import { getCountryConfig } from "./countryUtils";

const BASE_URL = "https://api.malidag.com";

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

 const { t, i18n } = useTranslation();

const [itemTranslations, setItemTranslations] = useState({});
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [bestSellersByCategory, setBestSellersByCategory] = useState({});

  const [rates, setRates] = useState({});

const [lockedCountry, setLockedCountry] =
  useState(null);

const countryCurrencyConfig = useMemo(
  () =>
    getCountryConfig(
      lockedCountry?.name || ""
    ),
  [lockedCountry?.name]
);

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

  const getTranslationLanguage = () => {
  const raw = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "en"
  ).toLowerCase();

  if (
    raw === "br" ||
    raw === "pt-br" ||
    raw.startsWith("pt")
  ) {
    return "br";
  }

  if (raw.startsWith("fr")) {
    return "fr";
  }

  return "en";
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
  const fetchRates = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/prices/rates`
      );

      setRates(response.data?.rates || {});
    } catch (error) {
      console.error(
        "Error fetching exchange rates:",
        error
      );
    }
  };

  fetchRates();
}, []);

useEffect(() => {
  const syncCountry = () => {
    try {
      const savedCountry =
        localStorage.getItem(
          "selectedCountry"
        );

      if (savedCountry) {
        const parsedCountry =
          JSON.parse(savedCountry);

        setLockedCountry(
          parsedCountry
        );
      } else {
        setLockedCountry(null);
      }
    } catch (error) {
      console.error(
        "Failed to sync country:",
        error
      );

      setLockedCountry(null);
    }
  };

  syncCountry();

  window.addEventListener(
    "countryChanged",
    syncCountry
  );

  return () => {
    window.removeEventListener(
      "countryChanged",
      syncCountry
    );
  };
}, []);

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

  useEffect(() => {
  if (!items.length) {
    setItemTranslations({});
    return;
  }

  let cancelled = false;

  const fetchItemTranslations = async () => {
    const lang = getTranslationLanguage();

    // English is the original product language.
    if (lang === "en") {
      if (!cancelled) {
        setItemTranslations({});
      }
      return;
    }

    const itemIds = [
      ...new Set(
        items
          .map((itemData) => itemData?.itemId)
          .filter(Boolean)
          .map(String)
      ),
    ];

    try {
      const results = await Promise.allSettled(
        itemIds.map(async (itemId) => {
          const response = await axios.get(
            `${BASE_URL}/translate/product/translate/${encodeURIComponent(
              itemId
            )}/${encodeURIComponent(lang)}`
          );

          return {
            itemId,
            translation: response.data?.translation || null,
          };
        })
      );

      if (cancelled) return;

      const translationMap = {};

      results.forEach((result) => {
        if (result.status !== "fulfilled") return;

        const {
          itemId,
          translation,
        } = result.value;

        if (translation) {
          translationMap[String(itemId)] = translation;
        }
      });

      setItemTranslations(translationMap);
    } catch (error) {
      console.error(
        "Error translating item names:",
        error
      );
    }
  };

  fetchItemTranslations();

  return () => {
    cancelled = true;
  };
}, [
  items,
  i18n.language,
  i18n.resolvedLanguage,
]);

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

const translateDynamicLabel = (value) => {
  if (!value) return "";

  const raw = String(value).trim();

  return t(raw, {
    defaultValue: raw,
  });
};

const normalizeTranslationKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

const translateGenderType = (gender, type) => {
  if (!gender && !type) return "";

  if (!gender) {
    return translateDynamicLabel(type);
  }

  if (!type) {
    return translateDynamicLabel(gender);
  }

  const genderKey = normalizeTranslationKey(gender);
  const typeKey = normalizeTranslationKey(type);

  // Example:
  // women + jacket  -> women_jacket
  // men + T-Shirt   -> men_t_shirt
  const combinedKey = `${genderKey}_${typeKey}`;

  // First priority: proper combined translation.
  if (i18n.exists(combinedKey)) {
    return t(combinedKey);
  }

  // Fallback: translate the two backend values separately.
  return `${translateDynamicLabel(gender)} ${translateDynamicLabel(type)}`;
};

const getTranslatedColor = (color) => {
  if (!color) return "";

  const normalizedColor = String(color)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  return t(`color_${normalizedColor}`, {
    defaultValue: color,
  });
};

const formatUsdToLocal = (usdValue) => {
  const usdPrice =
    Number(usdValue || 0);

  const currency =
    countryCurrencyConfig?.currency ||
    "USD";

  let localizedPrice = usdPrice;

  if (currency !== "USD") {
    const rate =
      Number(rates?.[currency]);

    if (rate) {
      localizedPrice =
        usdPrice * rate;
    }
  }

  const symbol =
    countryCurrencyConfig?.symbol ||
    "$";

  return `${symbol}${localizedPrice.toFixed(
    2
  )}`;
};



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

     <h2>{t("items_no_products_available")}</h2>

<p>
  {t("items_no_products_delivery", {
    type: String(itemClicked).replaceAll("_", " "),
    country: countryName,
  })}
</p>

<p>
  {t("items_new_arrivals_message")}
</p>

<button
  type="button"
  className="items-empty-btn"
  onClick={() => router.push(withCountry("/"))}
>
  {t("continue_shopping")}
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
        <span> {translateDynamicLabel(category)}</span>
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
            {translateGenderType(
              item.item?.genre,
              item.item?.type
            )}
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
    <span>{t("filters")}</span>
    <span>{filterOpen ? "▲" : "▼"}</span>
  </button>

  <div className={`items-filter-dropdown ${filterOpen ? "open" : ""}`}>
    <div className="items-filter-section">
      <h3>{t("colors")}</h3>

      <div className="items-color-options">
        <button
          type="button"
          className={`items-color-circle all ${
            selectedColor === "all" ? "active" : ""
          }`}
          onClick={() => setSelectedColor("all")}
        >
         {t("all")}
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
             title={getTranslatedColor(color)}
              aria-label={getTranslatedColor(color)}
              style={swatchColor ? { background: swatchColor } : {}}
              onClick={() => setSelectedColor(color)}
            />
          );
        })}
      </div>
    </div>

    {getAllSizes().length > 0 && (
      <div className="items-filter-section">
        <h3>{t("sizes")}</h3>

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
       {t("clear_filters")}
      </button>
    )}
  </div>
</div>
</aside>

        <div className="item-pge-container">
          <div className={gridClassName}>
           {displayedItems.map((itemData) => {
              const { itemId, id, item } = itemData;
               const {
                name,
                usdPrice,
                originalPrice,
                sold,
                videos,
              } = item;
              const translatedProduct =
              itemTranslations[String(itemId)];

            const displayName =
              translatedProduct?.name ||
              translatedProduct?.itemName ||
              name ||
              t("product");
              const isBestSeller =
                id === bestSellersByCategory[itemData.category];

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
                          alt={displayName}
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
                     {displayName?.length > 70
                      ? `${displayName.substring(0, 70)}...`
                      : displayName}
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
                             title={getTranslatedColor(color)}
                              aria-label={getTranslatedColor(color)}
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
                           {t("more_colors", {
                              count: getColorOptions(itemData).length - 3,
                            })}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="item-prices">
                      <div className="item-price-row">
                       <span className="item-price">
                        {formatUsdToLocal(usdPrice)}
                      </span>

                        {originalPrice > 0 && (
                          <span className="item-original-price">
                          {formatUsdToLocal(
                              originalPrice
                            )}
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