"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
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
import Image from "next/image";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

function TopItem() {
  const router = useRouter();
 const { t, i18n } = useTranslation();
 const {
  isMobile,
  isSmallMobile,
  isVerySmall,
  isVeryVerySmall,
} = useScreenSize();

const isPhone =
  isMobile ||
  isSmallMobile ||
  isVerySmall ||
  isVeryVerySmall;

  const [messageApi, contextHolder] = message.useMessage();

  const setSelectedBrandName = useCheckoutStore(
    (state) => state.setSelectedBrandName
  );

  const [items, setItems] = useState([]);
 const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);

const loadMoreRef = useRef(null);
const fetchingRef = useRef(false);

const batchSize = isPhone ? 4 : 8;

const [filterMetadata, setFilterMetadata] = useState({
  brands: [],
  types: [],
  colors: [],
  maxPrice: 100,
});

const [loadMoreError, setLoadMoreError] = useState(false);

const nextPageRef = useRef(1);
const requestControllerRef = useRef(null);
const generationRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [brandThemes, setBrandThemes] = useState([]);
  const [basketItems, setBasketItems] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
const [failedImages, setFailedImages] = useState({});
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);
const [rates, setRates] = useState({});
const [ratesLoading, setRatesLoading] =
  useState(true);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});
  const [sizeModalItem, setSizeModalItem] = useState(null);
const [selectedSize, setSelectedSize] = useState(null);
const [selectedLength, setSelectedLength] = useState(null);
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

useEffect(() => {
  const controller = new AbortController();

  const fetchFilters = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/items?country=${encodeURIComponent(countryCode)}&topSold=1&facets=1`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error(`Filter request failed: ${response.status}`);
      }

      const data = await response.json();

      setFilterMetadata({
        brands: data.brands || [],
        types: data.types || [],
        colors: data.colors || [],
        maxPrice: data.maxPrice || 100,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to load filters:", error);
      }
    }
  };

  fetchFilters();

  return () => controller.abort();
}, [countryCode]);

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

 const productQuery = useMemo(() => {
  const params = new URLSearchParams({
    country: countryCode,
    topSold: "1",
    brand: selectedBrand,
    type: selectedType,
    color: selectedColor,
    maxPrice: String(priceRange[1]),
  });

  return params.toString();
}, [
  countryCode,
  selectedBrand,
  selectedType,
  selectedColor,
  priceRange,
]);

const loadNextProducts = useCallback(async () => {
  if (fetchingRef.current || !hasMore) return;

  const generation = generationRef.current;
  const controller = new AbortController();
  const currentPage = nextPageRef.current;

  requestControllerRef.current = controller;
  fetchingRef.current = true;
  setLoadMoreError(false);

  if (currentPage === 1) {
    setLoading(true);
  } else {
    setLoadingMore(true);
  }

  try {
    const response = await fetch(
      `${BASE_URL}/items?${productQuery}&page=${currentPage}&limit=${batchSize}`,
      {
        signal: controller.signal,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Products request failed: ${response.status}`);
    }

    const data = await response.json();

    if (generation !== generationRef.current) return;

    const newItems = Array.isArray(data.items) ? data.items : [];

    setItems((previous) =>
      currentPage === 1
        ? newItems
        : [...previous, ...newItems]
    );

    setPage(currentPage);
    setHasMore(Boolean(data.pagination?.hasNextPage));

    nextPageRef.current = currentPage + 1;

    // Existing reviews functionality.
    newItems.forEach((product) => {
      if (product.itemId) {
        fetchReviews(product.itemId);
      }
    });

    // Your existing translation effect handles new items.
  } catch (error) {
    if (
      error.name !== "AbortError" &&
      generation === generationRef.current
    ) {
      console.error("Failed to load products:", error);
      setLoadMoreError(true);
    }
  } finally {
    if (generation === generationRef.current) {
      fetchingRef.current = false;
      requestControllerRef.current = null;
      setLoading(false);
      setLoadingMore(false);
    }
  }
}, [productQuery, batchSize, hasMore]);

// Reset only the product results when the query changes.
useEffect(() => {
  generationRef.current += 1;
  requestControllerRef.current?.abort();
  requestControllerRef.current = null;

  fetchingRef.current = false;
  nextPageRef.current = 1;

  setItems([]);
  setPage(1);
  setHasMore(true);
  setLoadMoreError(false);
  setLoading(true);
  setLoadingMore(false);

  const generation = generationRef.current;
  const controller = new AbortController();

  requestControllerRef.current = controller;
  fetchingRef.current = true;

  const fetchFirstPage = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/items?${productQuery}&page=1&limit=${batchSize}`,
        { signal: controller.signal, cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Products request failed: ${response.status}`);
      }

      const data = await response.json();

      if (generation !== generationRef.current) return;

      const newItems = Array.isArray(data.items) ? data.items : [];

      setItems(newItems);
      setHasMore(Boolean(data.pagination?.hasNextPage));
      nextPageRef.current = 2;

      newItems.forEach((product) => {
        if (product.itemId) fetchReviews(product.itemId);
      });
    } catch (error) {
      if (
        error.name !== "AbortError" &&
        generation === generationRef.current
      ) {
        console.error("First page failed:", error);
        setLoadMoreError(true);
      }
    } finally {
      if (generation === generationRef.current) {
        fetchingRef.current = false;
        requestControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  fetchFirstPage();

  return () => {
    controller.abort();
    generationRef.current += 1;
  };
}, [productQuery, batchSize]);

// Load subsequent pages only when the bottom is reached.
useEffect(() => {
  if (loading || loadingMore || !hasMore || loadMoreError) return;

  const target = loadMoreRef.current;
  if (!target) return;

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

 const getSizeEntriesForColor = (product, color) => {
  const sizeMap =
    product?.item?.size ||
    product?.details?.sizes ||
    {};

  if (
    !color ||
    !sizeMap ||
    typeof sizeMap !== "object" ||
    Array.isArray(sizeMap)
  ) {
    return [];
  }

  const actualColorKey = Object.keys(sizeMap).find(
    (key) =>
      String(key).trim().toLowerCase() ===
      String(color).trim().toLowerCase()
  );

  if (!actualColorKey) return [];

  const entries = sizeMap[actualColorKey];

  if (!Array.isArray(entries)) return [];

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

    const sizes = splitValues(
      data.value ?? data.size ?? data.label
    );

    const lengths = splitValues(data.length);

    const rawPrice =
      data.price ??
      data.usdPrice ??
      data.variantPrice ??
      null;

    const parsedPrice = Number(rawPrice);

    const price =
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


const getVariantPrice = (entry, fallbackPrice) => {
  if (
    !entry ||
    typeof entry !== "object" ||
    Array.isArray(entry)
  ) {
    return Number(fallbackPrice || 0);
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
    return Number(fallbackPrice || 0);
  }

  const price = Number(rawPrice);

  return Number.isFinite(price) && price > 0
    ? price
    : Number(fallbackPrice || 0);
};


const getSizeLabel = (entry) => {
  if (
    entry === null ||
    entry === undefined
  ) {
    return "";
  }

  if (
    typeof entry === "string" ||
    typeof entry === "number"
  ) {
    return String(entry);
  }

  return String(
    entry.size ??
    entry.value ??
    entry.label ??
    ""
  ).trim();
};

const getLengthOptions = (
  product,
  color,
  selectedSizeEntry = null
) => {
  const sizeEntries = getSizeEntriesForColor(
    product,
    color
  );

  if (selectedSizeEntry) {
    const selectedLabel = getSizeLabel(selectedSizeEntry);

    const matchingSize = sizeEntries.find(
      (entry) => getSizeLabel(entry) === selectedLabel
    );

    return matchingSize?.lengths || [];
  }

  // When no size is selected, don't show lengths
  // belonging to a different size.
  if (sizeEntries.length > 0) {
    return [];
  }

  // Fallback for products with lengths but no sizes.
  const rawLengths =
    product?.item?.length ??
    product?.item?.lengths ??
    [];

  const entries = Array.isArray(rawLengths)
    ? rawLengths
    : [rawLengths];

  return [
    ...new Set(
      entries.flatMap((entry) =>
        String(
          typeof entry === "object" && entry !== null
            ? entry.value ?? entry.length ?? entry.label ?? ""
            : entry ?? ""
        )
          .split(/[,;]|\.(?=\s*\d)/)
          .map((value) => value.trim())
          .filter(Boolean)
      )
    ),
  ];
};


const getProductPriceForColor = (
  product,
  color
) => {
  const mainPrice = Number(
    product?.item?.usdPrice || 0
  );

  const entries =
    getSizeEntriesForColor(
      product,
      color
    );

  if (!entries.length) {
    return mainPrice;
  }

  const prices = entries
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
    .filter((price) => price !== null);

  return prices.length
    ? Math.min(...prices)
    : mainPrice;
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

 const brands = filterMetadata.brands;
const types = filterMetadata.types;
const colors = filterMetadata.colors;
const maxPrice = filterMetadata.maxPrice;

 const filteredItems = items;

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

  const colorOptions =
    getColorOptions(itemData);

  const selectedColorForBasket =
    selectedColorByItem[itemData.id] ||
    colorOptions?.[0] ||
    null;

 const sizeEntries = getSizeEntriesForColor(
  itemData,
  selectedColorForBasket
);

const lengthOptions = getLengthOptions(
  itemData,
  selectedColorForBasket
);

  /*
   * Product has sizes:
   * open modal instead of adding immediately.
   */
  if (sizeEntries.length > 0 || lengthOptions.length > 0) {
  setSelectedSize(null);
  setSelectedLength(null);

  setSizeModalItem({
    itemData,
    color: selectedColorForBasket,
    sizes: sizeEntries,
    lengths: lengthOptions,
  });

  return;
}

  /*
   * Product has no sizes:
   * add directly.
   */
  await addItemToBasket(
    itemData,
    selectedColorForBasket,
    null
  );
};

const addItemToBasket = async (
  itemData,
  selectedColorForBasket,
  selectedSizeEntry = null,
  selectedLengthValue = null
) => {
  const currentUser = auth?.currentUser;

  if (!currentUser) return;

  try {
    const item = itemData?.item || {};
    const details = itemData?.details || {};

    const variantImages =
      item?.imagesVariants?.[
        selectedColorForBasket
      ] || [];

    const basketImage =
      getImageUrl(
        sortImages(variantImages)?.[0]
      ) ||
      getImageUrl(item?.images?.[0]);

    const selectedSizeLabel =
      selectedSizeEntry
        ? getSizeLabel(selectedSizeEntry)
        : null;

    const basketPrice =
      selectedSizeEntry
        ? getVariantPrice(
            selectedSizeEntry,
            item.usdPrice
          )
        : Number(item.usdPrice || 0);

    const basketItem = {
      userId: currentUser.uid,

      item: {
        id: itemData.id,
        itemId: itemData.itemId,
        name: item.name,

        price: basketPrice,

        color:
          selectedColorForBasket,

        size:
          selectedSizeLabel,

        length: selectedLengthValue,

        image: basketImage,

        brand:
          item.brand ||
          details.brand,

        brandPrice:
          item.brandPrice,

        quantity: 1,

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

    const response =
      await axios.post(
        BASKET_API,
        basketItem
      );

    if (
      response.status === 200 ||
      response.status === 201
    ) {
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

      setSizeModalItem(null);
      setSelectedSize(null);
      setSelectedLength(null);
    } else {
      messageApi.error(
        t("failed_to_add_to_cart")
      );
    }
  } catch (error) {
    console.error(
      "Error adding item to basket:",
      error
    );

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

const availableModalLengths = sizeModalItem
  ? getLengthOptions(
      sizeModalItem.itemData,
      sizeModalItem.color,
      selectedSize !== null
        ? sizeModalItem.sizes[selectedSize]
        : null
    )
  : [];

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

      {sizeModalItem && (
  <div
    className="size-modal-overlay"
    onClick={() => {
      setSizeModalItem(null);
      setSelectedSize(null);
    }}
  >
    <div
      className="size-modal"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      <div className="size-modal-header">
        <h2>
          {t("choose_your_size")}
        </h2>

        <button
          type="button"
          className="size-modal-close"
          onClick={() => {
            setSizeModalItem(null);
            setSelectedSize(null);
          }}
        >
          ×
        </button>
      </div>

      <div className="size-modal-options">
        {sizeModalItem.sizes.map(
          (sizeEntry, index) => {
            const sizeLabel =
              getSizeLabel(sizeEntry);

            const variantPrice =
              getVariantPrice(
                sizeEntry,
                sizeModalItem.itemData
                  ?.item?.usdPrice
              );

            const isSelected =
              selectedSize === index;

            return (
              <button
                key={`${sizeLabel}-${index}`}
                type="button"
                className={`size-modal-option ${
                  isSelected
                    ? "active"
                    : ""
                }`}
               onClick={() => {
                setSelectedSize(index);
                setSelectedLength(null);
              }}
              >
                <span>
                  {sizeLabel}
                </span>

                <small>
                  {formatPrice(
                    variantPrice
                  )}
                </small>
              </button>
            );
          }
        )}
      </div>

      {availableModalLengths.length > 0 && (
  <>
    <h3>
      {t("length", { defaultValue: "Length" })}
    </h3>

    <div className="size-modal-options">
      {availableModalLengths.map((length, index) => (
        <button
          key={`${length}-${index}`}
          type="button"
          className={`size-modal-option ${
            selectedLength === index ? "active" : ""
          }`}
          onClick={() => setSelectedLength(index)}
        >
          <span>{length}</span>
        </button>
      ))}
    </div>
  </>
)}

      <button
        type="button"
        className="size-modal-add"
      disabled={
  (sizeModalItem.sizes.length > 0 &&
    selectedSize === null) ||
  (availableModalLengths.length > 0 &&
    selectedLength === null)
}
       onClick={async () => {
  const hasSizes = sizeModalItem.sizes.length > 0;
  const hasLengths = availableModalLengths.length > 0;

  if (hasSizes && selectedSize === null) return;
  if (hasLengths && selectedLength === null) return;

  const selectedEntry = hasSizes
    ? sizeModalItem.sizes[selectedSize]
    : null;

  const selectedLengthValue = hasLengths
    ? availableModalLengths[selectedLength]
    : null;

  await addItemToBasket(
    sizeModalItem.itemData,
    sizeModalItem.color,
    selectedEntry,
    selectedLengthValue
  );
}}
      >
        {t("add_to_cart")}
      </button>
    </div>
  </div>
)}

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

      <div className="topitem-products-column">
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

                         <Image
                        src={
                          failedImages[id] === displayImage
                            ? "/fallback.png"
                            : displayImage
                        }
                        alt={getTranslatedName(item, itemId) || t("product")}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
                        quality={75}
                        loading="lazy"
                        className="topitem-product-image"
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
                       {formatPrice(displayedUsdPrice)}
                      </div>

                    {Number(originalPrice) > 0 &&
                      Number(originalPrice) >
                        Number(displayedUsdPrice || 0) && (
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

                   <div className="topitem-cart-actions">
  {/* ALWAYS allow adding another variant/size */}
  <button
    type="button"
    className="topitem-add-cart-btn"
    onClick={(e) => handleAddToBasket(itemData, e)}
  >
    {t("add_to_cart")}
  </button>

  {/* Show basket indicator only when this product is already in basket */}
  {isItemInBasket(itemId) && (
    <button
      type="button"
      className="topitem-added-cart-btn"
      onClick={(e) => {
        e.stopPropagation();
        router.push(withCountry("/basket"));
      }}
    >
      <span className="topitem-cart-icon">🛒</span>

      <span className="topitem-cart-added-text">
        {getBasketQuantity(itemId)}
      </span>
    </button>
  )}
</div>
                  </div>
                );
              })
            ) : (
              <div className="topitem-no-items">{t("no_items_found")}</div>
            )}
          </div>

           {hasMore && !loadMoreError && (
    <div ref={loadMoreRef} className="topitem-load-more">
      {loadingMore && <div className="topitem-loading-spinner" />}
    </div>
  )}

  {loadMoreError && (
    <div className="topitem-load-more">
      <button type="button" onClick={loadNextProducts}>
        Try again
      </button>
    </div>
  )}
</div>
        </div>
      </div>
    </>
  );
}

export default TopItem;