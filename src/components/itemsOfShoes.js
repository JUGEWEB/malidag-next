"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./itemOfShoes.css";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import colorSwatches from "../../lib/colors.json";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";
import { AppContext } from "./appContext";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

function ItemOfShoes({  itemClicked, countryCode  }) {
  const withCountry = (path) => {
  const code = countryCode;
  if (!path) return `/${code}`;
  return `/${code}${path.startsWith("/") ? path : `/${path}`}`;
};
  const router = useRouter();
  const { t, i18n } = useTranslation();
const { country } = useContext(AppContext);
const [translations, setTranslations] = useState({});
const [rates, setRates] = useState(null);

const currentLanguage =
  isSupportedLanguage(i18n.language)
    ? i18n.language
    : "en";

const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

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
const [sizeModalOpen, setSizeModalOpen] = useState(false);
const [pendingBasketItem, setPendingBasketItem] = useState(null);
const [pendingSizes, setPendingSizes] = useState([]);
const [pendingSize, setPendingSize] = useState(null);
const [pendingLength, setPendingLength] = useState(null);
const [addingToBasket, setAddingToBasket] = useState(false);

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
  if (!productId) return;

  try {
    const response = await axios.get(
      `${BASE_URL}/get-reviews/${encodeURIComponent(productId)}`
    );

    const reviewsArray =
      response.data?.success === true &&
      Array.isArray(response.data?.reviews)
        ? response.data.reviews
        : [];

    const validReviews = reviewsArray.filter((review) => {
      const rawRating = review?.rating;

      if (
        rawRating === null ||
        rawRating === undefined ||
        String(rawRating).trim() === ""
      ) {
        return false;
      }

      const rating = Number(rawRating);

      return (
        Number.isFinite(rating) &&
        rating >= 1 &&
        rating <= 5
      );
    });

    const averageRating = validReviews.length
      ? validReviews.reduce(
          (sum, review) => sum + Number(review.rating),
          0
        ) / validReviews.length
      : null;

    setReviews((prev) => ({
      ...prev,
      [productId]: {
        averageRating,
        reviewsArray: validReviews,
        validReviewCount: validReviews.length,
      },
    }));
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error("Error fetching reviews:", error);
    }

    setReviews((prev) => ({
      ...prev,
      [productId]: {
        averageRating: null,
        reviewsArray: [],
        validReviewCount: 0,
      },
    }));
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
        const normalizedType = itemClicked
  .toLowerCase()
  .trim()
  .replaceAll("_", "-");

const filteredImages = Array.isArray(response.data)
  ? response.data.filter(
      (image) =>
        image?.type
          ?.toLowerCase()
          ?.trim()
          ?.replaceAll("_", "-") === normalizedType
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
  const fetchRates = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/prices/rates`
      );

      setRates(
        response.data?.rates ||
        response.data ||
        null
      );
    } catch (error) {
      console.error(
        "Failed to fetch currency rates:",
        error
      );

      setRates(null);
    }
  };

  fetchRates();
}, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!itemClicked || typeof itemClicked !== "string") {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
       const normalizedItemClicked = itemClicked
  .toLowerCase()
  .trim()
  .replaceAll("_", "-");

const [gender, ...typeParts] = normalizedItemClicked.split("-");
const type = typeParts.join("-");
       

        const response = await axios.get(`${BASE_URL}/items/${type}?country=${encodeURIComponent(countryCode)}`);
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
  },[itemClicked, countryCode]);

  useEffect(() => {
  const fetchTranslations = async () => {
    if (!items.length) {
      setTranslations({});
      return;
    }

    if (currentLanguage === "en") {
      setTranslations({});
      return;
    }

    const results = await Promise.all(
      items.map(async (itemData) => {
        const productId = itemData?.itemId;

        if (!productId) return null;

        try {
          const response = await axios.get(
            `${BASE_URL}/translate/product/translate/${productId}/${currentLanguage}`
          );

          return {
            productId,
            translation:
              response.data?.translation ||
              null,
          };
        } catch (error) {
          console.error(
            `Failed product translation ${productId}:`,
            error
          );

          return null;
        }
      })
    );

    const nextTranslations = {};

    results.forEach((result) => {
      if (
        result?.productId &&
        result?.translation
      ) {
        nextTranslations[result.productId] =
          result.translation;
      }
    });

    setTranslations(nextTranslations);
  };

  fetchTranslations();
}, [items, currentLanguage]);

  const getCurrencyRate = () => {
  if (!currencyConfig || !rates) {
    return null;
  }

  if (currencyConfig.currency === "USD") {
    return 1;
  }

  const rate = Number(
    rates?.[currencyConfig.currency]
  );

  return Number.isFinite(rate) && rate > 0
    ? rate
    : null;
};

const convertUsd = (usdAmount) => {
  const amount = Number(usdAmount);

  if (!Number.isFinite(amount)) {
    return null;
  }

  const rate = getCurrencyRate();

  if (rate === null) {
    return null;
  }

  return amount * rate;
};

const formatPrice = (usdAmount) => {
  const converted = convertUsd(usdAmount);

  if (
    converted === null ||
    !currencyConfig
  ) {
    return t("price_unavailable");
  }

  return `${currencyConfig.symbol}${converted.toFixed(2)}`;
};

const normalizeSizes = (value) => {
  if (value == null) return [];

  const values = Array.isArray(value) ? value : [value];

  return [
    ...new Set(
      values.flatMap((entry) => {
        // OLD FORMAT
        if (typeof entry === "string" || typeof entry === "number") {
          return String(entry)
            .split(",")
            .map((size) => size.trim())
            .filter(Boolean);
        }

        // NEW FORMAT
        if (
          entry &&
          typeof entry === "object" &&
          !Array.isArray(entry)
        ) {
          return String(entry.value ?? "")
            .split(",")
            .map((size) => size.trim())
            .filter(Boolean);
        }

        return [];
      })
    ),
  ];
};

const getAllSizes = (itemsList) => {
  const allSizes = itemsList.flatMap((entry) =>
    Object.values(entry?.item?.size || {}).flatMap((value) =>
      normalizeSizes(value)
    )
  );

  return [...new Set(allSizes)].sort((a, b) => {
    const numberA = Number(a);
    const numberB = Number(b);

    if (Number.isFinite(numberA) && Number.isFinite(numberB)) {
      return numberA - numberB;
    }

    return String(a).localeCompare(String(b));
  });
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

const normalizeTaxonomyKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_");

const translateTaxonomy = (value) => {
  if (!value) return "";

  const raw = String(value).trim();
  const key = normalizeTaxonomyKey(raw);

  const namespace =
    i18n.options?.defaultNS || "translation";

  const translated = i18n.getResource(
    currentLanguage,
    namespace,
    key
  );

  return typeof translated === "string" &&
    translated.trim()
    ? translated
    : raw.replace(/[-_]+/g, " ");
};

const getColorOptions = (itemData) =>
  Object.keys(itemData?.item?.imagesVariants || {});

const translateColor = (color) => {
  if (!color) return "";

  const raw = String(color).trim();

  const key = `color_${raw
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_")}`;

  const namespace =
    i18n.options?.defaultNS ||
    "translation";

  const translated =
    i18n.getResource(
      currentLanguage,
      namespace,
      key
    );

  return typeof translated === "string" &&
    translated.trim()
    ? translated
    : raw;
};

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
  Object.values(itemData?.item?.size || {}).some((value) =>
    normalizeSizes(value).includes(selectedSize)
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
   router.push(withCountry(`/product/${id}`));
  };

  const handleBrandNavigate = (brandName) => {
    if (!brandName) return;

    const brandSlug = brandName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    router.push(withCountry(`/brand/theme1/${brandSlug}`));
  };

  const handleReviewNavigate = (itemData) => {
    setItemData(itemData);
    router.push(withCountry(`/product/${itemData.id}/review`));
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
  return basketItems
    .filter((basketItem) => basketItem.itemId === itemId)
    .reduce(
      (total, basketItem) =>
        total + Number(basketItem?.quantity || 0),
      0
    );
};

const isItemInBasket = (itemId) => {
  return getBasketQuantity(itemId) > 0;
};

const findVariantKey = (object = {}, selectedColor) => {
  if (!selectedColor) return null;

  const wanted = String(selectedColor).trim().toLowerCase();

  return (
    Object.keys(object).find(
      (key) => String(key).trim().toLowerCase() === wanted
    ) || null
  );
};

const getSizesForColor = (itemData, color) => {
  const sizeMap = itemData?.item?.size || {};

  // Prefer the size entry belonging to the selected color.
  const colorKey = findVariantKey(sizeMap, color);

  if (colorKey) {
    return normalizeSizes(sizeMap[colorKey]);
  }

  // Some products may not store size by color.
  // In that case use all product sizes.
  return [
    ...new Set(
      Object.values(sizeMap).flatMap((value) =>
        normalizeSizes(value)
      )
    ),
  ];
};

const getSizeOptionsForColor = (itemData, color) => {
  const sizeMap =
    itemData?.item?.size ||
    itemData?.details?.sizes ||
    {};

  if (
    !sizeMap ||
    typeof sizeMap !== "object" ||
    Array.isArray(sizeMap) ||
    !color
  ) {
    return [];
  }

  const actualColorKey = findVariantKey(sizeMap, color);

  if (!actualColorKey) return [];

  const rawEntries = sizeMap[actualColorKey];

  const entries = Array.isArray(rawEntries)
    ? rawEntries
    : [rawEntries];

  const splitValues = (value) =>
    String(value ?? "")
      .split(/[,;]|\.(?=\s*\d)/)
      .map((value) => value.trim())
      .filter(Boolean);

  const uniqueSizes = new Map();

  entries.forEach((entry) => {
    const data =
      typeof entry === "string" ||
      typeof entry === "number"
        ? { value: String(entry) }
        : entry;

    if (!data || typeof data !== "object") return;

    const sizes = splitValues(data.value);
    const lengths = splitValues(data.length);

    const rawPrice = data.price;
    const parsedPrice = Number(rawPrice);

    const price =
      rawPrice !== undefined &&
      rawPrice !== null &&
      rawPrice !== "" &&
      Number.isFinite(parsedPrice) &&
      parsedPrice > 0
        ? parsedPrice
        : null;

    sizes.forEach((size) => {
      const key = size.toLowerCase();
      const existing = uniqueSizes.get(key);

      if (!existing) {
        uniqueSizes.set(key, {
          value: size,
          price,
          lengths: [...new Set(lengths)],
        });
      } else {
        existing.lengths = [
          ...new Set([...existing.lengths, ...lengths]),
        ];

        if (existing.price == null && price != null) {
          existing.price = price;
        }
      }
    });
  });

  return [...uniqueSizes.values()];
};


const getVariantPrice = (itemData, color, size = null) => {
  const item = itemData?.item || {};
  const mainPrice = Number(item.usdPrice || 0);

  const options = getSizeOptionsForColor(
    itemData,
    color
  );

  if (!options.length) {
    return mainPrice;
  }

  // If an exact size was selected, return its
  // variant price when one exists.
  if (size !== null && size !== undefined) {
    const selectedOption = options.find(
      (option) =>
        String(option.value).trim() ===
        String(size).trim()
    );

    if (
      selectedOption &&
      selectedOption.price !== null &&
      Number.isFinite(Number(selectedOption.price))
    ) {
      return Number(selectedOption.price);
    }

    return mainPrice;
  }

  // Product card:
  // show the lowest variant price for this color.
  const specialPrices = options
    .map((option) => Number(option.price))
    .filter(
      (price) =>
        Number.isFinite(price) &&
        price > 0
    );

  if (specialPrices.length) {
    return Math.min(...specialPrices);
  }

  return mainPrice;
};


const getDisplayVariantPrice = (itemData) => {
  const colorOptions = getColorOptions(itemData);

  const currentColor =
    selectedColorByItem[itemData.id] ||
    colorOptions?.[0] ||
    null;

  return getVariantPrice(
    itemData,
    currentColor
  );
};

const addBasketVariant = async (
  itemData,
  selectedColorForBasket,
  selectedSizeForBasket,
  selectedLengthForBasket = null
) => {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname
        : "/";

    router.push(
      withCountry(
        `/auth?redirect=${encodeURIComponent(currentPath)}`
      )
    );

    return false;
  }

  try {
    setAddingToBasket(true);

    const item = itemData?.item || {};

    const variantImages =
      item?.imagesVariants?.[selectedColorForBasket] || [];

    const basketImage =
      getImageUrl(sortImages(variantImages)?.[0]) ||
      getImageUrl(item?.images?.[0]);

    const finalPrice = getVariantPrice(
      itemData,
      selectedColorForBasket,
      selectedSizeForBasket
    );

    const basketItem = {
      userId: currentUser.uid,

      item: {
        id: itemData.id,
        itemId: itemData.itemId,

        name: item.name,
        price: finalPrice,

       color: selectedColorForBasket,
        size: selectedSizeForBasket || null,
        length: selectedLengthForBasket || null,

        image: basketImage,
        brand: item.brand,
        brandPrice: item.brandPrice,
        quantity: 1,
      },
    };

    const productName =
      currentLanguage === "en"
        ? item.name
        : translations?.[itemData.itemId]?.name ||
          item.name;

    const response = await axios.post(
      BASKET_API,
      basketItem
    );

    if (
      response.status === 200 ||
      response.status === 201
    ) {
      await fetchUserBasket();

      messageApi.success(
        t("basket_add_success", {
          product: productName,
        })
      );

      return true;
    }

    messageApi.error(t("basket_add_failed"));
    return false;
  } catch (error) {
    console.error(
      "Error adding item to basket:",
      error
    );

    messageApi.error(t("basket_add_error"));

    return false;
  } finally {
    setAddingToBasket(false);
  }
};


const handleAddToBasket = async (itemData, e) => {
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname
        : "/";

    router.push(
      withCountry(
        `/auth?redirect=${encodeURIComponent(currentPath)}`
      )
    );

    return;
  }

  const colorOptions = getColorOptions(itemData);

  const selectedColorForBasket =
    selectedColorByItem[itemData.id] ||
    colorOptions?.[0] ||
    null;

  const sizeOptions = getSizeOptionsForColor(
    itemData,
    selectedColorForBasket
  );

  // No size variants: add directly.
  if (sizeOptions.length === 0) {
    await addBasketVariant(
      itemData,
      selectedColorForBasket,
      null,
      null
    );

    return;
  }

  // Exactly one size without lengths:
  // no selection is necessary.
  if (
    sizeOptions.length === 1 &&
    sizeOptions[0].lengths.length === 0
  ) {
    await addBasketVariant(
      itemData,
      selectedColorForBasket,
      sizeOptions[0].value,
      null
    );

    return;
  }

  // Multiple sizes or lengths:
  // let the customer select the correct variant.
  setPendingBasketItem({
    itemData,
    color: selectedColorForBasket,
  });

  setPendingSizes(sizeOptions);
  setPendingSize(null);
  setPendingLength(null);
  setSizeModalOpen(true);
};

const closeSizeModal = () => {
  if (addingToBasket) return;

  setSizeModalOpen(false);
  setPendingBasketItem(null);
  setPendingSizes([]);
  setPendingSize(null);
  setPendingLength(null);
};

const selectedSizeOption = pendingSizes.find(
  (option) => option.value === pendingSize
);

const availableLengths = selectedSizeOption?.lengths || [];


const handleConfirmSize = async () => {
  if (
    !pendingBasketItem ||
    !selectedSizeOption ||
    addingToBasket
  ) {
    return;
  }

  if (
    availableLengths.length > 0 &&
    !pendingLength
  ) {
    return;
  }

  const success = await addBasketVariant(
    pendingBasketItem.itemData,
    pendingBasketItem.color,
    selectedSizeOption.value,
    pendingLength
  );

  if (success) {
    closeSizeModal();
  }
};

const normalizedItemClicked = itemClicked
  ?.replaceAll("_", "-")
  ?.trim();

const translatedPageType =
  translateTaxonomy(normalizedItemClicked);

const pageTitle = translatedPageType
  ? `Malidag ${translatedPageType}`
  : `Malidag ${t("shoes")}`;

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

if (!loading && items.length === 0) {
  return (
    <div className="shoe-empty-country">
      <div className="shoe-empty-icon">👟</div>

      <div className="shoe-empty-badge">
        {countryCode?.toUpperCase()}
      </div>

      <h2>{t("shoes_no_footwear")}</h2>

      <p>
        {t("shoes_no_footwear_delivery", {
          country: countryCode?.toUpperCase(),
        })}
      </p>

      <p>
        {t("shoes_check_back")}
      </p>

      <button
        className="shoe-empty-btn"
        onClick={() => router.push(withCountry("/"))}
      >
        {t("continue_shopping")}
      </button>
    </div>
  );
}

return (
  <div className="shoe-page">
    <div className="shoe-shell">
      <section className="shoe-hero">
        <div className="shoe-hero-copy">
          <div className="shoe-hero-topline">
            <span className="shoe-kicker"> {t("malidag_footwear")}</span>
            <span className="shoe-kicker-muted">
             {displayedItems.length} {t("items")}
            </span>
          </div>

          <h1 className="shoe-hero-title">{pageTitle}</h1>

          <p className="shoe-hero-text">
            {t("shoe_hero_description")}
          </p>

          <div className="shoe-hero-stats">
           <div className="shoe-stat">
            <span className="shoe-stat-value">{brands.length}</span>
            <span className="shoe-stat-label">{t("brands")}</span>
          </div>

          <div className="shoe-stat">
            <span className="shoe-stat-value">{allSizes.length}</span>
            <span className="shoe-stat-label">{t("sizes")}</span>
          </div>

          <div className="shoe-stat">
            <span className="shoe-stat-value">{items.length}</span>
            <span className="shoe-stat-label">{t("products")}</span>
          </div>
          </div>
        </div>

        {beautyImages.length > 0 ? (
          <div className="shoe-hero-visual">
            <img
              src={beautyImages[0].imageUrl}
              alt={normalizedItemClicked || t("shoes")}
              className="shoe-hero-image"
            />
            <div className="shoe-hero-gradient" />

            <div className="shoe-hero-floating-panel">
             <span className="shoe-floating-label">
            {selectedSize
              ? `${t("selected")}: ${selectedSize}`
              : t("footwear_collection")}
          </span>

          <strong>
           {translatedPageType || t("shoes")}
          </strong>
            </div>
          </div>
        ) : (
          <div className="shoe-hero-placeholder">
            <div className="shoe-hero-placeholder-inner">
              <span className="shoe-placeholder-kicker">Malidag</span>
             <strong>{t("curated_footwear")}</strong>
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
                alt={`${normalizedItemClicked}-${index}`}
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
  {t("filters")}

  {(selectedSize || selectedColor !== "all") && (
    <span className="shoe-filter-active-dot" />
  )}
</button>

  <div className="shoe-filter-content">
    <div className="shoe-toolbar-main">
      <div className="shoe-section-heading">
        <span className="shoe-section-kicker">{t("filter_by_size")}</span>
       <h2>{t("choose_size")}</h2>
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
      <span className="shoe-section-kicker">
        {t("colors")}
      </span>

      <div className="shoe-color-list">
        <button
          type="button"
          className={`shoe-color-chip all ${
            selectedColor === "all" ? "active" : ""
          }`}
          onClick={() => setSelectedColor("all")}
        >
           {t("all")}
        </button>

        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`shoe-color-chip ${
              selectedColor === color ? "active" : ""
            }`}
           title={translateColor(color)}
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
          {t("clear_filter")}
        </button>
      )}
    </div>
  </div>
</section>

      <section className="shoe-brand-section">
        <div className="shoe-section-heading shoe-section-heading-row">
          <div>
            <span className="shoe-section-kicker">{t("brands")}</span>
            <h2>{t("shop_by_brand")}</h2>
          </div>
         <span className="shoe-section-meta">
          {t("results_count", {
            count: brands.length,
          })}
          </span>
        </div>
          {brands.length === 0 ? (
        <div className="shoe-empty-card">
          {t("no_brands_found")}
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
                    {t("view_more")}
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
            <span className="shoe-section-kicker">
            {t("hot_label")}
          </span>
           <h2>{t("curated_product_selection")}</h2>
          </div>
         <span className="shoe-section-meta">
          {t("results_count", {
            count: displayedItems.length,
          })}
        </span>
        </div>

        {displayedItems.length === 0 ? (
          <div className="shoe-empty-card">
            {t("no_products_found")}
          </div>
        ) : (
          <div className="shoe-product-grid">
            {displayedItems.map((itemData) => {
              const { itemId, id, item } = itemData;
              const {
               usdPrice,
                originalPrice,
                sold,
                videos,
                genre,
                type,
                brand,
              } = item;

              const originalName =
              item?.name ||
              t("unnamed_item");

            const translatedName =
              translations?.[itemId]?.name;

            const name =
              currentLanguage === "en"
                ? originalName
                : translatedName || originalName;

             const reviewsData = reviews[itemId] || {};

              const finalRating = reviewsData?.averageRating ?? null;

              const reviewCount = reviewsData?.validReviewCount ?? 0;

              const hasValidReviews =
                reviewCount > 0 &&
                Number.isFinite(finalRating) &&
                finalRating >= 1 &&
                finalRating <= 5;

              const normalizedVideos = Array.isArray(videos)
                ? videos
                : videos
                ? [videos]
                : [];

              const firstVideoUrl = normalizedVideos.find(
                (video) => typeof video === "string" && video.endsWith(".mp4")
              );

             const ratingNumber = hasValidReviews
            ? Math.round(finalRating)
            : 0;

               const colorOptions = getColorOptions(itemData);

              const selectedColorForItem =
                selectedColorByItem[id];

              const displayImage =
                getDisplayImage(itemData);

              const currentImages =
                getCurrentImages(itemData);

              const displayPrice =
                getDisplayVariantPrice(itemData);

              const visibleColorOptions =
                colorOptions.slice(0, 4);

              const hiddenColorCount =
                Math.max(colorOptions.length - 4, 0);
                 

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
                          {t("premium")}
                        </span>
                         
                        </div>

                        {firstVideoUrl && (
                          <button
                            type="button"
                            className="shoe-video-btn"
                            onClick={() => handleVideoPlay(id)}
                            aria-label={t("play_product_video")}
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
                         title={translateColor(color)}
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
                       {t("more_colors", {
                        count: hiddenColorCount,
                      })}
                      </button>
                    )}
                  </div>
                )}

                       {hasValidReviews && (
  <div
    className="shoe-card-rating"
    onClick={(e) => {
      e.stopPropagation();
      handleReviewNavigate(itemData);
    }}
  >
    <span className="shoe-rating-stars">
      {"★".repeat(ratingNumber)}
      {"☆".repeat(5 - ratingNumber)}
    </span>

    <span className="shoe-rating-value">
      {finalRating.toFixed(1)}
    </span>

    <span className="shoe-rating-count">
      ({reviewCount})
    </span>
  </div>
)}
                      </div>

                      <div className="shoe-card-price-row">
                       <div className="shoe-card-price-main">
                         {formatPrice(displayPrice)}
                        </div>

                        {Number(originalPrice) > 0 &&
                          convertUsd(originalPrice) !== null && (
                            <div className="shoe-card-price-old">
                              {formatPrice(originalPrice)}
                            </div>
                          )}
                      </div>

                     <div className="shoe-delivery-info">
                      {brandDelivery?.isFree && (
                        <span className="shoe-free-delivery"> {t("free_delivery")}</span>
                      )}

                       <span className="shoe-delivery-date">
                        {t("delivery_in_days", {
                          days: brandDelivery?.estimatedDaysMax || 7,
                        })}
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
                            ? t("stock_low", {
                                count: item.numberOfItems,
                              })
                            : t("stock_available", {
                                count: item.numberOfItems,
                              })}
                        </div>
                      )}

                      <div className="shoe-card-meta">
                       <span>{translateTaxonomy(genre) || t("fashion")}</span>
                        <span>
                          {Number(sold || 0)} {t("sold")}
                        </span>
                      </div>
                    </div>

                    <div className="shoe-card-actions">
  <button
    type="button"
    className="shoe-primary-btn"
    onClick={(e) => handleAddToBasket(itemData, e)}
  >
    {t("add_to_cart")}
  </button>

  {isItemInBasket(itemId) && (
    <button
      type="button"
      className="shoe-added-cart-btn"
      onClick={(e) => {
        e.stopPropagation();
        router.push(withCountry("/basket"));
      }}
      aria-label={`${t("cart")} ${getBasketQuantity(itemId)}`}
    >
      <span className="shoe-cart-icon">🛒</span>

      <span className="shoe-cart-quantity">
        {getBasketQuantity(itemId)}
      </span>
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

    {sizeModalOpen && pendingBasketItem && (
  <div
    className="shoe-size-modal-overlay"
    onClick={closeSizeModal}
  >
    <div
      className="shoe-size-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shoe-size-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="shoe-size-modal-header">
        <h2 id="shoe-size-modal-title">
          {t("choose_size")}
        </h2>

        <button
          type="button"
          className="shoe-size-modal-close"
          onClick={closeSizeModal}
          disabled={addingToBasket}
          aria-label={t("close")}
        >
          ×
        </button>
      </div>

     <div className="shoe-size-modal-options">
  {pendingSizes.map((option) => (
    <button
      key={option.value}
      type="button"
      className={`shoe-size-modal-option ${
        pendingSize === option.value ? "active" : ""
      }`}
      onClick={() => {
        setPendingSize(option.value);
        setPendingLength(null);
      }}
      disabled={addingToBasket}
    >
      {option.value}
    </button>
  ))}
</div>

{availableLengths.length > 0 && (
  <>
    <h3>
      {t("length", { defaultValue: "Length" })}
    </h3>

    <div className="shoe-size-modal-options">
      {availableLengths.map((length) => (
        <button
          key={length}
          type="button"
          className={`shoe-size-modal-option ${
            pendingLength === length ? "active" : ""
          }`}
          onClick={() => setPendingLength(length)}
          disabled={addingToBasket}
        >
          {length}
        </button>
      ))}
    </div>
  </>
)}

      <button
        type="button"
        className="shoe-size-modal-add"
       disabled={
          !pendingSize ||
          (availableLengths.length > 0 && !pendingLength) ||
          addingToBasket
        }
        onClick={handleConfirmSize}
      >
        {addingToBasket
          ? t("adding")
          : t("add_to_cart")}
      </button>
    </div>
  </div>
)}
  </div>
);
}

export default ItemOfShoes;