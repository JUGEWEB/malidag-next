"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./fashionForAllPage.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import colorSwatches from "../../lib/colors.json";
import { usePathname, useRouter } from "next/navigation";

const BASE_URL = "https://api.malidag.com";

function ItemFashionPage() {
  const [brandGroups, setBrandGroups] = useState([]);
  const [topItemsPerBrand, setTopItemsPerBrand] = useState({});
  const [bestSellersByBrand, setBestSellersByBrand] = useState({});
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall } = useScreenSize();
   const [reviews, setReviews] = useState({}); // Store reviews data
  const [brandThemes, setBrandThemes] = useState([]);
  const [translations, setTranslations] = useState({});
 const { t, i18n } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);
  const setSelectedBrandName = useCheckoutStore((state) => state.setSelectedBrandName);
  const [selectedBrand, setSelectedBrand] = useState("all");
const [selectedType, setSelectedType] = useState("all");
const [selectedColor, setSelectedColor] = useState("all");
const [priceRange, setPriceRange] = useState([0, 10000]);
const [rates, setRates] = useState({});
const [ratesLoading, setRatesLoading] =
  useState(true);
const [selectedColorByItem, setSelectedColorByItem] = useState({});
const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});
const { push } = useRouter();
const pathname = usePathname();

const routeCountryCode = pathname.split("/").filter(Boolean)[0];

const countryCode = routeCountryCode;

const countryName = countryCode?.toUpperCase() || "your country";

const currencyByCountry = {
  fr: "EUR",
  gb: "GBP",
  br: "BRL",
  us: "USD",
  de: "EUR",
  ie: "EUR",
  be: "EUR",
  au: "AUD",
};

const currency =
  currencyByCountry[countryCode] || "USD";

  console.log("Selected country code in fashion page:", countryCode);
const hasCountry = Boolean(countryCode);

const currentLang =
  ["en", "fr", "br"].includes(i18n.language)
    ? i18n.language
    : "en";

const fetchTranslation = async (productId, lang) => {
  if (translations[productId]?.[lang]) return;
  try {
    const response = await axios.get(`https://api.malidag.com/translate/product/translate/${productId}/${lang}`);
    setTranslations((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [lang]: response.data.translation,
      },
    }));
  } catch (error) {
    console.error(`Error fetching translation for ${productId}:`, error);
  }
};

  // Fetch reviews from the endpoint
                const fetchReviews = async (productId) => {
                  try {
                    const response = await axios.get(`https://api.malidag.com/get-reviews/${productId}`);
                    if (response.data.success) {
                     
                      const reviewsArray = response.data.reviews || [];
                      const totalRating = reviewsArray.reduce((acc, review) => {
                        let rating = parseFloat(review.rating);
                        return acc + (isNaN(rating) ? 4 : rating); // If rating is invalid, treat as 5 stars
                      }, 0);
                      const averageRating = reviewsArray.length ? (totalRating / reviewsArray.length).toFixed(2) : null;
              
                      setReviews((prevReviews) => ({
                        ...prevReviews,
                        [productId]: { averageRating, reviewsArray },
                      }));
              
                    }
                  } catch (error) {
                    console.error("Error fetching reviews:", error);
                  }
                };

                const translateTaxonomy = (value = "") => {
  if (!value) return "";

  const key = String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return t(key, {
    defaultValue: value
      .replace(/_/g, " ")
      .replace(/-/g, " "),
  });
};

const getTranslatedColor = (color) =>
  translateTaxonomy(color);

                useEffect(() => {
  const fetchBrandThemes = async () => {
    try {
      const res = await fetch("https://api.malidag.com/api/brands/themes");
      const data = await res.json();
      setBrandThemes(data || []);
    } catch (err) {
      console.error("Failed to fetch brand themes", err);
    }
  };
  fetchBrandThemes();
}, []);

  // Fetch brands from clothing, shoes, and bags
useEffect(() => {
  if (!countryCode) {
    return;
  }

  const fetchBrands = async () => {
    setLoading(true);

    try {
     const categories = ["clothes", "shoes", "bags"];

      const brandSets = await Promise.all(
        categories.map((cat) =>
          axios
            .get(
              `https://api.malidag.com/api/categories/${cat}/brands?country=${countryCode}`
            )
            .then((res) => res.data?.brands || [])
            .catch(() => [])
        )
      );

      const mergedBrands = Array.from(
        new Map(
          brandSets.flat().map((brand) => [brand.brand, brand])
        ).values()
      );

      setBrandGroups(mergedBrands);

    if (mergedBrands.length === 0) {
  setTopItemsPerBrand({});
  setBestSellersByBrand({});
  setLoading(false);
}

    } catch (error) {
      console.error("Error fetching fashion brands:", error);
      setBrandGroups([]);
      setTopItemsPerBrand({});
      setBestSellersByBrand({});
      setLoading(false);
    }
  };

  fetchBrands();
}, [countryCode]);

useEffect(() => {
  if (!countryCode) {
    setLoading(false);
    return;
  }

   if (brandGroups.length === 0) {
    return;
  }

  const fetchTopItemsAndBestSellers = async () => {
    const itemsMap = {};
    const bestSellerMap = {};

    await Promise.all(
      brandGroups.map(async (group) => {
        const brandName = group.brand;

        try {
          const encodedBrandName = encodeURIComponent(brandName);

          const topItemsRes = await axios.get(
            `https://api.malidag.com/api/brands/${encodedBrandName}/top-items?country=${countryCode}`
          );

          const bestSellerRes = await axios.get(
            `https://api.malidag.com/api/brands/${encodedBrandName}/best-seller?country=${countryCode}`
          );

          const topItems = topItemsRes.data || [];

          itemsMap[brandName.trim().toLowerCase()] = topItems;

          const bestSellerId = bestSellerRes.data?.id;
          if (bestSellerId) {
            bestSellerMap[brandName.trim().toLowerCase()] = bestSellerId;
          }

          const lang = i18n.language || "en";

          topItems.forEach((item) => {
            fetchTranslation(item.itemId, lang);
            fetchReviews(item.itemId);
          });
        } catch (error) {
          console.warn(`Error fetching items for ${brandName}`, error);
        }
      })
    );

    setTopItemsPerBrand(itemsMap);
    setBestSellersByBrand(bestSellerMap);
    setLoading(false);
  };

  if (brandGroups.length > 0) {
    fetchTopItemsAndBestSellers();
  }
}, [brandGroups, countryCode]);

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

  if (currency === "USD") {
    return usdPrice;
  }

  const rate = Number(rates?.[currency]);

  if (!rate) {
    return null;
  }

  return usdPrice * rate;
};

const formatPrice = (usdValue) => {
  const usdPrice = Number(usdValue || 0);

  if (!usdPrice) {
    return new Intl.NumberFormat(
      currentLang === "fr"
        ? "fr-FR"
        : currentLang === "br"
          ? "pt-BR"
          : "en-US",
      {
        style: "currency",
        currency,
      }
    ).format(0);
  }

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

  useEffect(() => {
  const lang = i18n.language || "en";
  Object.values(topItemsPerBrand).flatMap(items =>
    items.forEach(item => fetchTranslation(item.itemId, lang))
  );
}, [i18n.language, topItemsPerBrand]);

const getTranslatedName = (item, itemId) => {
  const lang = i18n.language || "en";
  const translated = translations[itemId]?.[lang]?.name;
  const fallback = item.name;
  const nameToShow = translated || fallback;
  return nameToShow.length > 20 ? nameToShow.substring(0, 20) + "..." : nameToShow;
};

const normalizeBrand = (brand = "") => brand.trim().toLowerCase();

const allFashionItems = useMemo(() => {
  return Object.entries(topItemsPerBrand).flatMap(([brand, items]) =>
    items.map((rawItem) => ({
      id: rawItem.id,
      itemId: rawItem.itemId,
      brand,
      item: {
        name: rawItem.name,
        brand,
        type: rawItem.type,
        images: rawItem.images || [],
        imagesVariants: rawItem.imagesVariants || {},
        usdPrice: rawItem.usdPrice,
        cryptocurrency: rawItem.cryptocurrency,
        sold: rawItem.sold,
      },
    }))
  );
}, [topItemsPerBrand]);

const brands = useMemo(() => {
  return [...new Set(allFashionItems.map((x) => x.brand).filter(Boolean))];
}, [allFashionItems]);

const types = useMemo(() => {
  return [...new Set(allFashionItems.map((x) => x.item.type).filter(Boolean))];
}, [allFashionItems]);

const colors = useMemo(() => {
  const allColors = [];

  allFashionItems.forEach((itemData) => {
    Object.keys(itemData?.item?.imagesVariants || {}).forEach((color) => {
      allColors.push(color);
    });
  });

  return [...new Set(allColors)];
}, [allFashionItems]);

const maxPrice = useMemo(() => {
  const prices = allFashionItems.map((x) => Number(x?.item?.usdPrice || 0));
  return Math.ceil(Math.max(...prices, 100));
}, [allFashionItems]);

const filteredItems = useMemo(() => {
  return allFashionItems.filter((itemData) => {
    const item = itemData.item;
    const price = Number(item?.usdPrice || 0);

    const matchesBrand =
      selectedBrand === "all" || normalizeBrand(itemData.brand) === selectedBrand;

    const matchesType =
      selectedType === "all" || item?.type === selectedType;

    const matchesPrice =
      price >= priceRange[0] && price <= priceRange[1];

    const matchesColor =
      selectedColor === "all" ||
      Object.keys(item?.imagesVariants || {}).includes(selectedColor);

    return matchesBrand && matchesType && matchesPrice && matchesColor;
  });
}, [allFashionItems, selectedBrand, selectedType, selectedColor, priceRange]);

const hasLoadedItems = allFashionItems.length > 0;
const hasActiveFilters =
  selectedBrand !== "all" ||
  selectedType !== "all" ||
  selectedColor !== "all" ||
  priceRange[0] > 0 ||
  priceRange[1] < maxPrice;

const getColorSwatch = (colorName = "") => {
  const color = colorName.trim().toLowerCase();
  return colorSwatches[color] || null;
};

const getColorFilterPreviewImage = (color) => {
  for (const itemData of allFashionItems) {
    const variantImages = sortImages(itemData?.item?.imagesVariants?.[color] || []);
    const firstImage = getImageUrl(variantImages?.[0]);

    if (firstImage) return firstImage;
  }

  return "";
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
  const selectedColor = selectedColorByItem[product.id];

  if (selectedColor && Array.isArray(variants[selectedColor])) {
    return sortImages(variants[selectedColor]);
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


const withCountry = (path) => {
  const code = countryCode || "fr";
  if (!path) return `/${code}`;
  return `/${code}${path.startsWith("/") ? path : `/${path}`}`;
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


  const handleItemClick = (id) => {
   if (id) push(withCountry(`/product/${id}`));
  };

if (loading) {
  return (
    <div className="fashion-page-wrapper">
      <div className="fashion-loading-state">
        <div className="fashion-loading-spinner" />

       <h2>
          {t("fashion_loading_title", {
            country: countryName,
          })}
        </h2>

        <p>
          {t("fashion_loading_description")}
        </p>
      </div>
    </div>
  );
}

 if (!loading && filteredItems.length === 0) {
  return (
    <div className="fashion-page-wrapper">
      <div className="country-empty-state">
        <div className="country-empty-icon">📍</div>

        <h2>
  {hasLoadedItems
    ? t("fashion_no_filter_results")
    : t("fashion_no_country_products", {
        country: countryName,
      })}
</h2>

<p>
  {hasLoadedItems
    ? t("fashion_change_filters")
    : t("fashion_no_country_products_description", {
        country: countryName,
      })}
</p>

        {!hasLoadedItems && (
          <p>
             {t("fashion_choose_different_location")}
          </p>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            className="empty-state-action"
            onClick={() => {
              setSelectedBrand("all");
              setSelectedType("all");
              setSelectedColor("all");
              setPriceRange([0, maxPrice]);
            }}
          >
           {t("clear_filters")}
          </button>
        )}
      </div>
    </div>
  );
}

  return (
  <div className="fashion-page-wrapper">
    <div className="fashion-brand-top">
      {brandThemes
        .filter((b) =>
          Object.keys(topItemsPerBrand).includes(normalizeBrand(b.brandName))
        )
        .map((brand) => (
          <button
            key={brand.brandName}
            className="fashion-brand-logo-card"
           onClick={() => {
                const themeRoute = brand?.theme?.trim()?.toLowerCase();

                if (!themeRoute || !brand?.brandName) return;

                setSelectedBrandName(brand.brandName);

               push(
  withCountry(`/brand/${themeRoute}/${encodeURIComponent(brand.brandName)}`)
);
              }}
          >
            <img src={brand.logo} alt={`${brand.brandName} logo`} />
          </button>
        ))}
    </div>

    <div className="mobile-filters-wrapper">
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
            className={selectedBrand === normalizeBrand(brand) ? "active-filter" : ""}
            onClick={() => setSelectedBrand(normalizeBrand(brand))}
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
            className={selectedType === type ? "active-filter" : ""}
            onClick={() => setSelectedType(type)}
          >
          {translateTaxonomy(type)}
          </button>
        ))}
      </div>

      <div className="mobile-color-filters">
        <button
          className={`mobile-color-circle all ${selectedColor === "all" ? "active" : ""}`}
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
                : {
                    backgroundImage: `url("${previewImage}")`,
                    backgroundSize: "300%",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
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

    <div className="fashion-layout">
      <aside className="fashion-sidebar">
        <div className="sidebar-section">
          <h3>{t("brands")}</h3>

          <button
            className={`sidebar-btn ${selectedBrand === "all" ? "active" : ""}`}
            onClick={() => setSelectedBrand("all")}
          >
           {t("all")}
          </button>

          {brands.map((brand) => (
            <button
              key={brand}
              className={`sidebar-btn ${
                selectedBrand === normalizeBrand(brand) ? "active" : ""
              }`}
              onClick={() => setSelectedBrand(normalizeBrand(brand))}
            >
              {brand}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <h3>{t("types")}</h3>

          <button
            className={`sidebar-btn ${selectedType === "all" ? "active" : ""}`}
            onClick={() => setSelectedType("all")}
          >
           {t("all")}
          </button>

          {types.map((type) => (
            <button
              key={type}
              className={`sidebar-btn ${selectedType === type ? "active" : ""}`}
              onClick={() => setSelectedType(type)}
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
                aria-label={t("select_color", {
                  color: getTranslatedColor(color),
                })}
                style={
                  swatchColor
                    ? { background: swatchColor }
                    : {
                        backgroundImage: `url("${previewImage}")`,
                        backgroundSize: "300%",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }
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

      <div className="fashion-items-grid">
        {filteredItems.map((itemData) => {
          const { id, itemId, item, brand } = itemData;
          const reviewsData = reviews[itemId] || {};
          const finalRating = reviewsData?.averageRating || null;
          const isBestSeller = id === bestSellersByBrand[brand];
          const colorOptions = getColorOptions(itemData);
          const selectedColorForItem = selectedColorByItem[id];
          const displayImage = getDisplayImage(itemData);
          const currentImages = getCurrentImages(itemData);

          const brandDelivery =
          brandThemes?.find(
            (x) =>
              x?.brandName?.trim()?.toLowerCase() ===
              brand?.trim()?.toLowerCase()
          )?.delivery || null;

          const visibleColorOptions = colorOptions.slice(0, 3);
          const hiddenColorCount = Math.max(colorOptions.length - 3, 0);

          return (
            <div
              key={id}
              className="fashion-card"
              onClick={() => handleItemClick(id)}
            >
             <div
              className="fashion-card-media"
              style={{
                background: "white",
                zIndex: "1",
                paddingTop: "20px",
                filter: "brightness(0.97)",
                width: "100%",
                height: isVerySmall ? "230px" : "300px",
                marginBottom: "10px",
                marginTop: "10px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {currentImages.length > 1 && (
                <button
                  type="button"
                  className="image-arrow image-arrow-left"
                  aria-label={t("previous_image")}
                  onClick={(e) => handleImageArrow(itemData, "prev", e)}
                >
                  ‹
                </button>
              )}

              <img
                src={displayImage}
                alt={item.name}
                style={{
                  width: "100%",
                  height: isVerySmall ? "230px" : "300px",
                  objectFit: "contain",
                  display: "block",
                }}
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
                  onClick={(e) => handleImageArrow(itemData, "next", e)}
                >
                  ›
                </button>
              )}

              <div className={isBestSeller ? "fashion-badge best" : "fashion-badge"}>
                {isBestSeller ? t("best_seller") : t("topIt")}
              </div>
            </div>

              <div className="fashion-product-brand">
                {item?.brand || brand}
              </div>

              <div className="fashion-product-name">
                {getTranslatedName(item, itemId)}
              </div>

             {colorOptions.length > 0 && (
                <div
                  className="fashion-color-options"
                  onClick={(e) => e.stopPropagation()}
                >
               {visibleColorOptions.map((color) => {
                  const swatchColor = getColorSwatch(color);

                  const variantImages = sortImages(item?.imagesVariants?.[color] || []);
                  const firstVariantImage = getImageUrl(variantImages?.[0]);

                  return (
                    <button
                      key={color}
                      type="button"
                      className={`fashion-color-circle ${
                        selectedColorForItem === color ? "active" : ""
                      }`}
                      title={color}
                      aria-label={`Select ${color}`}
                      onClick={(e) => handleColorSelect(id, color, e)}
                      style={
                        swatchColor
                          ? { background: swatchColor }
                          : {
                              backgroundImage: `url("${firstVariantImage}")`,
                              backgroundSize: "300%",
                              backgroundPosition: "center",
                              backgroundRepeat: "no-repeat",
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

              {brandDelivery?.isFree && (
              <div className="fashion-delivery-info">
                <div className="fashion-free-delivery">
                 {t("free_delivery")}
                </div>

                <div className="fashion-delivery-date">
                 {t("get_it_by", {
                  date: getEstimatedDeliveryDay(
                    brandDelivery?.estimatedDaysMax || 7
                  ),
                })}
                </div>
              </div>
            )}
            <div className="item-price">
              {formatPrice(item.usdPrice)}
            </div>

            {item?.sold && Number(item.sold) > 0 && (
              <div className="fashion-sold-badge">
               {t("sold_worldwide", {
                  count: item.sold,
                })}
              </div>
            )}

              <div
                className="item-type-stars"
                onClick={(e) => {
                  e.stopPropagation();
                  if (finalRating) {
                    setItemData(itemData);
                   push(withCountry(`/product/${id}/review`));
                  }
                }}
              >
                {finalRating &&
                  "★".repeat(Math.round(finalRating)) +
                    "☆".repeat(5 - Math.round(finalRating))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
}

export default ItemFashionPage;
