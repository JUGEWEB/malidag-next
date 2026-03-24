"use client";

import React, { useState, useEffect } from "react";
import "./BrandDepartment.css";
import axios from "axios";
import { useRouter } from "next/navigation";
import useScreenSize from "../../useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "@/components/checkoutStore"; // adjust path if needed

function Theme1Department({ brandName, department, brandType }) {
  const router = useRouter();
  const { isDesktop } = useScreenSize();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [expandedDeptIndex, setExpandedDeptIndex] = useState(null);
  const [translations, setTranslations] = useState({});
  const [selectedColorByItem, setSelectedColorByItem] = useState({});

  const [brandDetails, setBrandDetails] = useState({
    logo: null,
    headerImage: null,
    theme: null,
  });

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
      console.error(`Error fetching translation for product ${productId}`, error);
    }
  };

  useEffect(() => {
    const lang = i18n.language || "en";
    items.forEach((item) => {
      if (item?.itemId) fetchTranslation(item.itemId, lang);
    });
  }, [items]);

  useEffect(() => {
    const fetchBrandTheme = async () => {
      try {
        const res = await fetch("https://api.malidag.com/api/brands/themes");
        const data = await res.json();

        const brand = Array.isArray(data)
          ? data.find(
              (b) =>
                b?.brandName?.trim()?.toLowerCase() ===
                brandName?.trim()?.toLowerCase()
            )
          : null;

        if (brand) {
          setBrandDetails({
            logo: brand?.logo || null,
            headerImage: brand?.headerImage || null,
            theme: brand?.theme || null,
          });
        }
      } catch (err) {
        console.error("Theme fetch error:", err);
      }
    };

    if (brandName) {
      fetchBrandTheme();
    }
  }, [brandName]);

  useEffect(() => {
    if (!brandName) return;

    fetch(`https://api.malidag.com/api/brands/${brandName}`)
      .then((res) => res.json())
      .then((data) =>
        setDepartments(Array.isArray(data?.departments) ? data.departments : [])
      )
      .catch((err) => console.error("Department fetch error:", err));
  }, [brandName]);

  useEffect(() => {
    if (!department || !brandType || !brandName) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    axios
      .get(`https://api.malidag.com/api/brands/${brandName}/items`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        const filtered = data.filter((item) => {
          const itemDepartment = item?.item?.department?.trim()?.toLowerCase() || "";
          const itemBrandType = item?.item?.brandType?.trim()?.toLowerCase() || "";
          const targetDepartment = department?.trim()?.toLowerCase() || "";
          const targetBrandType = brandType?.trim()?.toLowerCase() || "";

          return (
            itemDepartment === targetDepartment &&
            itemBrandType === targetBrandType
          );
        });

        const initialColors = {};
        filtered.forEach((product) => {
          const colorKeys = Object.keys(product?.item?.imagesVariants || {});
          if (colorKeys.length > 0) {
            initialColors[product.id] = colorKeys[0];
          }
        });

        setSelectedColorByItem(initialColors);
        setItems(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load items");
        setLoading(false);
      });
  }, [department, brandType, brandName]);

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    return (
      translations?.[itemId]?.[lang]?.name ||
      item?.item?.name ||
      "Unnamed product"
    );
  };

  const handleRoute = (depName, brand) => {
    router.push(
      `/${brandDetails?.theme?.toLowerCase()}department/${encodeURIComponent(
        depName || ""
      )}/${encodeURIComponent(brand || "")}/${encodeURIComponent(
        brandName || ""
      )}`
    );
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.item?.imagesVariants || {});
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();
    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  };

  const getDisplayImage = (product) => {
    const selectedColor = selectedColorByItem[product.id];
    const variants = product?.item?.imagesVariants || {};

    if (selectedColor && variants[selectedColor]?.[0]) {
      return variants[selectedColor][0];
    }

    return product?.item?.images?.[0] || "/fallback.png";
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
      "sky blue": "#38bdf8",
      skyblue: "#38bdf8",
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

  const renderStars = (rating) => {
    const safeRating = Math.round(Number(rating) || 0);
    return (
      <div className="bd-stars-container">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < safeRating ? "bd-star filled" : "bd-star empty"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleAddToBasketPreview = (product, selectedColor, selectedImage, e) => {
    e.stopPropagation();
    setItemData({
      ...product,
      selectedColor,
      selectedImage,
    });
  };

  const renderProductCard = (item) => {
    const selectedColor = selectedColorByItem[item.id];
    const colorOptions = getColorOptions(item);
    const displayImage = getDisplayImage(item);

    return (
      <div key={item.id} className="bd-item-card">
        <div
          className="bd-item-media"
          onClick={() => router.push(`/product/${item.id}`)}
        >
          <img
            src={displayImage}
            alt={item?.item?.name || "Product"}
            className="bd-item-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/fallback.png";
            }}
          />
        </div>

        <div
          className="bd-item-info"
          onClick={() => router.push(`/product/${item.id}`)}
        >
          <div className="bd-item-price-row">
            <span className="bd-item-price">${item?.item?.usdPrice || "0"}</span>
          </div>

          <div className="bd-item-name">
            {getTranslatedName(item, item.itemId)?.length > 70
              ? `${getTranslatedName(item, item.itemId).slice(0, 70)}...`
              : getTranslatedName(item, item.itemId)}
          </div>

          {colorOptions.length > 0 && (
            <div className="bd-color-block" onClick={(e) => e.stopPropagation()}>
              <div className="bd-color-label">
                Color: <span>{selectedColor}</span>
              </div>

              <div className="bd-color-options">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`bd-color-circle ${
                      selectedColor === color ? "active" : ""
                    }`}
                    title={color}
                    aria-label={`Select ${color}`}
                    style={{ background: getColorSwatch(color) }}
                    onClick={(e) => handleColorSelect(item.id, color, e)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="bd-item-rating">
            {renderStars(item?.item?.rating || 0)}
          </div>

          <button
            type="button"
            className="bd-add-basket-btn"
            onClick={(e) =>
              handleAddToBasketPreview(item, selectedColor, displayImage, e)
            }
          >
            Add to Basket
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bd-wrapper">
      <div className="bd-container">
        {isDesktop ? (
          <>
            <aside className="bd-sidebar">
              <div className="bd-sidebar-inner">
                {brandDetails?.logo ? (
                  <img
                    src={brandDetails.logo}
                    alt={`${brandName} Logo`}
                    className="bd-logo"
                  />
                ) : null}

                <div className="bd-sidebar-title">{t("departments_label")}</div>

                <div className="bd-type-list">
                  {departments.map((dep, index) => (
                    <div key={index} className="bd-department-block">
                      <div className="bd-department-name">{t(dep?.name)}</div>

                      <div className="bd-brandtype-list">
                        {(dep?.brandTypes || []).map((brand, bIndex) => {
                          const isActive =
                            brand === brandType && dep?.name === department;

                          return (
                            <div
                              key={bIndex}
                              className={`bd-type-item ${isActive ? "active" : ""}`}
                              onClick={() => handleRoute(dep?.name, brand)}
                            >
                              {t(brand)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <main className="bd-main">
              {loading && <p className="bd-message">{t("loading")}</p>}
              {error && (
                <p className="bd-message bd-error">
                  {t("error_label")}: {error}
                </p>
              )}

              <div className="bd-item-grid">{items.map(renderProductCard)}</div>
            </main>
          </>
        ) : (
          <div className="bd-mobile">
            {brandDetails?.logo ? (
              <img
                src={brandDetails.logo}
                alt={`${brandName} Logo`}
                className="bd-mobile-logo"
              />
            ) : null}

            <div className="bd-mobile-type-list">
              {departments.map((dep, index) => (
                <div key={index} className="bd-mobile-department">
                  <div
                    className="bd-mobile-department-title"
                    onClick={() =>
                      setExpandedDeptIndex(expandedDeptIndex === index ? null : index)
                    }
                  >
                    {t(dep?.name)}
                  </div>

                  {expandedDeptIndex === index && (
                    <div className="bd-mobile-dropdown">
                      {(dep?.brandTypes || []).map((brand, bIndex) => (
                        <div
                          key={bIndex}
                          className="bd-mobile-dropdown-item"
                          onClick={() => handleRoute(dep?.name, brand)}
                        >
                          {t(brand)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {loading && <p className="bd-message">{t("loading")}</p>}
            {error && (
              <p className="bd-message bd-error">
                {t("error_label")}: {error}
              </p>
            )}

            <div className="bd-item-grid mobile">{items.map(renderProductCard)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Theme1Department;