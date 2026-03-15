"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./kidToy.css";

const PRODUCT_FALLBACK_IMAGE =
  "https://via.placeholder.com/600x700?text=Kids+Toy";

const MAX_PRODUCTS_PER_GROUP = 5;
const MAX_PRODUCT_NAME_LENGTH = 90;

function normalizeType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

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
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index < safeRating;

        return (
          <span
            key={index}
            className={`star ${isFilled ? "filled" : "empty"}`}
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="section-header">
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

function PillSection({ title, subtitle, pills = [], onPillClick, className = "" }) {
  return (
    <div className={`pill-section ${className}`.trim()}>
      {(title || subtitle) && (
        <div className="pill-section-copy">
          {title ? <h4 className="pill-section-title">{title}</h4> : null}
          {subtitle ? <p className="pill-section-subtitle">{subtitle}</p> : null}
        </div>
      )}

      <div className="pill-list">
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
  const productName =
    product?.item?.name || t("unnamed_product") || "Unnamed product";
  const productImage = getSafeImage(
    product?.item?.images?.[0],
    PRODUCT_FALLBACK_IMAGE
  );
  const productPrice = formatPrice(product?.item?.usdPrice);
  const productRating = product?.item?.rating || 0;

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

    const allGroups = groupedEntries.map(([key, group]) => {
      const typeName = group?.type || key || "";
      const safeItems = Array.isArray(group?.items)
        ? group.items.slice(0, MAX_PRODUCTS_PER_GROUP)
        : [];

      return {
        key: typeName,
        type: typeName,
        genre: group?.genre || "",
        items: safeItems,
      };
    });

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
        <div className="kid-toy-hero-badge">
          {t("new_collection") || "New Collection"}
        </div>

        <h2 id="kid-toy-heading" className="kid-toy-title">
          {t("kid_toy") || "Kid Toy"}
        </h2>

        <p className="kid-toy-subtitle">
          Fun, playful, and engaging toy collections designed to spark imagination
          and joyful everyday moments.
        </p>

        <div className="kid-toy-stats" aria-label="Collection overview">
          <div className="kid-toy-stat">
            <strong>{preparedData.totalTypes}</strong>
            <span>{t("categories") || "Categories"}</span>
          </div>
          <div className="kid-toy-stat">
            <strong>{preparedData.totalProducts}</strong>
            <span>{t("featured_items") || "Featured Items"}</span>
          </div>
        </div>
      </section>

      <section className="types-main-section" aria-labelledby="toy-types-section-title">
        <SectionHeader
          eyebrow={t("discover") || "Discover"}
          title={t("types") || "Types"}
          subtitle={
            t("toy_types_section_subtitle") ||
            "Browse toy categories built for fun, creativity, and playful exploration."
          }
        />

        {!hasTypes ? (
          <EmptyState
            message={t("no_kid_toy_types") || "No kid toy types found."}
          />
        ) : (
          <PillSection
            title={t("product_types") || "Product Types"}
            subtitle={
              t("product_types_subtitle") ||
              "Explore the available toy categories in this collection."
            }
            pills={preparedData.allGroups.map((group) => ({
              label: group.type,
              variant: "type-pill",
            }))}
            onPillClick={handleTypeClick}
          />
        )}
      </section>

      <section className="top-topic-section" aria-labelledby="toy-top-topic-title">
        <SectionHeader
          eyebrow={t("featured") || "Featured"}
          title={t("top_topic") || "Top Topic"}
          subtitle={
            t("toy_top_topic_subtitle") ||
            "A quick view of the toy types shaping this collection right now."
          }
        />

        {!hasTypes ? (
          <EmptyState
            message={t("no_kid_toy_products") || "No kid toy products found."}
          />
        ) : (
          <PillSection
            className="top-topic-pill-section"
            title={t("top_topic_types") || "Top Topic Types"}
            subtitle={
              t("top_topic_types_subtitle") ||
              "Tap a type to jump into the matching toy collection."
            }
            pills={preparedData.allGroups.map((group) => ({
              label: group.type,
              variant: "top-topic-pill",
            }))}
            onPillClick={handleTypeClick}
          />
        )}
      </section>

      <section
        className="products-main-section"
        aria-labelledby="toy-products-section-title"
      >
        <SectionHeader
          eyebrow={t("shop_now") || "Shop Now"}
          title={t("featured_products") || "Featured Products"}
          subtitle={
            t("featured_toy_products_subtitle") ||
            "Selected toy pieces from across the collection with playful appeal and everyday fun."
          }
        />

        {!hasProducts ? (
          <EmptyState
            message={t("no_kid_toy_products") || "No kid toy products found."}
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