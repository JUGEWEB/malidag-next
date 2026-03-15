"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./kidFashion.css";

const TYPES_FALLBACK_IMAGE =
  "https://api.malidag.com/learn/videos/1773412619015-Downpic.cc-2703545185.jpg";

const TOP_TOPIC_IMAGE =
  "https://api.malidag.com/learn/videos/1773413113417-e69e70ceca.jpg";

const PRODUCT_FALLBACK_IMAGE =
  "https://via.placeholder.com/600x700?text=Kids+Product";

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

function TypeImageCard({ title, image, onClick }) {
  return (
    <button
      type="button"
      className="type-image-card"
      aria-label={title}
      title={title}
      onClick={onClick}
    >
      <img
        src={getSafeImage(image, TYPES_FALLBACK_IMAGE)}
        alt={title}
        className="type-image-card-img"
        loading="lazy"
      />
      <div className="type-image-card-overlay" />
      <div className="type-image-card-content">
        <span className="type-image-card-label">{title}</span>
      </div>
    </button>
  );
}

function PillBanner({ image, alt, pills = [], className = "", onPillClick }) {
  return (
    <div className={`center-banner ${className}`.trim()}>
      <img
        src={getSafeImage(image, TYPES_FALLBACK_IMAGE)}
        alt={alt}
        className="center-banner-image"
        loading="lazy"
      />
      <div className="center-banner-overlay" />
      <div className="center-banner-middle">
        <div className="center-banner-copy">
          <h4 className="center-banner-title">{alt}</h4>
          <p className="center-banner-text">
            Explore trending styles, standout essentials, and category highlights
            curated for modern kidswear collections.
          </p>
        </div>

        <div className="center-banner-scroll">
          <div className="center-pill-list">
            {pills.map((pill, index) => (
              <button
                key={`${pill.label}-${index}`}
                type="button"
                className={`center-pill ${pill.variant || ""}`.trim()}
                onClick={() => onPillClick?.(pill.label)}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
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

function KidFashion({ mtypes = [], types = {} }) {
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
    const typeImageMap = new Map(
      (Array.isArray(mtypes) ? mtypes : []).map((entry) => [
        normalizeType(entry?.type),
        entry,
      ])
    );

    const allGroups = groupedEntries.map(([key, group]) => {
      const typeName = group?.type || key || "";
      const normalizedType = normalizeType(typeName);
      const matchedType = typeImageMap.get(normalizedType);
      const safeItems = Array.isArray(group?.items)
        ? group.items.slice(0, MAX_PRODUCTS_PER_GROUP)
        : [];

      return {
        key: typeName,
        type: typeName,
        genre: group?.genre || "",
        image: matchedType?.image || "",
        hasTypeImage: Boolean(matchedType?.image),
        items: safeItems,
      };
    });

    const typesWithImage = allGroups.filter((group) => group.hasTypeImage);
    const typesWithoutImage = allGroups.filter((group) => !group.hasTypeImage);

    const mixedProducts = allGroups.flatMap((group) =>
      group.items.map((entry) => ({
        ...entry,
        groupType: group.type,
        groupGenre: group.genre,
      }))
    );

    return {
      allGroups,
      typesWithImage,
      typesWithoutImage,
      mixedProducts,
      totalTypes: allGroups.length,
      totalProducts: mixedProducts.length,
    };
  }, [mtypes, types]);

  const hasTypes = preparedData.allGroups.length > 0;
  const hasProducts = preparedData.mixedProducts.length > 0;

  return (
    <div className="kid-fashion-page">
      <section className="kids-hero" aria-labelledby="kid-fashion-heading">
        <div className="kids-hero-badge">
          {t("new_collection") || "New Collection"}
        </div>

        <h2 id="kid-fashion-heading" className="personal-care-title">
          {t("kid_fashion") || "Kid Fashion"}
        </h2>

        <p className="kids-hero-subtitle">
         
            Soft styles, playful colors, and elevated essentials designed for every little personality.
        </p>

        <div className="kids-hero-stats" aria-label="Collection overview">
          <div className="kids-hero-stat">
            <strong>{preparedData.totalTypes}</strong>
            <span>{t("categories") || "Categories"}</span>
          </div>
          <div className="kids-hero-stat">
            <strong>{preparedData.totalProducts}</strong>
            <span>{t("featured_items") || "Featured Items"}</span>
          </div>
        </div>
      </section>

      <section className="types-main-section" aria-labelledby="types-section-title">
        <SectionHeader
          eyebrow={t("discover") || "Discover"}
          title={t("types") || "Types"}
          subtitle={
            t("types_section_subtitle") ||
            "Browse category-led collections crafted for comfort, style, and everyday movement."
          }
        />

        {!hasTypes ? (
          <EmptyState
            message={t("no_kid_fashion_types") || "No kid fashion types found."}
          />
        ) : (
          <>
            {preparedData.typesWithImage.length > 0 && (
              <div className="types-image-grid">
                {preparedData.typesWithImage.map((typeObj, index) => (
                 <TypeImageCard
                  key={`${typeObj.type}-image-${index}`}
                  title={typeObj.type}
                  image={typeObj.image}
                  onClick={() => handleTypeClick(typeObj.type)}
                />
                ))}
              </div>
            )}

            {preparedData.typesWithoutImage.length > 0 && (
             <PillBanner
              image={TYPES_FALLBACK_IMAGE}
              alt={t("collection_types") || "Collection Types"}
              pills={preparedData.typesWithoutImage.map((typeObj) => ({
                label: typeObj.type,
                variant: "no-image",
              }))}
              onPillClick={handleTypeClick}
            />
            )}
          </>
        )}
      </section>

      <section className="top-topic-section" aria-labelledby="top-topic-title">
        <SectionHeader
          eyebrow={t("featured") || "Featured"}
          title={t("top_topic") || "Top Topic"}
          subtitle={
            t("top_topic_subtitle") ||
            "A fast view of the categories driving the current kidswear assortment."
          }
        />

        {!hasTypes ? (
          <EmptyState
            message={
              t("no_kid_fashion_products") || "No kid fashion products found."
            }
          />
        ) : (
         <PillBanner
          image={TOP_TOPIC_IMAGE}
          alt={t("top_topic") || "Top Topic"}
          className="top-topic-banner"
          pills={preparedData.allGroups.map((group) => ({
            label: group.type,
            variant: group.hasTypeImage ? "has-image" : "no-image",
          }))}
          onPillClick={handleTypeClick}
        />
        )}
      </section>

      <section
        className="products-main-section"
        aria-labelledby="products-section-title"
      >
        <SectionHeader
          eyebrow={t("shop_now") || "Shop Now"}
          title={t("featured_products") || "Featured Products"}
          subtitle={
            t("featured_products_subtitle") ||
            "Selected pieces from across the collection, balancing comfort, quality, and visual appeal."
          }
        />

        {!hasProducts ? (
          <EmptyState
            message={
              t("no_kid_fashion_products") || "No kid fashion products found."
            }
          />
        ) : (
          <div className="products-grid">
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

export default KidFashion;