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
  const basketItem = basketItems.find((item) => item.itemId === itemId);
  return Number(basketItem?.quantity || 0);
};

const isItemInBasket = (itemId) => getBasketQuantity(itemId) > 0;

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

  try {
    const item = itemData?.item || {};
    const colorOptions = getColorOptions(itemData);

    const selectedColorForBasket =
      selectedColorByItem[itemData.id] ||
      colorOptions?.[0] ||
      null;

    const variantImages =
      item?.imagesVariants?.[selectedColorForBasket] || [];

    const basketImage =
      getImageUrl(sortImages(variantImages)?.[0]) ||
      getImageUrl(item?.images?.[0]);

    const basketItem = {
      userId: currentUser.uid,
      item: {
        id: itemData.id,
        itemId: itemData.itemId,

        // keep canonical DB values in basket
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

    // translated name only for visible UI message
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

      setTimeout(() => {
        messageApi.success(
          t("basket_add_success", {
            product: productName,
          })
        );
      }, 0);
    } else {
      setTimeout(() => {
        messageApi.error(
          t("basket_add_failed")
        );
      }, 0);
    }
  } catch (error) {
    console.error(
      "Error adding item to basket:",
      error
    );

    setTimeout(() => {
      messageApi.error(
        t("basket_add_error")
      );
    }, 0);
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
                            {finalRating || t("no_rating")}
                          </span>
                        </div>
                      </div>

                      <div className="shoe-card-price-row">
                       <div className="shoe-card-price-main">
                          {formatPrice(usdPrice)}
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

                     {isItemInBasket(itemId) ? (
  <button
    type="button"
    className="shoe-added-cart-btn"
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
    className="shoe-primary-btn"
    onClick={(e) => handleAddToBasket(itemData, e)}
  >
   {t("add_to_cart")}
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