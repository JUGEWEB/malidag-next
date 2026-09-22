"use client";

"use client";

import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PlayCircleOutlined,
} from "@ant-design/icons";

import axios from "axios";
import "./typePage.css";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AppContext } from "./appContext";
import { useCheckoutStore } from "./checkoutStore";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "./countryUtils";

const BASE_URL = "https://api.malidag.com";

const normalizeItems = (data) => {
  const items =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];

  return items.filter(
    (item) =>
      item &&
      item.category &&
      item.item &&
      item.item.type &&
      Array.isArray(item.item.images)
  );
};

export default function TypePage() {
  const router = useRouter();
  const { setItemData } = useCheckoutStore();

  const { country } = useContext(AppContext);
const { t, i18n } = useTranslation();
const [brandThemes, setBrandThemes] =
  useState([]);

const countryCode =
  country?.code?.toLowerCase() || "fr";

const currencyConfig = useMemo(
  () =>
    getCountryConfig(
      country?.name || ""
    ),
  [country?.name]
);

const rawLanguage = (
  i18n.resolvedLanguage ||
  i18n.language ||
  "en"
).toLowerCase();

let currentLanguage = "en";

if (
  rawLanguage === "br" ||
  rawLanguage === "pt-br" ||
  rawLanguage.startsWith("pt")
) {
  currentLanguage = "br";
} else if (
  rawLanguage.startsWith("fr")
) {
  currentLanguage = "fr";
}

const withCountry = (path) => {
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
};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reviews, setReviews] = useState({});

  const [rates, setRates] = useState({});
const [translations, setTranslations] =
  useState({});

  const fetchReviews = async (id) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/get-reviews/${id}`);

      if (data.success) {
        const arr = data.reviews || [];
        const avg = arr.length
          ? (
              arr.reduce((a, r) => a + (parseFloat(r.rating) || 4), 0) / arr.length
            ).toFixed(1)
          : null;

        setReviews((prev) => ({
          ...prev,
          [id]: { averageRating: avg },
        }));
      }
    } catch {
      setReviews((prev) => ({
        ...prev,
        [id]: { averageRating: null },
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
       const { data } = await axios.get(
  `${BASE_URL}/items`,
  {
    params: {
      country: countryCode,
    },
  }
);
        const normalized = normalizeItems(data);

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const filtered = normalized.filter((i) => {
          const d = new Date(i.createdAt);
          return !isNaN(d) && d >= twoMonthsAgo;
        });

        setItems(filtered);

      

        filtered.slice(0, 20).forEach((i) => fetchReviews(i.itemId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [countryCode]);

  useEffect(() => {
  const fetchBrandThemes = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/brands/themes`
      );

      setBrandThemes(
        response.data || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch brand themes:",
        error
      );
    }
  };

  fetchBrandThemes();
}, []);

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

const getBrandTheme = (brandName) => {
  const match = brandThemes.find(
    (entry) =>
      normalizeText(entry?.brandName) ===
      normalizeText(brandName)
  );

  return (
    match?.theme?.trim()?.toLowerCase() ||
    "brand"
  );
};

  useEffect(() => {
  const fetchRates = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/prices/rates`
      );

      setRates(
        response.data?.rates || {}
      );
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

useEffect(() => {
  const fetchTranslations = async () => {
    if (!items.length) {
      setTranslations({});
      return;
    }

    if (currentLanguage === "en") {
      setTranslations({});
      return;
    }

    try {
      const results =
        await Promise.all(
          items.map(async (itemData) => {
            const productId =
              itemData?.itemId;

            if (!productId) {
              return null;
            }

            try {
              const response =
                await axios.get(
                  `${BASE_URL}/translate/product/translate/${encodeURIComponent(
                    productId
                  )}/${encodeURIComponent(
                    currentLanguage
                  )}`
                );

              return {
                productId:
                  String(productId),

                translation:
                  response.data
                    ?.translation || null,
              };
            } catch (error) {
              console.error(
                `Failed to translate product ${productId}:`,
                error
              );

              return null;
            }
          })
        );

      const nextTranslations = {};

      results.forEach((result) => {
        if (
          result?.productId &&
          result?.translation
        ) {
          nextTranslations[
            result.productId
          ] = result.translation;
        }
      });

      setTranslations(
        nextTranslations
      );
    } catch (error) {
      console.error(
        "Failed to fetch translations:",
        error
      );
    }
  };

  fetchTranslations();
}, [items, currentLanguage]);

const formatUsdToLocal = (usdValue) => {
  const usdPrice =
    Number(usdValue || 0);

  const currency =
    currencyConfig?.currency || "USD";

  let localizedPrice = usdPrice;

  if (currency !== "USD") {
    const rate =
      Number(rates?.[currency]);

    if (rate) {
      localizedPrice =
        usdPrice * rate;
    }
  }

  const symbol =
    currencyConfig?.symbol || "$";

  return `${symbol}${localizedPrice.toFixed(
    2
  )}`;
};

  const relatedBrands = useMemo(() => {
  return [
    ...new Set(
      items
        .map(
          (itemData) =>
            itemData?.item?.brand ||
            itemData?.details?.brand
        )
        .filter(Boolean)
        .map((brand) =>
          String(brand).trim()
        )
    ),
  ];
}, [items]);


 const handleItemClick = (id) => {
  router.push(
    withCountry(`/product/${id}`)
  );
};

  const renderStars = (rating) => {
    const safeRating = Math.round(Number(rating) || 0);

    return (
      <div className="tp-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < safeRating ? "tp-star filled" : "tp-star"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const latestItems = useMemo(() => items, [items]);

  if (loading) {
    return (
      <div className="tp-loading-wrap">
        <div className="tp-loader" />
      </div>
    );
  }

  return (
    <div className="tp-page">
     {relatedBrands.length > 0 && (
  <section className="tp-brands">
    <div className="tp-brands-head">
      <div>
        <span className="tp-brands-eyebrow">
         {t("discover_more")}
        </span>

        <h2 className="tp-brands-title">
         {t("related_brands")}
        </h2>
      </div>
    </div>

    <div className="tp-brand-list">
      {relatedBrands.map((brand) => (
        <button
          key={brand}
          type="button"
          className="tp-brand-pill"
         onClick={() => {
  const theme =
    getBrandTheme(brand);

  router.push(
    withCountry(
      `/brand/${encodeURIComponent(
        theme
      )}/${encodeURIComponent(
        brand
      )}`
    )
  );
}}
        >
          {brand}
          <span className="tp-brand-arrow">
            →
          </span>
        </button>
      ))}
    </div>
  </section>
)}

     {latestItems.length === 0 ? (
  <div className="tp-empty-state">
    <div className="tp-empty-icon">
      <span>✦</span>
    </div>

   <span className="tp-empty-label">
  {t("new_arrivals")}
</span>

<h2>
  {t("new_arrivals_empty_title")}
</h2>

<p>
  {t("new_arrivals_empty_description")}
</p>

<button
  type="button"
  className="tp-empty-action"
  onClick={() =>
    router.push(
      withCountry("/")
    )
  }
>
  {t("continue_shopping")}
  <span>→</span>
</button>
  </div>
) : (
  <div className="tp-grid">
    {latestItems.map((itemData) => {
         const {
  itemId,
  id,
  item = {},
  details = {},
} = itemData;

const rating =
  reviews[itemId]?.averageRating;

const originalName =
  item?.name ||
  details?.itemName ||
  t("unnamed_item");

const translatedProduct =
  translations[String(itemId)];

const displayName =
  currentLanguage === "en"
    ? originalName
    : translatedProduct?.name ||
      translatedProduct?.itemName ||
      originalName;

      const brandName =
  item?.brand ||
  details?.brand ||
  "";

          const video = Array.isArray(item.videos)
            ? item.videos.find((v) => v?.endsWith(".mp4"))
            : item.videos?.endsWith(".mp4")
            ? item.videos
            : null;

          return (
            <div key={id} className="tp-card">
              <div className="tp-media">
                {video && <div className="tp-badge">{t("video")}</div>}

                {activeVideoId === id && video ? (
                  <video
                    src={video}
                    controls
                    autoPlay
                    className="tp-video"
                    onEnded={() => setActiveVideoId(null)}
                  />
                ) : (
                  <>
                    <img
                      src={item.images[0]}
                      alt={displayName}
                      className="tp-image"
                      onClick={() => handleItemClick(id)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/fallback.png";
                      }}
                    />

                    {video && (
                      <button
                        type="button"
                        className="tp-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoId(id);
                        }}
                      >
                        <PlayCircleOutlined />
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="tp-info">

                {brandName && (
  <button
    type="button"
    className="tp-card-brand"
    onClick={(e) => {
      e.stopPropagation();

      const theme =
        getBrandTheme(brandName);

      router.push(
        withCountry(
          `/brand/${encodeURIComponent(
            theme
          )}/${encodeURIComponent(
            brandName
          )}`
        )
      );
    }}
  >
    <span>{brandName}</span>
    <span
      className="tp-card-brand-arrow"
      aria-hidden="true"
    >
      →
    </span>
  </button>
)}
               <div
                className="tp-name"
                onClick={() =>
                  handleItemClick(id)
                }
              >
                {displayName.length > 58
                  ? `${displayName.slice(0, 58)}...`
                  : displayName}
              </div>

                <div className="tp-price-row">
                 <span className="tp-price">
                  {formatUsdToLocal(item.usdPrice)}
                </span>
                  <span className="tp-new-badge">{t("new")}</span>
                </div>

                <div className="tp-rating-row">
                  {rating ? (
                    <>
                      {renderStars(rating)}
                      <span className="tp-rating-value">{rating}/5</span>
                    </>
                  ) : (
                    <span className="tp-no-reviews">{t("no_reviews_yet")}</span>
                  )}
                </div>

                <button
                  type="button"
                  className="tp-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemData(itemData);
                   router.push(
                  withCountry(
                    `/product/${id}/review`
                  )
                );
                  }}
                >
                 {t("buy_now")}
                </button>
              </div>
            </div>
          );
        })} 
      </div>
      )}
    </div>
  );
}