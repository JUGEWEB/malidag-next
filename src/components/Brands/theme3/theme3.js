"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./theme3.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "@/components/checkoutStore";

function Theme3({ brandName }) {
  const router = useRouter();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [brandDetails, setBrandDetails] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [allBrandItems, setAllBrandItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [selectedColorByItem, setSelectedColorByItem] = useState({});

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeKey = (value = "") =>
    String(value).trim().toLowerCase().replace(/\s+/g, "_");

  const themeConfig = brandDetails?.themeConfig || {};

  const normalizeBrandItem = (product) => {
    const source = product?.item || {};

    return {
      id: product?.id || "",
      itemId: product?.itemId || source?.id || "",
      name: source?.name || "",
      images: Array.isArray(source?.images) ? source.images : [],
      videos: Array.isArray(source?.videos) ? source.videos : [],
      department: source?.department || "",
      brandType: source?.brandType || "",
      usdPrice: source?.usdPrice || product?.usdPrice || 0,
      originalPrice: source?.originalPrice || product?.originalPrice || 0,
      rating: source?.rating || product?.rating || 0,
      imagesVariants: source?.imagesVariants || {},
      rawItem: product,
    };
  };

  useEffect(() => {
    const fetchTheme3Data = async () => {
      try {
        setLoading(true);

        const [themesRes, departmentsRes, itemsRes] = await Promise.all([
          fetch("https://api.malidag.com/api/brands/themes"),
          fetch(`https://api.malidag.com/api/brands/${brandName}`),
          fetch(`https://api.malidag.com/api/brands/${brandName}/items`),
        ]);

        const themesData = await themesRes.json();
        const departmentsData = await departmentsRes.json();
        const itemsData = await itemsRes.json();

        const foundBrand = Array.isArray(themesData)
          ? themesData.find(
              (brand) =>
                brand?.brandName?.trim()?.toLowerCase() ===
                brandName?.trim()?.toLowerCase()
            )
          : null;

        const normalizedItems = Array.isArray(itemsData)
          ? itemsData.map(normalizeBrandItem)
          : [];

        const initialColors = {};
        normalizedItems.forEach((product) => {
          const colorKeys = Object.keys(product?.imagesVariants || {}).filter(
            (key) => key.toLowerCase() !== "variants"
          );

          if (colorKeys.length > 0) {
            initialColors[product.id] = colorKeys[0];
          }
        });

        setBrandDetails(foundBrand);
        setDepartments(
          Array.isArray(departmentsData?.departments)
            ? departmentsData.departments
            : []
        );
        setAllBrandItems(normalizedItems);
        setSelectedColorByItem(initialColors);
      } catch (error) {
        console.error("Theme3 fetch error:", error);
        setBrandDetails(null);
        setDepartments([]);
        setAllBrandItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme3Data();
  }, [brandName]);

  const fetchTranslation = async (productId, lang) => {
    if (!productId || translations?.[productId]?.[lang]) return;

    try {
      const response = await fetch(
        `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
      );
      const data = await response.json();

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: data?.translation || {},
        },
      }));
    } catch (error) {
      console.error("Translation error:", error);
    }
  };

  const fetchReviews = async (productId) => {
    if (!productId || reviews[productId]) return;

    try {
      const response = await fetch(
        `https://api.malidag.com/get-reviews/${productId}`
      );
      const data = await response.json();

      const reviewList = Array.isArray(data?.reviews) ? data.reviews : [];
      const total = reviewList.reduce(
        (sum, review) => sum + Number(review?.rating || 0),
        0
      );

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          rating: reviewList.length ? total / reviewList.length : 0,
          count: reviewList.length,
        },
      }));
    } catch (error) {
      console.error("Reviews error:", error);
    }
  };

  useEffect(() => {
    const lang = i18n.language || "en";

    allBrandItems.forEach((item) => {
      fetchTranslation(item.itemId, lang);
      fetchReviews(item.itemId);
    });
  }, [allBrandItems]);

  const departmentTiles = useMemo(() => {
    return departments.map((department) => {
      const key = normalizeKey(department?.name);
      const config = themeConfig?.departments?.[key] || {};

      return {
        ...department,
        key,
        image:
          config?.image ||
          themeConfig?.defaultDepartmentImage ||
          brandDetails?.headerImage ||
          "/fallback.png",
        title: config?.title || t(department?.name) || department?.name,
        subtitle: config?.subtitle || "",
      };
    });
  }, [departments, themeConfig, brandDetails, t]);

  const selectedDepartmentData = useMemo(() => {
    if (!selectedDepartment) return null;

    return departments.find(
      (department) =>
        normalizeKey(department?.name) === normalizeKey(selectedDepartment)
    );
  }, [departments, selectedDepartment]);

  const typeTiles = useMemo(() => {
    const brandTypes = selectedDepartmentData?.brandTypes || [];

    return brandTypes.map((type) => {
      const key = normalizeKey(type);
      const config = themeConfig?.types?.[key] || {};

      return {
        rawType: type,
        key,
        image:
          config?.image ||
          themeConfig?.defaultTypeImage ||
          themeConfig?.defaultDepartmentImage ||
          "/fallback.png",
        title: config?.title || t(type) || type,
        subtitle: config?.subtitle || "",
      };
    });
  }, [selectedDepartmentData, themeConfig, t]);

  const selectedTypeConfig = useMemo(() => {
    if (!selectedType) return {};

    return themeConfig?.types?.[normalizeKey(selectedType)] || {};
  }, [selectedType, themeConfig]);

  const typeProducts = useMemo(() => {
    if (!selectedDepartment || !selectedType) return [];

    const departmentKey = normalizeKey(selectedDepartment);
    const typeKey = normalizeKey(selectedType);

    return allBrandItems.filter(
      (item) =>
        normalizeKey(item.department) === departmentKey &&
        normalizeKey(item.brandType) === typeKey
    );
  }, [allBrandItems, selectedDepartment, selectedType]);

  const getTranslatedName = (item) => {
    const lang = i18n.language || "en";

    return (
      translations?.[item.itemId]?.[lang]?.name ||
      item?.name ||
      "Unnamed product"
    );
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.imagesVariants || {}).filter(
      (key) => key.toLowerCase() !== "variants"
    );
  };

  const getVariantImageUrl = (variant) => {
    if (typeof variant === "string") return variant;
    if (variant?.url) return variant.url;
    return null;
  };

  const getDisplayImage = (product) => {
    const selectedColor = selectedColorByItem[product.id];
    const variants = product?.imagesVariants || {};

    const selectedList = selectedColor ? variants[selectedColor] : null;
    const selectedImage = Array.isArray(selectedList)
      ? getVariantImageUrl(selectedList[0])
      : null;

    if (selectedImage) return selectedImage;

    const firstVariantList = Object.values(variants).find(Array.isArray);
    const firstVariantImage = firstVariantList
      ? getVariantImageUrl(firstVariantList[0])
      : null;

    return firstVariantImage || product?.images?.[0] || "/fallback.png";
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();

    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
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
      multicolor:
        "linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #3b82f6, #a855f7)",
      transparent:
        "linear-gradient(135deg, #ddd 25%, #fff 25%, #fff 50%, #ddd 50%, #ddd 75%, #fff 75%, #fff 100%)",
    };

    return swatches[color] || "#d1d5db";
  };

  const renderStars = (rating, item) => {
    const safeRating = Math.round(Number(rating) || 0);

    return (
      <div
        className="th3-stars"
        onClick={(e) => {
          e.stopPropagation();
          setItemData(item);
          router.push("/reviewPage");
        }}
      >
        {"★".repeat(safeRating)}
        {"☆".repeat(5 - safeRating)}
      </div>
    );
  };

  const renderProductCard = (item) => {
    const selectedColor = selectedColorByItem[item.id];
    const colorOptions = getColorOptions(item);
    const displayImage = getDisplayImage(item);
    const translatedName = getTranslatedName(item);
    const productReview = reviews[item.itemId] || {
      rating: item.rating || 0,
      count: 0,
    };

    return (
      <div
        key={item.id}
        className="th3-product-card"
        onClick={() => router.push(`/product/${item.id}`)}
      >
        <div className="th3-product-media">
          <img
            src={displayImage}
            alt={translatedName}
            className="th3-product-image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/fallback.png";
            }}
          />
        </div>

        <div className="th3-product-info">
          <div className="th3-product-price-row">
            <span className="th3-product-price">
              ${Number(item?.usdPrice || 0).toFixed(2)}
            </span>

            {Number(item?.originalPrice || 0) > 0 && (
              <span className="th3-product-original-price">
                ${Number(item?.originalPrice || 0).toFixed(2)}
              </span>
            )}
          </div>

          <div className="th3-product-name">
            {translatedName.length > 70
              ? `${translatedName.slice(0, 70)}...`
              : translatedName}
          </div>

          <div className="th3-product-rating">
            {renderStars(productReview.rating, item)}
            {productReview.count > 0 && (
              <span className="th3-review-count">({productReview.count})</span>
            )}
          </div>

          {colorOptions.length > 0 && (
            <div
              className="th3-color-options"
              onClick={(e) => e.stopPropagation()}
            >
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`th3-color-circle ${
                    selectedColor === color ? "active" : ""
                  }`}
                  title={color}
                  aria-label={`Select ${color}`}
                  style={{ background: getColorSwatch(color) }}
                  onClick={(e) => handleColorSelect(item.id, color, e)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHero = () => (
    <section className="th3-hero">
      {brandDetails?.headerImage && (
        <img
          src={brandDetails.headerImage}
          alt={brandName}
          className="th3-hero-image"
        />
      )}

      <div className="th3-hero-overlay">
        {brandDetails?.logo && (
          <img src={brandDetails.logo} alt={brandName} className="th3-logo" />
        )}

        <h1>{brandName}</h1>
      </div>
    </section>
  );

  const renderDepartmentsPage = () => (
    <main className="th3-main">
      <section className="th3-tile-grid">
        {departmentTiles.map((department) => (
          <button
            key={department.key}
            type="button"
            className="th3-large-tile"
            onClick={() => {
              setSelectedDepartment(department.name);
              setSelectedType(null);
            }}
          >
            <img src={department.image} alt={department.title} />

            <div className="th3-tile-overlay">
              {department.title && <h2>{department.title}</h2>}
              {department.subtitle && <p>{department.subtitle}</p>}
            </div>
          </button>
        ))}
      </section>
    </main>
  );

  const renderTypesPage = () => (
    <main className="th3-main">
      <div className="th3-toolbar">
        <button type="button" onClick={() => setSelectedDepartment(null)}>
          ← Back
        </button>

        <h2>{t(selectedDepartment) || selectedDepartment}</h2>
      </div>

      <section className="th3-tile-grid">
        {typeTiles.map((type) => (
          <button
            key={type.key}
            type="button"
            className="th3-large-tile"
            onClick={() => setSelectedType(type.rawType)}
          >
            <img src={type.image} alt={type.title} />

            <div className="th3-tile-overlay">
              {type.title && <h2>{type.title}</h2>}
              {type.subtitle && <p>{type.subtitle}</p>}
            </div>
          </button>
        ))}
      </section>
    </main>
  );

  const renderTypeProductsPage = () => {
    const heroImage =
      selectedTypeConfig?.heroImage ||
      themeConfig?.defaultTypeHeroImage ||
      themeConfig?.defaultTypeImage ||
      brandDetails?.headerImage ||
      "/fallback.png";

    const title =
      selectedTypeConfig?.title || t(selectedType) || selectedType || brandName;

    const subtitle = selectedTypeConfig?.subtitle || "";

    return (
      <main className="th3-main">
        <div className="th3-toolbar">
          <button type="button" onClick={() => setSelectedType(null)}>
            ← Back
          </button>

          <button type="button" onClick={() => setSelectedDepartment(null)}>
            All Departments
          </button>
        </div>

        <section className="th3-type-hero">
          <img src={heroImage} alt={title} />

          <div className="th3-type-hero-overlay">
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        </section>

        {typeProducts.length > 0 ? (
          <section className="th3-product-grid">
            {typeProducts.map((item) => renderProductCard(item))}
          </section>
        ) : (
          <p className="th3-empty">No products found.</p>
        )}
      </main>
    );
  };

  if (loading) {
    return <div className="th3-loading">Loading...</div>;
  }

  return (
    <div className="th3-wrapper">
      {!selectedType && renderHero()}

      {!selectedDepartment && renderDepartmentsPage()}

      {selectedDepartment && !selectedType && renderTypesPage()}

      {selectedDepartment && selectedType && renderTypeProductsPage()}
    </div>
  );
}

export default Theme3;