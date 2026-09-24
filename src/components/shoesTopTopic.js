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
  useRouter,
  useParams,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

import "./shoesTopTopic.css";
import AnalyseReview from "./analyseReview";
import { AppContext } from "./appContext";
import { isSupportedLanguage } from "./countryUtils";

const BASE_URL = "https://api.malidag.com";

const ShoesTopTopic = () => {
  const params = useParams();
const searchParams = useSearchParams();

const { id } = params;
const router = useRouter();

const ratingFromURL = searchParams.get("rating");

  const { country } = useContext(AppContext);
  const { t } = useTranslation();

  const type = decodeURIComponent(String(params?.type || ""));
  const genre = decodeURIComponent(String(params?.genre || ""));

  const countryCode =
    country?.code?.toLowerCase() || "fr";

  const currentLang = isSupportedLanguage(i18n.language)
    ? i18n.language
    : "en";

  const [topShoesItems, setTopShoesItems] = useState([]);
  const [translations, setTranslations] = useState({});

  const [selectedItemId, setSelectedItemId] =
    useState(null);

  const [
    selectedItemProductId,
    setSelectedItemProductId,
  ] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  /*
   * Country-aware routes
   */
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

  /*
   * Taxonomy translation
   *
   * Raw taxonomy remains canonical for:
   * - URL params
   * - API comparisons
   *
   * Translation is only for display.
   */
  const translateTaxonomy = useCallback(
    (value) => {
      if (!value) return "";

      const raw = String(value).trim();

      const normalizedKey = raw
        .toLowerCase()
        .replace(/&/g, "_and_")
        .replace(/[-\s]+/g, "_")
        .replace(/_+/g, "_");

      if (i18n.exists(normalizedKey)) {
        return t(normalizedKey);
      }

      if (i18n.exists(raw)) {
        return t(raw);
      }

      return raw.replace(/-/g, " ");
    },
    [t]
  );

  /*
   * Product translation
   */
  useEffect(() => {
    let cancelled = false;

    const fetchTranslations = async () => {
      if (
        currentLang === "en" ||
        topShoesItems.length === 0
      ) {
        return;
      }

      const uniqueItemIds = [
        ...new Set(
          topShoesItems
            .map((product) => product?.itemId)
            .filter(Boolean)
        ),
      ];

      const missingItemIds = uniqueItemIds.filter(
        (itemId) =>
          !translations?.[itemId]?.[currentLang]
      );

      if (missingItemIds.length === 0) {
        return;
      }

      const results = await Promise.allSettled(
        missingItemIds.map(async (itemId) => {
          const response = await axios.get(
            `${BASE_URL}/translate/product/translate/${encodeURIComponent(
              itemId
            )}/${encodeURIComponent(currentLang)}`
          );

          return {
            itemId,
            translation:
              response.data?.translation || {},
          };
        })
      );

      if (cancelled) return;

      setTranslations((prev) => {
        const next = { ...prev };

        results.forEach((result) => {
          if (result.status !== "fulfilled") {
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

    fetchTranslations().catch((error) => {
      console.error(
        "Error fetching product translations:",
        error
      );
    });

    return () => {
      cancelled = true;
    };
  }, [
    topShoesItems,
    currentLang,
    translations,
  ]);

  /*
   * Country-filtered products
   */
  useEffect(() => {
    let cancelled = false;

    const fetchTopShoesItems = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `${BASE_URL}/items?country=${encodeURIComponent(
            countryCode
          )}`
        );

        if (cancelled) return;

        const data = Array.isArray(
          response.data?.items
        )
          ? response.data.items
          : Array.isArray(response.data)
          ? response.data
          : [];

        const normalizedType = type
          .trim()
          .toLowerCase();

        const normalizedGenre = genre
          .trim()
          .toLowerCase();

        const filteredItems = data.filter(
          (product) => {
            const category = String(
              product?.category || ""
            )
              .trim()
              .toLowerCase();

            const productType = String(
              product?.item?.type || ""
            )
              .trim()
              .toLowerCase();

            const productGenre = String(
              product?.item?.genre || ""
            )
              .trim()
              .toLowerCase();

            const sold = Number(
              product?.item?.sold || 0
            );

            return (
              category === "shoes" &&
              productType === normalizedType &&
              productGenre === normalizedGenre &&
              sold >= 100
            );
          }
        );

        /*
         * This is a "Top sellers" page, so let's actually
         * rank products by units sold.
         */
        const rankedItems = [...filteredItems].sort(
          (a, b) =>
            Number(b?.item?.sold || 0) -
            Number(a?.item?.sold || 0)
        );

        setTopShoesItems(rankedItems);
      } catch (error) {
        console.error(
          "Error fetching top shoes items:",
          error
        );

        if (!cancelled) {
          setTopShoesItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!type || !genre) {
      setTopShoesItems([]);
      setLoading(false);
      return;
    }

    fetchTopShoesItems();

    return () => {
      cancelled = true;
    };
  }, [type, genre, countryCode]);

  /*
   * Display helpers
   */
  const displayType = useMemo(
    () => translateTaxonomy(type),
    [type, translateTaxonomy]
  );

  const displayGenre = useMemo(
    () => translateTaxonomy(genre),
    [genre, translateTaxonomy]
  );

  const getProductName = useCallback(
    (product) => {
      const itemId = product?.itemId;

      const originalName =
        product?.item?.name ||
        t("fashion_item");

      if (currentLang === "en") {
        return originalName;
      }

      return (
        translations?.[itemId]?.[currentLang]
          ?.name ||
        translations?.[itemId]?.[currentLang]
          ?.itemName ||
        originalName
      );
    },
    [translations, currentLang, t]
  );

  /*
   * Modal
   */
  const openModal = (product) => {
    setSelectedItemId(product?.id || null);
    setSelectedItemProductId(
      product?.itemId || null
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItemId(null);
    setSelectedItemProductId(null);
    setModalOpen(false);
  };

 const handleRatingClick = (rating) => {
  if (!selectedItemId) return;

  const productPath =
    rating !== null && rating !== undefined
      ? `/product/${selectedItemId}?rating=${encodeURIComponent(rating)}`
      : `/product/${selectedItemId}`;

  router.push(withCountry(productPath));
};

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="topic-page">
        <div className="topic-shell">
          <div className="topic-loading">
            <div className="topic-loading-title" />
            <div className="topic-loading-subtitle" />

            <div className="topic-loading-grid">
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="topic-skeleton-card"
                  >
                    <div className="topic-skeleton-image" />
                    <div className="topic-skeleton-line topic-skeleton-line-lg" />
                    <div className="topic-skeleton-line" />
                    <div className="topic-skeleton-line topic-skeleton-line-sm" />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topic-page">
      <div className="topic-shell">
        {/* HERO */}
        <section className="topic-hero">
          <div className="topic-hero-copy">
            <span className="topic-kicker">
              {t("shoes_topic_top_performing")}
            </span>

            <h1 className="topic-title">
              {displayGenre} {displayType}
            </h1>

            <p className="topic-subtitle">
              {t("shoes_topic_description")}
            </p>

            <div className="topic-hero-stats">
              <div className="topic-stat">
                <strong>
                  {topShoesItems.length}
                </strong>

                <span>
                  {t("shoes_topic_top_items")}
                </span>
              </div>

              <div className="topic-stat">
                <strong>
                  {displayGenre}
                </strong>

                <span>
                  {t("shoes_topic_audience")}
                </span>
              </div>

              <div className="topic-stat">
                <strong>
                  {displayType}
                </strong>

                <span>
                  {t("shoes_topic_category")}
                </span>
              </div>
            </div>
          </div>

          <div className="topic-hero-side">
            <div className="topic-hero-panel">
              <span className="topic-panel-kicker">
                {t("shoes_topic_selection_rule")}
              </span>

              <strong>
                {t("shoes_topic_sold_100")}
              </strong>

              <p>
                {t("shoes_topic_selection_description")}
              </p>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section className="topic-results-section">
          <div className="topic-section-head">
            <div>
              <span className="topic-section-kicker">
                {t("shoes_topic_ranked_products")}
              </span>

              <h2>
                {t("shoes_topic_top_sellers")}
              </h2>
            </div>

            <span className="topic-results-meta">
              {t("shoes_topic_results_count", {
                count: topShoesItems.length,
              })}
            </span>
          </div>

          {topShoesItems.length === 0 ? (
            <div className="topic-empty">
              <h3>
                {t("shoes_topic_empty_title")}
              </h3>

              <p>
                {t("shoes_topic_empty_description", {
                  genre: displayGenre,
                  type: displayType,
                })}
              </p>
            </div>
          ) : (
            <div className="topic-grid">
              {topShoesItems.map(
                (product, index) => {
                  const {
                    itemId,
                    id,
                    item = {},
                  } = product;

                  const productName =
                    getProductName(product);

                  return (
                    <article
                      key={id || itemId}
                      className="topic-card"
                    >
                      <div className="topic-card-media">
                        <img
                          src={
                            item?.images?.[0] ||
                            "/placeholder.jpg"
                          }
                          alt={productName}
                          className="topic-card-image"
                          loading="lazy"
                          onClick={() =>
                            router.push(
                              withCountry(
                                `/product/${id}`
                              )
                            )
                          }
                        />

                        <div className="topic-rank-badge">
                          #{index + 1}
                        </div>

                        <div className="topic-sales-badge">
                          {t(
                            "shoes_topic_sold_count",
                            {
                              count: Number(
                                item?.sold || 0
                              ),
                            }
                          )}
                        </div>
                      </div>

                      <div className="topic-card-body">
                        <div
                          className="topic-card-main"
                          onClick={() =>
                            router.push(
                              withCountry(
                                `/product/${id}`
                              )
                            )
                          }
                        >
                          <h3 className="topic-card-title">
                            {productName}
                          </h3>

                          <div className="topic-card-meta">
                            <span>
                              {displayGenre}
                            </span>

                            <span>
                              {displayType}
                            </span>
                          </div>
                        </div>

                        <div className="topic-card-actions">
                          <button
                            type="button"
                            className="topic-secondary-btn"
                            onClick={() =>
                              openModal(product)
                            }
                          >
                            {t(
                              "shoes_topic_reviews_analysis"
                            )}
                          </button>

                          <button
                            type="button"
                            className="topic-primary-btn"
                            onClick={() =>
                              router.push(
                                withCountry(
                                  `/product/${id}`
                                )
                              )
                            }
                          >
                            {t(
                              "fashionkick_view_product"
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* REVIEW MODAL */}
        {modalOpen &&
          selectedItemProductId && (
            <div
              className="topic-modal-backdrop"
              onClick={closeModal}
            >
              <div
                className="topic-modal"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <button
                  type="button"
                  className="topic-modal-close"
                  onClick={closeModal}
                  aria-label={t("close")}
                >
                  ×
                </button>

                <div className="topic-modal-head">
                  <span className="topic-section-kicker">
                    {t(
                      "shoes_topic_review_insight"
                    )}
                  </span>

                  <h3>
                    {t(
                      "shoes_topic_product_analysis"
                    )}
                  </h3>
                </div>

                <AnalyseReview
                  productId={
                    selectedItemProductId
                  }
                  id={selectedItemId}
                  onRatingClick={
                    handleRatingClick
                  }
                />
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ShoesTopTopic;