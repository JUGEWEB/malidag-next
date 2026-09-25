"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useTranslation } from "react-i18next";

import "./WomenTopTopic.css";
import AnalyseReview from "./analyseReview";
import { AppContext } from "./appContext";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

const BASE_URL = "https://api.malidag.com";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

const normalizeTranslationKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const WomenTopTopic = () => {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { country } = useContext(AppContext);

  const type = params?.type || "";

  const countryCode =
    country?.code?.toLowerCase() || "fr";

  const currentLang =
    isSupportedLanguage(i18n.language)
      ? i18n.language
      : "en";

  const countryCurrencyConfig =
    useMemo(
      () =>
        getCountryConfig(
          country?.name || ""
        ),
      [country?.name]
    );

  const [topItems, setTopItems] =
    useState([]);

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [reviews, setReviews] =
    useState({});

  const [rates, setRates] =
    useState({});

  const [
    itemTranslations,
    setItemTranslations,
  ] = useState({});

  const [loading, setLoading] =
    useState(true);

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
        cleanPath.startsWith("/")
          ? cleanPath
          : `/${cleanPath}`
      }`;
    },
    [countryCode]
  );

  const translateTaxonomy =
    useCallback(
      (value) => {
        if (!value) return "";

        const key =
          normalizeTranslationKey(value);

        return t(key, {
          defaultValue: value,
        });
      },
      [t]
    );

  const readableType = useMemo(
    () =>
      translateTaxonomy(
        String(type)
          .replace(/-/g, " ")
          .replace(/_/g, " ")
      ),
    [type, translateTaxonomy]
  );

  // -------------------------
  // PRICE RATES
  // -------------------------

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

        const data =
          await response.json();

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

  const convertUsdToLocal =
    useCallback(
      (usdValue) => {
        const usdPrice =
          Number(usdValue || 0);

        const currency =
          countryCurrencyConfig
            ?.currency || "USD";

        if (!usdPrice) return 0;

        if (currency === "USD") {
          return usdPrice;
        }

        const rate =
          Number(rates?.[currency]);

        if (!rate) return null;

        return usdPrice * rate;
      },
      [
        rates,
        countryCurrencyConfig?.currency,
      ]
    );

  const formatPrice =
    useCallback(
      (usdValue) => {
        const converted =
          convertUsdToLocal(usdValue);

        if (converted === null) {
          return t(
            "price_unavailable"
          );
        }

        const currency =
          countryCurrencyConfig
            ?.currency || "USD";

        const locale =
          currentLang === "fr"
            ? "fr-FR"
            : currentLang === "br"
              ? "pt-BR"
              : "en-US";

        return new Intl.NumberFormat(
          locale,
          {
            style: "currency",
            currency,
          }
        ).format(converted);
      },
      [
        convertUsdToLocal,
        countryCurrencyConfig?.currency,
        currentLang,
        t,
      ]
    );

  // -------------------------
  // REVIEWS
  // -------------------------

  const fetchReviews =
    useCallback(async (productId) => {
      if (!productId) return;

      try {
        const response =
          await axios.get(
            `${BASE_URL}/get-reviews/${productId}`
          );

        const reviewsArray =
          response.data?.success &&
          Array.isArray(
            response.data.reviews
          )
            ? response.data.reviews
            : [];

        const validRatings =
          reviewsArray
            .map((review) =>
              Number(review?.rating)
            )
            .filter(
              (rating) =>
                Number.isFinite(
                  rating
                ) &&
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
                ) /
                validRatings.length
              ).toFixed(1)
            : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating,
            count:
              validRatings.length,
          },
        }));
      } catch (error) {
        if (
          error?.response?.status !==
          404
        ) {
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
    }, []);

  // -------------------------
  // WOMEN TOP ITEMS
  // -------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchTopItems =
      async () => {
        try {
          setLoading(true);

          const response =
            await axios.get(
              `${BASE_URL}/items?country=${encodeURIComponent(
                countryCode
              )}`
            );

          const raw =
            response?.data;

          const data =
            Array.isArray(raw)
              ? raw
              : Array.isArray(
                    raw?.items
                  )
                ? raw.items
                : [];

          const normalizedType =
            normalize(type);

          const filteredItems =
            data
              .filter((entry) => {
                const item =
                  entry?.item || {};

                const genre =
                  normalize(
                    item?.genre
                  );

                const itemType =
                  normalize(
                    item?.type
                  );

                const sold =
                  Number(
                    item?.sold || 0
                  );

                const isWomen =
                  genre ===
                    "women" ||
                  genre ===
                    "woman" ||
                  genre ===
                    "female";

                return (
                  isWomen &&
                  itemType ===
                    normalizedType &&
                  sold >= 100
                );
              })
              .sort(
                (a, b) =>
                  Number(
                    b?.item
                      ?.sold || 0
                  ) -
                  Number(
                    a?.item
                      ?.sold || 0
                  )
              );

          if (cancelled) {
            return;
          }

          setTopItems(
            filteredItems
          );

          await Promise.all(
            filteredItems.map(
              (entry) =>
                entry?.itemId
                  ? fetchReviews(
                      entry.itemId
                    )
                  : Promise.resolve()
            )
          );
        } catch (error) {
          console.error(
            "Error fetching top women items:",
            error
          );

          if (!cancelled) {
            setTopItems([]);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    if (type) {
      fetchTopItems();
    } else {
      setTopItems([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [
    type,
    countryCode,
    fetchReviews,
  ]);

  // -------------------------
  // PRODUCT TRANSLATIONS
  // -------------------------

  useEffect(() => {
    if (
      currentLang === "en" ||
      topItems.length === 0
    ) {
      if (currentLang === "en") {
        setItemTranslations({});
      }

      return;
    }

    let cancelled = false;

    const fetchTranslations =
      async () => {
        const missingIds = [
          ...new Set(
            topItems
              .map(
                (entry) =>
                  entry?.itemId
              )
              .filter(Boolean)
          ),
        ].filter(
          (itemId) =>
            !itemTranslations?.[
              itemId
            ]?.[currentLang]
        );

        if (!missingIds.length) {
          return;
        }

        const results =
          await Promise.allSettled(
            missingIds.map(
              async (itemId) => {
                const response =
                  await fetch(
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

                const data =
                  await response.json();

                return {
                  itemId,
                  translation:
                    data?.translation ||
                    data?.translatedProduct ||
                    data,
                };
              }
            )
          );

        if (cancelled) return;

        setItemTranslations(
          (prev) => {
            const next = {
              ...prev,
            };

            results.forEach(
              (result) => {
                if (
                  result.status !==
                  "fulfilled"
                ) {
                  return;
                }

                const {
                  itemId,
                  translation,
                } = result.value;

                next[itemId] = {
                  ...(next[itemId] ||
                    {}),
                  [currentLang]:
                    translation,
                };
              }
            );

            return next;
          }
        );
      };

    fetchTranslations();

    return () => {
      cancelled = true;
    };
  }, [
    topItems,
    currentLang,
    itemTranslations,
  ]);

  const getProductName =
    useCallback(
      (entry) => {
        const originalName =
          entry?.item?.name ||
          t("fashion_item");

        if (
          currentLang === "en"
        ) {
          return originalName;
        }

        const translated =
          itemTranslations?.[
            entry?.itemId
          ]?.[currentLang];

        return (
          translated?.name ||
          translated?.itemName ||
          originalName
        );
      },
      [
        currentLang,
        itemTranslations,
        t,
      ]
    );

  // -------------------------
  // MODAL
  // -------------------------

  const closeModal =
    useCallback(() => {
      setSelectedItem(null);
      setModalOpen(false);
    }, []);

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        closeModal();
      }
    };

    if (modalOpen) {
      document.addEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        "hidden";
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        "";
    };
  }, [
    modalOpen,
    closeModal,
  ]);

  const openModal = (entry) => {
    setSelectedItem(entry);
    setModalOpen(true);
  };

  const handleRatingClick = () => {
    if (!selectedItem?.id) {
      return;
    }

    router.push(
      withCountry(
        `/product/${selectedItem.id}`
      )
    );
  };

  // -------------------------
  // LOADING
  // -------------------------

  if (loading) {
    return (
      <div className="women-top-container">
        <div className="women-top-header">
          <span className="women-top-eyebrow">
            {t(
              "women_top_topic_badge"
            )}
          </span>

          <h1>
            {t(
              "women_top_items_title",
              {
                type:
                  readableType,
              }
            )}
          </h1>

          <p>
            {t(
              "women_top_loading"
            )}
          </p>
        </div>

        <div className="women-top-grid">
          {[...Array(8)].map(
            (_, index) => (
              <div
                key={index}
                className="women-top-card women-top-skeleton"
              >
                <div className="women-top-skeleton-image" />

                <div className="women-top-card-body">
                  <div className="women-top-skeleton-line" />
                  <div className="women-top-skeleton-line short" />
                  <div className="women-top-skeleton-line tiny" />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="women-top-container">
      <div className="women-top-header">
        <span className="women-top-eyebrow">
          {t(
            "women_top_topic_badge"
          )}
        </span>

        <h1>
          {t(
            "women_top_items_title",
            {
              type:
                readableType,
            }
          )}
        </h1>

        <p>
          {t(
            "women_top_items_description"
          )}
        </p>
      </div>

      {topItems.length === 0 ? (
        <div className="women-top-empty">
          <div className="women-top-empty-icon">
            ♡
          </div>

          <h2>
            {t(
              "women_top_empty_title"
            )}
          </h2>

          <p>
            {t(
              "women_top_empty_description",
              {
                type:
                  readableType,
              }
            )}
          </p>
        </div>
      ) : (
        <div className="women-top-grid">
          {topItems.map(
            (entry, index) => {
              const {
                id,
                itemId,
                item,
              } = entry;

              const productName =
                getProductName(
                  entry
                );

              const reviewData =
                reviews[itemId];

              const averageRating =
                reviewData
                  ?.averageRating;

              const reviewCount =
                reviewData?.count ||
                0;

              const soldCount =
                Number(
                  item?.sold || 0
                );

              const imageSrc =
                item?.images?.[0] ||
                entry?.image_url ||
                "/fallback.png";

              return (
                <article
                  key={
                    id ||
                    itemId
                  }
                  className="women-top-card"
                >
                  <button
                    type="button"
                    className="women-top-image-button"
                    onClick={() =>
                      router.push(
                        withCountry(
                          `/product/${id}`
                        )
                      )
                    }
                    aria-label={
                      productName
                    }
                  >
                    <img
                      src={
                        imageSrc
                      }
                      alt={
                        productName
                      }
                      className="women-top-image"
                      onError={(
                        event
                      ) => {
                        event.currentTarget.onerror =
                          null;

                        event.currentTarget.src =
                          "/fallback.png";
                      }}
                    />

                    <span className="women-top-rank">
                      #{index + 1}
                    </span>
                  </button>

                  <div className="women-top-card-body">
                    <button
                      type="button"
                      className="women-top-name"
                      onClick={() =>
                        router.push(
                          withCountry(
                            `/product/${id}`
                          )
                        )
                      }
                      title={
                        productName
                      }
                    >
                      {productName}
                    </button>

                    <button
                      type="button"
                      className="women-top-rating"
                      onClick={() =>
                        openModal(
                          entry
                        )
                      }
                      title={t(
                        "view_reviews"
                      )}
                    >
                      <span className="women-top-stars">
                        {averageRating
                          ? "★".repeat(
                              Math.round(
                                Number(
                                  averageRating
                                )
                              )
                            ) +
                            "☆".repeat(
                              5 -
                                Math.round(
                                  Number(
                                    averageRating
                                  )
                                )
                            )
                          : "☆☆☆☆☆"}
                      </span>

                      <span className="women-top-review-text">
                        {averageRating
                          ? t(
                              "recommended_review_summary",
                              {
                                rating:
                                  averageRating,
                                count:
                                  reviewCount,
                              }
                            )
                          : t(
                              "no_reviews_yet"
                            )}
                      </span>
                    </button>

                    <div className="women-top-card-footer">
                      <div className="women-top-sold">
                        {t(
                          "women_top_sold",
                          {
                            count:
                              soldCount,
                          }
                        )}
                      </div>

                      {Number(
                        item?.usdPrice
                      ) > 0 && (
                        <div className="women-top-price">
                          {formatPrice(
                            item.usdPrice
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {modalOpen &&
        selectedItem?.itemId && (
          <div
            className="review-modal-overlay"
            onClick={
              closeModal
            }
          >
            <div
              className="review-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="women-review-modal-title"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="review-modal-close"
                onClick={
                  closeModal
                }
                aria-label={t(
                  "close_modal"
                )}
              >
                ×
              </button>

              <div className="review-modal-header">
                <span className="review-modal-eyebrow">
                  {t(
                    "customer_reviews"
                  )}
                </span>

                <h3
                  id="women-review-modal-title"
                  className="review-modal-title"
                >
                  {getProductName(
                    selectedItem
                  )}
                </h3>

                <p className="review-modal-subtitle">
                  {t(
                    "review_modal_description"
                  )}
                </p>
              </div>

              <div className="review-modal-body">
                <AnalyseReview
                  productId={
                    selectedItem.itemId
                  }
                  id={
                    selectedItem.id
                  }
                  onRatingClick={
                    handleRatingClick
                  }
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default WomenTopTopic;