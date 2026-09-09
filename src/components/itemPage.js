"use client";

import React, { useEffect, useState, useContext, useMemo } from "react";
import { AppContext } from "./appContext";
import axios from "axios";
import "./itemPage.css";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import colors from "../../lib/colors.json";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

function ItemPage({ searchTerm }) {
  const router = useRouter();
  const { country } = useContext(AppContext);

const countryCode = country?.code?.toLowerCase() || null;

const withCountry = (path) => {
  if (!countryCode) return "/";

  if (!path) return `/${countryCode}`;

  return `/${countryCode}${path.startsWith("/") ? path : `/${path}`}`;
};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  const { isMobile, isTablet, isVerySmall, isSmallMobile } = useScreenSize();
  const { t, i18n } = useTranslation();
  const [translations, setTranslations] = useState({});
  const setItemData = useCheckoutStore((state) => state.setItemData);
  const [bestSellerId, setBestSellerId] = useState(null);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedBrand, setSelectedBrand] = useState("all");
const [selectedBrandType, setSelectedBrandType] = useState("all");
const [selectedType, setSelectedType] = useState("all");
const [selectedSize, setSelectedSize] = useState("all");
const [selectedColor, setSelectedColor] = useState("all");
const [priceRange, setPriceRange] = useState([0, 10000]);
const [brandThemes, setBrandThemes] = useState([]);
const [messageApi, contextHolder] = message.useMessage();
const [basketItems, setBasketItems] = useState([]);
const [rates, setRates] = useState(null);

const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

const currentLanguage = isSupportedLanguage(i18n.language)
  ? i18n.language
  : "en";

  const translateTaxonomy = (value) => {
  if (!value) return "";

  const raw = String(value).trim();

  const normalizedKey = raw
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_");

  // Try normalized locale key first
  if (i18n.exists(normalizedKey)) {
    return t(normalizedKey);
  }

  // Try original DB value as a key
  if (i18n.exists(raw)) {
    return t(raw);
  }

  // If no translation exists, keep original DB text
  return raw;
};

const translateColor = (color) => {
  if (!color) return "";

  const raw = String(color).trim();

  const key = `color_${raw
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_")}`;

  return i18n.exists(key)
    ? t(key)
    : raw;
};

const translateTaxonomyPhrase = (gender, type) => {
  const rawGender = String(gender || "").trim();
  const rawType = String(type || "").trim();

  if (!rawGender && !rawType) return "";

  const normalizeKey = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "_and_")
      .replace(/[-\s]+/g, "_")
      .replace(/_+/g, "_");

  const genderKey = normalizeKey(rawGender);
  const typeKey = normalizeKey(rawType);

  const joinedKey = [genderKey, typeKey]
    .filter(Boolean)
    .join("_");

  // Priority 1: use complete phrase translation
  if (joinedKey && i18n.exists(joinedKey)) {
    return t(joinedKey);
  }

  // Priority 2: translate each part separately
  const translatedGender = translateTaxonomy(rawGender);
  const translatedType = translateTaxonomy(rawType);

  return [translatedGender, translatedType]
    .filter(Boolean)
    .join(" ");
};

 const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");


const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

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

const isItemInBasket = (itemId) => {
  return getBasketQuantity(itemId) > 0;
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
    const fetchItems = async () => {
      if (!searchTerm) return;

      setLoading(true);

      try {
       const response = await axios.get(
  `https://api.malidag.com/items/${encodeURIComponent(searchTerm)}?country=${encodeURIComponent(countryCode)}`
);
       const matchedItems = response.data.items || [];
setItems(matchedItems);

const initialColors = {};

matchedItems.forEach((product) => {
  const colorKeys = Object.keys(product?.item?.imagesVariants || {});
  if (colorKeys.length > 0) {
    initialColors[product.id] = colorKeys[0];
  }
});

setSelectedColorByItem(initialColors);

const bestSeller = [...matchedItems].sort(
  (a, b) => Number(b?.item?.sold || b?.details?.soldText || 0) - Number(a?.item?.sold || a?.details?.soldText || 0)
)[0];

setBestSellerId(bestSeller?.id || null);

matchedItems.forEach((item) => fetchReviews(item.itemId));
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [searchTerm, countryCode]);

  useEffect(() => {
  const fetchRates = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/prices/rates`);

      setRates(response.data?.rates || response.data || null);
    } catch (error) {
      console.error("Failed to fetch currency rates:", error);
      setRates(null);
    }
  };

  fetchRates();
}, []);

const categoryTypes = Array.from(
  new Map(
    items
      .filter(
        (itemData) =>
          itemData?.item?.type &&
          itemData?.item?.genre
      )
      .map((itemData) => [
        `${normalizeText(itemData.item.genre)}_${normalizeText(
          itemData.item.type
        )}`,
        itemData,
      ])
  ).values()
);

const getCurrencyRate = () => {
  if (!currencyConfig || !rates) return null;

  if (currencyConfig.currency === "USD") {
    return 1;
  }

  const rate = Number(rates?.[currencyConfig.currency]);

  return Number.isFinite(rate) && rate > 0
    ? rate
    : null;
};

const convertUsd = (usdAmount) => {
  const amount = Number(usdAmount);

  if (!Number.isFinite(amount)) return null;

  const rate = getCurrencyRate();

  if (!rate) return null;

  return amount * rate;
};

const formatPrice = (usdAmount) => {
  const converted = convertUsd(usdAmount);

  if (converted === null || !currencyConfig) {
    return t("price_unavailable");
  }

  return `${currencyConfig.symbol}${converted.toFixed(2)}`;
};

  useEffect(() => {
  const fetchTranslations = async () => {
    if (!items.length) {
      setTranslations({});
      return;
    }

    // English uses the original database content.
    if (currentLanguage === "en") {
      setTranslations({});
      return;
    }

    try {
      const results = await Promise.all(
        items.map(async (itemData) => {
          const productId = itemData?.itemId;

          if (!productId) {
            return null;
          }

          try {
            const response = await axios.get(
              `${BASE_URL}/translate/product/translate/${productId}/${currentLanguage}`
            );

            return {
              productId,
              translation: response.data?.translation || null,
            };
          } catch (error) {
            console.error(
              `Failed to translate product ${productId}:`,
              error
            );

            return null;
          }
        })
      );

      const nextTranslations = {};

      results.forEach((result) => {
        if (result?.productId && result?.translation) {
          nextTranslations[result.productId] = result.translation;
        }
      });

      setTranslations(nextTranslations);
    } catch (error) {
      console.error("Failed to fetch product translations:", error);
    }
  };

  fetchTranslations();
}, [items, currentLanguage]);

  const handleAddToBasket = async (itemData, e) => {
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/";

   router.push(withCountry(`/auth?redirect=${encodeURIComponent(currentPath)}`));
    return;
  }

  try {
    const item = itemData?.item || {};
    const colorOptions = getColorOptions(itemData);

    const selectedColorForBasket =
      selectedColorByItem[itemData.id] || colorOptions?.[0] || null;

    const variantImages = item?.imagesVariants?.[selectedColorForBasket] || [];

    const basketImage =
      getImageUrl(variantImages?.[0]) || getImageUrl(item?.images?.[0]);

    const basketItem = {
      userId: currentUser.uid,
      item: {
        id: itemData.id,
        itemId: itemData.itemId,
        name: item.name,
        price: Number(item.usdPrice || 0),
        color: selectedColorForBasket,
        size: null,
        image: basketImage,
        brand: item.brand,
        brandPrice: item.brandPrice,
        quantity: 1,
      },
    };

    const response = await axios.post(BASKET_API, basketItem);

    if (response.status === 200 || response.status === 201) {
      await fetchUserBasket();
      messageApi.success(`${item.name} added to cart`);
    } else {
     messageApi.error(t("basket_add_failed"));
    }
  } catch (error) {
    console.error("Error adding item to basket:", error);
   messageApi.error(t("basket_add_error"));
  }
};

  const brands = Array.from(
    new Set(items.map((item) => item?.item?.brand).filter(Boolean))
  );

 const brandTypes = Array.from(
  new Map(
    items
      .filter((itemData) => itemData?.item?.brandType && itemData?.item?.brand)
      .map((itemData) => [
        `${itemData.item.brandType} ${itemData.item.brand}`,
        itemData,
      ])
  ).entries()
);

  const handleVideoPlay = (id) => {
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleItemClick = (id) => {
    if (id) {
     router.push(withCountry(`/product/${id}`));
    }
  };


const formatRoute = (value) =>
  encodeURIComponent(
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
  );

const getBrandTheme = (brandName) => {
  const match = brandThemes.find(
    (x) => normalizeText(x?.brandName) === normalizeText(brandName)
  );

  return match?.theme?.trim()?.toLowerCase() || "brand";
};

const formatTypeForUrl = (type) =>
  encodeURIComponent(String(type || "").toLowerCase().replace(/\s+/g, "-"));

const handleNavigateByType = (firstItem) => {
  const type = (firstItem?.item?.type || "").toLowerCase();
  const category = (firstItem?.category || "").toLowerCase();
  const gender = (firstItem?.item?.genre || "").toLowerCase();

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
    console.warn("No route matched for:", { type, category, gender });
  }
};

const handleLinkClick = (label, value, sourceItem = null) => {
  setMenuOpen(false);

  if (label === "type") {
    handleNavigateByType(sourceItem);
    return;
  }

  if (label === "brand") {
    const theme = getBrandTheme(value);
   router.push(withCountry(`/brand/${theme}/${encodeURIComponent(value)}`));
    return;
  }

  if (label === "brandType") {
    const brand = sourceItem?.item?.brand || sourceItem?.details?.brand || brands[0];
    if (!brand) return;

    const theme = getBrandTheme(brand);

   router.push(
  withCountry(
    `/brand/${theme}/${encodeURIComponent(
      brand
    )}?brandType=${encodeURIComponent(value)}`
  )
);
  }
};

useEffect(() => {
  const fetchBrandThemes = async () => {
    try {
      const res = await axios.get("https://api.malidag.com/api/brands/themes");
      setBrandThemes(res.data || []);
    } catch (error) {
      console.error("Failed to fetch brand themes:", error);
    }
  };

  fetchBrandThemes();
}, []);

  const isSmallScreen = isMobile || isTablet || isVerySmall || isSmallMobile;

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  if (!items || items.length === 0) {
    return (
      <div className="no-results-message">
        {t("no_results_found", { term: searchTerm })}
      </div>
    );
  }

  const handleColorSelect = (itemId, color, e) => {
  e.stopPropagation();
  setSelectedColorByItem((prev) => ({
    ...prev,
    [itemId]: color,
  }));
};

const getColorOptions = (itemData) => {
  return Object.keys(itemData?.item?.imagesVariants || {});
};

const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

const getDisplayImage = (itemData) => {
  const selectedColor = selectedColorByItem[itemData.id];
  const variants = itemData?.item?.imagesVariants || {};

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number"
          ? a.position
          : 999999;

      const posB =
        typeof b === "object" && typeof b?.position === "number"
          ? b.position
          : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object"
          ? a?.filename || ""
          : String(a || "").split("/").pop() || "";

      const nameB =
        typeof b === "object"
          ? b?.filename || ""
          : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(itemData?.item?.images?.[0]) || "/fallback.png";
};

const getColorSwatch = (colorName = "") => {
  const key = String(colorName).trim().toLowerCase();

  return colors[key] || null;
};

const getSizeOptionsForItem = (itemData) => {
  const sizeMap = itemData?.item?.size || {};
  const allOptions = Object.values(sizeMap).flat();

  return allOptions.flatMap((option) => {
    if (!option) return [];

    if (typeof option === "object") {
      return option.value ? [String(option.value).trim()] : [];
    }

    if (typeof option === "string") {
      return option
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return [];
  });
};

const sizes = Array.from(
  new Set(
    items
      .flatMap(getSizeOptionsForItem)
      .map((size) => String(size).trim())
      .filter(Boolean)
  )
);

const colorFilterOptions = Array.from(
  new Set(
    items.flatMap((itemData) =>
      Object.keys(itemData?.item?.imagesVariants || {})
    )
  )
);

const convertedPrices = items
  .map((x) => convertUsd(x?.item?.usdPrice))
  .filter((price) => price !== null);

const maxPrice =
  convertedPrices.length > 0
    ? Math.max(1, Math.ceil(Math.max(...convertedPrices)))
    : 1;

const filteredItems = items.filter((itemData) => {
  const item = itemData?.item || {};
  const price = convertUsd(item.usdPrice);

 const itemSizes = getSizeOptionsForItem(itemData).map(normalizeText);

  const matchesType =
    selectedType === "all" || normalizeText(item.type) === selectedType;

  const matchesBrand =
    selectedBrand === "all" || normalizeText(item.brand) === selectedBrand;

  const matchesBrandType =
    selectedBrandType === "all" ||
    normalizeText(item.brandType) === selectedBrandType;

  const matchesSize =
    selectedSize === "all" || itemSizes.includes(selectedSize);

  const matchesColor =
    selectedColor === "all" ||
    Object.keys(item.imagesVariants || {}).includes(selectedColor);

  const matchesPrice =
  price !== null &&
  price >= priceRange[0] &&
  price <= priceRange[1];

  return (
    matchesType &&
    matchesBrand &&
    matchesBrandType &&
    matchesSize &&
    matchesColor &&
    matchesPrice
  );
});

  return (
    <div className="page-layout-cc">
      {contextHolder}
      {isSmallScreen && (
        <div className="mobile-top-bar-cc">
          <div className="mobile-results-title-cc">
            {t("search_results")}
          </div>

          <button
            className="mobile-menu-icon-button-cc"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={t("filters")}
          >
            {t("filters")}
          </button>
        </div>
      )}

      <aside
        className={`sidebar-filters-cc ${isSmallScreen ? "mobile-sidebar-cc" : ""} ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="sidebar-block-cc">
          <div className="sidebar-title-cc">{t("related_types")}</div>
          <div className="sidebar-links-cc">
          {categoryTypes.map((firstItem, index) => {
            const gender = firstItem?.item?.genre || "";
            const type = firstItem?.item?.type || "";

           const translatedLabel = translateTaxonomyPhrase(
              gender,
              type
            );

            return (
              <div
                key={`${gender}-${type}-${index}`}
                className="sidebar-main-link-cc"
                onClick={() =>
                  handleLinkClick("type", type, firstItem)
                }
              >
               {translatedLabel}
              </div>
            );
          })}
          </div>
        </div>

        {brands.length > 0 && (
          <div className="sidebar-block-cc">
            <div className="sidebar-title-cc"> {t("related_brands")}</div>
            <div className="sidebar-links-cc">
              {brands.map((brand, index) => (
                <div
                  key={index}
                  className="sidebar-main-link-cc"
                  onClick={() => handleLinkClick("brand", brand)}
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        )}

        {brandTypes.length > 0 && (
          <div className="sidebar-block-cc">
            <div className="sidebar-title-cc"> {t("brand_types")}</div>
            <div className="sidebar-links-cc">
            {brandTypes.map(([label, sourceItem], index) => {
  const brandType = sourceItem?.item?.brandType || "";
  const brand = sourceItem?.item?.brand || "";

  const translatedBrandType = translateTaxonomy(brandType);

  return (
    <div
      key={index}
      className="sidebar-main-link-cc"
      onClick={() =>
        handleLinkClick(
          "brandType",
          brandType,
          sourceItem
        )
      }
    >
      {translatedBrandType} {brand}
    </div>
  );
})}
            </div>
          </div>
        )}

        <div className="sidebar-block-cc filter-section-cc">
  <div className="sidebar-title-cc">{t("filters")}</div>

  <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
    <option value="all"> {t("all_sizes")}</option>
    {sizes.map((size) => (
      <option key={size} value={normalizeText(size)}>
        {size}
      </option>
    ))}
  </select>

 <div className="filter-colors-cc">
  <button
    type="button"
    className={`filter-color-circle-cc ${
      selectedColor === "all" ? "active" : ""
    }`}
    onClick={() => setSelectedColor("all")}
    title={t("all_colors")}
  >
    {t("all")}
  </button>

  {colorFilterOptions.map((color) => {
    const swatch = getColorSwatch(color);

    return (
      <button
        key={color}
        type="button"
        className={`filter-color-circle-cc ${
          selectedColor === color ? "active" : ""
        }`}
        onClick={() => setSelectedColor(color)}
       title={translateColor(color)}
        style={
          swatch
            ? { background: swatch }
            : {
                backgroundImage: `url(${getImageUrl(
                  items.find((x) =>
                    x?.item?.imagesVariants?.[color]
                  )?.item?.imagesVariants?.[color]?.[0]
                )})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
        }
      />
    );
  })}
</div>

  <input
  type="range"
  min="0"
  max={maxPrice}
  value={Math.min(priceRange[1], maxPrice)}
  onChange={(e) =>
    setPriceRange([0, Number(e.target.value)])
  }
/>

  <span>
  {t("up_to_price", {
    price: `${currencyConfig?.symbol || ""}${Math.min(
      priceRange[1],
      maxPrice
    ).toFixed(2)}`,
  })}
</span>
</div>
      </aside>

      <main className="item-page-container-cc">
        {!isSmallScreen && (
          <div className="desktop-results-title-cc">
            {t("search_results")}
          </div>
        )}

        <div className="search-results-container-cc">
         {filteredItems.map((itemData) => {
  const { itemId, id, item = {}, details = {} } = itemData;

    const originalName =
  item.name ||
  details.itemName ||
  itemData.name ||
  t("unnamed_item");

  const translatedName =
  translations?.[itemId]?.name;

  const name =
  currentLanguage === "en"
    ? originalName
    : translatedName || originalName;

  const usdPrice = parseFloat(item.usdPrice || details.usdText || 0);
  const originalPrice = parseFloat(
    item.originalPrice || details.originalPrice || 0
  );

 const sold = item.sold || details.soldText || "";
const numericSold = Number(sold) || 0;
const hasSold = numericSold > 0;
const isBestSeller = id === bestSellerId;

  const reductionPercentage =
    originalPrice > 0 && usdPrice >= 0 && usdPrice < originalPrice
      ? Math.round(((originalPrice - usdPrice) / originalPrice) * 100)
      : 0;

  const reviewsData = reviews[itemId] || {};
  const finalRating = reviewsData?.averageRating || t("no_rating");

 const displayPrice = formatPrice(usdPrice);
const displayOriginalPrice =
  originalPrice > 0
    ? formatPrice(originalPrice)
    : null;

  const normalizedVideos = Array.isArray(item.videos)
    ? item.videos
    : item.videos
    ? [item.videos]
    : [];

  const firstVideoUrl = normalizedVideos.find(
    (video) => typeof video === "string" && video.endsWith(".mp4")
  );

 const firstImage = getDisplayImage(itemData);
const colorOptions = getColorOptions(itemData);
const selectedColor = selectedColorByItem[id];
const visibleColorOptions = colorOptions.slice(0, 4);
const hiddenColorCount = Math.max(colorOptions.length - 4, 0);
const brandDelivery =
  brandThemes?.find(
    (x) =>
      normalizeText(x?.brandName) ===
      normalizeText(item?.brand || details?.brand)
  )?.delivery || null;

const hasFreeDelivery = Boolean(brandDelivery?.isFree);

  return (
    <div key={id} className="item-card-cc">
      <div className="item-media-box-cc">
        <div className={`item-badge-cc ${isBestSeller ? "item-badge-best-cc" : "item-badge-top-cc"}`}>
        {isBestSeller ? t("best_seller") : t("topIt")}
      </div>
        {activeVideoId === id && firstVideoUrl ? (
          <video
            src={firstVideoUrl}
            controls
            autoPlay
            onEnded={handleVideoStop}
            style={{ width: "100%", height: "230px", objectFit: "contain" }}
          />
        ) : (
          <>
            <img
              className="item-image-cc"
              src={firstImage}
              onClick={() => handleItemClick(id)}
              alt={name}
              style={{ width: "100%", height: "230px", objectFit: "contain" }}
            />
            {firstVideoUrl && (
             <button
              type="button"
              className="play-button-cc"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoPlay(id);
              }}
              aria-label={t("play_product_video")}
            >
              ▶
            </button>
            )}
          </>
        )}
      </div>

    <div onClick={() => handleItemClick(id)} className="item-details-cc">

      {colorOptions.length > 0 && (
  <div className="item-color-block-cc">
    <div className="item-color-label-cc">
     {t("color")}: <span>{translateColor(selectedColor)}</span>
    </div>

   <div className="item-color-options-cc">
    {visibleColorOptions.map((color) => {
  const swatch = getColorSwatch(color);

  return (
    <button
      key={color}
      type="button"
      className={`item-color-circle-cc ${
        selectedColor === color ? "active" : ""
      }`}
      onClick={(e) => handleColorSelect(id, color, e)}
      title={translateColor(color)}
      aria-label={t("select_color", {
        color: translateColor(color),
      })}
      style={
        swatch
          ? { background: swatch }
          : {
              backgroundImage: `url(${getImageUrl(
                item?.imagesVariants?.[color]?.[0]
              )})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
      }
    />
  );
})}

{hiddenColorCount > 0 && (
  <button
    type="button"
    className="more-colors-btn-cc"
    onClick={(e) => {
      e.stopPropagation();
      handleItemClick(id);
    }}
  >
   {t("more_colors", {
  count: hiddenColorCount,
})}
  </button>
)}
    </div>
  </div>
)}
  <div className="item-name-cc" title={name}>
    {name.length > 40 ? `${name.substring(0, 40)}...` : name}
  </div>

 <div className="item-service-row-cc">
  {hasFreeDelivery && (
    <span className="item-service-pill-cc"> {t("free_delivery")}</span>
  )}

  <span className="item-service-pill-cc item-service-muted-cc">
    {t("easy_returns")}
  </span>
</div>

  <div className="item-prices-cc">
    <div className="item-price-row-cc">
    <span className="item-price-cc">
  {displayPrice}
</span>

{originalPrice > 0 && displayOriginalPrice && (
  <span className="item-original-price-cc">
    {displayOriginalPrice}
  </span>
)}

      {reductionPercentage > 0 && (
        <span className="item-reduction-cc">
  {t("discount_off", {
    percent: reductionPercentage,
  })}
</span>
      )}
    </div>
  </div>

 {hasSold && (
  <div className="item-meta-row-cc">
    <span className="item-sold-cc">
      {numericSold} <span className="sold-label-cc">{t("sold")}</span>
    </span>
  </div>
)}

  <div
    className="item-type-stars-cc"
    onClick={(e) => {
      e.stopPropagation();
      setItemData(itemData);
     router.push(withCountry(`/product/${id}/review`));
    }}
    title={t("view_reviews")}
  >
    {finalRating
      ? "★".repeat(Math.round(finalRating)) +
        "☆".repeat(5 - Math.round(finalRating))
      : t("no_rating")}
  </div>

 {isItemInBasket(itemId) ? (
  <button
    type="button"
    className="added-to-basket-btn-cc"
    onClick={(e) => {
      e.stopPropagation();
      router.push(withCountry("/basket"));
    }}
  >
    🛒 {getBasketQuantity(itemId)}
  </button>
) : (
  <button
    type="button"
    className="add-to-basket-btn-cc"
    onClick={(e) => handleAddToBasket(itemData, e)}
  >
    {t("add_to_cart")}
  </button>
)}
</div>
</div>
  );
})}
        </div>
      </main>
    </div>
  );
}

export default ItemPage;