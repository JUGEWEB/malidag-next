"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useCheckoutStore } from "./checkoutStore";
import "./topTopic.css";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { getCountryConfig } from "./countryUtils";

const BASE_URL = "https://api.malidag.com";

const MAX_ITEMS = 100;
const CACHED_ITEMS_COUNT = 10;
const CACHE_KEY = "topTopic_first10";

function TopTopic({
  title = "",
  eyebrow = "",
  viewMoreLabel = "",
  sectionRoute = "/topitem",
  showHeader = true,
  showViewMore = true,
  country,
}) {
  const router = useRouter();
  const scrollRef = useRef(null);

  const { i18n } = useTranslation();

  const [topItems, setTopItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [rates, setRates] = useState(null);

  const { isMobile, isTablet, isSmallMobile, isVerySmall } =
    useScreenSize();

  const { setItemData } = useCheckoutStore();

  // =========================================================
  // COUNTRY
  // =========================================================

  const countryCode = country?.code?.toLowerCase() || "fr";

  const countryName =
    country?.name ||
    (countryCode === "gb"
      ? "United Kingdom"
      : countryCode === "br"
      ? "Brazil"
      : "France");

  const countryCurrencyConfig = useMemo(
    () => getCountryConfig(countryName),
    [countryName]
  );

  // =========================================================
  // LANGUAGE
  // =========================================================

const currentLanguage = ["en", "fr", "br"].includes(i18n.language)
  ? i18n.language
  : "en";

  // =========================================================
  // COUNTRY-AWARE ROUTING
  // =========================================================

  const withCountry = useCallback(
    (path) => {
      if (!path) {
        return `/${countryCode}`;
      }

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

  // =========================================================
  // RESPONSIVE WIDTH
  // =========================================================

  const itemWidth =
    isSmallMobile || isVerySmall
      ? "calc(100% / 2)"
      : isMobile || isTablet
      ? "calc(100% / 3)"
      : "calc(100% / 7)";

  // =========================================================
  // CURRENCY RATES
  // =========================================================

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
      }
    };

    fetchRates();
  }, []);

  const convertUsdToLocal = useCallback(
    (usdValue) => {
      const usdPrice = Number(usdValue || 0);

      const currency =
        countryCurrencyConfig?.currency || "USD";

      if (!Number.isFinite(usdPrice)) {
        return 0;
      }

      if (currency === "USD") {
        return usdPrice;
      }

      const rate = Number(rates?.[currency]);

      if (!rate || !Number.isFinite(rate)) {
        return null;
      }

      return usdPrice * rate;
    },
    [rates, countryCurrencyConfig?.currency]
  );

  const renderPrice = useCallback(
    (usdValue) => {
      const localizedValue =
        convertUsdToLocal(usdValue);

      if (localizedValue === null) {
        return "...";
      }

      const symbol =
        countryCurrencyConfig?.symbol || "$";

      return `${symbol}${localizedValue.toFixed(2)}`;
    },
    [
      convertUsdToLocal,
      countryCurrencyConfig?.symbol,
    ]
  );

  // =========================================================
  // REVIEWS
  // =========================================================

  const fetchReviewsForItems = useCallback(
    async (items) => {
      try {
        await Promise.all(
          items.map(async (item) => {
            const productId = item?.itemId;

            if (!productId) return;

            try {
              const response = await axios.get(
                `${BASE_URL}/get-reviews/${productId}`
              );

              if (response.data.success) {
                const reviewsArray =
                  response.data.reviews || [];

                const totalRating =
                  reviewsArray.reduce(
                    (acc, review) => {
                      const rating = parseFloat(
                        review.rating
                      );

                      return (
                        acc +
                        (isNaN(rating)
                          ? 4
                          : rating)
                      );
                    },
                    0
                  );

                const averageRating =
                  reviewsArray.length > 0
                    ? (
                        totalRating /
                        reviewsArray.length
                      ).toFixed(2)
                    : null;

                setReviews((prevReviews) => ({
                  ...prevReviews,

                  [productId]: {
                    averageRating,
                    reviewsArray,
                  },
                }));
              }
            } catch (error) {
              if (
                error.response &&
                error.response.status === 404
              ) {
                setReviews((prevReviews) => ({
                  ...prevReviews,

                  [productId]: {
                    averageRating: null,
                    reviewsArray: [],
                  },
                }));
              } else {
                console.error(
                  "Error fetching reviews:",
                  error
                );
              }
            }
          })
        );
      } catch (error) {
        console.error(
          "Error fetching review batch:",
          error
        );
      }
    },
    []
  );

  // =========================================================
  // PRODUCT TRANSLATIONS
  // =========================================================

  const fetchTranslationsForItems = useCallback(
  async (items) => {
    if (currentLanguage === "en") {
      setTranslations({});
      return;
    }

    const nextTranslations = {};

    await Promise.all(
      items.map(async (item) => {
        const productId = String(item?.itemId || "").trim();

        if (!productId) return;

        try {
          const response = await fetch(
            `${BASE_URL}/translate/product/translate/${productId}/${currentLanguage}`,
            {
              cache: "no-store",
            }
          );

          if (!response.ok) {
            console.warn(
              `Translation not found: ${productId} / ${currentLanguage}`
            );
            return;
          }

         const data = await response.json();

          if (data?.translation) {
            nextTranslations[productId] = data.translation;
          }
        } catch (error) {
          console.error(
            `Error fetching translation for ${productId}:`,
            error
          );
        }
      })
    );

    setTranslations(nextTranslations);
  },
  [currentLanguage]
);

  // =========================================================
  // LOAD TOP ITEMS
  // =========================================================

  useEffect(() => {
    const cacheKey = `${CACHE_KEY}_${countryCode}`;

    const loadCachedItems = () => {
      try {
        const cachedItems =
          localStorage.getItem(cacheKey);

        if (!cachedItems) return;

        const parsedItems =
          JSON.parse(cachedItems);

        if (
          Array.isArray(parsedItems) &&
          parsedItems.length > 0
        ) {
          setTopItems(parsedItems);
        }
      } catch (error) {
        console.error(
          "Error reading top-topic cache:",
          error
        );
      }
    };

    const fetchTopItems = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/top-items?limit=${MAX_ITEMS}&country=${encodeURIComponent(
            countryCode
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch top items: ${response.status}`
          );
        }

        const sortedItems =
          await response.json();

        const freshItems = Array.isArray(
          sortedItems
        )
          ? sortedItems
          : [];

        setTopItems(freshItems);

        localStorage.setItem(
          cacheKey,
          JSON.stringify(
            freshItems.slice(
              0,
              CACHED_ITEMS_COUNT
            )
          )
        );

        fetchReviewsForItems(freshItems);
      } catch (error) {
        console.error(
          "Error fetching top items:",
          error
        );
      }
    };

    loadCachedItems();
    fetchTopItems();
  }, [countryCode, fetchReviewsForItems]);

  // =========================================================
  // TRANSLATE WHEN ITEMS / LANGUAGE CHANGE
  // =========================================================

  useEffect(() => {
    if (!topItems.length) return;

    fetchTranslationsForItems(topItems);
  }, [
    topItems,
    currentLanguage,
    fetchTranslationsForItems,
  ]);

  // =========================================================
  // ITEM HELPERS
  // =========================================================

 const getProductName = (item) => {
  const productId = String(item?.itemId || "").trim();

  return (
    translations?.[productId]?.name ||
    item?.item?.name ||
    "Top item"
  );
};

  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleItemClick = (id) => {
    if (!id) return;

    router.push(
      withCountry(`/product/${id}`)
    );
  };

  const handleSectionNavigation = () => {
    if (!sectionRoute) return;

    router.push(
      withCountry(sectionRoute)
    );
  };

  // =========================================================
  // CAROUSEL
  // =========================================================

  const scrollCarousel = (direction) => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;

    const scrollAmount =
      container.clientWidth * 0.8;

    container.scrollBy({
      left:
        direction === "left"
          ? -scrollAmount
          : scrollAmount,

      behavior: "smooth",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="top-topic-caou">
      {showHeader && (
        <div className="top-topic-header">
          <div className="top-topic-heading-wrap">
            <span className="top-topic-eyebrow">
              {eyebrow}
            </span>

            <h2 className="top-topic-title">
              {title}
            </h2>
          </div>

          {showViewMore &&
            sectionRoute && (
              <button
                type="button"
                className="top-topic-view-more"
                onClick={
                  handleSectionNavigation
                }
                aria-label={`View more from ${title}`}
              >
                {viewMoreLabel}
              </button>
            )}
        </div>
      )}

      <div
        ref={scrollRef}
        className="carousel-sli"
      >
        {topItems.map(
          (item, index) => {
            const productId =
              item?.itemId;

            const ratingObj =
              reviews[productId];

            const averageRating =
              ratingObj
                ? ratingObj.averageRating
                : null;

            const usdPrice =
              Number(
                item?.item?.usdPrice ??
                  item?.details?.usdText ??
                  item?.item?.price ??
                  0
              ) || 0;

           const translationProductId = String(
            item?.itemId || ""
          ).trim();

          const navigationId = item?.id;

          const productName = getProductName(item);

            return (
              <div
                key={
                  item.id ||
                  productId ||
                  index
                }
                className="top-topic-card"
                style={{
                  width: itemWidth,
                  flex: "0 0 auto",
                }}
              >
                <div className="carousel-i">
                  <img
                    src={
                      item.item
                        ?.images?.[0] ||
                      "/fallback.png"
                    }
                    alt={productName}
                   onClick={() =>
                      handleItemClick(navigationId)
                    }
                    className="carousel-im"
                    style={{
                      cursor: "pointer",
                    }}
                  />
                </div>

                <div className="item-pr">
                  {renderPrice(usdPrice)}
                </div>

                <div
                  className="item-type-stars"
                  onClick={() => {
                    setItemData(item);

                    router.push(
                      withCountry(
                        `product/${navigationId}/review`
                      )
                    );
                  }}
                  title="View reviews of this item"
                >
                  {averageRating
                    ? "★".repeat(
                        Math.round(
                          averageRating
                        )
                      ) +
                      "☆".repeat(
                        5 -
                          Math.round(
                            averageRating
                          )
                      )
                    : "No rating"}
                </div>

                <div
                 onClick={() =>
  handleItemClick(navigationId)
}
                  className="item-n"
                >
                  {productName}
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="carousel-arr">
        <LeftOutlined
          onClick={() =>
            scrollCarousel("left")
          }
          className="arrow-but"
        />

        <RightOutlined
          onClick={() =>
            scrollCarousel("right")
          }
          className="arrow-but"
        />
      </div>
    </div>
  );
}

export default TopTopic;