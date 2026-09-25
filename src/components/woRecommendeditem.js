'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./recomendedItem.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";

import { useAppContext } from "./appContext";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

const BASE_URL = "https://api.malidag.com";
const MAX_CACHE_ITEMS = 20;
const MAX_DISPLAY_ITEMS = 30;
const CACHE_TTL = 30 * 60 * 1000;

function WoRecommendedItem() {
  const router = useRouter();
const { t, i18n } = useTranslation();
const { country } = useAppContext();

const [recommendedItems, setRecommendedItems] = useState([]);
const [reviews, setReviews] = useState({});
const [rates, setRates] = useState({});
const [itemTranslations, setItemTranslations] = useState({});
const [loadingRecommendations, setLoadingRecommendations] =
  useState(true);

const countryCode =
  country?.code?.toLowerCase() || "fr";

const currentLang = isSupportedLanguage(i18n.language)
  ? i18n.language
  : "en";

const countryCurrencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

const cacheKey =
  `womenFaRecommended_${countryCode}`;

const withCountry = useCallback(
  (path) => {
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
  },
  [countryCode]
);

  const renderStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

 const fetchReviews = useCallback(
  async (productId) => {
    if (!productId) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/get-reviews/${productId}`
      );

      const reviewsArray =
        response.data?.success &&
        Array.isArray(response.data.reviews)
          ? response.data.reviews
          : [];

      const validRatings = reviewsArray
        .map((review) =>
          Number(review?.rating)
        )
        .filter(
          (rating) =>
            Number.isFinite(rating) &&
            rating >= 1 &&
            rating <= 5
        );

      const averageRating =
        validRatings.length > 0
          ? (
              validRatings.reduce(
                (sum, rating) =>
                  sum + rating,
                0
              ) / validRatings.length
            ).toFixed(1)
          : null;

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          averageRating,
          count: validRatings.length,
        },
      }));
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error(
          "Error fetching reviews:",
          error
        );
      }

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          averageRating: null,
          count: 0,
        },
      }));
    }
  },
  []
);

 useEffect(() => {
  let cancelled = false;

  const hydrateReviews = async (items) => {
    await Promise.all(
      items.map((product) => {
        const productId = product?.itemId;

        return productId
          ? fetchReviews(productId)
          : Promise.resolve();
      })
    );
  };

  const loadCachedItems = () => {
    try {
      const cached =
        localStorage.getItem(cacheKey);

      if (!cached) return false;

      const parsed = JSON.parse(cached);

      if (
        !parsed ||
        !Array.isArray(parsed.items) ||
        !parsed.items.length ||
        !parsed.timestamp
      ) {
        localStorage.removeItem(cacheKey);
        return false;
      }

      const isExpired =
        Date.now() - parsed.timestamp >
        CACHE_TTL;

      if (isExpired) {
        localStorage.removeItem(cacheKey);
        return false;
      }

      if (cancelled) return false;

      setRecommendedItems(parsed.items);
      setLoadingRecommendations(false);

      hydrateReviews(parsed.items).catch(
        (error) => {
          console.error(
            "Error fetching cached reviews:",
            error
          );
        }
      );

      return true;
    } catch (error) {
      console.error(
        "Error reading recommended cache:",
        error
      );

      localStorage.removeItem(cacheKey);

      return false;
    }
  };

  const fetchRecommendedItems = async () => {
    try {
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
          `Failed to fetch items: ${response.status}`
        );
      }

      const data = await response.json();

      const itemsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

   const filteredItems =
  itemsArray.filter((product) => {
    const item =
      product?.item || {};

    const details =
      product?.details || {};

    const price = Number(
      item?.usdPrice || 0
    );

    const category = String(
      product?.category ||
        details?.category ||
        ""
    )
      .trim()
      .toLowerCase();

    const genre = String(
      item?.genre ||
        details?.genre ||
        product?.genre ||
        ""
    )
      .trim()
      .toLowerCase();

   const isWomen =
  genre === "women" ||
  genre === "woman" ||
  genre === "female" ||
  genre === "unisex";

    const isFashion =
      category === "fashion" ||
      category === "clothes" ||
      category === "clothing" ||
      category === "shoes";

   return (
  isWomen &&
  isFashion &&
  price >= 1 &&
  price <= 100
);
  });

      // Fisher-Yates shuffle
      const shuffledItems = [
        ...filteredItems,
      ];

      for (
        let i = shuffledItems.length - 1;
        i > 0;
        i--
      ) {
        const j = Math.floor(
          Math.random() * (i + 1)
        );

        [
          shuffledItems[i],
          shuffledItems[j],
        ] = [
          shuffledItems[j],
          shuffledItems[i],
        ];
      }

      const selectedItems =
        shuffledItems.slice(
          0,
          MAX_DISPLAY_ITEMS
        );

      if (cancelled) return;

      setRecommendedItems(selectedItems);

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: Date.now(),
          items: selectedItems.slice(
            0,
            MAX_CACHE_ITEMS
          ),
        })
      );

      await hydrateReviews(selectedItems);
    } catch (error) {
      console.error(
        "Error fetching recommended items:",
        error
      );

      if (!cancelled) {
        setRecommendedItems([]);
      }
    } finally {
      if (!cancelled) {
        setLoadingRecommendations(false);
      }
    }
  };

  setLoadingRecommendations(true);

  loadCachedItems();

  fetchRecommendedItems();

  return () => {
    cancelled = true;
  };
}, [
  countryCode,
  cacheKey,
  fetchReviews,
]);

  useEffect(() => {
  if (
    currentLang === "en" ||
    recommendedItems.length === 0
  ) {
    if (currentLang === "en") {
      setItemTranslations({});
    }

    return;
  }

  let cancelled = false;

  const fetchTranslations = async () => {
    const missingIds = [
      ...new Set(
        recommendedItems
          .map((product) => product?.itemId)
          .filter(Boolean)
      ),
    ].filter(
      (itemId) =>
        !itemTranslations?.[itemId]?.[
          currentLang
        ]
    );

    if (!missingIds.length) return;

    const results =
      await Promise.allSettled(
        missingIds.map(async (itemId) => {
          const response = await fetch(
            `${BASE_URL}/translate/product/translate/${encodeURIComponent(
              itemId
            )}/${encodeURIComponent(
              currentLang
            )}`
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
        if (
          result.status !== "fulfilled"
        ) {
          return;
        }

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
}, [
  recommendedItems,
  currentLang,
]);

const getProductName = (product) => {
  const originalName =
    product?.item?.name ||
    product?.details?.itemName ||
    t("recommended_item");

  if (currentLang === "en") {
    return originalName;
  }

  const translated =
    itemTranslations?.[product?.itemId]?.[
      currentLang
    ];

  return (
    translated?.name ||
    translated?.itemName ||
    originalName
  );
};

  useEffect(() => {
  const fetchRates = async () => {
    try {
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

    if (!rate) return null;

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

    return `${
      countryCurrencyConfig?.symbol || "$"
    }${converted.toFixed(2)}`;
  },
  [
    convertUsdToLocal,
    countryCurrencyConfig?.symbol,
    t,
  ]
);

 const handleItemClick = (id) => {
  if (!id) return;

  router.push(
    withCountry(`/product/${id}`)
  );
};

if (
  !loadingRecommendations &&
  recommendedItems.length === 0
) {
  return null;
}

  return (
    <div className="recommended-items-container">
      <h2 className="recommended-title"> {t("recommended_products")}</h2>

      <div className="recommended-grid">
        {loadingRecommendations && recommendedItems.length === 0 ? (
          [...Array(8)].map((_, index) => (
            <div className="recommended-item skeleton-card" key={index}>
              <div className="rec-img skeleton-image" />
              <div className="recommended-info">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))
        ) : (
          recommendedItems.map((item) => {
            const productName =
  getProductName(item);
            const productId = item?.itemId;
            const reviewData = reviews[productId];
            const averageRating = reviewData?.averageRating;
            const reviewCount = reviewData?.count || 0;

            return (
              <div className="recommended-item" key={item?.id || productId}>
                <div className="rec-img">
                  <img
                    src={item?.item?.images?.[0] || "/fallback.png"}
                   alt={productName}
                    className="recommended-image"
                    onClick={() => handleItemClick(item?.id)}
                  />
                </div>

                <div className="recommended-info">
                 <p
                    className="recommended-name"
                    onClick={() =>
                      handleItemClick(item?.id)
                    }
                  >
                    {productName}
                  </p>

                  <div className="item-sta">
                      {averageRating
                        ? renderStars(averageRating)
                        : t("no_rating")}
                    </div>

                    <div className="recommended-review-summary">
                      {averageRating
                        ? t(
                            "recommended_review_summary",
                            {
                              rating: averageRating,
                              count: reviewCount,
                            }
                          )
                        : t("no_reviews_yet")}
                    </div>

                  <div className="recommended-price">
                    {formatPrice(item?.item?.usdPrice)}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default WoRecommendedItem;