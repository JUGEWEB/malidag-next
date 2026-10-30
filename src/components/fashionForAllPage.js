"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import "./fashionForAllPage.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import colorSwatches from "../../lib/colors.json";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

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
const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(true);
const isPhone =
  isMobile ||
  isSmallMobile ||
  isVerySmall ||
  isVeryVerySmall;

  const [useCompactFilters, setUseCompactFilters] = useState(false);

useEffect(() => {
  const media = window.matchMedia("(max-width: 900px)");

  const update = () => {
    setUseCompactFilters(media.matches);
  };

  update();

  media.addEventListener("change", update);

  return () => {
    media.removeEventListener("change", update);
  };
}, []);
const mobileFiltersRef = useRef(null);
const [headerBottom, setHeaderBottom] = useState(0);

useEffect(() => {
  if (!useCompactFilters) return;

  const header = document.querySelector(".malidag-sticky-header");

  if (!header) return;

  let frameId = null;

  const updateHeaderPosition = () => {
    const rect = header.getBoundingClientRect();

    // If the header is visible, place filters directly below it.
    // If hidden above the screen, let filters reach the top.
    const nextBottom = Math.max(0, rect.bottom);

    setHeaderBottom((previous) =>
      Math.abs(previous - nextBottom) > 1 ? nextBottom : previous
    );
  };

  const handleScroll = () => {
    if (frameId !== null) return;

    frameId = requestAnimationFrame(() => {
      frameId = null;
      updateHeaderPosition();
    });
  };

  updateHeaderPosition();

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll);

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleScroll);

    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
  };
},  [useCompactFilters]);


const lastMobileScrollYRef = useRef(0);
const mobileFiltersExpandedRef = useRef(true);
const mobileFiltersManualOpenRef = useRef(false);
const updateMobileFiltersExpanded = useCallback((expanded) => {
  mobileFiltersExpandedRef.current = expanded;
  setMobileFiltersExpanded(expanded);
}, []);
const [priceRange, setPriceRange] = useState([0, 10000]);
const [filterMetadata, setFilterMetadata] = useState({
  types: [],
  colors: [],
  maxPrice: 10000,
});

const [filtersLoading, setFiltersLoading] = useState(false);
const [rates, setRates] = useState({});
const [ratesLoading, setRatesLoading] =
  useState(true);
const [selectedColorByItem, setSelectedColorByItem] = useState({});
const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});
const { push } = useRouter();
const pathname = usePathname();
const [failedImages, setFailedImages] = useState({});

const [loadingMore, setLoadingMore] = useState(false);
const [hasMore, setHasMore] = useState(true);
const [loadMoreError, setLoadMoreError] = useState(false);

const loadMoreRef = useRef(null);
const paginationCursorRef = useRef({
  brandIndex: 0,
  page: 1,
});

const fetchingRef = useRef(false);
const paginationGenerationRef = useRef(0);



const batchSize = isPhone ? 4 : 8;

// Automatically collapse mobile filters on intentional downward scrolling.
// Keep manually opened filters visible until the user closes them.
useEffect(() => {
 if (!useCompactFilters) return;

  lastMobileScrollYRef.current = Math.max(0, window.scrollY);

  let downwardDistance = 0;

  const handleMobileFilterScroll = () => {
    const currentY = Math.max(0, window.scrollY);
    const previousY = lastMobileScrollYRef.current;
    const delta = currentY - previousY;

    lastMobileScrollYRef.current = currentY;

    // Always show filters near the top.
    if (currentY <= 40) {
      downwardDistance = 0;
      mobileFiltersManualOpenRef.current = false;

      if (!mobileFiltersExpandedRef.current) {
        updateMobileFiltersExpanded(true);
      }

      return;
    }

    // Don't auto-close filters that the user opened manually.
    if (mobileFiltersManualOpenRef.current) {
      return;
    }

    // Ignore upward scrolling and tiny layout movements.
    if (delta <= 0) {
      downwardDistance = 0;
      return;
    }

    if (delta < 3) return;

    downwardDistance += delta;

    // Collapse only after meaningful downward scrolling.
    if (
      currentY > 100 &&
      downwardDistance >= 35 &&
      mobileFiltersExpandedRef.current
    ) {
      updateMobileFiltersExpanded(false);
      downwardDistance = 0;
    }
  };

  window.addEventListener("scroll", handleMobileFilterScroll, {
    passive: true,
  });

  return () => {
    window.removeEventListener("scroll", handleMobileFilterScroll);
  };
},  [useCompactFilters, updateMobileFiltersExpanded]);

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

const pendingProductsRef = useRef([]);
const hasMoreRef = useRef(true);
const requestControllerRef = useRef(null);
const loadedBestSellersRef = useRef(new Set());

const paginationQuery = useMemo(
  () => ({
    country: countryCode,
    brand: selectedBrand,
    type: selectedType,
    color: selectedColor,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
  }),
  [
    countryCode,
    selectedBrand,
    selectedType,
    selectedColor,
    priceRange[0],
    priceRange[1],
  ]
);

const loadNextProducts = useCallback(
  async (reset = false) => {
    if (
      fetchingRef.current ||
      !countryCode ||
      !brandGroups.length ||
      (!reset && !hasMoreRef.current)
    ) {
      return;
    }

    const generation = paginationGenerationRef.current;
    const controller = new AbortController();
    requestControllerRef.current = controller;

    fetchingRef.current = true;
    setLoadingMore(!reset);
    setLoadMoreError(false);

    const matchingBrands =
      selectedBrand === "all"
        ? brandGroups
        : brandGroups.filter(
            (group) =>
              group.brand?.trim().toLowerCase() === selectedBrand
          );

    const cursor = { ...paginationCursorRef.current };
    const newItems = {};
    const newBestSellers = {};
    let collected = 0;

    try {
      while (
        collected < batchSize &&
        cursor.brandIndex < matchingBrands.length
      ) {
        const brandName = matchingBrands[cursor.brandIndex]?.brand;

        if (!brandName) {
          cursor.brandIndex++;
          cursor.page = 1;
          continue;
        }

        const key = brandName.trim().toLowerCase();
        const remaining = batchSize - collected;
        let products = [];

        // Keep the brand name with buffered products.
        // Otherwise a leftover batch can be assigned to the next brand.
        if (pendingProductsRef.current.length > 0) {
          products = pendingProductsRef.current;
          pendingProductsRef.current = [];
        } else {
          const response = await axios.get(
            `${BASE_URL}/api/brands/${encodeURIComponent(brandName)}/top-items`,
            {
              params: {
                country: countryCode,
                type: selectedType,
                color: selectedColor,
                minPrice: priceRange[0],
                maxPrice: priceRange[1],
                page: cursor.page,
                limit: batchSize,
              },
              signal: controller.signal,
            }
          );

          if (generation !== paginationGenerationRef.current) return;

          products = (response.data?.items || []).map((product) => ({
            ...product,
            __brandKey: key,
          }));

          if (response.data?.pagination?.hasNextPage) {
            cursor.page++;
          } else {
            cursor.brandIndex++;
            cursor.page = 1;
          }
        }

        const consumed = products.slice(0, remaining);
        const leftover = products.slice(remaining);

        if (leftover.length > 0) {
          pendingProductsRef.current = leftover;
        }

        consumed.forEach((product) => {
          const productBrand = product.__brandKey || key;

          if (!newItems[productBrand]) {
            newItems[productBrand] = [];
          }

          newItems[productBrand].push(product);
        });

        collected += consumed.length;

        if (!loadedBestSellersRef.current.has(key)) {
          const sellerResponse = await axios.get(
            `${BASE_URL}/api/brands/${encodeURIComponent(brandName)}/best-seller`,
            {
              params: { country: countryCode },
              signal: controller.signal,
            }
          );

          if (generation !== paginationGenerationRef.current) return;

          if (sellerResponse.data?.id) {
            newBestSellers[key] = sellerResponse.data.id;
          }

          loadedBestSellersRef.current.add(key);
        }

        if (leftover.length > 0) break;
      }

      if (generation !== paginationGenerationRef.current) return;

      paginationCursorRef.current = cursor;

      setTopItemsPerBrand((previous) => {
        const updated = { ...previous };

        Object.entries(newItems).forEach(([brand, products]) => {
          const existing = updated[brand] || [];
          const existingIds = new Set(
            existing.map((product) => product.itemId)
          );

          updated[brand] = [
            ...existing,
            ...products.filter(
              (product) => !existingIds.has(product.itemId)
            ),
          ];
        });

        return updated;
      });

      setBestSellersByBrand((previous) => ({
        ...previous,
        ...newBestSellers,
      }));

      Object.values(newItems).flat().forEach((product) => {
        if (product.itemId) {
          fetchReviews(product.itemId);
        }
      });

      const more =
        pendingProductsRef.current.length > 0 ||
        cursor.brandIndex < matchingBrands.length;

      hasMoreRef.current = more;
      setHasMore(more);
    } catch (error) {
      if (
        generation === paginationGenerationRef.current &&
        !controller.signal.aborted
      ) {
        console.error("Fashion pagination error:", error);
        setLoadMoreError(true);
      }
    } finally {
      if (generation === paginationGenerationRef.current) {
        fetchingRef.current = false;
        requestControllerRef.current = null;
        setLoadingMore(false);
        setLoading(false);
      }
    }
  },
  [
    countryCode,
    brandGroups,
    batchSize,
    selectedBrand,
    selectedType,
    selectedColor,
    priceRange[0],
    priceRange[1],
  ]
);

// Reset pagination and fetch immediately when any filter changes.
useEffect(() => {
  paginationGenerationRef.current += 1;

  requestControllerRef.current?.abort();
  requestControllerRef.current = null;
  fetchingRef.current = false;

  paginationCursorRef.current = {
    brandIndex: 0,
    page: 1,
  };

  pendingProductsRef.current = [];
  loadedBestSellersRef.current = new Set();
  hasMoreRef.current = true;

  setTopItemsPerBrand({});
  setBestSellersByBrand({});
  setHasMore(true);
  setLoadMoreError(false);
  setLoading(true);
  setLoadingMore(false);

  if (!countryCode || brandGroups.length === 0) {
    setLoading(false);
    return;
  }

  loadNextProducts(true);

  return () => {
    paginationGenerationRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    fetchingRef.current = false;
  };
}, [paginationQuery, brandGroups, batchSize, loadNextProducts]);

// Infinite scrolling for the currently selected filters.
useEffect(() => {
  const target = loadMoreRef.current;

  if (
    !target ||
    loading ||
    loadingMore ||
    !hasMore ||
    loadMoreError
  ) {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (
        entry.isIntersecting &&
        !fetchingRef.current &&
        window.scrollY > 0
      ) {
        observer.disconnect();
        loadNextProducts();
      }
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 0,
    }
  );

  observer.observe(target);

  return () => observer.disconnect();
}, [
  loading,
  loadingMore,
  hasMore,
  loadMoreError,
  loadNextProducts,
]);


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

useEffect(() => {
  if (!countryCode || brandGroups.length === 0) return;

  const controller = new AbortController();

  const fetchAllFacets = async () => {
    setFiltersLoading(true);

    try {
      const responses = await Promise.all(
        brandGroups.map((group) =>
          axios.get(
            `${BASE_URL}/api/brands/${encodeURIComponent(group.brand)}/top-items`,
            {
              params: {
                country: countryCode,
                facets: 1,
              },
              signal: controller.signal,
            }
          )
        )
      );

      if (controller.signal.aborted) return;

      const allTypes = new Set();
      const allColors = new Set();
      let highestPrice = 100;

      responses.forEach(({ data }) => {
        (data.types || []).forEach((type) => allTypes.add(type));
        (data.colors || []).forEach((color) => allColors.add(color));

        highestPrice = Math.max(
          highestPrice,
          Number(data.maxPrice) || 0
        );
      });

      setFilterMetadata({
        types: [...allTypes],
        colors: [...allColors],
        maxPrice: Math.ceil(highestPrice),
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Fashion facets error:", error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setFiltersLoading(false);
      }
    }
  };

  fetchAllFacets();

  return () => controller.abort();
}, [brandGroups, countryCode]);

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
      size: rawItem.size || {},
      usdPrice: rawItem.usdPrice,
      cryptocurrency: rawItem.cryptocurrency,
      sold: rawItem.sold,
    },
    }))
  );
}, [topItemsPerBrand]);

const brands = useMemo(() => {
  return [
    ...new Set(
      brandGroups
        .map((group) => group?.brand?.trim())
        .filter(Boolean)
    ),
  ];
}, [brandGroups]);

const types = filterMetadata.types;
const colors = filterMetadata.colors;
const maxPrice = filterMetadata.maxPrice;

const filteredItems = allFashionItems;


const hasLoadedItems = brandGroups.length > 0;
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

const getProductPriceForColor = (
  product,
  selectedColor
) => {
  const mainPrice = Number(
    product?.item?.usdPrice || 0
  );

  if (!selectedColor) {
    return mainPrice;
  }

  const sizeMap =
    product?.item?.size || {};

  if (
    !sizeMap ||
    typeof sizeMap !== "object" ||
    Array.isArray(sizeMap)
  ) {
    return mainPrice;
  }

  const normalizedSelectedColor =
    String(selectedColor)
      .trim()
      .toLowerCase();

  const actualColorKey = Object.keys(
    sizeMap
  ).find(
    (key) =>
      String(key)
        .trim()
        .toLowerCase() ===
      normalizedSelectedColor
  );

  if (!actualColorKey) {
    return mainPrice;
  }

  const entries =
    sizeMap[actualColorKey];

  if (!Array.isArray(entries)) {
    return mainPrice;
  }

  const variantPrices = entries
    .map((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        Array.isArray(entry)
      ) {
        return null;
      }

      const rawPrice =
        entry.price ??
        entry.usdPrice ??
        entry.variantPrice ??
        null;

      if (
        rawPrice === null ||
        rawPrice === undefined ||
        rawPrice === ""
      ) {
        return null;
      }

      const price = Number(rawPrice);

      return Number.isFinite(price) &&
        price > 0
        ? price
        : null;
    })
    .filter(
      (price) => price !== null
    );

  if (!variantPrices.length) {
    return mainPrice;
  }

  return Math.min(...variantPrices);
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
    brandGroups.some(
      (group) =>
        normalizeBrand(group.brand) ===
        normalizeBrand(b.brandName)
    )
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
           <Image
            src={brand.logo || "/fallback.png"}
            alt={`${brand.brandName} logo`}
            width={130}
            height={70}
            sizes="130px"
            quality={75}
            loading="lazy"
          />
          </button>
        ))}
    </div>

  <div
  ref={mobileFiltersRef}
  className={`mobile-filters-wrapper ${
    mobileFiltersExpanded ? "filters-expanded" : "filters-collapsed"
  }`}
  style={{
    "--mobile-filter-top": `${headerBottom}px`,
  }}
>
  <button
  type="button"
  className="mobile-filters-toggle"
  onClick={() => {
    const nextExpanded = !mobileFiltersExpandedRef.current;

    // Remember that the user intentionally opened the panel.
    mobileFiltersManualOpenRef.current = nextExpanded;

    updateMobileFiltersExpanded(nextExpanded);
  }}
  aria-expanded={mobileFiltersExpanded}
  aria-controls="malidag-mobile-filter-options"
>
    <span className="mobile-filters-toggle-left">
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M7 12h10M10 17h4" />
        <circle cx="8" cy="7" r="2" fill="white" />
        <circle cx="15" cy="12" r="2" fill="white" />
      </svg>

      <span>{t("filters", { defaultValue: "Filters" })}</span>

      {[
        selectedBrand !== "all",
        selectedType !== "all",
        selectedColor !== "all",
        priceRange[0] > 0 || priceRange[1] < maxPrice,
      ].filter(Boolean).length > 0 && (
        <span className="mobile-active-filter-count">
          {[
            selectedBrand !== "all",
            selectedType !== "all",
            selectedColor !== "all",
            priceRange[0] > 0 || priceRange[1] < maxPrice,
          ].filter(Boolean).length}
        </span>
      )}
    </span>

    <span className="mobile-filters-toggle-right">
      {mobileFiltersExpanded
        ? t("hide_filters", { defaultValue: "Hide" })
        : t("view_filters", { defaultValue: "View filters" })}

      <span aria-hidden="true">
        {mobileFiltersExpanded ? "⌃" : "⌄"}
      </span>
    </span>
  </button>

  <div
    id="malidag-mobile-filter-options"
    className="mobile-filters-content"
    hidden={!mobileFiltersExpanded}
  >
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

<div className="fashion-products-column">
      <div className="fashion-items-grid">
        {filteredItems.map((itemData) => {
          const { id, itemId, item, brand } = itemData;
          const reviewsData = reviews[itemId] || {};
          const finalRating = reviewsData?.averageRating || null;
          const isBestSeller = id === bestSellersByBrand[brand];
         const colorOptions =
  getColorOptions(itemData);

const selectedColorForItem =
  selectedColorByItem[id];

const displayedUsdPrice =
  getProductPriceForColor(
    itemData,
    selectedColorForItem
  );

const displayImage =
  getDisplayImage(itemData);

const currentImages =
  getCurrentImages(itemData);

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

              <Image
                src={failedImages[id] === displayImage ? "/fallback.png" : displayImage}
                alt={item.name || "Fashion product"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
                quality={75}
                loading="lazy"
                style={{
                  objectFit: "contain",
                  display: "block",
                }}
                onError={() => {
                  if (displayImage !== "/fallback.png") {
                    setFailedImages((prev) => ({
                      ...prev,
                      [id]: displayImage,
                    }));
                  }
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
              {formatPrice(displayedUsdPrice)}
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

     {hasMore && (
      <div ref={loadMoreRef} className="fashion-load-more">
        {loadingMore && (
          <div className="fashion-loading-spinner" />
        )}

        {loadMoreError && (
          <button type="button"onClick={() => loadNextProducts()}>
            {t("try_again")}
          </button>
        )}
  </div>
)}
    </div>
  </div>
   </div>
);
}

export default ItemFashionPage;
