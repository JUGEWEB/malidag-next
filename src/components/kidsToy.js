"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./kidToy.css";

const PRODUCT_FALLBACK_IMAGE =
  "https://via.placeholder.com/600x700?text=Kids+Toy";

const MAX_PRODUCTS_PER_GROUP = 5;
const MAX_PRODUCT_NAME_LENGTH = 70;

function slugifyType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
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

function truncateText(text, maxLength = MAX_PRODUCT_NAME_LENGTH) {
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

function SectionHeader({ eyebrow, title, subtitle, compact = false }) {
  return (
    <div className={`section-header ${compact ? "compact" : ""}`}>
      {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
      <h3 className="main-section-title">{title}</h3>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty-state" role="status">
      <p>{message}</p>
    </div>
  );
}

function PillSection({
  title,
  pills = [],
  onPillClick,
  className = "",
  scrollable = false,
}) {
  return (
    <div className={`pill-section ${className}`.trim()}>
      {title ? (
        <div className="pill-section-copy">
          <h4 className="pill-section-title">{title}</h4>
        </div>
      ) : null}

      <div className={`pill-list ${scrollable ? "pill-list-scroll" : ""}`}>
        {pills.map((pill, index) => (
          <button
            key={`${pill.label}-${index}`}
            type="button"
            className={`pill-chip ${pill.variant || ""}`.trim()}
            onClick={() => onPillClick?.(pill.label)}
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, groupType, onClick, t }) {
  const productId = product?.id;
  const item = product?.item || {};

  const productName =
    item?.name || t("unnamed_product", { defaultValue: "Unnamed product" });

  const productImage = getSafeImage(
    item?.images?.[0],
    PRODUCT_FALLBACK_IMAGE
  );

  const productPrice = formatPrice(item?.usdPrice);
  const productRating = item?.rating || 0;

  return (
    <article className="product-card" aria-label={productName}>
      <button
        type="button"
        className="product-card-media"
        onClick={() => onClick(productId)}
        aria-label={`${t("view_product", { defaultValue: "View product" })}: ${productName}`}
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
          <span className="item-type-badge">{groupType}</span>
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
          <StarRating rating={productRating} />
        </div>
      </div>
    </article>
  );
}

function KidToy({ types = {} }) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleItemClick = useCallback(
    (id) => {
      if (!id) return;
      router.push(`/product/${id}`);
    },
    [router]
  );

  const handleTypeClick = useCallback(
    (type) => {
      if (!type) return;
      router.push(`/kid-fashionTypes/${slugifyType(type)}`);
    },
    [router]
  );

  const preparedData = useMemo(() => {
    const groupedEntries = Object.entries(types || {});

    const allGroups = groupedEntries
      .map(([key, group]) => {
        const typeName = String(group?.type || key || "").trim();
        const safeItems = Array.isArray(group?.items)
          ? group.items.slice(0, MAX_PRODUCTS_PER_GROUP)
          : [];

        return {
          key: key || typeName,
          type: typeName || "other",
          genre: group?.genre || "",
          items: safeItems,
        };
      })
      .filter((group) => group.items.length > 0);

    const mixedProducts = allGroups.flatMap((group) =>
      group.items.map((entry) => ({
        ...entry,
        groupType: group.type,
        groupGenre: group.genre,
      }))
    );

    return {
      allGroups,
      mixedProducts,
      totalTypes: allGroups.length,
      totalProducts: mixedProducts.length,
    };
  }, [types]);

  const hasTypes = preparedData.allGroups.length > 0;
  const hasProducts = preparedData.mixedProducts.length > 0;

  return (
    <div className="kid-toy-page">
      <section className="kid-toy-hero" aria-labelledby="kid-toy-heading">
        <div className="kid-toy-hero-top">
          <div className="kid-toy-hero-badge">
            {t("new_collection", { defaultValue: "New" })}
          </div>

          <div className="kid-toy-stats" aria-label="Collection overview">
            <div className="kid-toy-stat">
              <strong>{preparedData.totalTypes}</strong>
              <span>{t("categories", { defaultValue: "Categories" })}</span>
            </div>
            <div className="kid-toy-stat">
              <strong>{preparedData.totalProducts}</strong>
              <span>{t("featured_items", { defaultValue: "Items" })}</span>
            </div>
          </div>
        </div>

        <h2 id="kid-toy-heading" className="kid-toy-title">
          {t("kid_toy", { defaultValue: "Kid Toy" })}
        </h2>

        <p className="kid-toy-subtitle">
          {t("kid_toy_subtitle", {
            defaultValue: "Playful picks for kids.",
          })}
        </p>
      </section>

      <section
        className="types-main-section"
        aria-labelledby="toy-types-section-title"
      >
        <SectionHeader
          compact
          eyebrow={t("discover", { defaultValue: "Discover" })}
          title={t("types", { defaultValue: "Types" })}
        />

        {!hasTypes ? (
          <EmptyState
            message={t("no_kid_toy_types", {
              defaultValue: "No types found.",
            })}
          />
        ) : (
          <PillSection
            title={t("product_types", { defaultValue: "Browse Types" })}
            pills={preparedData.allGroups.map((group) => ({
              label: group.type,
              variant: "type-pill",
            }))}
            onPillClick={handleTypeClick}
            scrollable
          />
        )}
      </section>

      <section
        className="products-main-section"
        aria-labelledby="toy-products-section-title"
      >
        <SectionHeader
          compact
          eyebrow={t("shop_now", { defaultValue: "Shop" })}
          title={t("featured_products", { defaultValue: "Featured Products" })}
        />

        {!hasProducts ? (
          <EmptyState
            message={t("no_kid_toy_products", {
              defaultValue: "No products found.",
            })}
          />
        ) : (
          <div
            className={`products-grid ${
              preparedData.mixedProducts.length === 1 ? "single-item" : ""
            }`}
          >
            {preparedData.mixedProducts.map((product) => (
              <ProductCard
                key={`${product.groupType}-${product.id}`}
                product={product}
                groupType={product.groupType}
                onClick={handleItemClick}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default KidToy;