"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import Head from "next/head";
import "./topItem.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import colorSwatches from "../../lib/colors.json";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

function TopItem() {
  const router = useRouter();
 const { t, i18n } = useTranslation();
  const { isVerySmall } = useScreenSize();
  const [messageApi, contextHolder] = message.useMessage();

  const setSelectedBrandName = useCheckoutStore(
    (state) => state.setSelectedBrandName
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [brandThemes, setBrandThemes] = useState([]);
  const [basketItems, setBasketItems] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);

  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);
const [rates, setRates] = useState({});
const [ratesLoading, setRatesLoading] =
  useState(true);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});

  const pathname = usePathname();

const routeCountryCode =
  pathname.split("/").filter(Boolean)[0]?.toLowerCase();

const countryCode = [
  "fr",
  "gb",
  "br",
  "us",
  "de",
  "ie",
  "au",
  "be",
].includes(routeCountryCode)
  ? routeCountryCode
  : "fr";

const currentLang = [
  "en",
  "fr",
  "br",
].includes(i18n.language)
  ? i18n.language
  : "en";

const currencyByCountry = {
  fr: "EUR",
  gb: "GBP",
  br: "BRL",
  us: "USD",
  de: "EUR",
  ie: "EUR",
  au: "AUD",
  be: "EUR",
};

const currency =
  currencyByCountry[countryCode] || "USD";

const withCountry = (path) => {
  if (!path) return `/${countryCode}`;

  const cleanPath = path.replace(
    /^\/(fr|gb|br|us|de|ie|au|be)(\/|$)/,
    "/"
  );

  return `/${countryCode}${
    cleanPath.startsWith("/")
      ? cleanPath
      : `/${cleanPath}`
  }`;
};

  const normalizeText = (value) => String(value || "").trim().toLowerCase();

  const fetchTranslation = async (
  productId,
  lang
) => {
  if (!productId || lang === "en") return;

  if (translations[productId]?.[lang]) {
    return;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/translate/product/translate/${encodeURIComponent(
        productId
      )}/${encodeURIComponent(lang)}`
    );

    setTranslations((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [lang]:
          response.data.translation,
      },
    }));
  } catch (error) {
    console.error(
      `Error fetching translation for ${productId}`,
      error
    );
  }
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

        setReviews((prevReviews) => ({
          ...prevReviews,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
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

  useEffect(() => {
    const fetchTopSoldItems = async () => {
      try {
        setLoading(true);

       const response = await fetch(
        `${BASE_URL}/items?country=${encodeURIComponent(
          countryCode
        )}`,
        {
          cache: "no-store",
        }
      );
        const data = await response.json();

        const itemsArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        const sortedItems = itemsArray
          .filter((itemData) => itemData?.item)
          .sort(
            (a, b) =>
              Number(b?.item?.sold || 0) -
              Number(a?.item?.sold || 0)
          )
          .slice(0, 100);

        const lang = i18n.language || "en";

        setItems(sortedItems);

        sortedItems.forEach((itemData) => {
          if (itemData?.itemId) {
            fetchTranslation(itemData.itemId, lang);
            fetchReviews(itemData.itemId);
          }
        });
      } catch (error) {
        console.error("Error fetching top sold items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSoldItems();
  },  [countryCode]);

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

  useEffect(() => {
    const lang = i18n.language || "en";
    items.forEach((itemData) => fetchTranslation(itemData.itemId, lang));
  }, [i18n.language, items]);

  useEffect(() => {
  const fetchRates = async () => {
    try {
      setRatesLoading(true);

      const response = await fetch(
        `${BASE_URL}/prices/rates`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch rates: ${response.status}`
        );
      }

      const data = await response.json();

      setRates(data?.rates || {});
    } catch (error) {
      console.error(
        "Error fetching exchange rates:",
        error
      );
    } finally {
      setRatesLoading(false);
    }
  };

  fetchRates();
}, []);

const convertUsdToLocal = (usdValue) => {
  const usdPrice = Number(usdValue || 0);

  if (!usdPrice) return 0;
  if (currency === "USD") return usdPrice;

  const rate = Number(rates?.[currency]);

  if (!rate) return null;

  return usdPrice * rate;
};

const formatPrice = (usdValue) => {
  const usdPrice = Number(usdValue || 0);

  if (
    currency !== "USD" &&
    ratesLoading
  ) {
    return "—";
  }

  const converted =
    convertUsdToLocal(usdPrice);

  if (converted === null) {
    return t("price_unavailable");
  }

  const locale =
    currentLang === "fr"
      ? "fr-FR"
      : currentLang === "br"
        ? "pt-BR"
        : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
};

  const getBasketQuantity = (itemId) => {
    const basketItem = basketItems.find((item) => item.itemId === itemId);
    return Number(basketItem?.quantity || 0);
  };

  const isItemInBasket = (itemId) => {
    return getBasketQuantity(itemId) > 0;
  };

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

  const getColorOptions = (product) => {
    return Object.keys(product?.item?.imagesVariants || {});
  };

  const getCurrentImages = (product) => {
    const variants = product?.item?.imagesVariants || {};
    const selectedColorForItem = selectedColorByItem[product.id];

    if (selectedColorForItem && Array.isArray(variants[selectedColorForItem])) {
      return sortImages(variants[selectedColorForItem]);
    }

    const firstColor = Object.keys(variants)[0];

    if (firstColor && Array.isArray(variants[firstColor])) {
      return sortImages(variants[firstColor]);
    }

    return product?.item?.images || [];
  };

  const getDisplayImage = (product) => {
    const images = getCurrentImages(product);
    const index = selectedImageIndexByItem[product.id] || 0;

    return (
      getImageUrl(images[index]) ||
      getImageUrl(product?.item?.images?.[0]) ||
      "/fallback.png"
    );
  };

  const getColorFilterPreviewImage = (color) => {
    for (const itemData of items) {
      const variantImages = sortImages(
        itemData?.item?.imagesVariants?.[color] || []
      );

      const firstImage = getImageUrl(variantImages?.[0]);
      if (firstImage) return firstImage;
    }

    return "";
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

  const handleImageArrow = (product, direction, e) => {
    e.stopPropagation();

    const images = getCurrentImages(product);
    if (images.length <= 1) return;

    setSelectedImageIndexByItem((prev) => {
      const current = prev[product.id] || 0;

      const next =
        direction === "next"
          ? (current + 1) % images.length
          : (current - 1 + images.length) % images.length;

      return {
        ...prev,
        [product.id]: next,
      };
    });
  };

  const brands = useMemo(() => {
    return [
      ...new Set(
        items.map((x) => x?.item?.brand || x?.details?.brand).filter(Boolean)
      ),
    ];
  }, [items]);

  const types = useMemo(() => {
    return [
      ...new Set(
        items
          .map((x) => x?.item?.type || x?.item?.brandType)
          .filter(Boolean)
      ),
    ];
  }, [items]);

  const colors = useMemo(() => {
    const allColors = [];

    items.forEach((itemData) => {
      Object.keys(itemData?.item?.imagesVariants || {}).forEach((color) => {
        allColors.push(color);
      });
    });

    return [...new Set(allColors)];
  }, [items]);

  const maxPrice = useMemo(() => {
    const prices = items.map((x) => Number(x?.item?.usdPrice || 0));
    return Math.ceil(Math.max(...prices, 100));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((itemData) => {
      const item = itemData.item || {};
      const price = Number(item?.usdPrice || 0);
      const itemType = normalizeText(item?.type || item?.brandType);

      const matchesBrand =
        selectedBrand === "all" ||
        normalizeText(item?.brand || itemData?.details?.brand) === selectedBrand;

      const matchesType =
        selectedType === "all" ||
        itemType === selectedType ||
        itemType.includes(selectedType);

      const matchesColor =
        selectedColor === "all" ||
        Object.keys(item?.imagesVariants || {}).includes(selectedColor);

      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesBrand && matchesType && matchesColor && matchesPrice;
    });
  }, [items, selectedBrand, selectedType, selectedColor, priceRange]);

  const topItemBrandThemes = useMemo(() => {
    const brandNames = new Set(brands.map((brand) => normalizeText(brand)));

    return brandThemes.filter((brand) =>
      brandNames.has(normalizeText(brand?.brandName))
    );
  }, [brandThemes, brands]);

  const translateTaxonomy = (value = "") => {
  if (!value) return "";

  const key = String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return t(key, {
    defaultValue: String(value)
      .replace(/_/g, " ")
      .replace(/-/g, " "),
  });
};

const getTranslatedColor = (color) =>
  translateTaxonomy(color);

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    const translated = translations[itemId]?.[lang]?.name;
   const fallback =
  item?.name || t("product");
    const nameToShow = translated || fallback;

    return nameToShow.length > 20
      ? `${nameToShow.substring(0, 20)}...`
      : nameToShow;
  };

 const getEstimatedDeliveryDay = (
  daysToAdd = 7
) => {
  const date = new Date();

  date.setDate(
    date.getDate() + daysToAdd
  );

  const locale =
    currentLang === "fr"
      ? "fr-FR"
      : currentLang === "br"
        ? "pt-BR"
        : "en-US";

  return date.toLocaleDateString(
    locale,
    {
      weekday: "long",
      day: "numeric",
    }
  );
};

  const handleVideoPlay = (id, e) => {
    e.stopPropagation();
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleAddToBasket = async (itemData, e) => {
    e.stopPropagation();

    const currentUser = auth?.currentUser;

    if (!currentUser) {
      const currentPath =
  typeof window !== "undefined"
    ? window.location.pathname
    : withCountry("/topItem");

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
      const details = itemData?.details || {};
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
          size: null,
          image: basketImage,
          brand: item.brand || details.brand,
          brandPrice: item.brandPrice,
          quantity: 1,
          shippingCountry: details?.country || "",
          selectedCountry: "",
          eurText: details?.eurText || "",
          poundText: details?.poundText || "",
          brlText: details?.brlText || "",
          tryText: details?.tryText || "",
          audText: details?.audText || "",
          sarText: details?.sarText || "",
        },
      };

      const response = await axios.post(BASKET_API, basketItem);

      if (response.status === 200 || response.status === 201) {
        await fetchUserBasket();
       messageApi.success(
        t("item_added_to_cart", {
          name:
            getTranslatedName(
              item,
              itemData.itemId
            ) || t("product"),
        })
      );
      } else {
       messageApi.error(
          t("failed_to_add_to_cart")
        );
      }
    } catch (error) {
      console.error("Error adding item to basket:", error);
     messageApi.error(
        t("error_adding_to_cart")
      );
    }
  };

 const handleItemClick = (id) => {
  if (id) {
    router.push(
      withCountry(`/product/${id}`)
    );
  }
};

  if (loading) return <div className="topitem-loading-message"> {t("loading")}</div>;

  return (
    <>
      <Head>
        <title>Top Items | Malidag</title>
        <meta
          name="description"
          content="Shop the top selling items on Malidag."
        />
      </Head>

      {contextHolder}

      <div className="topitem-page-wrapper">
        <div className="topitem-brand-top">
          {topItemBrandThemes.map((brand) => (
            <button
              key={brand.brandName}
              className="topitem-brand-logo-card"
              onClick={() => {
                const themeRoute = brand?.theme?.trim()?.toLowerCase();

                if (!themeRoute || !brand?.brandName) return;

                setSelectedBrandName(brand.brandName);

               router.push(
                withCountry(
                  `/brand/${themeRoute}/${encodeURIComponent(
                    brand.brandName
                  )}`
                )
              );
              }}
            >
              <img src={brand.logo} alt={`${brand.brandName} logo`} />
            </button>
          ))}
        </div>

        <div className="topitem-hero-row">
          <div>
            <div className="topitem-eyebrow"> {t("top_items_marketplace")}</div>
            <h1>{t("top_items")}</h1>
          </div>

          <div className="topitem-count">  {t("items_count", {
    count: filteredItems.length,
  })}</div>
        </div>

        <div className="mobile-filters-wrapper topitem-mobile-filters">
          <div className="mobile-scroll-filters">
            <button
              className={selectedBrand === "all" ? "active-filter" : ""}
              onClick={() => setSelectedBrand("all")}
            >
              {t("all_brands")}
            </button>

            {brands.map((brand) => (
              <button
                key={brand}
                className={
                  selectedBrand === normalizeText(brand) ? "active-filter" : ""
                }
                onClick={() => setSelectedBrand(normalizeText(brand))}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="mobile-scroll-filters">
            <button
              className={selectedType === "all" ? "active-filter" : ""}
              onClick={() => setSelectedType("all")}
            >
              {t("all_types")}
            </button>

            {types.map((type) => (
              <button
                key={type}
                className={
                  selectedType === normalizeText(type) ? "active-filter" : ""
                }
                onClick={() => setSelectedType(normalizeText(type))}
              >
               {translateTaxonomy(type)}
              </button>
            ))}
          </div>

          <div className="mobile-color-filters">
            <button
              className={`mobile-color-circle all ${
                selectedColor === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedColor("all")}
            >
              {t("all")}
            </button>

            {colors.map((color) => {
              const swatchColor = getColorSwatch(color);
              const previewImage = getColorFilterPreviewImage(color);

              return (
                <button
                  key={color}
                  className={`mobile-color-circle ${
                    selectedColor === color ? "active" : ""
                  }`}
                  title={getTranslatedColor(color)}
                  aria-label={t("filter_by_color", {
                    color: getTranslatedColor(color),
                  })}
                  style={
                    swatchColor
                      ? { background: swatchColor }
                      : { backgroundImage: `url("${previewImage}")` }
                  }
                  onClick={() => setSelectedColor(color)}
                />
              );
            })}
          </div>

          <div className="price-filter-mobile">
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={Math.min(priceRange[1], maxPrice)}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
            />
           <span>
            {t("max_price", {
              price: formatPrice(
                Math.min(
                  priceRange[1],
                  maxPrice
                )
              ),
            })}
          </span>
          </div>
        </div>

        <div className="topitem-layout">
          <aside className="topitem-sidebar">
            <div className="sidebar-section">
              <h3>{t("brands")}</h3>

              <button
                className={`sidebar-btn ${
                  selectedBrand === "all" ? "active" : ""
                }`}
                onClick={() => setSelectedBrand("all")}
              >
                {t("all")}
              </button>

              {brands.map((brand) => (
                <button
                  key={brand}
                  className={`sidebar-btn ${
                    selectedBrand === normalizeText(brand) ? "active" : ""
                  }`}
                  onClick={() => setSelectedBrand(normalizeText(brand))}
                >
                  {brand}
                </button>
              ))}
            </div>

            <div className="sidebar-section">
              <h3>{t("types")}</h3>

              <button
                className={`sidebar-btn ${
                  selectedType === "all" ? "active" : ""
                }`}
                onClick={() => setSelectedType("all")}
              >
               {t("all")}
              </button>

              {types.map((type) => (
                <button
                  key={type}
                  className={`sidebar-btn ${
                    selectedType === normalizeText(type) ? "active" : ""
                  }`}
                  onClick={() => setSelectedType(normalizeText(type))}
                >
                 {translateTaxonomy(type)}
                </button>
              ))}
            </div>

            <div className="sidebar-section">
              <h3>{t("colors")}</h3>

              <div className="sidebar-color-options">
                <button
                  className={`sidebar-color-circle all ${
                    selectedColor === "all" ? "active" : ""
                  }`}
                  onClick={() => setSelectedColor("all")}
                >
                  {t("all")}
                </button>

                {colors.map((color) => {
                  const swatchColor = getColorSwatch(color);
                  const previewImage = getColorFilterPreviewImage(color);

                  return (
                    <button
                      key={color}
                      className={`sidebar-color-circle ${
                        selectedColor === color ? "active" : ""
                      }`}
                      title={getTranslatedColor(color)}
                      aria-label={t("filter_by_color", {
                        color: getTranslatedColor(color),
                      })}
                      style={
                        swatchColor
                          ? { background: swatchColor }
                          : { backgroundImage: `url("${previewImage}")` }
                      }
                      onClick={() => setSelectedColor(color)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="sidebar-section">
              <h3>{t("price")}</h3>

              <input
                type="range"
                min="0"
                max={maxPrice}
                value={Math.min(priceRange[1], maxPrice)}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              />

              <span>
                {t("up_to_price", {
                  price: formatPrice(
                    Math.min(
                      priceRange[1],
                      maxPrice
                    )
                  ),
                })}
              </span>
            </div>
          </aside>

          <div className="topitem-items-grid">
            {filteredItems.length > 0 ? (
              filteredItems.map((itemData) => {
                const { id, itemId, item } = itemData;
                const {
                  name,
                  usdPrice,
                  originalPrice,
                  sold,
                  numberOfItems,
                  videos,
                } = item || {};

                const reviewsData = reviews[itemId] || {};
                const finalRating = reviewsData.averageRating;
                const colorOptions = getColorOptions(itemData);
                const selectedColorForItem = selectedColorByItem[id];
                const displayImage = getDisplayImage(itemData);
                const currentImages = getCurrentImages(itemData);
                const normalizedVideos = Array.isArray(videos) ? videos : [videos];

                const firstVideoUrl = normalizedVideos.find(
                  (video) => typeof video === "string" && video.endsWith(".mp4")
                );

                const visibleColorOptions = colorOptions.slice(0, 3);
                const hiddenColorCount = Math.max(colorOptions.length - 3, 0);

                const brandDelivery =
                  brandThemes?.find(
                    (x) =>
                      x?.brandName?.trim()?.toLowerCase() ===
                      (item?.brand || itemData?.details?.brand || "")
                        ?.trim()
                        ?.toLowerCase()
                  )?.delivery || null;

                return (
                  <div
                    key={id}
                    className="topitem-card"
                    onClick={() => handleItemClick(id)}
                  >
                    <div className="topitem-card-media">
                      {activeVideoId === id && firstVideoUrl ? (
                        <video
                          src={firstVideoUrl}
                          controls
                          autoPlay
                          onEnded={handleVideoStop}
                        />
                      ) : (
                        <>
                          {currentImages.length > 1 && (
                            <button
                              type="button"
                              className="image-arrow image-arrow-left"
                             aria-label={t("previous_image")}
                              onClick={(e) =>
                                handleImageArrow(itemData, "prev", e)
                              }
                            >
                              ‹
                            </button>
                          )}

                          <img
                            src={displayImage}
                           alt={
                                getTranslatedName(item, itemId) ||
                                t("product")
                              }
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/fallback.png";
                            }}
                          />

                          {currentImages.length > 1 && (
                            <button
                              type="button"
                              className="image-arrow image-arrow-right"
                             aria-label={t("next_image")}
                              onClick={(e) =>
                                handleImageArrow(itemData, "next", e)
                              }
                            >
                              ›
                            </button>
                          )}

                          {firstVideoUrl && (
                            <button
                              type="button"
                              className="topitem-play-button"
                             aria-label={t("play_product_video")}
                              onClick={(e) => handleVideoPlay(id, e)}
                            >
                              ▶
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="topitem-product-brand">
                      {item?.brand || itemData?.details?.brand || "Malidag"}
                    </div>

                    <div
                      className="topitem-product-name"
                      title={getTranslatedName(item, itemId)}
                    >
                      {getTranslatedName(item, itemId)}
                    </div>

                    {finalRating && (
                      <div
                        className="topitem-stars"
                        onClick={(e) => {
                          e.stopPropagation();
                         router.push(
                          withCountry(`/product/${id}/review`)
                        );
                        }}
                        title={t("view_reviews")}
                      >
                        <span className="topitem-rating-number">
                          {Number(finalRating).toFixed(1)}/5
                        </span>

                        <span className="topitem-rating-stars">
                          {"★".repeat(Math.round(finalRating))}
                          {"☆".repeat(5 - Math.round(finalRating))}
                        </span>

                        <span className="topitem-review-count">
                          (
                            {t("reviews_count", {
                              count:
                                reviewsData?.reviewsArray?.length || 0,
                            })}
                            )
                        </span>
                      </div>
                    )}

                    {colorOptions.length > 1 && (
                      <div
                        className="topitem-color-options"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {visibleColorOptions.map((color) => {
                          const swatchColor = getColorSwatch(color);
                          const variantImages = sortImages(
                            item?.imagesVariants?.[color] || []
                          );

                          const firstVariantImage = getImageUrl(
                            variantImages?.[0]
                          );

                          return (
                            <button
                              key={color}
                              type="button"
                              className={`topitem-color-circle ${
                                selectedColorForItem === color ? "active" : ""
                              }`}
                              title={getTranslatedColor(color)}
                                aria-label={t("select_color", {
                                  color: getTranslatedColor(color),
                                })}
                              onClick={(e) => handleColorSelect(id, color, e)}
                              style={
                                swatchColor
                                  ? { background: swatchColor }
                                  : {
                                      backgroundImage: `url("${firstVariantImage}")`,
                                    }
                              }
                            />
                          );
                        })}

                        {hiddenColorCount > 0 && (
                          <button
                            type="button"
                            className="more-colors-link"
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
                    )}

                    <div className="topitem-delivery-info">
                      {brandDelivery?.isFree && (
                        <div className="topitem-free-delivery">
                         {t("free_delivery")}
                        </div>
                      )}

                      <div className="topitem-delivery-date">
                       {t("get_it_by", {
                          date: getEstimatedDeliveryDay(
                            brandDelivery?.estimatedDaysMin || 7
                          ),
                        })}
                      </div>
                    </div>

                    <div className="topitem-price-row">
                      <div className="topitem-price">
                        {formatPrice(usdPrice)}
                      </div>

                     {Number(originalPrice) > 0 &&
                      Number(originalPrice) >
                        Number(usdPrice || 0) && (
                        <div className="topitem-original-price">
                          {formatPrice(originalPrice)}
                        </div>
                      )}
                    </div>

                    <div className="topitem-sold-row">
                     {t("sold_count", {
                        count: Number(sold || 0),
                      })}
                    </div>

                    {numberOfItems && Number(numberOfItems) > 0 && (
                      <div className="topitem-stock-badge">
                       {t("items_in_stock", {
                          count: numberOfItems,
                        })}
                      </div>
                    )}

                    {isItemInBasket(itemId) ? (
                      <button
                        type="button"
                        className="topitem-added-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            withCountry("/basket")
                          );
                        }}
                      >
                        <span className="topitem-cart-icon">🛒</span>
                        <span className="topitem-cart-added-text">
                          {getBasketQuantity(itemId)}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="topitem-add-cart-btn"
                        onClick={(e) => handleAddToBasket(itemData, e)}
                      >
                       {t("add_to_cart")}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="topitem-no-items">{t("no_items_found")}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TopItem;