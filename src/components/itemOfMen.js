"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import colorSwatches from "../../lib/colors.json";
import { message } from "antd";
import "./itemOfmen.css";
import { AppContext } from "./appContext";

import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

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

const { country } = useContext(AppContext);

const countryCode =
  country?.code?.toLowerCase() || null;

const { t, i18n } = useTranslation();

const currentLanguage =
  isSupportedLanguage(i18n.language)
    ? i18n.language
    : "en";

const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

const [translations, setTranslations] =
  useState({});

const [rates, setRates] =
  useState(null);

  const withCountry = (path) => {
  if (!countryCode) return "/";

  if (!path) {
    return `/${countryCode}`;
  }

  return `/${countryCode}${
    path.startsWith("/")
      ? path
      : `/${path}`
  }`;
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

   router.push(
  withCountry(
    `/auth?redirect=${encodeURIComponent(
      currentPath
    )}`
  )
);
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
      const productName =
  getTranslatedName(
    item,
    itemData.itemId,
    itemData?.details
  );
     messageApi.success(
  t("basket_add_success", {
    product: productName,
  })
);
    } else {
     messageApi.error(
  t("basket_add_failed")
);
    }
  } catch (error) {
    console.error("Error adding item to basket:", error);
   messageApi.error(
  t("basket_add_error")
);
  }
};

  const getColorOptions = (imagesVariants) => {
    if (!imagesVariants || typeof imagesVariants !== "object") return [];
    return Object.keys(imagesVariants).filter(Boolean);
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
      if (!itemClicked || !countryCode) {
  setItems([]);
  setBeautyImages([]);
  setReviews({});
  setIsLoading(false);
  return;
}

      setIsLoading(true);

      try {
        const [itemsResponse, imagesResponse] = await Promise.allSettled([
         axios.get(
  `${BASE_URL}/items/${encodeURIComponent(
    itemClicked
  )}?country=${encodeURIComponent(
    countryCode
  )}`
),
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
  }, [itemClicked, fetchReviews,  countryCode]);

  useEffect(() => {
  const fetchRates = async () => {
    try {
      const response =
        await axios.get(
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

const getCurrencyRate = () => {
  if (!currencyConfig || !rates) {
    return null;
  }

  if (
    currencyConfig.currency === "USD"
  ) {
    return 1;
  }

  const rate = Number(
    rates?.[currencyConfig.currency]
  );

  return Number.isFinite(rate) &&
    rate > 0
    ? rate
    : null;
};

const convertUsd = (usdAmount) => {
  const amount =
    Number(usdAmount);

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
  const converted =
    convertUsd(usdAmount);

  if (
    converted === null ||
    !currencyConfig
  ) {
    return t("price_unavailable");
  }

  return `${currencyConfig.symbol}${converted.toFixed(
    2
  )}`;
};

const fetchTranslation = async (
  productId,
  lang
) => {
  if (
    !productId ||
    translations?.[productId]?.[lang]
  ) {
    return;
  }

  try {
    const response =
      await axios.get(
        `${BASE_URL}/translate/product/translate/${productId}/${lang}`
      );

    setTranslations((prev) => ({
      ...prev,

      [productId]: {
        ...(prev[productId] || {}),

        [lang]:
          response.data?.translation ||
          {},
      },
    }));
  } catch (error) {
    console.error(
      `Failed to translate product ${productId}:`,
      error
    );
  }
};

useEffect(() => {
  if (
    currentLanguage === "en"
  ) {
    return;
  }

  items.forEach((itemData) => {
    if (itemData?.itemId) {
      fetchTranslation(
        itemData.itemId,
        currentLanguage
      );
    }
  });
}, [items, currentLanguage]);

const getTranslatedName = (
  item,
  itemId,
  details
) => {
  const originalName =
    item?.name ||
    details?.itemName ||
    t("unnamed_item");

  if (
    currentLanguage === "en"
  ) {
    return originalName;
  }

  return (
    translations?.[itemId]?.[
      currentLanguage
    ]?.name ||
    originalName
  );
};

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
     router.push(
  withCountry(`/product/${id}`)
);
    },
    [router]
  );

  const handleReviewNavigate = useCallback(
    (id, event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!id) return;
     router.push(
  withCountry(`/product/${id}/review`)
);
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

  const translateTaxonomy = (value) => {
  if (!value) return "";

  const raw =
    String(value).trim();

  const key = raw
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_");

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
    : raw.replace(/[-_]/g, " ");
};

const translateColor = (color) => {
  if (!color) return "";

  const raw =
    String(color).trim();

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

const pageTitle = useMemo(() => {
  return itemClicked
    ? translateTaxonomy(itemClicked)
    : t("menswear");
}, [
  itemClicked,
  currentLanguage,
]);

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
    router.push(
  withCountry(
    `/brand/theme1/${slugify(brandName)}`
  )
);
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
              {displayedItems.length} {t("products")}
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
                  }${selectedColor !== "all" ? `${t("color")}: ${translateColor(
              selectedColor
            )}` : ""}`
               : t("filters")}
            </button>

            {(selectedSize || selectedColor !== "all") && (
              <button
                type="button"
                className="men-clear-btn"
                onClick={clearFilter}
              >
                {t("clear_filter")}
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
                {t("browse_by_brand")}
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
            {t("no_products_found")}
          </div>
        ) : (
          <section className="men-products-wrap">
            <div className="men-section-head">
              <h2 className="men-section-title">
                {t("products")}
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
                const productName =
                getTranslatedName(
                  item,
                  itemId,
                  details
                );
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
                      <div
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
                                 {t("discount_off", {
                                    percent: discountPercentage,
                                  })}
                                </span>
                              )}

                              <div className="men-list-color-label">
                               {t("color")}:{" "}
                                <span>
                                  {translateColor(
                                    selectedColorForItem ||
                                      colorOptions[0]
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="men-list-color-options">
                              {colorOptions.map((color) => {
                                const swatchColor =
                                getColorSwatch(color);

                              const previewImage =
                                getColorPreviewImage(
                                  itemData,
                                  color
                                );

                              return (
                                <button
                                  key={color}
                                  type="button"
                                  className={`men-list-color-circle ${
                                    selectedColorForItem === color
                                      ? "active"
                                      : ""
                                  }`}
                                  title={translateColor(color)}
                                  aria-label={t("select_color", {
                                    color: translateColor(color),
                                  })}
                                  style={
                                    swatchColor
                                      ? {
                                          background: swatchColor,
                                        }
                                      : previewImage
                                      ? {
                                          backgroundImage:
                                            `url("${previewImage}")`,
                                          backgroundSize: "cover",
                                          backgroundPosition: "center",
                                        }
                                      : {}
                                  }
                                  onClick={(e) =>
                                    handleColorSelect(
                                      id,
                                      color,
                                      e
                                    )
                                  }
                                />
                              );
                              })}
                            </div>
                          </div>
                        )}

                        {colorOptions.length === 0 && discountPercentage > 0 && (
                          <div className="men-list-color-top">
                            <span className="men-list-discount">
                             {t("discount_off", {
                                  percent: discountPercentage,
                                })}
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
                            title={t("view_reviews")}
                          >
                            {ratingData.value || "—"} · {ratingData.stars}
                            {reviewCount > 0 ? ` (${reviewCount})` : ""}
                          </span>
                          <span>
                            {Number(sold || 0)} {t("sold")}
                          </span>
                        </div>

                        {Number(numberOfItems || 0) > 0 && (
                          <div className="men-list-meta">
                            <span>{t("items_in_stock", {
                              count: numberOfItems,
                            })}</span>
                          </div>
                        )}
                      </div>

                      <div className="men-delivery-info">
                          {brandDelivery?.isFree && <span>{t("free_delivery")}</span>}

                          <span>
                        {t("get_it_by", {
                          date: (() => {
                            const date = new Date();

                            date.setDate(
                              date.getDate() +
                                (brandDelivery?.estimatedDaysMin || 7)
                            );

                            const locale =
                              currentLanguage === "fr"
                                ? "fr-FR"
                                : currentLanguage === "br"
                                ? "pt-BR"
                                : "en-GB";

                            return date.toLocaleDateString(locale, {
                              weekday: "long",
                              day: "numeric",
                            });
                          })(),
                        })}
                      </span>
                        </div>

                        {isItemInBasket(itemId) ? (
                          <button
                            type="button"
                            className="men-cart-action-btn added"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                             router.push(
                                withCountry("/basket")
                              );
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
                           {t("add_to_cart")}
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
            <h3>{t("filters")}</h3>

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
            <h2 className="men-section-title">{t("choose_size")}</h2>
          </div>

          <div className="men-filter-sizes">
            {allSizes.length === 0 ? (
              <div className="men-empty-card">
                {t("no_sizes_found")}
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
                <h2 className="men-section-title"> {t("colors")}</h2>
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
                   title={translateColor(color)}
                    aria-label={t("select_color", {
                      color: translateColor(color),
                    })}
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
                {t("clear_filter")}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ItemOfMen;