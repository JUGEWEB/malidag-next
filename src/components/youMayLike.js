"use client";

import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";

import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";
import "./youMayLike.css";
import { useTranslation } from "react-i18next";
import { AppContext } from "./appContext";
import { getCountryConfig } from "./countryUtils";

const BASE_URL = "https://api.malidag.com";

function YouMayLike() {
  const router = useRouter();
  const appContext = useContext(AppContext);

  const user = appContext?.user || null;
  const country = appContext?.country;

  const { t, i18n } = useTranslation();

  const {
    isMobile,
    isDesktop,
    isSmallMobile,
    isTablet,
    isVerySmall,
    isVeryVerySmall,
  } = useScreenSize();

  const [suggestedItems, setSuggestedItems] = useState([]);
  const [userSearchHistory, setUserSearchHistory] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [rates, setRates] = useState({});

  const countryCode = country.code.toLowerCase();
  const countryName = country.name;

  const currentLanguage = ["en", "fr", "br"].includes(i18n.language)
    ? i18n.language
    : "en";

  const countryCurrencyConfig = useMemo(
    () => getCountryConfig(countryName),
    [countryName]
  );

  const withCountry = useCallback(
    (path) =>
      `/${countryCode}${path.startsWith("/") ? path : `/${path}`}`,
    [countryCode]
  );

  const itemsPerSlide =
    isMobile || isSmallMobile || isVerySmall ? 2 : 6;

  /*
   * Search history
   */
  useEffect(() => {
    const fetchUserSearchHistory = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/search-items?userId=${encodeURIComponent(user.uid)}`
        );

        const data = await response.json();

        setUserSearchHistory(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.userSearches)
            ? data.userSearches
            : []
        );
      } catch (error) {
        console.error("Error fetching user search history:", error);
      }
    };

    if (user?.uid) {
      fetchUserSearchHistory();
    }
  }, [user?.uid]);

  /*
   * Currency rates
   */
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(`${BASE_URL}/prices/rates`);

        if (!response.ok) {
          throw new Error(`Rates request failed: ${response.status}`);
        }

        const data = await response.json();

        setRates(data?.rates || data || {});
      } catch (error) {
        console.error("Error fetching currency rates:", error);
      }
    };

    fetchRates();
  }, []);

  /*
   * USD -> local currency
   */
  const convertUsdToLocal = useCallback(
    (usdValue) => {
      const usdPrice = Number(usdValue || 0);

      if (!Number.isFinite(usdPrice)) {
        return 0;
      }

      const currency = countryCurrencyConfig?.currency || "USD";

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
      const localizedPrice = convertUsdToLocal(usdValue);

      if (localizedPrice === null) {
        return "...";
      }

      const symbol = countryCurrencyConfig?.symbol || "$";

      return `${symbol}${localizedPrice.toFixed(2)}`;
    },
    [convertUsdToLocal, countryCurrencyConfig?.symbol]
  );

  /*
   * Reviews
   */
  const fetchReviews = useCallback(
    async (productId) => {
      if (!productId || reviews[productId]) return;

      try {
        const response = await fetch(
          `${BASE_URL}/get-reviews/${productId}`
        );

        const data = await response.json();

        if (!data.success) return;

        const reviewsArray = data.reviews || [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review.rating);
          return acc + (Number.isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(1)
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating,
            reviewsArray,
          },
        }));
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    },
    [reviews]
  );

  /*
   * Fetch items for selected country,
   * then match against browsing/search history.
   */
  useEffect(() => {
    if (!userSearchHistory.length || !countryCode) {
      setSuggestedItems([]);
      return;
    }

    let cancelled = false;

    const fetchSuggestedItems = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/items?country=${encodeURIComponent(countryCode)}`
        );

        const data = await response.json();

        const itemsArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        const searchedTerms = userSearchHistory
          .map((searchItem) =>
            String(searchItem?.search || "")
              .toLowerCase()
              .replace(/\+/g, " ")
              .trim()
          )
          .filter(Boolean);

        const matchedItems = itemsArray.filter((item) =>
          searchedTerms.some((term) => {
            return (
              item?.item?.name?.toLowerCase().includes(term) ||
              item?.item?.type?.toLowerCase().includes(term) ||
              item?.category?.toLowerCase().includes(term) ||
              item?.item?.theme?.toLowerCase().includes(term) ||
              item?.item?.brand?.toLowerCase().includes(term)
            );
          })
        );

        if (cancelled) return;

        setSuggestedItems(matchedItems);
        setCurrentSlide(0);

        localStorage.setItem(
          `suggestedItemsCount_${countryCode}`,
          String(matchedItems.length)
        );

        matchedItems.forEach((item) => {
          if (item?.itemId) {
            fetchReviews(item.itemId);
          }
        });
      } catch (error) {
        console.error("Error fetching suggested items:", error);

        if (!cancelled) {
          setSuggestedItems([]);
        }
      }
    };

    fetchSuggestedItems();

    return () => {
      cancelled = true;
    };
  }, [
    userSearchHistory,
    countryCode,
    fetchReviews,
  ]);

  /*
   * Translate product names
   */
  useEffect(() => {
    if (currentLanguage === "en") {
      setTranslations({});
      return;
    }

    if (!suggestedItems.length) return;

    let cancelled = false;

    const fetchTranslations = async () => {
      const missingItems = suggestedItems.filter((item) => {
        const productId = String(item?.itemId || "").trim();

        return productId && !translations[productId];
      });

      if (!missingItems.length) return;

      const results = await Promise.all(
        missingItems.map(async (item) => {
          const productId = String(item.itemId).trim();

          try {
            const response = await fetch(
              `${BASE_URL}/translate/product/translate/${productId}/${currentLanguage}`
            );

            if (!response.ok) {
              return null;
            }

            const data = await response.json();

            return {
              productId,
              translation: data?.translation || null,
            };
          } catch (error) {
            console.error(
              `Translation error for ${productId}:`,
              error
            );

            return null;
          }
        })
      );

      if (cancelled) return;

      setTranslations((prev) => {
        const next = { ...prev };

        results.forEach((result) => {
          if (result?.productId && result?.translation) {
            next[result.productId] = result.translation;
          }
        });

        return next;
      });
    };

    fetchTranslations();

    return () => {
      cancelled = true;
    };
  }, [
    suggestedItems,
    currentLanguage,
  ]);

  const getProductName = useCallback(
    (item) => {
      const productId = String(item?.itemId || "").trim();

      return (
        translations?.[productId]?.name ||
        item?.item?.name ||
        t("recommended_item")
      );
    },
    [translations, t]
  );

  const totalSlides = Math.ceil(
    suggestedItems.length / itemsPerSlide
  );

  const currentItems =
    isMobile || isSmallMobile || isVerySmall
      ? suggestedItems
      : suggestedItems.slice(
          currentSlide * itemsPerSlide,
          currentSlide * itemsPerSlide + itemsPerSlide
        );

  const handleNextSlide = () => {
    if (!totalSlides) return;

    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    if (!totalSlides) return;

    setCurrentSlide((prev) =>
      prev === 0 ? totalSlides - 1 : prev - 1
    );
  };

  const handleItemClick = (id) => {
    if (!id) return;

    router.push(withCountry(`/product/${id}`));
  };

  if (!user || !userSearchHistory.length) {
    return null;
  }

  return (
    <div className="you-may-like-carous">
      {suggestedItems.length > 0 ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              fontWeight: "bold",
              fontSize: "20px",
              width: "100%",
            }}
          >
            <span>
              {t("based_on_browsing_history")}
            </span>

            <button
              style={{
                backgroundColor: "green",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "5px",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onClick={() =>
                router.push(withCountry("/browsing"))
              }
            >
              {t("view_more")}
            </button>
          </div>

          <div
            className="carousel-slid"
            style={{
              overflowX:
                isMobile ||
                isSmallMobile ||
                isTablet ||
                isVerySmall ||
                isVeryVerySmall
                  ? "auto"
                  : "hidden",
            }}
          >
            {currentItems.map((item) => {
              const productName = getProductName(item);

              return (
                <div
                  className="carousel-it"
                  key={item.id}
                >
                  <img
                    src={
                      typeof item?.item?.images?.[0] === "string"
                        ? item.item.images[0]
                        : item?.item?.images?.[0]?.url ||
                          "/fallback.png"
                    }
                    alt={productName}
                    className="carousel-ima"
                    style={{ cursor: "pointer" }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/fallback.png";
                    }}
                    onClick={() =>
                      handleItemClick(item.id)
                    }
                  />

                  <div className="reconded-price">
                    {renderPrice(item?.item?.usdPrice)}
                  </div>

                  {reviews[item.itemId]?.averageRating && (
                    <div
                      className="item-s"
                      onClick={(e) => {
                        e.stopPropagation();

                        router.push(
                          withCountry(
                            `/product/${item.id}/review`
                          )
                        );
                      }}
                    >
                      <span>
                        {reviews[item.itemId].averageRating}/5
                      </span>{" "}

                      <span>
                        {"★".repeat(
                          Math.round(
                            Number(
                              reviews[item.itemId]
                                .averageRating
                            )
                          )
                        )}

                        {"☆".repeat(
                          5 -
                            Math.round(
                              Number(
                                reviews[item.itemId]
                                  .averageRating
                              )
                            )
                        )}
                      </span>{" "}

                      <span>
                        (
                        {reviews[item.itemId]
                          ?.reviewsArray?.length || 0}{" "}
                        {t("reviews")})
                      </span>
                    </div>
                  )}

                  <p
                    className="item-na"
                    onClick={() =>
                      handleItemClick(item.id)
                    }
                  >
                    {productName}
                  </p>
                </div>
              );
            })}
          </div>

          {isDesktop &&
            suggestedItems.length > itemsPerSlide && (
              <div className="carousel-arr">
                <LeftOutlined
                  onClick={handlePrevSlide}
                  className="arrow-butt"
                />

                <RightOutlined
                  onClick={handleNextSlide}
                  className="arrow-butt"
                />
              </div>
            )}
        </>
      ) : (
        <p style={{ padding: "1rem", color: "#777" }}>
          {t("no_items_browsing_history")}
        </p>
      )}
    </div>
  );
}

export default YouMayLike;