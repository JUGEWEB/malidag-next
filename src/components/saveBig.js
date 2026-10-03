"use client";

import React, { useEffect, useMemo, useState, useContext } from "react";
import axios from "axios";
import "./saveBig.css";
import { useRouter } from "next/navigation";
import { AppContext } from "./appContext";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import { useTranslation } from "react-i18next";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";
import colorSwatches from "../../lib/colors.json";

const BASE_URL = "https://api.malidag.com";

const BASKET_API = "https://api.malidag.com/add-to-basket";

function SaveBig({ countryCode }) {
  const router = useRouter();
  const { country } = useContext(AppContext);
  const setItemData = useCheckoutStore((state) => state.setItemData);
const [reviews, setReviews] = useState({});
  const [types, setTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [bestSellerId, setBestSellerId] = useState(null);
  const [basketItems, setBasketItems] = useState([]);
  const { t, i18n } = useTranslation();

const [rates, setRates] = useState({});
const [translations, setTranslations] = useState({});

const [sizeModalOpen, setSizeModalOpen] =
  useState(false);

const [
  pendingBasketProduct,
  setPendingBasketProduct,
] = useState(null);

const [
  pendingBasketColor,
  setPendingBasketColor,
] = useState(null);

const [
  pendingBasketImage,
  setPendingBasketImage,
] = useState("");

const [
  pendingSizes,
  setPendingSizes,
] = useState([]);

const [
  selectedModalSize,
  setSelectedModalSize,
] = useState(null);

const [
  modalQuantity,
  setModalQuantity,
] = useState(1);

const [
  addingToBasket,
  setAddingToBasket,
] = useState(false);

const lang = ["en", "fr", "br"].includes(i18n.language)
  ? i18n.language
  : "en";

const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

const currentLanguage = isSupportedLanguage(i18n.language)
  ? i18n.language
  : "en";

  const withCountry = (path) => {
  const code = countryCode;
  if (!path) return `/${code}`;
  return `/${code}${path.startsWith("/") ? path : `/${path}`}`;
};

  useEffect(() => {
    const fetchFilteredItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items?country=${encodeURIComponent(countryCode)}`);
        const raw = response.data;
const data = Array.isArray(raw) ? raw : raw?.items || [];

       const filteredData = data.filter((item) => {
  const usdPrice = parseFloat(item?.item?.usdPrice || 0);
  const originalPrice = parseFloat(item?.item?.originalPrice || 0);
  const discount =
    originalPrice > 0 ? (originalPrice - usdPrice) / originalPrice : 0;

  return originalPrice > usdPrice && discount <= 0.2;
});

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item?.item?.type || "Other";
          if (!acc[type]) acc[type] = [];
          acc[type].push(item);
          return acc;
        }, {});

        const bestSeller = [...filteredData].sort(
  (a, b) => Number(b?.item?.sold || 0) - Number(a?.item?.sold || 0)
)[0];

setBestSellerId(bestSeller?.id || null);

        const initialColors = {};

        filteredData.forEach((product) => {
          if (product?.itemId) fetchReviews(product.itemId);

          const colorKeys = Object.keys(product?.item?.imagesVariants || {});
          if (colorKeys.length > 0) {
            initialColors[product.id] = colorKeys[0];
          }
        });

        setSelectedColorByItem(initialColors);
        setTypes(groupedData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredItems();
  },  [countryCode]);

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

  const allItems = useMemo(() => Object.values(types).flat(), [types]);

  const countryName = countryCode?.toUpperCase() || "your country";
const hasItems = allItems.length > 0;

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
    }  else if (
  category === "jewelry"
) {
  router.push(withCountry(`/jewelry/${formattedType}`));
} else {
      console.warn("No route matched for:", { type, category, gender });
    }
  };

  const fetchUserBasket = async () => {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    setBasketItems([]);
    return;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/basket/${currentUser.uid}`
    );

    setBasketItems(response.data.basket || []);
  } catch (error) {
    console.error("Error fetching basket:", error);
    setBasketItems([]);
  }
};

const getBasketQuantity = (
  itemId
) => {
  return basketItems
    .filter(
      (basketItem) =>
        String(
          basketItem?.itemId
        ) === String(itemId)
    )
    .reduce(
      (total, basketItem) =>
        total +
        Number(
          basketItem?.quantity ||
            0
        ),
      0
    );
};


const isItemInBasket = (
  itemId
) => {
  return (
    getBasketQuantity(
      itemId
    ) > 0
  );
};

 const fetchReviews = async (productId) => {
  if (!productId) return;

  try {
    const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

    if (response.data.success) {
      const reviewsArray = response.data.reviews || [];

      const totalRating = reviewsArray.reduce((acc, review) => {
        const rating = parseFloat(review.rating);
        return acc + (isNaN(rating) ? 4 : rating);
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
    setReviews((prev) => ({
      ...prev,
      [productId]: {
        averageRating: 4.3,
        reviewsArray: Array(133).fill({ rating: 4.3 }),
      },
    }));
  }
};

  const handleItemClick = (id) => {
   router.push(withCountry(`/product/${id}`));
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();
    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.item?.imagesVariants || {});
  };

  const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

  const getDisplayImage = (product) => {
  const selectedColor = selectedColorByItem[product.id];
  const variants = product?.item?.imagesVariants || {};

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number" ? a.position : 999999;
      const posB =
        typeof b === "object" && typeof b?.position === "number" ? b.position : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object" ? a?.filename || "" : String(a || "").split("/").pop() || "";
      const nameB =
        typeof b === "object" ? b?.filename || "" : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(product?.item?.images?.[0]) || "/fallback.png";
};

const getColorSwatch = (colorName = "") => {
  const color = colorName.trim().toLowerCase();

  return colorSwatches[color] || null;
};

  const getDiscountPercentage = (usdPrice, originalPrice) => {
  const current = Number(usdPrice || 0);
  const original = Number(originalPrice || 0);

  if (!original || current >= original) return 0;
  return Math.round(((original - current) / original) * 100);
};

const getVariantData = (
  product,
  color
) => {
  const sizeMap =
    product?.item?.size ||
    product?.details?.sizes ||
    {};

  if (
    !sizeMap ||
    typeof sizeMap !== "object" ||
    Array.isArray(sizeMap) ||
    !color
  ) {
    return [];
  }

  const normalizedSelectedColor =
    String(color)
      .trim()
      .toLowerCase();

  const actualColorKey =
    Object.keys(sizeMap).find(
      (key) =>
        String(key)
          .trim()
          .toLowerCase() ===
        normalizedSelectedColor
    );

  if (!actualColorKey) {
    return [];
  }

  const entries =
    sizeMap[actualColorKey];

  if (!Array.isArray(entries)) {
    return [];
  }

  const normalizedSizes =
    entries.flatMap((entry) => {
      // FORMAT:
      // "40, 42, 45"
      if (typeof entry === "string") {
        return entry
          .split(",")
          .map((size) =>
            size.trim()
          )
          .filter(Boolean)
          .map((size) => ({
            size,
            price: null,
          }));
      }

      // FORMAT:
      // {
      //   value: "40, 42, 43",
      //   price: 42.99
      // }
      if (
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry)
      ) {
        const sizeValues =
          String(
            entry.value ?? ""
          )
            .split(",")
            .map((size) =>
              size.trim()
            )
            .filter(Boolean);

        let specialPrice = null;

        if (
          entry.price !== undefined &&
          entry.price !== null &&
          entry.price !== ""
        ) {
          const parsedPrice =
            Number(entry.price);

          if (
            Number.isFinite(
              parsedPrice
            )
          ) {
            specialPrice =
              parsedPrice;
          }
        }

        return sizeValues.map(
          (size) => ({
            size,
            price: specialPrice,
          })
        );
      }

      return [];
    });

  // Remove duplicate sizes.
  // If duplicate exists and one has
  // a special price, keep priced one.
  const uniqueSizes = new Map();

  normalizedSizes.forEach(
    (option) => {
      const key =
        String(option.size)
          .trim()
          .toLowerCase();

      if (!key) {
        return;
      }

      const existing =
        uniqueSizes.get(key);

      if (!existing) {
        uniqueSizes.set(
          key,
          option
        );

        return;
      }

      if (
        existing.price == null &&
        option.price != null
      ) {
        uniqueSizes.set(
          key,
          option
        );
      }
    }
  );

  return Array.from(
    uniqueSizes.values()
  );
};

const getVariantPrice = (
  product,
  color,
  size = null
) => {
  const mainPrice =
    Number(
      product?.item?.usdPrice || 0
    );

  const variants =
    getVariantData(
      product,
      color
    );

  if (!variants.length) {
    return mainPrice;
  }

  /*
   * Exact selected size wins.
   */
  if (size != null) {
    const exactVariant =
      variants.find(
        (variant) =>
          String(variant.size) ===
          String(size)
      );

    if (
      exactVariant &&
      Number.isFinite(
        exactVariant.price
      )
    ) {
      return exactVariant.price;
    }
  }

  /*
   * For the card, before size is selected,
   * use the first valid price belonging to
   * the selected color.
   */
  const pricedVariant =
    variants.find((variant) =>
      Number.isFinite(
        variant.price
      )
    );

  return pricedVariant
    ? pricedVariant.price
    : mainPrice;
};

 const handleAddToBasketPreview = (
  product,
  selectedColor,
  selectedImage,
  e
) => {
  e.stopPropagation();

  const currentUser =
    auth?.currentUser;

  if (!currentUser) {
    router.push(
      withCountry(
        `/auth?redirect=${encodeURIComponent(
          `/${countryCode}/save-big`
        )}`
      )
    );

    return;
  }

  const variants =
    getVariantData(
      product,
      selectedColor
    );

  /*
   * If this product/color has sizes,
   * require the customer to choose one.
   */
  if (variants.length > 0) {
    setPendingBasketProduct(
      product
    );

    setPendingBasketColor(
      selectedColor || null
    );

    setPendingBasketImage(
      selectedImage || ""
    );

    setPendingSizes(
      variants
    );

    setSelectedModalSize(null);
    setModalQuantity(1);
    setSizeModalOpen(true);

    return;
  }

  /*
   * No sizes:
   * add immediately.
   */
  addBasketVariant({
    product,
    selectedColor:
      selectedColor || null,
    selectedImage,
    selectedSize: null,
    quantity: 1,
  });
};

const addBasketVariant = async ({
  product,
  selectedColor,
  selectedImage,
  selectedSize,
  quantity,
}) => {
  const currentUser =
    auth?.currentUser;

  if (!currentUser || !product) {
    return;
  }

  const safeQuantity =
    Math.max(
      1,
      Number(quantity) || 1
    );

  const item =
    product?.item || {};

  const details =
    product?.details || {};

  /*
   * CRITICAL:
   * determine price from the exact
   * color + size combination.
   */
  const variantPrice =
    getVariantPrice(
      product,
      selectedColor,
      selectedSize
    );

  const basketItem = {
    userId: currentUser.uid,

    item: {
      id: product.id,
      itemId: product.itemId,

      name:
        item.name ||
        details.itemName ||
        "",

      /*
       * Save the VARIANT price.
       */
      price: variantPrice,
      usdPrice: variantPrice,

      color:
        selectedColor || null,

      size:
        selectedSize || null,

      image:
        selectedImage ||
        getDisplayImage(product),

      brand:
        item.brand ||
        details.brand,

      brandPrice:
        item.brandPrice ||
        details.brandPrice,

      quantity:
        safeQuantity,

      shippingCountry:
        details?.country || "",

      selectedCountry: "",

      eurText:
        details?.eurText || "",

      poundText:
        details?.poundText || "",

      brlText:
        details?.brlText || "",

      tryText:
        details?.tryText || "",

      audText:
        details?.audText || "",

      sarText:
        details?.sarText || "",
    },
  };

  try {
    setAddingToBasket(true);

    const response =
      await axios.post(
        BASKET_API,
        basketItem
      );

    if (
      (response.status === 200 ||
        response.status === 201) &&
      response.data?.success === true
    ) {
      /*
       * Use backend persisted basket
       * directly instead of POST → GET.
       */
      setBasketItems(
        Array.isArray(
          response.data?.basket
        )
          ? response.data.basket
          : []
      );

      setSizeModalOpen(false);
      setPendingBasketProduct(null);
      setPendingBasketColor(null);
      setPendingBasketImage("");
      setPendingSizes([]);
      setSelectedModalSize(null);
      setModalQuantity(1);

      return;
    }

    console.error(
      "Basket API did not confirm success:",
      response.data
    );
  } catch (error) {
    console.error(
      "Error adding item to basket:",
      error?.response?.data ||
        error
    );
  } finally {
    setAddingToBasket(false);
  }
};

  const renderStars = (rating) => {
  const safeRating = Math.round(Number(rating) || 0);

  return (
    <span className="bbe-stars-container">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < safeRating ? "bbe-star filled" : "bbe-star empty"}
        >
          ★
        </span>
      ))}
    </span>
  );
};

useEffect(() => {
  const fetchTranslations = async () => {
    if (!allItems.length) {
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
        allItems.map(async (itemData) => {
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
}, [allItems, currentLanguage]);

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

const translateTaxonomy = (value) => {
  if (!value) return "";

  const raw = String(value).trim();

  const normalizedKey = raw
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_");

  if (i18n.exists(normalizedKey)) {
    return t(normalizedKey);
  }

  if (i18n.exists(raw)) {
    return t(raw);
  }

  return raw;
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

  if (joinedKey && i18n.exists(joinedKey)) {
    return t(joinedKey);
  }

  const translatedGender = translateTaxonomy(rawGender);
  const translatedType = translateTaxonomy(rawType);

  return [translatedGender, translatedType]
    .filter(Boolean)
    .join(" ");
};

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(() => {
    fetchUserBasket();
  });

  return () => unsubscribe();
}, []);

 if (loading) {
  return (
    <div className="bbe-loading-wrapper">
      <div className="bbe-loading-header">
        <div className="bbe-skeleton bbe-skeleton-title" />
        <div className="bbe-skeleton bbe-skeleton-subtitle" />
      </div>

      <div className="bbe-loading-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bbe-loading-card">
            <div className="bbe-skeleton bbe-skeleton-image" />
            <div className="bbe-skeleton bbe-skeleton-line" />
            <div className="bbe-skeleton bbe-skeleton-line short" />
            <div className="bbe-skeleton bbe-skeleton-button" />
          </div>
        ))}
      </div>
    </div>
  );
}

if (!loading && !hasItems) {
  return (
   <div className="bbe-empty-country">
  <div className="bbe-empty-icon">💸</div>

  <span className="bbe-empty-badge">
    {t("save_big_deals")}
  </span>

  <h2>{t("no_discounted_products")}</h2>

  <p>
    {t("no_discounted_products_country", {
      country: countryName,
    })}
  </p>

  <p>{t("new_deals_every_day")}</p>

  <button
    type="button"
    className="bbe-empty-btn"
    onClick={() => router.push(withCountry("/"))}
  >
    {t("browse_homepage")}
  </button>
</div>
  );
}

  return (
    <div className="bbe-container">
      <div className="bbe-type-list">
        {Object.entries(types).map(([type, items]) => {
          const firstItem = items[0];
          const category = firstItem?.category?.toLowerCase();
        const gender = firstItem?.item?.genre || "";
const rawType = firstItem?.item?.type || "";

const label =
  category === "electronic"
    ? translateTaxonomy(rawType)
    : translateTaxonomyPhrase(gender, rawType);


          return (
            <div
              key={type}
              className="bbe-type-item"
              onClick={() => handleNavigateByType(firstItem)}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="bbe-item-grid">
        {allItems.map((product) => {
          const { id, item } = product;
         const originalName =
  item?.name ||
  product?.details?.itemName ||
  product?.name ||
  t("unnamed_item");

const translatedName =
  translations?.[product.itemId]?.name;

const displayName =
  currentLanguage === "en"
    ? originalName
    : translatedName || originalName;

          const selectedColor = selectedColorByItem[id];
          const colorOptions = getColorOptions(product);
          const displayImage = getDisplayImage(product);
          const displayedUsdPrice =
  getVariantPrice(
    product,
    selectedColor
  );
          const isBestSeller = id === bestSellerId;
         const discountPercentage =
        getDiscountPercentage(
          displayedUsdPrice,
          item?.originalPrice
        );

          return (
           <div key={id} className="bbe-item-card">
  <div className="bbe-item-media">
    {isBestSeller && (
      <div className="bbe-image-badge bbe-image-badge-best">
       {t("best_seller")}
      </div>
    )}

    {discountPercentage > 0 && (
      <div className="bbe-image-badge bbe-image-badge-discount">
        -{discountPercentage}%
      </div>
    )}

    <img
      src={displayImage}
     alt={displayName}
      onClick={() => handleItemClick(id)}
      className="bbe-item-image"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/fallback.png";
      }}
    />
  </div>

  <div className="bbe-item-info" onClick={() => handleItemClick(id)}>
   <div className="bbe-item-brand">
  {item?.brand || product?.details?.brand || "Malidag"}
</div>

<div className="bbe-item-name">
  {displayName.length > 70
    ? `${displayName.slice(0, 70)}...`
    : displayName}
</div>

<div className="bbe-item-price-row">
  <span className="bbe-item-price">
      {formatPrice(
    displayedUsdPrice
  )}
  </span>

  <span className="bbe-deals-badge">{t("deal")}</span>

  {Number(item?.originalPrice || 0) > 0 && (
    <span className="bbe-item-original-price">
     {formatPrice(item.originalPrice)}
    </span>
  )}
</div>

<div
  className="bbe-item-rating"
  onClick={(e) => {
    e.stopPropagation();
   router.push(withCountry(`/product/${id}/review`));
  }}
  title="View reviews"
>
  {(() => {
    const reviewData = reviews[product.itemId] || {};
    const rating = Number(reviewData.averageRating || 4.3);
    const reviewCount = reviewData.reviewsArray?.length || 133;

    return (
      <>
        <span className="bbe-rating-number">{rating.toFixed(1)}/5</span>
        {renderStars(rating)}
        <span className="bbe-review-count">{t("reviews_count", { count: reviewCount })}</span>
      </>
    );
  })()}
</div>

{colorOptions.length > 1 && (
  <div className="bbe-color-block" onClick={(e) => e.stopPropagation()}>
    <div className="bbe-color-label">
     {t("color")}: <span>{translateColor(selectedColor)}</span>
    </div>

    <div className="bbe-color-options">
      {colorOptions.slice(0, 3).map((color) => (
        <button
          key={color}
          type="button"
          className={`bbe-color-circle ${
            selectedColor === color ? "active" : ""
          }`}
          title={translateColor(color)}
          aria-label={`${t("select_color")} ${translateColor(color)}`}
         style={
  getColorSwatch(color)
    ? { background: getColorSwatch(color) }
    : {
        backgroundImage: `url("${getImageUrl(
          product?.item?.imagesVariants?.[color]?.[0]
        )}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
}
          onClick={(e) => handleColorSelect(id, color, e)}
        />
      ))}

      {colorOptions.length > 3 && (
        <button
          type="button"
          className="bbe-more-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(id);
          }}
        >
         {t("more_colors", {
            count: colorOptions.length - 3,
          })}
        </button>
      )}
    </div>
  </div>
)}

{Number(item?.numberOfItems || product?.details?.numberItemText || 0) > 0 && (
  <div
    className={
      Number(item?.numberOfItems || product?.details?.numberItemText || 0) < 100
        ? "bbe-stock-badge low"
        : "bbe-stock-badge"
    }
  >
   {Number(item?.numberOfItems || product?.details?.numberItemText || 0) < 100
  ? t("only_items_left", {
      count:
        item?.numberOfItems ||
        product?.details?.numberItemText,
    })
  : t("items_in_stock", {
      count:
        item?.numberOfItems ||
        product?.details?.numberItemText,
    })}
  </div>
)}

<div
  className="bbe-basket-actions"
  onClick={(e) =>
    e.stopPropagation()
  }
>
  <button
    type="button"
    className="bbe-add-basket-btn"
    disabled={addingToBasket}
    onClick={(e) =>
      handleAddToBasketPreview(
        product,
        selectedColor,
        displayImage,
        e
      )
    }
  >
    {addingToBasket
      ? t("adding")
      : t("add_to_basket")}
  </button>

  {getBasketQuantity(
    product.itemId
  ) > 0 && (
    <button
      type="button"
      className="bbe-added-basket-btn"
      onClick={(e) => {
        e.stopPropagation();

        router.push(
          withCountry(
            "/basket"
          )
        );
      }}
      aria-label="Open basket"
    >
      <span className="bbe-cart-icon">
        🛒
      </span>

      <span className="bbe-cart-count">
        {getBasketQuantity(
          product.itemId
        )}
      </span>
    </button>
  )}
</div>

  </div>
</div>
          );
        })}
      </div>

       {sizeModalOpen &&
  pendingBasketProduct && (
    <div
      className="bbe-size-modal-overlay"
      onClick={() => {
        if (!addingToBasket) {
          setSizeModalOpen(false);
        }
      }}
    >
      <div
        className="bbe-size-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          type="button"
          className="bbe-size-modal-close"
          disabled={addingToBasket}
          onClick={() =>
            setSizeModalOpen(false)
          }
        >
          ×
        </button>

        <div className="bbe-size-modal-header">
          <img
            src={
              pendingBasketImage ||
              getDisplayImage(
                pendingBasketProduct
              )
            }
            alt=""
            className="bbe-size-modal-image"
          />

          <div>
            <div className="bbe-size-modal-title">
              {pendingBasketProduct
                ?.item?.name ||
                pendingBasketProduct
                  ?.details?.itemName ||
                t("product")}
            </div>

            {pendingBasketColor && (
              <div className="bbe-size-modal-color">
                {t("color")}:{" "}
                <strong>
                  {translateColor(
                    pendingBasketColor
                  )}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div className="bbe-size-modal-section">
          <div className="bbe-size-modal-label">
            {t("choose_size")}
          </div>

          <div className="bbe-size-options">
            {pendingSizes.map(
              (variant) => {
                const active =
                  String(
                    selectedModalSize
                  ) ===
                  String(
                    variant.size
                  );

                return (
                  <button
                    key={
                      variant.size
                    }
                    type="button"
                    className={`bbe-size-option ${
                      active
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedModalSize(
                        variant.size
                      )
                    }
                  >
                    <span>
                      {variant.size}
                    </span>

                    {Number.isFinite(
                      variant.price
                    ) && (
                      <small>
                        {formatPrice(
                          variant.price
                        )}
                      </small>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="bbe-size-modal-section">
          <div className="bbe-size-modal-label">
            {t("quantity")}
          </div>

          <div className="bbe-modal-quantity">
            <button
              type="button"
              disabled={
                modalQuantity <= 1
              }
              onClick={() =>
                setModalQuantity(
                  (prev) =>
                    Math.max(
                      1,
                      prev - 1
                    )
                )
              }
            >
              −
            </button>

            <strong>
              {modalQuantity}
            </strong>

            <button
              type="button"
              onClick={() =>
                setModalQuantity(
                  (prev) =>
                    prev + 1
                )
              }
            >
              +
            </button>
          </div>
        </div>

        {selectedModalSize && (
          <div className="bbe-modal-selected-price">
            {formatPrice(
              getVariantPrice(
                pendingBasketProduct,
                pendingBasketColor,
                selectedModalSize
              )
            )}
          </div>
        )}

        <button
          type="button"
          className="bbe-size-modal-confirm"
          disabled={
            !selectedModalSize ||
            addingToBasket
          }
          onClick={() =>
            addBasketVariant({
              product:
                pendingBasketProduct,

              selectedColor:
                pendingBasketColor,

              selectedImage:
                pendingBasketImage,

              selectedSize:
                selectedModalSize,

              quantity:
                modalQuantity,
            })
          }
        >
          {addingToBasket
            ? t("adding")
            : t("add_to_basket")}
        </button>
      </div>
    </div>
  )}
    </div>
  );
}

export default SaveBig;