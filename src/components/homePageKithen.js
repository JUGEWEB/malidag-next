"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./homePageKithen.css";
import languages from "@/i18nLanguages";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "./checkoutStore";
import Head from "next/head";

function ItemHomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});

  const [selectedType, setSelectedType] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});

  const router = useRouter();
  const { t } = useTranslation();
  const { setItemData } = useCheckoutStore();

  const baseUrl = "https://www.malidag.com";
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const fetchTranslation = async (productId, lang) => {
    if (translations[productId]?.[lang]) return;

    try {
      const response = await axios.get(
        `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
      );

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: response.data.translation,
        },
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(
        `https://api.malidag.com/get-reviews/${productId}`
      );

      const reviewsArray = response?.data?.reviews || [];
      const total = reviewsArray.reduce(
        (acc, item) => acc + Number(item.rating || 0),
        0
      );

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          averageRating: reviewsArray.length ? total / reviewsArray.length : 0,
          count: reviewsArray.length,
        },
      }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("https://api.malidag.com/items/");
        const fetched = response.data || [];

        const filtered = fetched.filter(
          (item) => item?.category === "home_kitchen"
        );

        const initialColors = {};
        const initialIndexes = {};

        filtered.forEach((product) => {
          const colorKeys = Object.keys(product?.item?.imagesVariants || {});
          if (colorKeys.length > 0) {
            initialColors[product.id] = colorKeys[0];
            initialIndexes[product.id] = 0;
          }

          fetchTranslation(product.itemId, i18n.language || "en");
          fetchReviews(product.itemId);
        });

        setSelectedColorByItem(initialColors);
        setSelectedImageIndexByItem(initialIndexes);
        setItems(filtered);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const brands = useMemo(() => {
    return [...new Set(items.map((x) => x?.item?.brand).filter(Boolean))];
  }, [items]);

  const types = useMemo(() => {
    return [...new Set(items.map((x) => x?.item?.type).filter(Boolean))];
  }, [items]);

  const colors = useMemo(() => {
    const allColors = [];

    items.forEach((itemData) => {
      Object.keys(itemData?.item?.imagesVariants || {}).forEach((color) => {
        allColors.push(color);
      });
    });

    return [...new Set(allColors)];
  }, [items]);

  const maxPrice = useMemo(() => {
    const prices = items.map((itemData) => Number(itemData?.item?.usdPrice || 0));
    return Math.ceil(Math.max(...prices, 100));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((itemData) => {
      const item = itemData.item;
      const price = Number(item?.usdPrice || 0);

      const matchesType = selectedType === "all" || item?.type === selectedType;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      let matchesColor = true;

      if (selectedColor !== "all") {
        matchesColor = Object.keys(item?.imagesVariants || {}).includes(
          selectedColor
        );
      }

      return matchesType && matchesPrice && matchesColor;
    });
  }, [items, selectedType, selectedColor, priceRange]);

  const getImageUrl = (imageEntry) => {
    if (!imageEntry) return "";
    if (typeof imageEntry === "string") return imageEntry;
    if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
    return "";
  };

  const sortImages = (images = []) => {
    return [...images].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number"
          ? a.position
          : 999999;

      const posB =
        typeof b === "object" && typeof b?.position === "number"
          ? b.position
          : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object"
          ? a?.filename || ""
          : String(a || "").split("/").pop() || "";

      const nameB =
        typeof b === "object"
          ? b?.filename || ""
          : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.item?.imagesVariants || {});
  };

  const getCurrentImages = (product) => {
    const variants = product?.item?.imagesVariants || {};
    const selectedColor = selectedColorByItem[product.id];

    if (selectedColor && Array.isArray(variants[selectedColor])) {
      return sortImages(variants[selectedColor]);
    }

    const firstColor = Object.keys(variants)[0];

    if (firstColor && Array.isArray(variants[firstColor])) {
      return sortImages(variants[firstColor]);
    }

    return product?.item?.images || [];
  };

  const getDisplayImage = (product) => {
    const images = getCurrentImages(product);
    const index = selectedImageIndexByItem[product.id] || 0;
    return getImageUrl(images[index]) || getImageUrl(product?.item?.images?.[0]) || "/fallback.png";
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();

    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));

    setSelectedImageIndexByItem((prev) => ({
      ...prev,
      [itemId]: 0,
    }));
  };

  const handleImageArrow = (product, direction, e) => {
    e.stopPropagation();

    const images = getCurrentImages(product);
    if (images.length <= 1) return;

    setSelectedImageIndexByItem((prev) => {
      const current = prev[product.id] || 0;
      const next =
        direction === "next"
          ? (current + 1) % images.length
          : (current - 1 + images.length) % images.length;

      return {
        ...prev,
        [product.id]: next,
      };
    });
  };

  const getColorSwatch = (colorName = "") => {
    const color = colorName.trim().toLowerCase();

    const swatches = {
      black: "#111111",
      white: "#f8f8f8",
      red: "#dc2626",
      blue: "#2563eb",
      green: "#16a34a",
      yellow: "#eab308",
      pink: "#ec4899",
      purple: "#9333ea",
      orange: "#f97316",
      brown: "#92400e",
      grey: "#9ca3af",
      gray: "#9ca3af",
      silver: "#c0c0c0",
      gold: "#d4af37",
      beige: "#d6c7a1",
      cream: "#f5f0dc",
      ivory: "#fffff0",
      navy: "#1e3a8a",
      maroon: "#7f1d1d",
      olive: "#556b2f",
      khaki: "#c3b091",
      "sky blue": "#38bdf8",
      skyblue: "#38bdf8",
      multicolor:
        "linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #3b82f6, #a855f7)",
      transparent:
        "linear-gradient(135deg, #ddd 25%, #fff 25%, #fff 50%, #ddd 50%, #ddd 75%, #fff 75%, #fff 100%)",
    };

    return swatches[color] || "#d1d5db";
  };

  const handleItemClick = (id) => {
    router.push(`/product/${id}`);
  };

  const handleBrandClick = (brand) => {
    router.push(`/brand/${encodeURIComponent(brand)}`);
  };

  const renderStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

  if (loading) {
    return <div className="loading-message">{t("loading")}</div>;
  }

  return (
    <div className="kitchen-page-wrapper">
      <Head>
        <link rel="canonical" href={`${baseUrl}${currentPath}`} />

        {languages.map((lang) => (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={`${baseUrl}/${lang}${currentPath}`}
          />
        ))}
      </Head>

      <div className="kitchen-hero">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2Fsteptodown.com479163.jpg?alt=media&token=0abc0129-3e54-4b9c-ba3d-ed4d9e61e960"
          alt="home and kitchen"
          className="kitchen-hero-image"
        />

        <div className="kitchen-hero-overlay">
          <h1>{t("home_and_kitchen") || "Home & Kitchen"}</h1>
          <p>{t("discover_amazing_products") || "Beautiful essentials for your home."}</p>
        </div>
      </div>

      <div className="mobile-filters-wrapper">
        <div className="mobile-color-filters">
          <button
            type="button"
            className={`mobile-color-circle all ${
              selectedColor === "all" ? "active" : ""
            }`}
            onClick={() => setSelectedColor("all")}
          >
            All
          </button>

          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className={`mobile-color-circle ${
                selectedColor === color ? "active" : ""
              }`}
              title={color}
              aria-label={`Filter ${color}`}
              style={{ background: getColorSwatch(color) }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>

        <div className="mobile-scroll-filters">
          {brands.map((brand) => (
            <button key={brand} onClick={() => handleBrandClick(brand)}>
              {brand}
            </button>
          ))}
        </div>

        <div className="mobile-scroll-filters">
          <button
            className={selectedType === "all" ? "active-filter" : ""}
            onClick={() => setSelectedType("all")}
          >
            All Types
          </button>

          {types.map((type) => (
            <button
              key={type}
              className={selectedType === type ? "active-filter" : ""}
              onClick={() => setSelectedType(type)}
            >
              {type.replaceAll("_", " ")}
            </button>
          ))}
        </div>

        <div className="price-filter-mobile">
          <input
            type="range"
            min="0"
            max={maxPrice}
            value={Math.min(priceRange[1], maxPrice)}
            onChange={(e) => setPriceRange([0, Number(e.target.value)])}
          />
          <span>Max: ${Math.min(priceRange[1], maxPrice)}</span>
        </div>
      </div>

      <div className="kitchen-layout">
        <div className="kitchen-sidebar">
          <div className="sidebar-section">
            <h3>Brands</h3>

            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                className="sidebar-btn"
                onClick={() => handleBrandClick(brand)}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <h3>Types</h3>

            <button
              type="button"
              className={`sidebar-btn ${selectedType === "all" ? "active" : ""}`}
              onClick={() => setSelectedType("all")}
            >
              All
            </button>

            {types.map((type) => (
              <button
                key={type}
                type="button"
                className={`sidebar-btn ${selectedType === type ? "active" : ""}`}
                onClick={() => setSelectedType(type)}
              >
                {type.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <h3>Colors</h3>

            <div className="sidebar-color-options">
              <button
                type="button"
                className={`sidebar-color-circle all ${
                  selectedColor === "all" ? "active" : ""
                }`}
                onClick={() => setSelectedColor("all")}
              >
                All
              </button>

              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`sidebar-color-circle ${
                    selectedColor === color ? "active" : ""
                  }`}
                  title={color}
                  aria-label={`Filter ${color}`}
                  style={{ background: getColorSwatch(color) }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Price</h3>

            <input
              type="range"
              min="0"
              max={maxPrice}
              value={Math.min(priceRange[1], maxPrice)}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
            />

            <span>Up to ${Math.min(priceRange[1], maxPrice)}</span>
          </div>
        </div>

        <div className="kitchen-items-grid">
          {filteredItems.map((itemData) => {
            const { item, id, itemId } = itemData;

            const translated = translations[itemId]?.[i18n.language];
            const productName = translated?.name || item?.name;
            const reviewsData = reviews[itemId] || {};

            const colorOptions = getColorOptions(itemData);
            const selectedColorForItem = selectedColorByItem[id];
            const displayImage = getDisplayImage(itemData);
            const currentImages = getCurrentImages(itemData);

            return (
              <div key={id} className="kitchen-card">
                <div className="kitchen-card-media">
                  {currentImages.length > 1 && (
                    <button
                      type="button"
                      className="image-arrow image-arrow-left"
                      aria-label="Previous image"
                      onClick={(e) => handleImageArrow(itemData, "prev", e)}
                    >
                      ‹
                    </button>
                  )}

                  <img
                    className="kitchen-card-image"
                    src={displayImage}
                    alt={productName}
                    onClick={() => handleItemClick(id)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/fallback.png";
                    }}
                  />

                  {currentImages.length > 1 && (
                    <button
                      type="button"
                      className="image-arrow image-arrow-right"
                      aria-label="Next image"
                      onClick={(e) => handleImageArrow(itemData, "next", e)}
                    >
                      ›
                    </button>
                  )}
                </div>

                <div
                  className="kitchen-card-details"
                  onClick={() => handleItemClick(id)}
                >
                  <div className="item-name" title={productName}>
                    {productName?.length > 60
                      ? `${productName.slice(0, 60)}...`
                      : productName}
                  </div>

                  <div className="price-row">
                    <span className="item-price">${item?.usdPrice}</span>

                    {Number(item?.originalPrice || 0) > 0 && (
                      <span className="item-original-price">
                        ${item?.originalPrice}
                      </span>
                    )}
                  </div>

                  {colorOptions.length > 0 && (
                    <div
                      className="kitchen-color-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="kitchen-color-options">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`kitchen-color-circle ${
                              selectedColorForItem === color ? "active" : ""
                            }`}
                            title={color}
                            aria-label={`Select ${color}`}
                            style={{ background: getColorSwatch(color) }}
                            onClick={(e) => handleColorSelect(id, color, e)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className="reviews-row"
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemData(itemData);
                      router.push("/reviewPage");
                    }}
                  >
                    <span className="item-type-stars">
                      {renderStars(reviewsData.averageRating)}
                    </span>

                    <span className="review-count-text">
                      ({reviewsData.count || 0})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ItemHomePage;