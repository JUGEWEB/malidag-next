"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import useScreenSize from "../../useIsMobile";
import "./Baasploa.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "@/components/checkoutStore";
import { AppContext } from "@/components/appContext";
import colors from "../../../../lib/colors.json";
import axios from "axios";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";

import {
  getCountryConfig,
  isSupportedLanguage,
} from "@/components/countryUtils";

const BASE_URL = "https://api.malidag.com";
const BASKET_API =
  "https://api.malidag.com/add-to-basket";

function Theme1({ brandName }) {
  const router = useRouter();
const searchParams = useSearchParams();

const requestedBrandType =
  searchParams.get("brandType");
  const { isDesktop } = useScreenSize();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [departments, setDepartments] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [bestSeller, setBestSeller] = useState(null);
  const [brandItems, setBrandItems] = useState([]);
  const [departmentItemsLoading, setDepartmentItemsLoading] = useState(false);
  const [departmentItemsError, setDepartmentItemsError] = useState(null);
  const [hideBestSellerVideo, setHideBestSellerVideo] = useState(false);
  const [reviews, setReviews] = useState({});

  const [brandDetails, setBrandDetails] = useState({
    headerImage: null,
    logo: null,
  });

  const { country } = useContext(AppContext);

  const countryCode =
  country?.code?.toLowerCase() || null;

const withCountry = (path) => {
  if (!countryCode) return "/";

  if (!path) {
    return `/${countryCode}`;
  }

  return `/${countryCode}${
    path.startsWith("/") ? path : `/${path}`
  }`;
};

const [basketItems, setBasketItems] = useState([]);

const [messageApi, contextHolder] =
  message.useMessage();

const [rates, setRates] = useState(null);

const currentLanguage =
  isSupportedLanguage(i18n.language)
    ? i18n.language
    : "en";

const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

  const [expandedDeptIndex, setExpandedDeptIndex] = useState(null);
  const [translations, setTranslations] = useState({});
  const [selectedColorByItem, setSelectedColorByItem] = useState({});

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedBrandType, setSelectedBrandType] = useState(null);

  const normalizeTopItem = (product) => ({
    id: product?.id || "",
    itemId: product?.itemId || "",
    name: product?.name || "",
    images: Array.isArray(product?.images) ? product.images : [],
    videos: Array.isArray(product?.videos) ? product.videos : [],
    department: product?.department || "",
    brandType: product?.brandType || "",
    usdPrice: product?.usdPrice || product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    rating: product?.rating || 0,
    imagesVariants: product?.imagesVariants || {},
  });

  const normalizeBestSeller = (product) => {
    const source = product?.item || {};

    return {
      id: product?.id || "",
      itemId: product?.itemId || "",
      name: source?.name || "",
      images: Array.isArray(source?.images) ? source.images : [],
      videos: Array.isArray(source?.videos) ? source.videos : [],
      department: source?.department || product?.details?.department || "",
      brandType: source?.brandType || product?.details?.brandType || "",
      usdPrice: source?.usdPrice || product?.usdPrice || 0,
      originalPrice: source?.originalPrice || product?.originalPrice || 0,
      rating: source?.rating || product?.rating || 0,
      imagesVariants: source?.imagesVariants || {},
      rawItem: product,
    };
  };

  const normalizeBrandItem = (product) => {
    const source = product?.item || {};

    return {
      id: product?.id || "",
      itemId: product?.itemId || source?.id || "",
      name: source?.name || "",
      images: Array.isArray(source?.images) ? source.images : [],
      videos: Array.isArray(source?.videos) ? source.videos : [],
      department: source?.department || "",
      brandType: source?.brandType || "",
      usdPrice: source?.usdPrice || product?.usdPrice || 0,
      originalPrice: source?.originalPrice || product?.originalPrice || 0,
      rating: source?.rating || product?.rating || 0,
      imagesVariants: source?.imagesVariants || {},
      rawItem: product,
    };
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

    setBasketItems(
      response.data?.basket || []
    );
  } catch (error) {
    console.error(
      "Error fetching basket:",
      error
    );

    setBasketItems([]);
  }
};

useEffect(() => {
  const unsubscribe =
    auth.onAuthStateChanged(() => {
      fetchUserBasket();
    });

  return () => unsubscribe();
}, []);

const getBasketQuantity = (itemId) => {
  const basketItem = basketItems.find(
    (item) => item.itemId === itemId
  );

  return Number(
    basketItem?.quantity || 0
  );
};

const isItemInBasket = (itemId) =>
  getBasketQuantity(itemId) > 0;

  const fetchTranslation = async (productId, lang) => {
    if (!productId || translations?.[productId]?.[lang]) return;

    try {
      const response = await fetch(
        `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
      );
      const data = await response.json();

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: data?.translation || {},
        },
      }));
    } catch (error) {
      console.error(`Error fetching translation for product ${productId}`, error);
    }
  };

  const fetchReviews = async (productId) => {
    if (!productId || reviews[productId]) return;

    try {
      const response = await fetch(
        `https://api.malidag.com/get-reviews/${productId}`
      );
      const data = await response.json();

      const reviewList = Array.isArray(data?.reviews) ? data.reviews : [];
      const total = reviewList.reduce(
        (sum, review) => sum + Number(review?.rating || 0),
        0
      );
      const finalRating = reviewList.length > 0 ? total / reviewList.length : 0;

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          rating: finalRating,
          count: reviewList.length,
          reviews: reviewList,
        },
      }));
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}`, error);
      setReviews((prev) => ({
        ...prev,
        [productId]: {
          rating: 0,
          count: 0,
          reviews: [],
        },
      }));
    }
  };

 useEffect(() => {
  if (currentLanguage === "en") {
    return;
  }

  topItems.forEach((item) => {
    if (item?.itemId) {
      fetchTranslation(
        item.itemId,
        currentLanguage
      );
    }
  });

  if (bestSeller?.itemId) {
    fetchTranslation(
      bestSeller.itemId,
      currentLanguage
    );
  }

  brandItems.forEach((item) => {
    if (item?.itemId) {
      fetchTranslation(
        item.itemId,
        currentLanguage
      );
    }
  });
}, [
  topItems,
  bestSeller,
  brandItems,
  currentLanguage,
]);

  useEffect(() => {
  const fetchRates = async () => {
    try {
      const response = await fetch(
        "https://api.malidag.com/prices/rates"
      );

      const data = await response.json();

      setRates(
        data?.rates ||
        data ||
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
    topItems.forEach((item) => {
      if (item?.itemId) fetchReviews(item.itemId);
    });
  }, [topItems]);

  useEffect(() => {
    brandItems.forEach((item) => {
      if (item?.itemId) fetchReviews(item.itemId);
    });
  }, [brandItems]);

  useEffect(() => {
    if (bestSeller?.itemId) {
      fetchReviews(bestSeller.itemId);
    }
  }, [bestSeller]);

  useEffect(() => {
    const fetchBrandDetails = async () => {
      try {
        const res = await fetch("https://api.malidag.com/api/brands/themes");
        const data = await res.json();

        const brand = Array.isArray(data)
          ? data.find(
              (b) =>
                b?.brandName?.trim()?.toLowerCase() ===
                brandName?.trim()?.toLowerCase()
            )
          : null;

        if (brand) {
          setBrandDetails({
            headerImage: brand?.headerImage || null,
            logo: brand?.logo || null,
          });
        }
      } catch (err) {
        console.error("Error fetching brand theme:", err);
      }
    };

    fetchBrandDetails();
  }, [brandName]);

 useEffect(() => {
  if (!brandName || !countryCode) {
    setDepartments([]);
    return;
  }

  fetch(
    `${BASE_URL}/api/brands/${encodeURIComponent(
      brandName
    )}?country=${encodeURIComponent(
      countryCode
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      setDepartments(
        Array.isArray(data?.departments)
          ? data.departments
          : []
      );
    })
    .catch((error) => {
      console.error(
        "Error fetching departments:",
        error
      );

      setDepartments([]);
    });
}, [brandName, countryCode]);

  useEffect(() => {
  if (
    !requestedBrandType ||
    !departments.length
  ) {
    return;
  }

  const targetBrandType =
    requestedBrandType
      .trim()
      .toLowerCase();

  const matchingDepartment =
    departments.find((department) =>
      (department?.brandTypes || []).some(
        (brandType) =>
          String(brandType || "")
            .trim()
            .toLowerCase() ===
          targetBrandType
      )
    );

  if (!matchingDepartment) {
    return;
  }

  const actualBrandType =
    matchingDepartment.brandTypes.find(
      (brandType) =>
        String(brandType || "")
          .trim()
          .toLowerCase() ===
        targetBrandType
    );

  if (!actualBrandType) return;

  setSelectedDepartment(
    matchingDepartment.name
  );

  setSelectedBrandType(
    actualBrandType
  );
}, [
  requestedBrandType,
  departments,
]);

 useEffect(() => {
  if (!brandName || !countryCode) return;

  fetch(
    `${BASE_URL}/api/brands/${encodeURIComponent(
      brandName
    )}/top-items?country=${encodeURIComponent(
      countryCode
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      const normalized = Array.isArray(data)
        ? data.map(normalizeTopItem)
        : [];

      const initialColors = {};

      normalized.forEach((product) => {
        const colorKeys = Object.keys(
          product?.imagesVariants || {}
        );

        if (colorKeys.length > 0) {
          initialColors[product.id] =
            colorKeys[0];
        }
      });

      setSelectedColorByItem((prev) => ({
        ...initialColors,
        ...prev,
      }));

      setTopItems(normalized);
    })
    .catch((error) => {
      console.error(
        "Error fetching top items:",
        error
      );

      setTopItems([]);
    });
}, [brandName, countryCode]);

  useEffect(() => {
  if (!brandName || !countryCode) return;

  fetch(
    `${BASE_URL}/api/brands/${encodeURIComponent(
      brandName
    )}/best-seller?country=${encodeURIComponent(
      countryCode
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      const normalized = data
        ? normalizeBestSeller(data)
        : null;

      if (normalized) {
        const colorKeys = Object.keys(
          normalized?.imagesVariants || {}
        );

        if (colorKeys.length > 0) {
          setSelectedColorByItem((prev) => ({
            ...prev,
            [normalized.id]:
              prev[normalized.id] ||
              colorKeys[0],
          }));
        }
      }

      setBestSeller(normalized);
    })
    .catch((error) => {
      console.error(
        "Error fetching best seller:",
        error
      );

      setBestSeller(null);
    });
}, [brandName, countryCode]);

 useEffect(() => {
  if (
    !selectedDepartment ||
    !selectedBrandType ||
    !brandName ||
    !countryCode
  ) {
    setBrandItems([]);
    setDepartmentItemsError(null);
    setDepartmentItemsLoading(false);
    return;
  }

  setDepartmentItemsLoading(true);
  setDepartmentItemsError(null);

  fetch(
    `${BASE_URL}/api/brands/${encodeURIComponent(
      brandName
    )}/items?country=${encodeURIComponent(
      countryCode
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      const list = Array.isArray(data)
        ? data
        : [];

      const normalized = list
        .map(normalizeBrandItem)
        .filter((item) => {
          const itemDepartment =
            item?.department
              ?.trim()
              ?.toLowerCase() || "";

          const itemBrandType =
            item?.brandType
              ?.trim()
              ?.toLowerCase() || "";

          const targetDepartment =
            selectedDepartment
              ?.trim()
              ?.toLowerCase() || "";

          const targetBrandType =
            selectedBrandType
              ?.trim()
              ?.toLowerCase() || "";

          return (
            itemDepartment ===
              targetDepartment &&
            itemBrandType ===
              targetBrandType
          );
        });

      const initialColors = {};

      normalized.forEach((product) => {
        const colorKeys = Object.keys(
          product?.imagesVariants || {}
        );

        if (colorKeys.length > 0) {
          initialColors[product.id] =
            colorKeys[0];
        }
      });

      setSelectedColorByItem((prev) => ({
        ...initialColors,
        ...prev,
      }));

      setBrandItems(normalized);
      setDepartmentItemsLoading(false);
    })
    .catch((error) => {
      console.error(
        "Error fetching department items:",
        error
      );

      setBrandItems([]);
      setDepartmentItemsError(
        error?.message ||
          "Failed to load items"
      );
      setDepartmentItemsLoading(false);
    });
}, [
  selectedDepartment,
  selectedBrandType,
  brandName,
  countryCode,
]);

  useEffect(() => {
    setHideBestSellerVideo(false);
  }, [bestSeller?.id]);

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

 const handleBrandTypeClick = (
  department,
  brandType
) => {
  setExpandedDeptIndex(null);

  setSelectedDepartment(
    department
  );

  setSelectedBrandType(
    brandType
  );

  router.push(
    withCountry(
      `/brand/theme1/${encodeURIComponent(
        brandName
      )}?brandType=${encodeURIComponent(
        brandType
      )}`
    )
  );
};

 const handleBackToHome = () => {
  setSelectedDepartment(null);
  setSelectedBrandType(null);
  setDepartmentItemsError(null);
  setExpandedDeptIndex(null);

  router.push(
    withCountry(
      `/brand/theme1/${encodeURIComponent(
        brandName
      )}`
    )
  );
};

  const getTranslatedName = (item, itemId) => {
  if (currentLanguage === "en") {
    return item?.name || t("unnamed_item");
  }

  return (
    translations?.[itemId]?.[currentLanguage]?.name ||
    item?.name ||
    t("unnamed_item")
  );
};

  const isSameProduct = (a, b) => {
    if (!a || !b) return false;

    const aIds = [a?.id, a?.itemId].filter(Boolean).map(String);
    const bIds = [b?.id, b?.itemId].filter(Boolean).map(String);

    return aIds.some((id) => bIds.includes(id));
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.imagesVariants || {});
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();
    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  };

 const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

const getDisplayImage = (product) => {
  const selectedColor = selectedColorByItem[product.id];
  const variants = product?.imagesVariants || {};

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number"
          ? a.position
          : 999999;

      const posB =
        typeof b === "object" && typeof b?.position === "number"
          ? b.position
          : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object"
          ? a?.filename || ""
          : String(a || "").split("/").pop() || "";

      const nameB =
        typeof b === "object"
          ? b?.filename || ""
          : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(product?.images?.[0]) || "/fallback.png";
};

  const getFirstValidVideo = (product) => {
    if (!Array.isArray(product?.videos)) return null;

    return (
      product.videos.find((video) => {
        if (typeof video !== "string") return false;

        const cleanVideo = video.trim();
        const lowerVideo = cleanVideo.toLowerCase();

        if (!cleanVideo) return false;
        if (lowerVideo === "null") return false;
        if (lowerVideo === "undefined") return false;
        if (lowerVideo === "false") return false;
        if (lowerVideo === "n/a") return false;

        return (
          cleanVideo.startsWith("http://") ||
          cleanVideo.startsWith("https://") ||
          cleanVideo.startsWith("/")
        );
      }) || null
    );
  };

  const bestSellerVideo = useMemo(() => {
    return bestSeller ? getFirstValidVideo(bestSeller) : null;
  }, [bestSeller]);

  const shouldShowLargeBestSeller = !!bestSellerVideo && !hideBestSellerVideo;

  const filteredTopItems = useMemo(() => {
    const withoutBestSeller = topItems.filter(
      (item) => !isSameProduct(item, bestSeller)
    );

    return withoutBestSeller.filter((item, index, arr) => {
      return index === arr.findIndex((x) => isSameProduct(x, item));
    });
  }, [topItems, bestSeller]);

  const shoeItems = useMemo(() => {
    return filteredTopItems.filter((item) => {
      const dept = item?.department?.trim()?.toLowerCase() || "";
      return (
        dept === "men-shoes" ||
        dept === "women-shoes" ||
        dept === "mwomen-shoes"
      );
    });
  }, [filteredTopItems]);

  const otherItems = useMemo(() => {
    return filteredTopItems.filter((item) => {
      const dept = item?.department?.trim()?.toLowerCase() || "";
      return (
        dept !== "men-shoes" &&
        dept !== "women-shoes" &&
        dept !== "mwomen-shoes"
      );
    });
  }, [filteredTopItems]);

 const getColorSwatch = (colorName = "") => {
  const key = String(colorName || "")
    .trim()
    .toLowerCase();

  return colors[key] || "#d1d5db";
};

const translateColor = (color) => {
  if (!color) return "";

  const raw = String(color).trim();

  const key = `color_${raw
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_")}`;

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
    : raw;
};

  const renderStars = (rating, item) => {
    const safeRating = Math.round(Number(rating) || 0);

    return (
      <div
        className="th1-stars-container"
        onClick={(e) => {
          e.stopPropagation();
          setItemData(item);
         router.push(withCountry(`product/${item.id}/review`));
        }}
        style={{ cursor: "pointer" }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < safeRating ? "th1-star filled" : "th1-star empty"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getDiscountPercentage = (usdPrice, originalPrice) => {
    const current = Number(usdPrice || 0);
    const original = Number(originalPrice || 0);

    if (!original || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
  };

 const handleAddToBasket = async (
  product,
  e
) => {
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname
        : "/";

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
    const colorOptions =
      getColorOptions(product);

    const selectedColorForBasket =
      selectedColorByItem[product.id] ||
      colorOptions?.[0] ||
      null;

    const basketImage =
      getDisplayImage(product);

    const basketItem = {
      userId: currentUser.uid,

      item: {
        id: product.id,
        itemId: product.itemId,

        // canonical DB values
        name: product.name,
        price: Number(
          product.usdPrice || 0
        ),

        color: selectedColorForBasket,
        size: null,
        image: basketImage,

        brand:
          product.brand ||
          product.rawItem?.item?.brand ||
          product.rawItem?.brand ||
          brandName,

        brandPrice:
          product.brandPrice ||
          product.rawItem?.item?.brandPrice ||
          product.rawItem?.brandPrice,

        quantity: 1,
      },
    };

    const productName =
      getTranslatedName(
        product,
        product.itemId
      );

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

  const renderProductCard = (item, options = {}) => {
    const { isTop = false, badgeText = "" } = options;

    const selectedColor = selectedColorByItem[item.id];
    const colorOptions = getColorOptions(item);
    const displayImage = getDisplayImage(item);
    const discountPercentage = getDiscountPercentage(
      item?.usdPrice,
      item?.originalPrice
    );

    const productReview = reviews[item?.itemId] || {
      rating: item?.rating || 0,
      count: 0,
    };

    return (
      <div key={item.id} className="th1-item-card">

         {contextHolder}

        <div
          className="th1-item-media"
          onClick={() => router.push( withCountry(`/product/${item.id}`))}
        >
          {badgeText ? (
          <div className="th1-image-badge th1-image-badge-best">
            {badgeText}
          </div>
        ) : isTop ? (
          <div className="th1-image-badge th1-image-badge-top">
            {t("top")}
          </div>
        ) : null}

          {discountPercentage > 0 && (
            <div className="th1-image-badge th1-image-badge-discount">
              -{discountPercentage}%
            </div>
          )}

          <img
            src={displayImage}
            alt={item?.name || "Product"}
            className="th1-item-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/fallback.png";
            }}
          />
        </div>

        <div
          className="th1-item-info"
          onClick={() => router.push( withCountry(`/product/${item.id}`))}
        >
        <div className="th1-item-price-row">
          <span className="th1-item-price">
            {formatPrice(item?.usdPrice)}
          </span>

          {Number(item?.originalPrice || 0) > 0 &&
            convertUsd(item.originalPrice) !== null && (
              <span className="th1-item-original-price">
                {formatPrice(item.originalPrice)}
              </span>
            )}
        </div>

          <div className="th1-item-name">
            {getTranslatedName(item, item.itemId)?.length > 70
              ? `${getTranslatedName(item, item.itemId).slice(0, 70)}...`
              : getTranslatedName(item, item.itemId)}
          </div>

          {colorOptions.length > 0 && (
            <div className="th1-color-block" onClick={(e) => e.stopPropagation()}>
              <div className="th1-color-label">
               {t("color")}:{" "}
              <span>
                {translateColor(selectedColor)}
              </span>
              </div>

              <div className="th1-color-options">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`th1-color-circle ${
                      selectedColor === color ? "active" : ""
                    }`}
                    title={translateColor(color)}
                    aria-label={t("select_color", {
                        color: translateColor(color),
                      })}
                    style={{ background: getColorSwatch(color) }}
                    onClick={(e) => handleColorSelect(item.id, color, e)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="th1-item-rating">
            {renderStars(productReview.rating, item)}
            {productReview.count > 0 && (
              <span className="th1-review-count">({productReview.count})</span>
            )}
          </div>

         {isItemInBasket(item.itemId) ? (
                <button
                  type="button"
                  className="th1-add-basket-btn"
                  onClick={(e) => {
                    e.stopPropagation();

                    router.push(
                      withCountry("/basket")
                    );
                  }}
                >
                  🛒 {getBasketQuantity(item.itemId)}
                </button>
              ) : (
                <button
                  type="button"
                  className="th1-add-basket-btn"
                  onClick={(e) =>
                    handleAddToBasket(item, e)
                  }
                >
                  {t("add_to_cart")}
                </button>
              )}
        </div>
      </div>
    );
  };

  const renderBestSellerCard = () => {
    if (!bestSeller || !shouldShowLargeBestSeller) return null;

    const bestSellerReview = reviews[bestSeller?.itemId] || {
      rating: bestSeller?.rating || 0,
      count: 0,
    };

    return (
      <div className="th1-best-seller-section">
        <div className="th1-best-video-card">
          <div
            className="th1-video-container"
            onClick={() => router.push(withCountry(
                `/product/${bestSeller.id}`
              ))}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              controls
              onError={() => setHideBestSellerVideo(true)}
            >
              <source src={bestSellerVideo} type="video/mp4" />
               {t("video_not_supported")}
            </video>
          </div>
        </div>

        <div className="th1-best-image-card">
          <div
            className="th1-best-image-wrap"
            onClick={() => router.push(withCountry(
                `/product/${bestSeller.id}`
              ))}
          >
            <div className="th1-image-badge th1-image-badge-best"> {t("best_seller")}</div>

            <img
              src={getDisplayImage(bestSeller)}
              alt={bestSeller.name}
              className="th1-best-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/fallback.png";
              }}
            />
          </div>

          <div className="th1-item-info">
            <div className="th1-item-price-row">
            <span className="th1-item-price">
              {formatPrice(bestSeller?.usdPrice)}
            </span>

            {Number(bestSeller?.originalPrice || 0) > 0 &&
              convertUsd(bestSeller.originalPrice) !== null && (
                <span className="th1-item-original-price">
                  {formatPrice(bestSeller.originalPrice)}
                </span>
              )}
          </div>

            <div className="th1-item-name">
              {getTranslatedName(bestSeller, bestSeller.itemId)}
            </div>

            {getColorOptions(bestSeller).length > 0 && (
              <div className="th1-color-block" onClick={(e) => e.stopPropagation()}>
                <div className="th1-color-label">
                  {t("color")}:{" "}
                  <span>
                    {translateColor(
                      selectedColorByItem[bestSeller.id]
                    )}
                  </span>
                </div>

                <div className="th1-color-options">
                  {getColorOptions(bestSeller).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`th1-color-circle ${
                        selectedColorByItem[bestSeller.id] === color ? "active" : ""
                      }`}
                      title={translateColor(color)}
                      aria-label={t("select_color", {
                        color: translateColor(color),
                      })}
                      style={{ background: getColorSwatch(color) }}
                      onClick={(e) => handleColorSelect(bestSeller.id, color, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="th1-item-rating">
              {renderStars(bestSellerReview.rating, bestSeller)}
              {bestSellerReview.count > 0 && (
                <span className="th1-review-count">({bestSellerReview.count})</span>
              )}
            </div>

           {isItemInBasket(bestSeller.itemId) ? (
            <button
              type="button"
              className="th1-add-basket-btn"
              onClick={(e) => {
                e.stopPropagation();

                router.push(
                  withCountry("/basket")
                );
              }}
            >
              🛒{" "}
              {getBasketQuantity(
                bestSeller.itemId
              )}
            </button>
          ) : (
            <button
              type="button"
              className="th1-add-basket-btn"
              onClick={(e) =>
                handleAddToBasket(
                  bestSeller,
                  e
                )
              }
            >
              {t("add_to_cart")}
            </button>
          )}
          </div>
        </div>
      </div>
    );
  };

  const renderBestSellerSmallCard = () => {
    if (!bestSeller || shouldShowLargeBestSeller) return null;

    return (
      <div className={`th1-item-grid ${!isDesktop ? "mobile" : ""}`}>
        {renderProductCard(bestSeller, { badgeText: t("best_seller"), })}
      </div>
    );
  };

  const renderDepartmentItems = () => {
    return (
      <div className="th1-department-view">
        <div className="th1-department-toolbar">
          <button
            type="button"
            className="th1-back-btn"
            onClick={handleBackToHome}
          >
            ← {t("back")}
          </button>

          <div className="th1-department-current">
            <span>{t(selectedDepartment) || selectedDepartment}</span>
            <span className="th1-department-separator"> / </span>
            <span>{t(selectedBrandType) || selectedBrandType}</span>
          </div>
        </div>

        {departmentItemsLoading && (
          <p className="th1-message">{t("loading") || "Loading..."}</p>
        )}

        {departmentItemsError && (
          <p className="th1-message th1-error">
            {t("error_label") || "Error"}: {departmentItemsError}
          </p>
        )}

        {!departmentItemsLoading && !departmentItemsError && brandItems.length === 0 && (
          <p className="th1-message">{t("no_items_found") || "No items found"}</p>
        )}

        {!departmentItemsLoading && !departmentItemsError && brandItems.length > 0 && (
          <div className={`th1-item-grid ${!isDesktop ? "mobile" : ""}`}>
            {brandItems.map((item) => renderProductCard(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="th1-wrapper">
      {isDesktop ? (
        <div className="th1-container">
          <aside className="th1-sidebar">
            <div className="th1-sidebar-inner">
              {brandDetails?.logo ? (
                <img
                  src={brandDetails.logo}
                  alt={`${brandName} Logo`}
                  className="th1-logo"
                />
              ) : null}

              <div className="th1-sidebar-title">
               {t("departments_label")}
              </div>

              <div className="th1-type-list">
                {departments.map((department, index) => (
                  <div key={index} className="th1-department-block">
                    <div className="th1-department-name">{t(department?.name)}</div>

                    <div className="th1-brandtype-list">
                      {(department?.brandTypes || []).map((brandType, bIndex) => {
                        const isActive =
                          selectedDepartment === department?.name &&
                          selectedBrandType === brandType;

                        return (
                          <div
                            key={bIndex}
                            className={`th1-type-item ${isActive ? "active" : ""}`}
                            onClick={() =>
                              handleBrandTypeClick(department?.name, brandType)
                            }
                          >
                            {t(brandType)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="th1-main">
            <div className="th1-header">
              {brandDetails?.headerImage ? (
                <img
                  src={brandDetails.headerImage}
                  alt={`${brandName} Header`}
                  className="th1-header-image"
                />
              ) : null}
              <div className="th1-header-title">{brandName}</div>
            </div>

            {selectedDepartment && selectedBrandType ? (
              renderDepartmentItems()
            ) : (
              <>
                {shoeItems.length > 0 && (
                  <div className="th1-item-grid">
                    {shoeItems.map((item) => renderProductCard(item, { isTop: true }))}
                  </div>
                )}

                {renderBestSellerCard()}
                {renderBestSellerSmallCard()}

                {otherItems.length > 0 && (
                  <div className="th1-item-grid">
                    {otherItems.map((item) => renderProductCard(item, { isTop: true }))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      ) : (
        <div className="th1-mobile">
          <div className="th1-header">
            {brandDetails?.headerImage ? (
              <img
                src={brandDetails.headerImage}
                alt={`${brandName} Header`}
                className="th1-header-image"
              />
            ) : null}
            <div className="th1-header-title">{brandName}</div>
          </div>

          <div className="th1-mobile-nav">
            {brandDetails?.logo ? (
              <img
                src={brandDetails.logo}
                alt={`${brandName} Logo`}
                className="th1-mobile-logo"
              />
            ) : null}

            <div className="th1-mobile-type-list">
              {departments.map((department, index) => (
                <div key={index} className="th1-mobile-department">
                  <button
                    type="button"
                    className={`th1-mobile-department-title ${
                      expandedDeptIndex === index ? "active" : ""
                    }`}
                    onClick={() =>
                      setExpandedDeptIndex(index === expandedDeptIndex ? null : index)
                    }
                  >
                    {t(department?.name)}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {expandedDeptIndex !== null && (
            <>
              <div
                className="th1-mobile-dropdown-backdrop"
                onClick={() => setExpandedDeptIndex(null)}
              />

              <div className="th1-mobile-dropdown-panel">
                <div className="th1-mobile-dropdown-header">
                  <span className="th1-mobile-dropdown-title">
                    {t(departments?.[expandedDeptIndex]?.name)}
                  </span>

                  <button
                    type="button"
                    className="th1-mobile-dropdown-close"
                    onClick={() => setExpandedDeptIndex(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="th1-mobile-dropdown">
                  {(departments?.[expandedDeptIndex]?.brandTypes || []).map(
                    (brandType, bIndex) => {
                      const isActive =
                        selectedDepartment === departments?.[expandedDeptIndex]?.name &&
                        selectedBrandType === brandType;

                      return (
                        <button
                          key={bIndex}
                          type="button"
                          className={`th1-mobile-dropdown-item ${
                            isActive ? "active" : ""
                          }`}
                          onClick={() =>
                            handleBrandTypeClick(
                              departments?.[expandedDeptIndex]?.name,
                              brandType
                            )
                          }
                        >
                          {t(brandType)}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          )}

          {selectedDepartment && selectedBrandType ? (
            renderDepartmentItems()
          ) : (
            <>
              {renderBestSellerCard()}
              {renderBestSellerSmallCard()}

              {shoeItems.length > 0 && (
                <div className="th1-item-grid mobile">
                  {shoeItems.map((item) => renderProductCard(item, { isTop: true }))}
                </div>
              )}

              {otherItems.length > 0 && (
                <div className="th1-item-grid mobile">
                  {otherItems.map((item) => renderProductCard(item, { isTop: true }))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Theme1;