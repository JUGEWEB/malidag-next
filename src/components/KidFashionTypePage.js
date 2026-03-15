"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./kidFashionType.css";

const BASE_URL = "https://api.malidag.com";
const PRODUCT_FALLBACK_IMAGE =
  "https://via.placeholder.com/600x700?text=Kids+Product";
const TYPE_FALLBACK_IMAGE =
  "https://api.malidag.com/learn/videos/1773412619015-Downpic.cc-2703545185.jpg";

const KID_GENRES = new Set([
  "kids",
  "kid",
  "boy",
  "boys",
  "girl",
  "girls",
  "baby-boy",
  "baby-girl",
]);

function unslugifyType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getSafeImage(src, fallback) {
  return src && String(src).trim() ? src : fallback;
}

function clampRating(rating) {
  return Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
}

function formatPrice(price) {
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(numericPrice);
}

function truncateText(text, maxLength = 90) {
  const safeText = String(text || "").trim();
  if (!safeText) return "";
  if (safeText.length <= maxLength) return safeText;
  return `${safeText.slice(0, maxLength)}...`;
}

function StarRating({ rating }) {
  const safeRating = clampRating(rating);

  return (
    <div
      className="stars-container"
      aria-label={`Rated ${safeRating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`star ${index < safeRating ? "filled" : "empty"}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product, onClick, t }) {
  const productId = product?.id;
  const productName =
    product?.item?.name || t("unnamed_product") || "Unnamed product";
  const productImage = getSafeImage(
    product?.item?.images?.[0],
    PRODUCT_FALLBACK_IMAGE
  );
  const productPrice = formatPrice(product?.item?.usdPrice);
  const productRating = product?.item?.rating || 0;
  const productGenre = product?.item?.genre || "";
  const productType = product?.item?.type || "";

  return (
    <article className="product-card" aria-label={productName}>
      <button
        type="button"
        className="product-card-media"
        onClick={() => onClick(productId)}
        aria-label={`${t("view_product") || "View product"}: ${productName}`}
      >
        <img
          src={productImage}
          alt={productName}
          className="product-card-image"
          loading="lazy"
        />
      </button>

      <div className="product-card-body">
        <div className="product-card-meta">
          <span className="product-card-price">{productPrice}</span>
          <span className="item-type-badge">{productType}</span>
        </div>

        <button
          type="button"
          className="product-card-title"
          onClick={() => onClick(productId)}
          title={productName}
        >
          {truncateText(productName)}
        </button>

        <div className="product-card-footer">
          <span className="kid-type-genre-tag">{productGenre}</span>
          <StarRating rating={productRating} />
        </div>
      </div>
    </article>
  );
}

function KidFashionTypePage({ typeSlug }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [typeImage, setTypeImage] = useState(TYPE_FALLBACK_IMAGE);
  const [loading, setLoading] = useState(true);

  const readableType = useMemo(() => unslugifyType(typeSlug), [typeSlug]);

  const fetchTypeImage = useCallback(async (typeName) => {
    try {
      const response = await axios.get(`${BASE_URL}/kid-fashion/mtypes`);
      const mtypes = Array.isArray(response?.data?.mtypes)
        ? response.data.mtypes
        : [];

      const matched = mtypes.find(
        (entry) => normalizeValue(entry?.type) === normalizeValue(typeName)
      );

      setTypeImage(matched?.image || TYPE_FALLBACK_IMAGE);
    } catch (error) {
      console.error("Error fetching kid fashion type image:", error);
      setTypeImage(TYPE_FALLBACK_IMAGE);
    }
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!readableType) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await axios.get(
          `${BASE_URL}/items/${encodeURIComponent(readableType)}`
        );

        const fetchedItems = Array.isArray(response?.data?.items)
          ? response.data.items
          : [];

        const filteredItems = fetchedItems.filter((entry) => {
          const genre = String(entry?.item?.genre || "")
            .trim()
            .toLowerCase();

          return KID_GENRES.has(genre);
        });

        setItems(filteredItems);
      } catch (error) {
        console.error("Error fetching kid fashion items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
    fetchTypeImage(readableType);
  }, [readableType, fetchTypeImage]);

  const handleItemClick = useCallback(
    (id) => {
      if (!id) return;
      router.push(`/product/${id}`);
    },
    [router]
  );

  const handleBack = useCallback(() => {
    router.push("/kid-fashion");
  }, [router]);

  const totalProducts = items.length;

  const uniqueGenres = useMemo(() => {
    return [...new Set(items.map((entry) => entry?.item?.genre).filter(Boolean))];
  }, [items]);

  if (loading) {
    return (
      <div className="kid-fashion-type-page">
        <div className="kid-fashion-type-loading">
          {t("loading") || "Loading..."}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="kid-fashion-type-page">
        <section className="kid-type-hero">
          <button type="button" className="back-button" onClick={handleBack}>
            ← {t("back") || "Back"}
          </button>

          <div className="kid-type-hero-content">
            <div className="kid-type-hero-text">
              <span className="kid-type-eyebrow">
                {t("kid_fashion") || "Kid Fashion"}
              </span>
              <h1 className="kid-type-title">{readableType}</h1>
              <p className="kid-type-subtitle">
                {t("no_kid_fashion_products") || "No kid fashion products found."}
              </p>
            </div>

            <div className="kid-type-hero-media">
              <img
                src={typeImage}
                alt={readableType}
                className="kid-type-hero-image"
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="kid-fashion-type-page">
      <section className="kid-type-hero">
        <button type="button" className="back-button" onClick={handleBack}>
          ← {t("back") || "Back"}
        </button>

        <div className="kid-type-hero-content">
          <div className="kid-type-hero-text">
            <span className="kid-type-eyebrow">
              {t("kid_fashion") || "Kid Fashion"}
            </span>

            <h1 className="kid-type-title">{readableType}</h1>

            <p className="kid-type-subtitle">
              {t("shop_type_collection") ||
                "Browse this kids collection and discover styles made for comfort, movement, and everyday charm."}
            </p>

            <div className="kid-type-stats">
              <div className="kid-type-stat">
                <strong>{totalProducts}</strong>
                <span>{t("products") || "Products"}</span>
              </div>

              <div className="kid-type-stat">
                <strong>{uniqueGenres.length}</strong>
                <span>{t("genres") || "Genres"}</span>
              </div>
            </div>
          </div>

          <div className="kid-type-hero-media">
            <img
              src={typeImage}
              alt={readableType}
              className="kid-type-hero-image"
            />
          </div>
        </div>
      </section>

      {uniqueGenres.length > 0 && (
        <section className="kid-type-genre-section">
          <div className="kid-type-genre-list">
            {uniqueGenres.map((genre) => (
              <span key={genre} className="kid-type-genre-chip">
                {genre}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="kid-type-products-section">
        <div className="products-grid">
          {items.map((product) => (
            <ProductCard
              key={product?.id}
              product={product}
              onClick={handleItemClick}
              t={t}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default KidFashionTypePage;