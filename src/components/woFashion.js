"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import "./woFashion.css";
import WoRecommendedItem from "./woRecommendeditem";
import { useRouter } from "next/navigation";
import Slider from "react-slick";

import { useTranslation } from "react-i18next";
import { AppContext } from "./appContext";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

const BASE_URLs = "https://api.malidag.com";
const BASE_URL = "https://api.malidag.com";

function WoFashion({countryCode: countryCodeProp, }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const { country } =
    useContext(AppContext);

  const countryCode =
    country?.code?.toLowerCase() ||
    countryCodeProp?.toLowerCase() ||
    "fr";

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
  const [types, setTypes] = useState({});
  const [mtypes, setMTypes] = useState({});
  const [loadingMTypes, setLoadingMTypes] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const withCountry = (path) => {
  const code = countryCode || "fr";
  if (!path) return `/${code}`;
  return `/${code}${path.startsWith("/") ? path : `/${path}`}`;
};

const [
  itemTranslations,
  setItemTranslations,
] = useState({});

const [rates, setRates] =
  useState({});

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
        return t("price_unavailable");
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

  useEffect(() => {
    const fetchWomenTypes = async () => {
      try {
        const response = await axios.get(`${BASE_URLs}/categories/WomenFashion`);
        const data = response.data;
        setMTypes(data);
        setLoadingMTypes(false);
      } catch (error) {
        console.error("Error fetching WomenFashion category items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWomenTypes();
  }, []);

  useEffect(() => {
    const fetchWomenItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items?country=${encodeURIComponent(countryCode)}`);
        const raw = response.data;
        const data = Array.isArray(raw) ? raw : raw?.items || [];

        const filteredData = data.filter(
          (item) =>
            (item?.item?.genre || "").toLowerCase().includes("women") &&
            (item?.category || "").toLowerCase() !== "beauty"
        );

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item?.item?.type || "Other";
          if (!acc[type]) acc[type] = [];
          acc[type].push(item);
          return acc;
        }, {});

        setTypes(groupedData);
        setLoadingTypes(false);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWomenItems();
  }, [countryCode]);

  const handleItemClick = (id) => {
    if (id) {
      router.push(withCountry(`/product/${id}`));
    }
  };

  const handleCategoryClick = (category) => {
    if (category) {
      let formattedCategory = category.toLowerCase().trim();

      if (formattedCategory.includes("shirt and")) {
        formattedCategory = "shirt";
      }

      router.push(withCountry(`/item-of-women/${encodeURIComponent(formattedCategory)}`));
    }
  };

 const allItems = useMemo(
  () =>
    Object.values(types || {}).flat(),
  [types]
);

useEffect(() => {
  if (
    currentLang === "en" ||
    !allItems.length
  ) {
    return;
  }

  let cancelled = false;

  const translateProducts =
    async () => {
      const missingItems =
        allItems.filter(
          (entry) => {
            const itemId =
              entry?.itemId;

            return (
              itemId &&
              !itemTranslations[
                itemId
              ]?.[currentLang]
            );
          }
        );

      if (!missingItems.length) {
        return;
      }

      const results =
        await Promise.allSettled(
          missingItems.map(
            async (entry) => {
              const itemId =
                entry.itemId;

              const response =
                await axios.get(
                  `${BASE_URL}/translate/product/translate/${encodeURIComponent(
                    itemId
                  )}/${encodeURIComponent(
                    currentLang
                  )}`
                );

              return {
                itemId,
                translation:
                  response.data,
              };
            }
          )
        );

      if (cancelled) return;

      setItemTranslations(
        (previous) => {
          const next = {
            ...previous,
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

  translateProducts();

  return () => {
    cancelled = true;
  };
}, [
  allItems,
  currentLang,
  itemTranslations,
]);

const getProductName = (
  entry
) => {
  const originalName =
    entry?.item?.name ||
    t("fashion_item");

  if (currentLang === "en") {
    return originalName;
  }

  const translated =
    itemTranslations[
      entry?.itemId
    ]?.[currentLang];

  return (
    translated?.name ||
    translated?.itemName ||
    originalName
  );
};

const translateTaxonomy = useCallback(
  (value) => {
    if (!value) return "";

    const key = value
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return t(key, {
      defaultValue: value,
    });
  },
  [t]
);

  const countryName = countryCode?.toUpperCase() || "your country";
const hasItems = allItems.length > 0;

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  if (!loadingTypes && !hasItems) {
  return (
    <div className="women-fashion-page">
      <section className="women-fashion-header">
        <div className="women-fashion-header-content">
          <span className="women-fashion-badge">Women’s Fashion</span>
          <h1>Elegant Looks, Everyday Confidence</h1>
          <p>
            Discover fashion-forward styles, trending pieces, and beautiful essentials.
          </p>
        </div>
      </section>

      <section className="women-empty-country">
        <div className="women-empty-icon">👗</div>

       <span className="women-empty-badge">
          {t("women_fashion")}
        </span>

        <h2>
          {t("women_empty_title")}
        </h2>

        <p>
          {t("women_empty_country", {
            country: countryName,
          })}
        </p>

        <p>
          {t("women_empty_description")}
        </p>

        <button
          type="button"
          className="women-empty-btn"
          onClick={() =>
            router.push(withCountry("/"))
          }
        >
          {t("browse_homepage")}
        </button>
      </section>

      <section className="women-recommended-section">
        <RecommendedItem />
      </section>
    </div>
  );
}

  return (
    <div className="women-fashion-page">
      <section className="women-fashion-header">
        <div className="women-fashion-header-content">
         <span className="women-fashion-badge">
          {t("women_fashion")}
        </span>

        <h1>
          {t("women_fashion_hero_title")}
        </h1>

        <p>
          {t("women_fashion_hero_description")}
        </p>
        </div>
      </section>

      <section className="women-slider-section">
        <div className="section-header">
          <h2> {t("women_featured_categories")}</h2>
        </div>

        {loadingMTypes ? (
          <div className="section-spinner-wrapper">
            <div className="section-spinner"></div>
          </div>
        ) : Object.values(mtypes).length === 0 ? (
          <div className="empty-state"> {t("women_no_types")}</div>
        ) : (
          <Slider {...sliderSettings}>
            {Object.values(mtypes).map((typeObj, index) => (
              <div key={index} className="slider-card-shell">
                <div className="slider-card">
                  <img
                    src={typeObj.image}
                    alt={translateTaxonomy(typeObj.type)}
                    className="slider-card-image"
                    onClick={() => handleCategoryClick(typeObj.type)}
                  />
                  <div className="slider-card-overlay">
                    <div className="slider-card-content">
                     <h3>
                        {translateTaxonomy(typeObj.type)}
                      </h3>
                      <button
                        className="slider-card-button"
                        onClick={() => handleCategoryClick(typeObj.type)}
                      >
                       {t("view_more")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        )}
      </section>

   <section className="women-topics-section">
  <div className="section-header">
    <h2> {t("women_top_topics")}</h2>
  </div>

  <div className="topics-center-hero">
    <img
      src="https://cdn.malidag.com/themes/1760454830463-0a9bff23-526a-40ba-a2b9-be41271c845f.webp"
      alt={t("women_topics_alt")}
      className="topics-center-image"
    />

    <div className="topics-center-overlay"></div>

    <div className="topics-center-content">
      <span className="topics-center-badge">
        {t("women_fashion")}
      </span>

      <h3>
        {t("women_explore_top_styles")}
      </h3>

      <p>
        {t("women_top_styles_description")}
      </p>

      <div className="topics-center-scroll">
        {loadingTypes ? (
          <div className="section-spinner-wrapper">
            <div className="section-spinner"></div>
          </div>
        ) : (
          Object.keys(types).map((type, index) => (
            <button
              key={index}
              className="topics-center-item"
              onClick={() => router.push(withCountry(`/women-toptopic/${type.toLowerCase()}`))}
            >
            {t("women_top_type", {
              type: translateTaxonomy(type),
            })}
            </button>
          ))
        )}
      </div>
    </div>
  </div>
</section>

      <section className="women-products-section">
        <div className="section-header">
        <h2>
          {t("women_trending_products")}
        </h2>

        <span>
          {t("items_count", {
            count: allItems.length,
          })}
        </span>
  </div>

  {loadingTypes ? (
    <div className="women-products-grid">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image" />
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  ) : (
    <div className="women-products-grid">
     {allItems.map((entry) => {
  const { id, item } = entry;

  const productName =
    getProductName(entry);

  const currentPrice =
    Number(item?.usdPrice || 0);

  const originalPrice =
    Number(
      item?.originalPrice || 0
    );

  const hasDiscount =
    originalPrice > currentPrice &&
    originalPrice > 0;

  const discountPercentage =
    hasDiscount
      ? Math.round(
          ((originalPrice -
            currentPrice) /
            originalPrice) *
            100
        )
      : 0;

        return (
          <div
            key={id}
            className="women-product-card women-product-card-vertical"
            onClick={() => handleItemClick(id)}
          >
            <div className="women-product-image-wrap women-product-image-wrap-vertical">
              {discountPercentage > 0 && (
                <div className="product-image-badge product-image-badge-discount">
                 -{discountPercentage}% {t("off")}
                </div>
              )}

              <img
                src={item?.images?.[0] || "/fallback.png"}
                alt={productName}
                className="women-product-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/fallback.png";
                }}
              />
            </div>

            <div className="women-product-info women-product-info-vertical">
              <h3 className="women-product-title">
                {productName.length > 60
                  ? `${productName.substring(
                      0,
                      60
                    )}...`
                  : productName}
              </h3>

             <div className="women-product-price-row">
              <span className="women-product-price">
                {formatPrice(currentPrice)}
              </span>

              {hasDiscount && (
                <span className="women-product-old-price">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

              <button
                type="button"
                className="women-product-add-basket-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(id);
                }}
              >
               {t("view_product")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )}
</section>

      <section className="women-recommended-section">
        <WoRecommendedItem />
      </section>
    </div>
  );
}

export default WoFashion;