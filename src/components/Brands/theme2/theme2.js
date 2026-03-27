"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useScreenSize from "../../useIsMobile";
import "./theme2.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "@/components/checkoutStore";

function Theme2({ brandName }) {
  const router = useRouter();
  const { isDesktop } = useScreenSize();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [departments, setDepartments] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [bestSeller, setBestSeller] = useState(null);
  const [brandItems, setBrandItems] = useState([]);
  const [departmentItemsLoading, setDepartmentItemsLoading] = useState(false);
  const [departmentItemsError, setDepartmentItemsError] = useState(null);

  const [brandDetails, setBrandDetails] = useState({
    headerImage: null,
    logo: null,
  });

  const [expandedDeptIndex, setExpandedDeptIndex] = useState(null);
  const [translations, setTranslations] = useState({});
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedBrandType, setSelectedBrandType] = useState(null);

  const normalizeTopItem = (product) => ({
    id: product?.id || "",
    itemId: product?.itemId || "",
    name: product?.name || "",
    images: Array.isArray(product?.images) ? product.images : [],
    videos: Array.isArray(product?.videos) ? product.videos : [],
    department: product?.department || "",
    brandType: product?.brandType || "",
    usdPrice: product?.usdPrice || product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    rating: product?.rating || 0,
    imagesVariants: product?.imagesVariants || {},
  });

  const normalizeBestSeller = (product) => {
    const source = product?.item || {};

    return {
      id: product?.id || "",
      itemId: product?.itemId || "",
      name: source?.name || "",
      images: Array.isArray(source?.images) ? source.images : [],
      videos: Array.isArray(source?.videos) ? source.videos : [],
      department: source?.department || product?.details?.department || "",
      brandType: source?.brandType || product?.details?.brandType || "",
      usdPrice: source?.usdPrice || product?.usdPrice || 0,
      originalPrice: source?.originalPrice || product?.originalPrice || 0,
      rating: source?.rating || product?.rating || 0,
      imagesVariants: source?.imagesVariants || {},
      rawItem: product,
    };
  };

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

    topItems.forEach((item) => {
      if (item?.itemId) fetchTranslation(item.itemId, lang);
    });

    brandItems.forEach((item) => {
      if (item?.itemId) fetchTranslation(item.itemId, lang);
    });

    if (bestSeller?.itemId) {
      fetchTranslation(bestSeller.itemId, lang);
    }
  }, [topItems, brandItems, bestSeller]);

  useEffect(() => {
    const fetchBrandDetails = async () => {
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
            headerImage: brand?.headerImage || null,
            logo: brand?.logo || null,
          });
        }
      } catch (err) {
        console.error("Error fetching brand theme:", err);
      }
    };

    fetchBrandDetails();
  }, [brandName]);

  useEffect(() => {
    fetch(`https://api.malidag.com/api/brands/${brandName}`)
      .then((response) => response.json())
      .then((data) =>
        setDepartments(Array.isArray(data?.departments) ? data.departments : [])
      )
      .catch((error) => {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      });
  }, [brandName]);

  useEffect(() => {
    fetch(`https://api.malidag.com/api/brands/${brandName}/top-items`)
      .then((response) => response.json())
      .then((data) => {
        const normalized = Array.isArray(data) ? data.map(normalizeTopItem) : [];

        const initialColors = {};
        normalized.forEach((product) => {
          const colorKeys = Object.keys(product?.imagesVariants || {});
          if (colorKeys.length > 0) {
            initialColors[product.id] = colorKeys[0];
          }
        });

        setSelectedColorByItem((prev) => ({ ...initialColors, ...prev }));
        setTopItems(normalized);
      })
      .catch((error) => {
        console.error("Error fetching top items:", error);
        setTopItems([]);
      });
  }, [brandName]);

  useEffect(() => {
    fetch(`https://api.malidag.com/api/brands/${brandName}/best-seller`)
      .then((response) => response.json())
      .then((data) => {
        const normalized = data ? normalizeBestSeller(data) : null;

        if (normalized) {
          const colorKeys = Object.keys(normalized?.imagesVariants || {});
          if (colorKeys.length > 0) {
            setSelectedColorByItem((prev) => ({
              ...prev,
              [normalized.id]: prev[normalized.id] || colorKeys[0],
            }));
          }
        }

        setBestSeller(normalized);
      })
      .catch((error) => {
        console.error("Error fetching best seller:", error);
        setBestSeller(null);
      });
  }, [brandName]);

  useEffect(() => {
    if (!selectedDepartment || !selectedBrandType || !brandName) {
      setBrandItems([]);
      setDepartmentItemsError(null);
      setDepartmentItemsLoading(false);
      return;
    }

    setDepartmentItemsLoading(true);
    setDepartmentItemsError(null);

    fetch(`https://api.malidag.com/api/brands/${brandName}/items`)
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];

        const normalized = list
          .map(normalizeBrandItem)
          .filter((item) => {
            const itemDepartment = item?.department?.trim()?.toLowerCase() || "";
            const itemBrandType = item?.brandType?.trim()?.toLowerCase() || "";
            const targetDepartment =
              selectedDepartment?.trim()?.toLowerCase() || "";
            const targetBrandType =
              selectedBrandType?.trim()?.toLowerCase() || "";

            return (
              itemDepartment === targetDepartment &&
              itemBrandType === targetBrandType
            );
          });

        const initialColors = {};
        normalized.forEach((product) => {
          const colorKeys = Object.keys(product?.imagesVariants || {});
          if (colorKeys.length > 0) {
            initialColors[product.id] = colorKeys[0];
          }
        });

        setSelectedColorByItem((prev) => ({ ...initialColors, ...prev }));
        setBrandItems(normalized);
        setDepartmentItemsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching department items:", error);
        setBrandItems([]);
        setDepartmentItemsError(error?.message || "Failed to load items");
        setDepartmentItemsLoading(false);
      });
  }, [selectedDepartment, selectedBrandType, brandName]);

  const handleBrandTypeClick = (department, brandType) => {
    setExpandedDeptIndex(null);
    setSelectedDepartment(department);
    setSelectedBrandType(brandType);
  };

  const handleBackToHome = () => {
    setSelectedDepartment(null);
    setSelectedBrandType(null);
    setDepartmentItemsError(null);
    setExpandedDeptIndex(null);
  };

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    return (
      translations?.[itemId]?.[lang]?.name || item?.name || "Unnamed product"
    );
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.imagesVariants || {});
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
    const variants = product?.imagesVariants || {};

    if (selectedColor && variants[selectedColor]?.[0]) {
      return variants[selectedColor][0];
    }

    return product?.images?.[0] || "/fallback.png";
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
      <div className="th2-stars-container">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < safeRating ? "th2-star filled" : "th2-star empty"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getDiscountPercentage = (usdPrice, originalPrice) => {
    const current = Number(usdPrice || 0);
    const original = Number(originalPrice || 0);

    if (!original || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  const handleAddToBasketPreview = (product, selectedColor, selectedImage, e) => {
    e.stopPropagation();
    setItemData({
      ...product,
      selectedColor,
      selectedImage,
    });
  };

  const isSameProduct = (a, b) => {
    if (!a || !b) return false;

    const aIds = [a?.id, a?.itemId].filter(Boolean).map(String);
    const bIds = [b?.id, b?.itemId].filter(Boolean).map(String);

    return aIds.some((id) => bIds.includes(id));
  };

  const renderProductCard = (item, options = {}) => {
    const { isBestSeller = false } = options;

    const selectedColor = selectedColorByItem[item.id];
    const colorOptions = getColorOptions(item);
    const displayImage = getDisplayImage(item);
    const discountPercentage = getDiscountPercentage(
      item?.usdPrice,
      item?.originalPrice
    );

    const videoUrl = item?.videos?.find(
  (v) =>
    typeof v === "string" &&
    /\.(mp4|webm|ogg)$/i.test(v)
);

    const translatedName =
      getTranslatedName(item, item.itemId) || "Unnamed product";

    return (
      <div key={item.id} className="th2-item-card">
        <div
          className="th2-item-media"
          onClick={() => router.push(`/product/${item.id}`)}
        >
          {isBestSeller && (
            <div className="th2-image-badge th2-image-badge-best">
              Best Seller
            </div>
          )}

          {discountPercentage > 0 && (
            <div className="th2-image-badge th2-image-badge-discount">
              -{discountPercentage}%
            </div>
          )}

         {isBestSeller && videoUrl ? (
  <video
    src={videoUrl}
    className="th2-item-image"
    autoPlay
    muted
    loop
    playsInline
  />
) : (
  <img
    src={displayImage}
    alt={item?.name || "Product"}
    className="th2-item-image"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "/fallback.png";
    }}
  />
)}
        </div>

        <div
          className="th2-item-info"
          onClick={() => router.push(`/product/${item.id}`)}
        >
          <div className="th2-item-price-row">
            <span className="th2-item-price">
              ${Number(item?.usdPrice || 0).toFixed(2)}
            </span>

            {discountPercentage > 0 && (
              <span className="th2-deals-badge">Deal</span>
            )}

            {Number(item?.originalPrice || 0) > 0 && (
              <span className="th2-item-original-price">
                ${Number(item?.originalPrice || 0).toFixed(2)}
              </span>
            )}
          </div>

          <div className="th2-item-name">
            {translatedName.length > 70
              ? `${translatedName.slice(0, 70)}...`
              : translatedName}
          </div>

          <div className="th2-item-rating">{renderStars(item?.rating || 0)}</div>

          {colorOptions.length > 0 && (
            <div
              className="th2-color-block"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th2-color-label">
                Color: <span>{selectedColor}</span>
              </div>

              <div className="th2-color-options">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`th2-color-circle ${
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

          <button
            type="button"
            className="th2-add-basket-btn"
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

  const renderDepartmentItems = () => {
    return (
      <section className="th2-section">
        <div className="th2-section-toolbar">

          <button
            type="button"
            className="th2-back-btn"
            onClick={handleBackToHome}
          >
            ← {t("back") || "Back"}
          </button>

          <div className="th2-current-selection">
            <span>{t(selectedDepartment) || selectedDepartment}</span>
            <span className="th2-separator"> / </span>
            <span>{t(selectedBrandType) || selectedBrandType}</span>
          </div>
        </div>

        {departmentItemsLoading && (
          <p className="th2-message">{t("loading") || "Loading..."}</p>
        )}

        {departmentItemsError && (
          <p className="th2-message th2-error">
            {t("error_label") || "Error"}: {departmentItemsError}
          </p>
        )}

        {!departmentItemsLoading &&
          !departmentItemsError &&
          brandItems.length === 0 && (
            <p className="th2-message">
              {t("no_items_found") || "No items found"}
            </p>
          )}

        {!departmentItemsLoading &&
          !departmentItemsError &&
          brandItems.length > 0 && (
            <div className="th2-item-grid">
              {brandItems.map((item) => renderProductCard(item))}
            </div>
          )}
      </section>
    );
  };

  const visibleTopItems = useMemo(() => {
    const uniqueItems = topItems.filter((item, index, arr) => {
      return index === arr.findIndex((x) => isSameProduct(x, item));
    });

    const withoutBestSeller = uniqueItems.filter(
      (item) => !isSameProduct(item, bestSeller)
    );

    return withoutBestSeller;
  }, [topItems, bestSeller]);

  const mixedHomeItems = useMemo(() => {
    return [bestSeller, ...visibleTopItems].filter(Boolean);
  }, [bestSeller, visibleTopItems]);

  return (
    <div className="th2-wrapper">
      <section className="th2-hero">
        {brandDetails?.headerImage ? (
          <img
            src={brandDetails.headerImage}
            alt={`${brandName} Header`}
            className="th2-hero-image"
          />
        ) : null}

        <div className="th2-hero-overlay">
          {brandDetails?.logo ? (
            <img
              src={brandDetails.logo}
              alt={`${brandName} Logo`}
              className="th2-logo"
            />
          ) : null}

          <h1 className="th2-brand-title">{brandName}</h1>
        </div>
      </section>

      <main className="th2-main">
        <section className="th2-nav-section">
          {isDesktop ? (
            <div className="th2-department-row">
              {departments.map((department, index) => (
                <div key={index} className="th2-department-group">
                  <button
                    type="button"
                    className={`th2-department-chip ${
                      selectedDepartment === department?.name ? "active" : ""
                    }`}
                    onClick={() =>
                      setExpandedDeptIndex(
                        expandedDeptIndex === index ? null : index
                      )
                    }
                  >
                    {t(department?.name)}
                  </button>

                  {expandedDeptIndex === index && (
                    <div className="th2-brandtype-dropdown">
                      {(department?.brandTypes || []).map((brandType, bIndex) => {
                        const isActive =
                          selectedDepartment === department?.name &&
                          selectedBrandType === brandType;

                        return (
                          <button
                            key={bIndex}
                            type="button"
                            className={`th2-brandtype-item ${
                              isActive ? "active" : ""
                            }`}
                            onClick={() =>
                              handleBrandTypeClick(department?.name, brandType)
                            }
                          >
                            {t(brandType)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="th2-mobile-nav">
              {departments.map((department, index) => (
                <div key={index} className="th2-mobile-department">
                  <button
                    type="button"
                    className={`th2-mobile-department-title ${
                      expandedDeptIndex === index ? "active" : ""
                    }`}
                    onClick={() =>
                      setExpandedDeptIndex(
                        index === expandedDeptIndex ? null : index
                      )
                    }
                  >
                    {t(department?.name)}
                  </button>

                  {expandedDeptIndex === index && (
                    <div className="th2-mobile-dropdown">
                      {(department?.brandTypes || []).map((brandType, bIndex) => {
                        const isActive =
                          selectedDepartment === department?.name &&
                          selectedBrandType === brandType;

                        return (
                          <button
                            key={bIndex}
                            type="button"
                            className={`th2-mobile-dropdown-item ${
                              isActive ? "active" : ""
                            }`}
                            onClick={() =>
                              handleBrandTypeClick(department?.name, brandType)
                            }
                          >
                            {t(brandType)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedDepartment && selectedBrandType ? (
          renderDepartmentItems()
        ) : (
          <section className="th2-section">
            <div className="th2-item-grid">
              {mixedHomeItems.map((item) =>
                renderProductCard(item, {
                  isBestSeller: isSameProduct(item, bestSeller),
                })
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Theme2;