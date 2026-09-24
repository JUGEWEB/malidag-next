'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./menFashion.css";
import MenFaRecommended from "./menFaRecommended";
import { useCheckoutStore } from "./checkoutStore";
import useFinalRating from "./finalRating";
import axios from "axios";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";
import { useAppContext } from "./appContext";
import colorSwatches from "../../lib/colors.json";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

function ProductRating({ itemId }) {
  const { finalRating, loading, error } = useFinalRating(itemId || 0);



  if (loading) return null;
  if (error) return null;

  const numericRating = Number(finalRating);

  if (!numericRating || numericRating <= 0) return null;

  const safeRating = Math.round(numericRating);

  return (
    <div className="product-rating-wrap">
      <div className="product-stars-container">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < safeRating ? "product-star filled" : "product-star empty"}
          >
            ★
          </span>
        ))}
      </div>

      <span className="product-rating-value">
        {numericRating.toFixed(1)}
      </span>
    </div>
  );
}

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


const normalizeSwatchKey = (color = "") =>
  String(color)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizeTranslationKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const getColorSwatch = (colorName = "") => {
  const key = normalizeSwatchKey(colorName);

  return colorSwatches?.[key] || "#d1d5db";
};


function MenFashion({ mtypes, groupedTypes, countryCode }) {
  const setItemData = useCheckoutStore((state) => state.setItemData);
 const { t, i18n } = useTranslation();
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [bestSellerByBrand, setBestSellerByBrand] = useState({});
   const router = useRouter();
const [messageApi, contextHolder] = message.useMessage();
const [basketItems, setBasketItems] = useState([]);
const { country } = useAppContext();

const currentLang = isSupportedLanguage(i18n.language)
  ? i18n.language
  : "en";

const countryCurrencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

const [rates, setRates] = useState({});
const [itemTranslations, setItemTranslations] = useState({});

const getTranslatedColor = (color = "") => {
  if (!color) return "";

  const key = normalizeTranslationKey(color);

  return t(`color_${key}`, {
    defaultValue: color,
  });
};

const withCountry = (path) => {
  const code = countryCode || "fr";
  if (!path) return `/${code}`;
  return `/${code}${path.startsWith("/") ? path : `/${path}`}`;
};

  const allItems = useMemo(
    () => Object.values(groupedTypes || {}).flat(),
    [groupedTypes]
  );

  const countryName = countryCode?.toUpperCase() || "your country";
const hasItems = allItems.length > 0;

  const getBrandKey = (product) => {
    return String(
      product?.item?.brand ||
        product?.details?.brand ||
        product?.brand ||
        "unknown"
    )
      .trim()
      .toLowerCase();
  };

  useEffect(() => {
    const initialColors = {};
    const bestByBrand = {};

    allItems.forEach((product) => {
      const colorKeys = Object.keys(product?.item?.imagesVariants || {});
      if (colorKeys.length > 0) {
        initialColors[product.id] = colorKeys[0];
      }

      const brandKey = getBrandKey(product);

      const currentSold = Number(
        product?.item?.sold || product?.details?.soldText || 0
      );

      const existingSold = Number(
        bestByBrand?.[brandKey]?.item?.sold ||
          bestByBrand?.[brandKey]?.details?.soldText ||
          0
      );

      if (!bestByBrand[brandKey] || currentSold > existingSold) {
        bestByBrand[brandKey] = product;
      }
    });

    const brandBestSellerIds = Object.fromEntries(
      Object.entries(bestByBrand).map(([brand, product]) => [brand, product.id])
    );

    setSelectedColorByItem(initialColors);
    setBestSellerByBrand(brandBestSellerIds);
  }, [allItems]);

  useEffect(() => {
  const fetchRates = async () => {
    try {
      const response = await fetch(`${BASE_URL}/prices/rates`, {
        cache: "no-store",
      });

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

      setRates({});
    }
  };

  fetchRates();
}, []);

const convertUsdToLocal = useCallback(
  (usdValue) => {
    const usdPrice = Number(usdValue || 0);
    const currency =
      countryCurrencyConfig?.currency || "USD";

    if (!usdPrice) return 0;

    if (currency === "USD") {
      return usdPrice;
    }

    const rate = Number(rates?.[currency]);

    if (!rate) {
      return null;
    }

    return usdPrice * rate;
  },
  [
    rates,
    countryCurrencyConfig?.currency,
  ]
);

const formatPrice = useCallback(
  (usdValue) => {
    const converted =
      convertUsdToLocal(usdValue);

    if (converted === null) {
      return t("price_unavailable");
    }

    return `${countryCurrencyConfig?.symbol || "$"}${converted.toFixed(2)}`;
  },
  [
    convertUsdToLocal,
    countryCurrencyConfig?.symbol,
    t,
  ]
);

useEffect(() => {
  if (currentLang === "en") {
    setItemTranslations({});
    return;
  }

  let cancelled = false;

  const fetchTranslations = async () => {
    const missingItemIds = allItems
      .map((product) => product?.itemId)
      .filter(Boolean)
      .filter(
        (itemId) =>
          !itemTranslations?.[itemId]?.[currentLang]
      );

    if (!missingItemIds.length) return;

    const results = await Promise.allSettled(
      missingItemIds.map(async (itemId) => {
        const response = await fetch(
          `${BASE_URL}/translate/product/translate/${encodeURIComponent(
            itemId
          )}/${encodeURIComponent(currentLang)}`
        );

        if (!response.ok) {
          throw new Error(
            `Translation failed: ${response.status}`
          );
        }

        const data = await response.json();

        return {
          itemId,
          translation:
            data?.translation ||
            data?.translatedProduct ||
            data,
        };
      })
    );

    if (cancelled) return;

    setItemTranslations((prev) => {
      const next = { ...prev };

      results.forEach((result) => {
        if (result.status !== "fulfilled") return;

        const { itemId, translation } =
          result.value;

        next[itemId] = {
          ...(next[itemId] || {}),
          [currentLang]: translation,
        };
      });

      return next;
    });
  };

  fetchTranslations();

  return () => {
    cancelled = true;
  };
}, [allItems, currentLang]);

const getProductName = (product) => {
  const originalName =
    product?.item?.name ||
    product?.details?.itemName ||
    t("fashion_item");

  if (currentLang === "en") {
    return originalName;
  }

  const translatedProduct =
    itemTranslations?.[product?.itemId]?.[
      currentLang
    ];

  return (
    translatedProduct?.name ||
    translatedProduct?.itemName ||
    originalName
  );
};

const getEstimatedDeliveryDay = (
  daysToAdd = 7
) => {
  const date = new Date();

  date.setDate(
    date.getDate() + daysToAdd
  );

  const localeMap = {
    en: "en-US",
    fr: "fr-FR",
    br: "pt-BR",
  };

  const locale =
    localeMap[currentLang] || "en-US";

  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
  });
};

  const handleColorSelect = (itemId, color, e) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.item?.imagesVariants || {});
  };

  const getDisplayImage = (product) => {
  const selectedColor = selectedColorByItem[product.id];
  const variants = product?.item?.imagesVariants || {};

  if (selectedColor && Array.isArray(variants[selectedColor])) {
    const sortedVariantImages = sortImages(variants[selectedColor]);
    return getImageUrl(sortedVariantImages[0]) || "/fallback.png";
  }

  return getImageUrl(product?.item?.images?.[0]) || "/fallback.png";
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

const isItemInBasket = (itemId) => {
  return getBasketQuantity(itemId) > 0;
};

  const getDiscountPercentage = (usdPrice, originalPrice) => {
    const current = Number(usdPrice || 0);
    const original = Number(originalPrice || 0);

    if (!original || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
  };

 const handleAddToBasket = async (product, selectedColor, selectedImage, e) => {
  e.preventDefault();
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname
        : "/men-fashion";

    router.push(withCountry(`/auth?redirect=${encodeURIComponent(currentPath)}`));
    return;
  }

  try {
    const item = product?.item || {};
    const details = product?.details || {};

    const basketItem = {
      userId: currentUser.uid,
      item: {
        id: product.id,
        itemId: product.itemId,
        name: item.name,
        price: Number(item.usdPrice || 0),
        color: selectedColor || null,
        size: null,
        image: selectedImage || getImageUrl(item?.images?.[0]),
        brand: item.brand || details.brand,
        brandPrice: item.brandPrice,
        quantity: 1,
        shippingCountry: details?.country || "",
        selectedCountry: "",
      },
    };

    const response = await axios.post(BASKET_API, basketItem);

    if (response.status === 200 || response.status === 201) {
      await fetchUserBasket();
     messageApi.success(
        t("basket_add_success", {
          product: getProductName(product),
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

if (!hasItems) {
  return (
    <div className="men-fashion-page">
      <section className="men-empty-state">
        <div className="men-empty-icon">🧥</div>

        <span className="men-empty-badge">
          {t("men_fashion")}
        </span>

        <h1>{t("men_empty_title")}</h1>

        <p>
          {t("men_empty_country", {
            country: countryName,
          })}
        </p>

        <p>
          {t("men_empty_description")}
        </p>

        <button
          type="button"
          className="men-empty-btn"
          onClick={() =>
            router.push(withCountry("/"))
          }
        >
          {t("browse_homepage")}
        </button>
      </section>

      <section className="recommended-section">
        <RecommendedItem />
      </section>
    </div>
  );
}

  return (
    <div className="men-fashion-page">
      {contextHolder}
      <section className="men-hero">
        <img
          src="https://api.malidag.com/learn/videos/1754140515701-man-in-white-and-light-tan-outfit.jpg"
         alt={t("men_fashion")}
          className="men-hero-image"
        />
        <div className="men-hero-overlay">
          <div className="men-hero-content">
          <span className="men-hero-badge">
            {t("men_fashion")}
          </span>

          <h1>
            {t("men_fashion_hero_title")}
          </h1>

          <p>
            {t("men_fashion_hero_description")}
          </p>
          </div>
        </div>
      </section>

      <section className="men-types-section">
        <div className="section-header">
          <h2>{t("men_shop_by_type")}</h2>
        </div>

        <div className="men-types-row">
          {Object.keys(groupedTypes || {}).map((type, idx) => (
            <a
              key={idx}
              href={withCountry(`/item-of-men/${type.toLowerCase()}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="type-chip"
            >
              {t(normalizeTranslationKey(type), {
                defaultValue: type,
              })}
            </a>
          ))}
        </div>
      </section>

      <section className="men-products-section">
        <div className="section-header">
         <h2>
          {t("men_trending_products")}
        </h2>

        <span>
          {t("men_items_count", {
            count: allItems.length,
          })}
        </span>
        </div>

        <div className="men-products-grid">
          {allItems.map((product) => {
            const { id, item } = product;
            const selectedColor = selectedColorByItem[id];
            const colorOptions = getColorOptions(product);
            const displayImage = getDisplayImage(product);
            const discountPercentage = getDiscountPercentage(
              item?.usdPrice,
              item?.originalPrice
            );
            const productName =
            getProductName(product);
            const brandKey = getBrandKey(product);
            const isBestSeller = bestSellerByBrand[brandKey] === id;
            const soldCount = Number(item?.sold || 0);
            const showSold = soldCount >= 1000;

            return (
              <a
                key={id}
               href={withCountry(`/product/${id}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="product-card"
              >
                <div className="product-image-wrap">
                  {isBestSeller && (
                    <div className="product-image-badge product-image-badge-best">
                      {t("best_seller")}
                    </div>
                  )}

                  <img
                    src={displayImage}
                    alt={productName}
                    className="product-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/fallback.png";
                    }}
                  />
                </div>

                <div className="product-info">

                   <h3 className="product-title">
                      {productName?.length > 60
                        ? `${productName.substring(0, 60)}...`
                        : productName}
                    </h3>

                 <div className="product-price-row">
                  <span className="product-price">
                    {formatPrice(item?.usdPrice)}
                  </span>

                  {Number(item?.originalPrice || 0) >
                    Number(item?.usdPrice || 0) && (
                    <span className="product-old-price">
                      {formatPrice(item?.originalPrice)}
                    </span>
                  )}
                </div>

                 <div className="product-delivery-info">
                  <div className="product-free-delivery">
                    {t("free_delivery")}
                  </div>

                  <div className="product-delivery-date">
                     {t("get_it_by", {
                      date: getEstimatedDeliveryDay(7),
                    })}
                  </div>
                </div>

                  {showSold && (
                    <div className="product-meta">
                     <span>
                      {t("items_sold", {
                        count: soldCount,
                      })}
                    </span>
                    </div>
                  )}

                  <div className="product-rating">
                    <ProductRating itemId={product?.itemId} />
                  </div>

                   {colorOptions.length > 1 && (
                    <div
                      className="product-color-block"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <div className="product-color-top">
                        {discountPercentage > 0 && (
                          <span className="product-discount-inline">
                           {t("discount_off", {
                              percent: discountPercentage,
                            })}
                          </span>
                        )}

                        <div className="product-color-label">
                          {t("color")}:{" "}
                        <span>
                          {getTranslatedColor(selectedColor)}
                        </span>
                        </div>
                      </div>

                      <div className="product-color-options">
                       {colorOptions.map((color) => {
                              const translatedColor =
                                getTranslatedColor(color);

                              return (
                                <button
                                  key={color}
                                  type="button"
                                  className={`product-color-circle ${
                                    selectedColor === color
                                      ? "active"
                                      : ""
                                  }`}
                                  title={translatedColor}
                                  aria-label={t("select_color", {
                                    color: translatedColor,
                                  })}
                                  style={{
                                    background: getColorSwatch(color),
                                  }}
                                  onClick={(e) =>
                                    handleColorSelect(id, color, e)
                                  }
                                />
                              );
                            })}
                      </div>
                    </div>
                  )}

                 {isItemInBasket(product.itemId) ? (
                <button
                  type="button"
                  className="product-added-basket-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                   router.push(withCountry("/basket"));
                  }}
                >
                  🛒 {getBasketQuantity(product.itemId)}
                </button>
              ) : (
                <button
                  type="button"
                  className="product-add-basket-btn"
                  onClick={(e) =>
                    handleAddToBasket(product, selectedColor, displayImage, e)
                  }
                >
                {t("add_to_basket")}
                </button>
              )}
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="recommended-section">
        <MenFaRecommended />
      </section>
    </div>
  );
}

export default MenFashion; 