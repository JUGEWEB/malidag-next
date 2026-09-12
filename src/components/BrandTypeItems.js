"use client";

import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getCountryConfig } from "./countryUtils";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { AppContext } from "./appContext";
import "./BrandTypeItems.css";

const API_BASE = "https://api.malidag.com";

const BrandTypeItems = ({ brandType, brandName }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState({});
  const [rates, setRates] = useState(null);

  const router = useRouter();
const { t, i18n } = useTranslation();

const { country } = useContext(AppContext);

const countryCode =
  country?.code?.toLowerCase() || null;

  const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

const withCountry = (path) => {
  if (!countryCode) return "/";

  if (!path) {
    return `/${countryCode}`;
  }

  return `/${countryCode}${
    path.startsWith("/")
      ? path
      : `/${path}`
  }`;
};

useEffect(() => {
  const fetchRates = async () => {
    try {
      const res = await fetch(`${API_BASE}/prices/rates`);
      const data = await res.json();

      setRates(data?.rates || data || null);
    } catch (err) {
      console.error("Failed to fetch currency rates:", err);
      setRates(null);
    }
  };

  fetchRates();
}, []);

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

const formatPrice = (usdAmount) => {
  const amount = Number(usdAmount);

  if (!Number.isFinite(amount)) {
    return t("price_unavailable");
  }

  const rate = getCurrencyRate();

  if (rate === null || !currencyConfig) {
    return t("price_unavailable");
  }

  const converted = amount * rate;

  return `${currencyConfig.symbol}${converted.toFixed(2)}`;
};

 useEffect(() => {
  if (
    !brandType ||
    !brandName ||
    !countryCode
  ) {
    setItems([]);
    setLoading(false);
    return;
  }

  const fetchItems = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/api/brands/${encodeURIComponent(
          brandType
        )}/${encodeURIComponent(
          brandName
        )}/items?country=${encodeURIComponent(
          countryCode
        )}`
      );

      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setItems([]);
        return;
      }

      setItems(data);
    } catch (err) {
      console.error(
        "Error fetching brand items:",
        err
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  fetchItems();
}, [
  brandType,
  brandName,
  countryCode,
]);

  useEffect(() => {
    if (!items.length || !i18n.language) return;

    const fetchTranslations = async () => {
      const results = {};

      await Promise.all(
        items.map(async (product) => {
          if (!product.itemId) return;

          try {
            const res = await fetch(
              `${API_BASE}/translate/product/translate/${product.itemId}/${i18n.language}`
            );

            const data = await res.json();

            if (res.ok && data?.translation) {
              results[product.itemId] = data.translation;
            }
          } catch (err) {
            console.error(
              "Failed to fetch product translation:",
              product.itemId,
              err
            );
          }
        })
      );

      setTranslations(results);
    };

    fetchTranslations();
  }, [items, i18n.language]);

  if (loading) return null;
  if (!items.length) return null;

  const isGridMode = items.length >= 4;

  return (
    <section className="brand-items-section">
      <h2 className="brand-items-title">
        {t("more_from_brand", {
          brand: brandName,
        })}
      </h2>

      <div
        className={`brand-items-grid ${
          isGridMode ? "grid-mode" : "wide-mode"
        }`}
      >
        {items.map((product) => {
          const image = product.item?.images?.[0];

          const translatedProduct =
            translations[product.itemId];

          const name =
            translatedProduct?.name ||
            product.item?.name;

          const brand = product.item?.brand;
          const price = product.item?.usdPrice;

          const productId = product.itemId;
          const itemId = product.id;

          return (
            <article
              key={productId}

              onClick={() => {
                    router.push(
                      withCountry(`/product/${itemId}`)
                    );
                  }}
              className={`brand-item-card ${
                isGridMode ? "grid-card" : "wide-card"
              }`}
            >
              <div className="brand-item-image-wrap">
                {image && (
                  <img
                    src={encodeURI(image)}
                    alt={name || t("item")}
                    className="brand-item-image"
                  />
                )}
              </div>

              <div className="brand-item-info">
                {brand && (
                  <h3 className="brand-item-brand">
                    {brand}
                  </h3>
                )}

                {name && (
                  <p className="brand-item-name">
                    {name}
                  </p>
                )}

               {price != null && (
                <p className="brand-item-price">
                  {formatPrice(price)}
                </p>
              )}

                <button
                  type="button"
                  className="brand-item-btn"
                >
                  {t("buy_now")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default BrandTypeItems;