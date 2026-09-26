"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import "./basedbrowsing.css";

import { AppContext } from "./appContext";
import { useCheckoutStore } from "./checkoutStore";
import colorSwatches from "../../lib/colors.json";
import { getCountryConfig } from "../../src/components/countryUtils"

const BASE_URL = "https://api.malidag.com";

const SUPPORTED_LANGUAGES = ["en", "fr", "br"];

function Browsing() {
  const appContext = useContext(AppContext);

  const user = appContext?.user || null;
  const country = appContext?.country || null;

  const router = useRouter();
  const { t, i18n } = useTranslation();

  const setSelectedBrandName = useCheckoutStore(
    (state) => state.setSelectedBrandName
  );

  const [userSearchHistory, setUserSearchHistory] = useState([]);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [brandThemes, setBrandThemes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [translations, setTranslations] = useState({});
  const [reviews, setReviews] = useState({});

  const [rates, setRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);

  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] =
    useState({});

  const countryCode = country?.code?.toLowerCase() || "fr";

  const currentLang = SUPPORTED_LANGUAGES.includes(i18n.language)
    ? i18n.language
    : "en";

  const countryCurrencyConfig = useMemo(
    () => getCountryConfig(country?.name || ""),
    [country?.name]
  );

  const currency = countryCurrencyConfig?.currency || "USD";

  const locale =
    currentLang === "fr"
      ? "fr-FR"
      : currentLang === "br"
        ? "pt-BR"
        : "en-US";

  const withCountry = useCallback(
    (path) => {
      if (!path) return `/${countryCode}`;

      const cleanPath = path.replace(
        /^\/(fr|gb|br|us|de|ie|au|be)(\/|$)/,
        "/"
      );

      return `/${countryCode}${
        cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`
      }`;
    },
    [countryCode]
  );

  const normalizeBrand = useCallback(
    (brand = "") => String(brand).trim().toLowerCase(),
    []
  );

  const normalizeTranslationKey = useCallback((value = "") => {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }, []);

  const translateTaxonomy = useCallback(
    (value = "") => {
      if (!value) return "";

      const key = normalizeTranslationKey(value);

      return t(key, {
        defaultValue: String(value)
          .replace(/_/g, " ")
          .replace(/-/g, " "),
      });
    },
    [normalizeTranslationKey, t]
  );

  const getTranslatedColor = useCallback(
    (color = "") => translateTaxonomy(color),
    [translateTaxonomy]
  );

  const getImageUrl = useCallback((imageEntry) => {
    if (!imageEntry) return "";

    if (typeof imageEntry === "string") {
      return imageEntry;
    }

    if (
      typeof imageEntry === "object" &&
      imageEntry?.url
    ) {
      return imageEntry.url;
    }

    return "";
  }, []);

  const sortImages = useCallback((images = []) => {
    return [...images].sort((a, b) => {
      const posA =
        typeof a === "object" &&
        typeof a?.position === "number"
          ? a.position
          : 999999;

      const posB =
        typeof b === "object" &&
        typeof b?.position === "number"
          ? b.position
          : 999999;

      return posA - posB;
    });
  }, []);

  const getColorSwatch = useCallback((colorName = "") => {
    const color = String(colorName)
      .trim()
      .toLowerCase();

    return colorSwatches[color] || null;
  }, []);

  /* ---------------------------------
     PRICE RATES
  ---------------------------------- */

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

        setRates({});
      } finally {
        setRatesLoading(false);
      }
    };

    fetchRates();
  }, []);

  const convertUsdToLocal = useCallback(
    (usdValue) => {
      const usdPrice = Number(usdValue || 0);

      if (!usdPrice) return 0;

      if (currency === "USD") {
        return usdPrice;
      }

      const rate = Number(rates?.[currency]);

      if (!rate) return null;

      return usdPrice * rate;
    },
    [currency, rates]
  );

  const formatPrice = useCallback(
    (usdValue) => {
      if (
        currency !== "USD" &&
        ratesLoading
      ) {
        return "—";
      }

      const converted =
        convertUsdToLocal(usdValue);

      if (converted === null) {
        return t("price_unavailable");
      }

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    },
    [
      convertUsdToLocal,
      currency,
      locale,
      ratesLoading,
      t,
    ]
  );

  /* ---------------------------------
     DELIVERY
  ---------------------------------- */

  const getEstimatedDeliveryDay = useCallback(
    (daysToAdd = 7) => {
      const date = new Date();

      date.setDate(
        date.getDate() + Number(daysToAdd || 7)
      );

      return date.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
      });
    },
    [locale]
  );

  /* ---------------------------------
     PRODUCT TRANSLATIONS
  ---------------------------------- */

  const fetchTranslation = useCallback(
    async (productId, lang) => {
      if (!productId || lang === "en") {
        return;
      }

      if (translations[productId]?.[lang]) {
        return;
      }

      try {
        const response = await fetch(
          `${BASE_URL}/translate/product/translate/${encodeURIComponent(
            productId
          )}/${encodeURIComponent(lang)}`
        );

        if (!response.ok) {
          throw new Error(
            `Translation request failed: ${response.status}`
          );
        }

        const data = await response.json();

        const translation =
          data?.translation ||
          data?.translatedProduct ||
          data;

        setTranslations((prev) => ({
          ...prev,
          [productId]: {
            ...(prev[productId] || {}),
            [lang]: translation,
          },
        }));
      } catch (error) {
        console.error(
          `Error fetching translation for product ${productId}:`,
          error
        );
      }
    },
    [translations]
  );

  const getTranslatedName = useCallback(
    (item, itemId) => {
      const originalName =
        item?.name || t("fashion_item");

      if (currentLang === "en") {
        return originalName;
      }

      const translated =
        translations[itemId]?.[currentLang];

      return (
        translated?.name ||
        translated?.itemName ||
        originalName
      );
    },
    [currentLang, translations, t]
  );

  /* ---------------------------------
     REVIEWS
  ---------------------------------- */

  const fetchReviews = useCallback(
    async (productId) => {
      if (!productId || reviews[productId]) {
        return;
      }

      try {
        const response = await fetch(
          `${BASE_URL}/get-reviews/${encodeURIComponent(
            productId
          )}`
        );

        if (response.status === 404) {
          setReviews((prev) => ({
            ...prev,
            [productId]: {
              averageRating: null,
              reviewsArray: [],
            },
          }));

          return;
        }

        if (!response.ok) {
          throw new Error(
            `Reviews request failed: ${response.status}`
          );
        }

        const data = await response.json();

        const reviewsArray = Array.isArray(data?.reviews)
          ? data.reviews
          : [];

        const validRatings = reviewsArray
          .map((review) => Number(review?.rating))
          .filter(
            (rating) =>
              Number.isFinite(rating) &&
              rating >= 1 &&
              rating <= 5
          );

        const averageRating = validRatings.length
          ? validRatings.reduce(
              (sum, rating) => sum + rating,
              0
            ) / validRatings.length
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating,
            reviewsArray,
          },
        }));
      } catch (error) {
        console.error(
          `Error fetching reviews for product ${productId}:`,
          error
        );
      }
    },
    [reviews]
  );

  /* ---------------------------------
     BRAND THEMES
  ---------------------------------- */

  useEffect(() => {
    const fetchBrandThemes = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/brands/themes`
        );

        if (!response.ok) {
          throw new Error(
            `Brand themes request failed: ${response.status}`
          );
        }

        const data = await response.json();

        setBrandThemes(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Failed to fetch brand themes:",
          error
        );

        setBrandThemes([]);
      }
    };

    fetchBrandThemes();
  }, []);

  /* ---------------------------------
     SEARCH HISTORY
  ---------------------------------- */

  useEffect(() => {
    const fetchUserSearchHistory = async () => {
      if (!user?.uid) {
        setUserSearchHistory([]);
        setSuggestedItems([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${BASE_URL}/search-items?userId=${encodeURIComponent(
            user.uid
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Search history request failed: ${response.status}`
          );
        }

        const data = await response.json();

        setUserSearchHistory(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.userSearches)
              ? data.userSearches
              : []
        );
      } catch (error) {
        console.error(
          "Error fetching user search history:",
          error
        );

        setUserSearchHistory([]);
        setSuggestedItems([]);
        setLoading(false);
      }
    };

    fetchUserSearchHistory();
  }, [user?.uid]);

  /* ---------------------------------
     COUNTRY CATALOG + MATCHING
  ---------------------------------- */

  useEffect(() => {
    const fetchSuggestedItems = async () => {
      if (!userSearchHistory.length) {
        setSuggestedItems([]);
        setLoading(false);
        return;
      }

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

        if (!response.ok) {
          throw new Error(
            `Items request failed: ${response.status}`
          );
        }

        const data = await response.json();

        const itemsArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        const terms = [
          ...new Set(
            userSearchHistory
              .map((entry) =>
                String(entry?.search || "")
                  .toLowerCase()
                  .replace(/\+/g, " ")
                  .trim()
              )
              .filter(Boolean)
          ),
        ];

        const matchedItems = itemsArray.filter(
          (itemData) => {
            const item = itemData?.item || {};
            const details =
              itemData?.details || {};

            const searchBlob = [
              item?.name,
              item?.type,
              item?.theme,
              item?.brand,
              item?.genre,
              itemData?.category,
              details?.category,
              details?.brand,
              details?.brandType,
              details?.department,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return terms.some((term) =>
              searchBlob.includes(term)
            );
          }
        );

        setSuggestedItems(matchedItems);

        matchedItems.forEach((itemData) => {
          const itemId = itemData?.itemId;

          if (!itemId) return;

          if (currentLang !== "en") {
            fetchTranslation(
              itemId,
              currentLang
            );
          }

          fetchReviews(itemId);
        });
      } catch (error) {
        console.error(
          "Error fetching suggested items:",
          error
        );

        setSuggestedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedItems();
  }, [
    userSearchHistory,
    countryCode,
    currentLang,
  ]);

  /* ---------------------------------
     LANGUAGE CHANGE
  ---------------------------------- */

  useEffect(() => {
    if (currentLang === "en") return;

    suggestedItems.forEach((itemData) => {
      if (itemData?.itemId) {
        fetchTranslation(
          itemData.itemId,
          currentLang
        );
      }
    });
  }, [currentLang, suggestedItems]);

  /* ---------------------------------
     NORMALIZED ITEMS
  ---------------------------------- */

  const allBrowsingItems = useMemo(() => {
    return suggestedItems.map((itemData) => {
      const item = itemData?.item || {};
      const details =
        itemData?.details || {};

      const rawBrand =
        item?.brand ||
        details?.brand ||
        "Malidag";

      return {
        ...itemData,

        normalizedBrand:
          normalizeBrand(rawBrand),

        item: {
          ...item,

          brand: rawBrand,

          type:
            item?.type ||
            details?.brandType ||
            itemData?.category ||
            "",

          images: Array.isArray(item?.images)
            ? item.images
            : [],

          imagesVariants:
            item?.imagesVariants || {},

          usdPrice: Number(
            item?.usdPrice || 0
          ),

          sold: Number(item?.sold || 0),
        },
      };
    });
  }, [suggestedItems, normalizeBrand]);

  const brands = useMemo(() => {
    return [
      ...new Set(
        allBrowsingItems
          .map((entry) => entry?.item?.brand)
          .filter(Boolean)
      ),
    ];
  }, [allBrowsingItems]);

  const types = useMemo(() => {
    return [
      ...new Set(
        allBrowsingItems
          .map((entry) => entry?.item?.type)
          .filter(Boolean)
      ),
    ];
  }, [allBrowsingItems]);

  const colors = useMemo(() => {
    const allColors = [];

    allBrowsingItems.forEach((itemData) => {
      Object.keys(
        itemData?.item?.imagesVariants || {}
      ).forEach((color) => {
        allColors.push(color);
      });
    });

    return [...new Set(allColors)];
  }, [allBrowsingItems]);

  const maxPrice = useMemo(() => {
    const prices = allBrowsingItems
      .map((entry) =>
        Number(entry?.item?.usdPrice || 0)
      )
      .filter((price) => price > 0);

    if (!prices.length) {
      return 100;
    }

    return Math.ceil(Math.max(...prices));
  }, [allBrowsingItems]);

  useEffect(() => {
    setPriceRange((prev) => [
      0,
      Math.min(
        prev[1] === 10000
          ? maxPrice
          : prev[1],
        maxPrice
      ),
    ]);
  }, [maxPrice]);

  const filteredItems = useMemo(() => {
    return allBrowsingItems.filter(
      (itemData) => {
        const item = itemData?.item || {};

        const price = Number(
          item?.usdPrice || 0
        );

        const matchesBrand =
          selectedBrand === "all" ||
          itemData.normalizedBrand ===
            selectedBrand;

        const matchesType =
          selectedType === "all" ||
          item?.type === selectedType;

        const matchesPrice =
          price >= priceRange[0] &&
          price <= priceRange[1];

        const matchesColor =
          selectedColor === "all" ||
          Object.keys(
            item?.imagesVariants || {}
          ).includes(selectedColor);

        return (
          matchesBrand &&
          matchesType &&
          matchesPrice &&
          matchesColor
        );
      }
    );
  }, [
    allBrowsingItems,
    selectedBrand,
    selectedType,
    selectedColor,
    priceRange,
  ]);

  /* ---------------------------------
     PRODUCT IMAGES
  ---------------------------------- */

  const getColorFilterPreviewImage =
    useCallback(
      (color) => {
        for (const itemData of allBrowsingItems) {
          const variantImages = sortImages(
            itemData?.item?.imagesVariants?.[
              color
            ] || []
          );

          const firstImage = getImageUrl(
            variantImages?.[0]
          );

          if (firstImage) {
            return firstImage;
          }
        }

        return "";
      },
      [
        allBrowsingItems,
        getImageUrl,
        sortImages,
      ]
    );

  const getColorOptions = useCallback(
    (product) => {
      return Object.keys(
        product?.item?.imagesVariants || {}
      );
    },
    []
  );

  const getCurrentImages = useCallback(
    (product) => {
      const variants =
        product?.item?.imagesVariants || {};

      const selectedColorForItem =
        selectedColorByItem[product.id];

      if (
        selectedColorForItem &&
        Array.isArray(
          variants[selectedColorForItem]
        )
      ) {
        return sortImages(
          variants[selectedColorForItem]
        );
      }

      const firstColor =
        Object.keys(variants)[0];

      if (
        firstColor &&
        Array.isArray(variants[firstColor])
      ) {
        return sortImages(
          variants[firstColor]
        );
      }

      return sortImages(
        product?.item?.images || []
      );
    },
    [selectedColorByItem, sortImages]
  );

  const getDisplayImage = useCallback(
    (product) => {
      const images =
        getCurrentImages(product);

      const currentIndex =
        selectedImageIndexByItem[
          product.id
        ] || 0;

      return (
        getImageUrl(
          images[currentIndex]
        ) ||
        getImageUrl(
          product?.item?.images?.[0]
        ) ||
        "/fallback.png"
      );
    },
    [
      getCurrentImages,
      getImageUrl,
      selectedImageIndexByItem,
    ]
  );

  const handleColorSelect = useCallback(
    (itemId, color, event) => {
      event.stopPropagation();

      setSelectedColorByItem((prev) => ({
        ...prev,
        [itemId]: color,
      }));

      setSelectedImageIndexByItem(
        (prev) => ({
          ...prev,
          [itemId]: 0,
        })
      );
    },
    []
  );

  const handleImageArrow = useCallback(
    (product, direction, event) => {
      event.stopPropagation();

      const images =
        getCurrentImages(product);

      if (images.length <= 1) return;

      setSelectedImageIndexByItem(
        (prev) => {
          const current =
            prev[product.id] || 0;

          const next =
            direction === "next"
              ? (current + 1) %
                images.length
              : (current -
                  1 +
                  images.length) %
                images.length;

          return {
            ...prev,
            [product.id]: next,
          };
        }
      );
    },
    [getCurrentImages]
  );

  const handleItemClick = useCallback(
    (id) => {
      if (!id) return;

      router.push(
        withCountry(`/product/${id}`)
      );
    },
    [router, withCountry]
  );

  const clearFilters = () => {
    setSelectedBrand("all");
    setSelectedType("all");
    setSelectedColor("all");
    setPriceRange([0, maxPrice]);
  };

  /* ---------------------------------
     LOADING
  ---------------------------------- */

  if (loading) {
    return (
      <section className="browsing-state">
        <div className="browsing-loader" />

        <h2>
          {t("browsing_loading_title")}
        </h2>

        <p>
          {t(
            "browsing_loading_description"
          )}
        </p>
      </section>
    );
  }

  /* ---------------------------------
     EMPTY HISTORY
  ---------------------------------- */

  if (!userSearchHistory.length) {
    return (
      <section className="browsing-state">
        <span className="browsing-state-eyebrow">
          {t("browsing_for_you")}
        </span>

        <h2>
          {t(
            "browsing_no_history_title"
          )}
        </h2>

        <p>
          {t(
            "browsing_no_history_description"
          )}
        </p>

        <button
          type="button"
          className="browsing-primary-button"
          onClick={() =>
            router.push(
              withCountry("/")
            )
          }
        >
          {t("browsing_start_exploring")}
        </button>
      </section>
    );
  }

  return (
    <main className="browsing-page">
      <section className="browsing-hero">
        <div>
          <span className="browsing-eyebrow">
            {t("browsing_for_you")}
          </span>

          <h1>
            {t("browsing_title")}
          </h1>

          <p>
            {t(
              "browsing_description"
            )}
          </p>
        </div>

        <div className="browsing-result-count">
          <strong>
            {filteredItems.length}
          </strong>

          <span>
            {t("browsing_items")}
          </span>
        </div>
      </section>

      {brands.length > 0 && (
        <section
          className="browsing-brand-strip"
          aria-label={t("brands")}
        >
          {brandThemes
            .filter((brandTheme) =>
              brands.some(
                (brand) =>
                  normalizeBrand(brand) ===
                  normalizeBrand(
                    brandTheme?.brandName
                  )
              )
            )
            .map((brandTheme) => {
              const themeRoute =
                brandTheme?.theme
                  ?.trim()
                  ?.toLowerCase();

              return (
                <button
                  type="button"
                  key={
                    brandTheme.brandName
                  }
                  className="browsing-brand-logo"
                  onClick={() => {
                    if (
                      !themeRoute ||
                      !brandTheme?.brandName
                    ) {
                      return;
                    }

                    setSelectedBrandName(
                      brandTheme.brandName
                    );

                    router.push(
                      withCountry(
                        `/brand/${themeRoute}/${encodeURIComponent(
                          brandTheme.brandName
                        )}`
                      )
                    );
                  }}
                  aria-label={t(
                    "browse_brand",
                    {
                      brand:
                        brandTheme.brandName,
                    }
                  )}
                >
                  <img
                    src={brandTheme.logo}
                    alt={brandTheme.brandName}
                  />
                </button>
              );
            })}
        </section>
      )}

      <section className="browsing-mobile-filters">
        <div className="browsing-filter-row">
          <button
            type="button"
            className={
              selectedBrand === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setSelectedBrand("all")
            }
          >
            {t("all_brands")}
          </button>

          {brands.map((brand) => {
            const normalized =
              normalizeBrand(brand);

            return (
              <button
                type="button"
                key={brand}
                className={
                  selectedBrand ===
                  normalized
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedBrand(
                    normalized
                  )
                }
              >
                {brand}
              </button>
            );
          })}
        </div>

        <div className="browsing-filter-row">
          <button
            type="button"
            className={
              selectedType === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setSelectedType("all")
            }
          >
            {t("all_types")}
          </button>

          {types.map((type) => (
            <button
              type="button"
              key={type}
              className={
                selectedType === type
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedType(type)
              }
            >
              {translateTaxonomy(type)}
            </button>
          ))}
        </div>

        <div className="browsing-mobile-colors">
          <button
            type="button"
            className={`browsing-color-all ${
              selectedColor === "all"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedColor("all")
            }
          >
            {t("all")}
          </button>

          {colors.map((color) => {
            const swatch =
              getColorSwatch(color);

            const preview =
              getColorFilterPreviewImage(
                color
              );

            return (
              <button
                type="button"
                key={color}
                className={`browsing-color-filter ${
                  selectedColor === color
                    ? "active"
                    : ""
                }`}
                title={getTranslatedColor(
                  color
                )}
                aria-label={t(
                  "filter_by_color",
                  {
                    color:
                      getTranslatedColor(
                        color
                      ),
                  }
                )}
                style={
                  swatch
                    ? {
                        background:
                          swatch,
                      }
                    : {
                        backgroundImage:
                          preview
                            ? `url("${preview}")`
                            : "none",
                      }
                }
                onClick={() =>
                  setSelectedColor(color)
                }
              />
            );
          })}
        </div>

        <div className="browsing-mobile-price">
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

          <input
            type="range"
            min="0"
            max={maxPrice}
            value={Math.min(
              priceRange[1],
              maxPrice
            )}
            onChange={(event) =>
              setPriceRange([
                0,
                Number(
                  event.target.value
                ),
              ])
            }
          />
        </div>
      </section>

      <section className="browsing-layout">
        <aside className="browsing-sidebar">
          <div className="browsing-sidebar-header">
            <h2>
              {t("filters")}
            </h2>

            <button
              type="button"
              onClick={clearFilters}
            >
              {t("clear_filters")}
            </button>
          </div>

          <div className="browsing-filter-group">
            <h3>{t("brands")}</h3>

            <button
              type="button"
              className={
                selectedBrand === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedBrand("all")
              }
            >
              {t("all_brands")}
            </button>

            {brands.map((brand) => {
              const normalized =
                normalizeBrand(brand);

              return (
                <button
                  type="button"
                  key={brand}
                  className={
                    selectedBrand ===
                    normalized
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedBrand(
                      normalized
                    )
                  }
                >
                  {brand}
                </button>
              );
            })}
          </div>

          <div className="browsing-filter-group">
            <h3>{t("types")}</h3>

            <button
              type="button"
              className={
                selectedType === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedType("all")
              }
            >
              {t("all_types")}
            </button>

            {types.map((type) => (
              <button
                type="button"
                key={type}
                className={
                  selectedType === type
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedType(type)
                }
              >
                {translateTaxonomy(
                  type
                )}
              </button>
            ))}
          </div>

          {colors.length > 0 && (
            <div className="browsing-filter-group">
              <h3>{t("colors")}</h3>

              <div className="browsing-sidebar-colors">
                <button
                  type="button"
                  className={`browsing-color-all ${
                    selectedColor ===
                    "all"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedColor(
                      "all"
                    )
                  }
                >
                  {t("all")}
                </button>

                {colors.map((color) => {
                  const swatch =
                    getColorSwatch(
                      color
                    );

                  const preview =
                    getColorFilterPreviewImage(
                      color
                    );

                  return (
                    <button
                      type="button"
                      key={color}
                      className={`browsing-color-filter ${
                        selectedColor ===
                        color
                          ? "active"
                          : ""
                      }`}
                      title={getTranslatedColor(
                        color
                      )}
                      aria-label={t(
                        "filter_by_color",
                        {
                          color:
                            getTranslatedColor(
                              color
                            ),
                        }
                      )}
                      style={
                        swatch
                          ? {
                              background:
                                swatch,
                            }
                          : {
                              backgroundImage:
                                preview
                                  ? `url("${preview}")`
                                  : "none",
                            }
                      }
                      onClick={() =>
                        setSelectedColor(
                          color
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="browsing-filter-group">
            <h3>{t("price")}</h3>

            <input
              className="browsing-price-range"
              type="range"
              min="0"
              max={maxPrice}
              value={Math.min(
                priceRange[1],
                maxPrice
              )}
              onChange={(event) =>
                setPriceRange([
                  0,
                  Number(
                    event.target.value
                  ),
                ])
              }
            />

            <span className="browsing-price-label">
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

        <div className="browsing-content">
          {filteredItems.length > 0 ? (
            <div className="browsing-grid">
              {filteredItems.map(
                (itemData) => {
                  const {
                    id,
                    item,
                    itemId,
                  } = itemData;

                  const reviewsData =
                    reviews[itemId] || {};

                  const finalRating =
                    Number(
                      reviewsData?.averageRating
                    ) || null;

                  const reviewCount =
                    reviewsData
                      ?.reviewsArray
                      ?.length || 0;

                  const colorOptions =
                    getColorOptions(
                      itemData
                    );

                  const selectedProductColor =
                    selectedColorByItem[
                      id
                    ];

                  const displayImage =
                    getDisplayImage(
                      itemData
                    );

                  const currentImages =
                    getCurrentImages(
                      itemData
                    );

                  const brandDelivery =
                    brandThemes?.find(
                      (entry) =>
                        normalizeBrand(
                          entry?.brandName
                        ) ===
                        normalizeBrand(
                          item?.brand
                        )
                    )?.delivery ||
                    null;

                  const visibleColors =
                    colorOptions.slice(
                      0,
                      3
                    );

                  const hiddenColorCount =
                    Math.max(
                      colorOptions.length -
                        3,
                      0
                    );

                  return (
                    <article
                      key={id}
                      className="browsing-card"
                      onClick={() =>
                        handleItemClick(
                          id
                        )
                      }
                    >
                      <div className="browsing-card-media">
                        {currentImages.length >
                          1 && (
                          <button
                            type="button"
                            className="browsing-image-arrow browsing-image-arrow-left"
                            aria-label={t(
                              "previous_image"
                            )}
                            onClick={(
                              event
                            ) =>
                              handleImageArrow(
                                itemData,
                                "prev",
                                event
                              )
                            }
                          >
                            ‹
                          </button>
                        )}

                        <img
                          src={
                            displayImage
                          }
                          alt={getTranslatedName(
                            item,
                            itemId
                          )}
                          loading="lazy"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.onerror =
                              null;

                            event.currentTarget.src =
                              "/fallback.png";
                          }}
                        />

                        {currentImages.length >
                          1 && (
                          <button
                            type="button"
                            className="browsing-image-arrow browsing-image-arrow-right"
                            aria-label={t(
                              "next_image"
                            )}
                            onClick={(
                              event
                            ) =>
                              handleImageArrow(
                                itemData,
                                "next",
                                event
                              )
                            }
                          >
                            ›
                          </button>
                        )}

                        <span className="browsing-card-badge">
                          {t(
                            "recommended_for_you"
                          )}
                        </span>
                      </div>

                      <div className="browsing-card-body">
                        <div className="browsing-card-brand">
                          {item?.brand ||
                            "Malidag"}
                        </div>

                        <h2 className="browsing-card-name">
                          {getTranslatedName(
                            item,
                            itemId
                          )}
                        </h2>

                        {finalRating ? (
                          <button
                            type="button"
                            className="browsing-rating"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              router.push(
                                withCountry(
                                  `/product/${id}/review`
                                )
                              );
                            }}
                          >
                            <span className="browsing-stars">
                              {"★".repeat(
                                Math.round(
                                  finalRating
                                )
                              )}
                              {"☆".repeat(
                                5 -
                                  Math.round(
                                    finalRating
                                  )
                              )}
                            </span>

                            <span>
                              {finalRating.toFixed(
                                1
                              )}
                            </span>

                            <span className="browsing-review-count">
                              {t(
                                "reviews_count",
                                {
                                  count:
                                    reviewCount,
                                }
                              )}
                            </span>
                          </button>
                        ) : (
                          <div className="browsing-no-rating">
                            {t(
                              "no_reviews_yet"
                            )}
                          </div>
                        )}

                        {colorOptions.length >
                          0 && (
                          <div
                            className="browsing-card-colors"
                            onClick={(
                              event
                            ) =>
                              event.stopPropagation()
                            }
                          >
                            {visibleColors.map(
                              (color) => {
                                const swatch =
                                  getColorSwatch(
                                    color
                                  );

                                const variantImages =
                                  sortImages(
                                    item
                                      ?.imagesVariants?.[
                                      color
                                    ] ||
                                      []
                                  );

                                const preview =
                                  getImageUrl(
                                    variantImages?.[0]
                                  );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      color
                                    }
                                    className={`browsing-product-color ${
                                      selectedProductColor ===
                                      color
                                        ? "active"
                                        : ""
                                    }`}
                                    title={getTranslatedColor(
                                      color
                                    )}
                                    aria-label={t(
                                      "select_color",
                                      {
                                        color:
                                          getTranslatedColor(
                                            color
                                          ),
                                      }
                                    )}
                                    onClick={(
                                      event
                                    ) =>
                                      handleColorSelect(
                                        id,
                                        color,
                                        event
                                      )
                                    }
                                    style={
                                      swatch
                                        ? {
                                            background:
                                              swatch,
                                          }
                                        : {
                                            backgroundImage:
                                              preview
                                                ? `url("${preview}")`
                                                : "none",
                                          }
                                    }
                                  />
                                );
                              }
                            )}

                            {hiddenColorCount >
                              0 && (
                              <button
                                type="button"
                                className="browsing-more-colors"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  handleItemClick(
                                    id
                                  );
                                }}
                              >
                                {t(
                                  "more_colors",
                                  {
                                    count:
                                      hiddenColorCount,
                                  }
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        <div className="browsing-card-bottom">
                          <div>
                            <div className="browsing-card-price">
                              {formatPrice(
                                item?.usdPrice
                              )}
                            </div>

                            {Number(
                              item?.sold || 0
                            ) > 0 && (
                              <div className="browsing-sold">
                                {t(
                                  "sold_count",
                                  {
                                    count:
                                      Number(
                                        item.sold
                                      ),
                                  }
                                )}
                              </div>
                            )}
                          </div>

                          {(brandDelivery?.isFree ||
                            !brandDelivery) && (
                            <div className="browsing-delivery">
                              <strong>
                                {t(
                                  "free_delivery"
                                )}
                              </strong>

                              <span>
                                {t(
                                  "get_it_by",
                                  {
                                    date: getEstimatedDeliveryDay(
                                      brandDelivery?.estimatedDaysMax ||
                                        7
                                    ),
                                  }
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <section className="browsing-empty">
              <span className="browsing-state-eyebrow">
                {t("browsing_for_you")}
              </span>

              <h2>
                {allBrowsingItems.length
                  ? t(
                      "browsing_no_filter_results"
                    )
                  : t(
                      "browsing_no_recommendations_title"
                    )}
              </h2>

              <p>
                {allBrowsingItems.length
                  ? t(
                      "browsing_change_filters"
                    )
                  : t(
                      "browsing_no_recommendations_description"
                    )}
              </p>

              {allBrowsingItems.length >
                0 && (
                <button
                  type="button"
                  className="browsing-primary-button"
                  onClick={
                    clearFilters
                  }
                >
                  {t(
                    "clear_filters"
                  )}
                </button>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default Browsing;