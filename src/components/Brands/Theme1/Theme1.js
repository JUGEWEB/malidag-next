"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useScreenSize from "../../useIsMobile";
import "./Baasploa.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "@/components/checkoutStore";

function Theme1({ brandName }) {
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
  const [hideBestSellerVideo, setHideBestSellerVideo] = useState(false);
  const [reviews, setReviews] = useState({});

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
      const finalRating = reviewList.length > 0 ? total / reviewList.length : 0;

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          rating: finalRating,
          count: reviewList.length,
          reviews: reviewList,
        },
      }));
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}`, error);
      setReviews((prev) => ({
        ...prev,
        [productId]: {
          rating: 0,
          count: 0,
          reviews: [],
        },
      }));
    }
  };

  useEffect(() => {
    const lang = i18n.language || "en";

    topItems.forEach((item) => {
      if (item?.itemId) fetchTranslation(item.itemId, lang);
    });

    if (bestSeller?.itemId) {
      fetchTranslation(bestSeller.itemId, lang);
    }

    brandItems.forEach((item) => {
      if (item?.itemId) fetchTranslation(item.itemId, lang);
    });
  }, [topItems, bestSeller, brandItems]);

  useEffect(() => {
    topItems.forEach((item) => {
      if (item?.itemId) fetchReviews(item.itemId);
    });
  }, [topItems]);

  useEffect(() => {
    brandItems.forEach((item) => {
      if (item?.itemId) fetchReviews(item.itemId);
    });
  }, [brandItems]);

  useEffect(() => {
    if (bestSeller?.itemId) {
      fetchReviews(bestSeller.itemId);
    }
  }, [bestSeller]);

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

  useEffect(() => {
    setHideBestSellerVideo(false);
  }, [bestSeller?.id]);

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
    return translations?.[itemId]?.[lang]?.name || item?.name || "Unnamed product";
  };

  const isSameProduct = (a, b) => {
    if (!a || !b) return false;

    const aIds = [a?.id, a?.itemId].filter(Boolean).map(String);
    const bIds = [b?.id, b?.itemId].filter(Boolean).map(String);

    return aIds.some((id) => bIds.includes(id));
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

  const getFirstValidVideo = (product) => {
    if (!Array.isArray(product?.videos)) return null;

    return (
      product.videos.find((video) => {
        if (typeof video !== "string") return false;

        const cleanVideo = video.trim();
        const lowerVideo = cleanVideo.toLowerCase();

        if (!cleanVideo) return false;
        if (lowerVideo === "null") return false;
        if (lowerVideo === "undefined") return false;
        if (lowerVideo === "false") return false;
        if (lowerVideo === "n/a") return false;

        return (
          cleanVideo.startsWith("http://") ||
          cleanVideo.startsWith("https://") ||
          cleanVideo.startsWith("/")
        );
      }) || null
    );
  };

  const bestSellerVideo = useMemo(() => {
    return bestSeller ? getFirstValidVideo(bestSeller) : null;
  }, [bestSeller]);

  const shouldShowLargeBestSeller = !!bestSellerVideo && !hideBestSellerVideo;

  const filteredTopItems = useMemo(() => {
    const withoutBestSeller = topItems.filter(
      (item) => !isSameProduct(item, bestSeller)
    );

    return withoutBestSeller.filter((item, index, arr) => {
      return index === arr.findIndex((x) => isSameProduct(x, item));
    });
  }, [topItems, bestSeller]);

  const shoeItems = useMemo(() => {
    return filteredTopItems.filter((item) => {
      const dept = item?.department?.trim()?.toLowerCase() || "";
      return (
        dept === "men-shoes" ||
        dept === "women-shoes" ||
        dept === "mwomen-shoes"
      );
    });
  }, [filteredTopItems]);

  const otherItems = useMemo(() => {
    return filteredTopItems.filter((item) => {
      const dept = item?.department?.trim()?.toLowerCase() || "";
      return (
        dept !== "men-shoes" &&
        dept !== "women-shoes" &&
        dept !== "mwomen-shoes"
      );
    });
  }, [filteredTopItems]);

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

  const renderStars = (rating, item) => {
    const safeRating = Math.round(Number(rating) || 0);

    return (
      <div
        className="th1-stars-container"
        onClick={(e) => {
          e.stopPropagation();
          setItemData(item);
          router.push("/reviewPage");
        }}
        style={{ cursor: "pointer" }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < safeRating ? "th1-star filled" : "th1-star empty"}
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

  const renderProductCard = (item, options = {}) => {
    const { isTop = false, badgeText = "" } = options;

    const selectedColor = selectedColorByItem[item.id];
    const colorOptions = getColorOptions(item);
    const displayImage = getDisplayImage(item);
    const discountPercentage = getDiscountPercentage(
      item?.usdPrice,
      item?.originalPrice
    );

    const productReview = reviews[item?.itemId] || {
      rating: item?.rating || 0,
      count: 0,
    };

    return (
      <div key={item.id} className="th1-item-card">
        <div
          className="th1-item-media"
          onClick={() => router.push(`/product/${item.id}`)}
        >
          {badgeText ? (
            <div className="th1-image-badge th1-image-badge-best">{badgeText}</div>
          ) : isTop ? (
            <div className="th1-image-badge th1-image-badge-top">Top</div>
          ) : null}

          {discountPercentage > 0 && (
            <div className="th1-image-badge th1-image-badge-discount">
              -{discountPercentage}%
            </div>
          )}

          <img
            src={displayImage}
            alt={item?.name || "Product"}
            className="th1-item-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/fallback.png";
            }}
          />
        </div>

        <div
          className="th1-item-info"
          onClick={() => router.push(`/product/${item.id}`)}
        >
          <div className="th1-item-price-row">
            <span className="th1-item-price">${item?.usdPrice || "0"}</span>

            {Number(item?.originalPrice || 0) > 0 && (
              <span className="th1-item-original-price">
                ${Number(item.originalPrice).toFixed(2)}
              </span>
            )}
          </div>

          <div className="th1-item-name">
            {getTranslatedName(item, item.itemId)?.length > 70
              ? `${getTranslatedName(item, item.itemId).slice(0, 70)}...`
              : getTranslatedName(item, item.itemId)}
          </div>

          {colorOptions.length > 0 && (
            <div className="th1-color-block" onClick={(e) => e.stopPropagation()}>
              <div className="th1-color-label">
                Color: <span>{selectedColor}</span>
              </div>

              <div className="th1-color-options">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`th1-color-circle ${
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

          <div className="th1-item-rating">
            {renderStars(productReview.rating, item)}
            {productReview.count > 0 && (
              <span className="th1-review-count">({productReview.count})</span>
            )}
          </div>

          <button
            type="button"
            className="th1-add-basket-btn"
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

  const renderBestSellerCard = () => {
    if (!bestSeller || !shouldShowLargeBestSeller) return null;

    const bestSellerReview = reviews[bestSeller?.itemId] || {
      rating: bestSeller?.rating || 0,
      count: 0,
    };

    return (
      <div className="th1-best-seller-section">
        <div className="th1-best-video-card">
          <div
            className="th1-video-container"
            onClick={() => router.push(`/product/${bestSeller.id}`)}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              controls
              onError={() => setHideBestSellerVideo(true)}
            >
              <source src={bestSellerVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        <div className="th1-best-image-card">
          <div
            className="th1-best-image-wrap"
            onClick={() => router.push(`/product/${bestSeller.id}`)}
          >
            <div className="th1-image-badge th1-image-badge-best">Best Seller</div>

            <img
              src={getDisplayImage(bestSeller)}
              alt={bestSeller.name}
              className="th1-best-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/fallback.png";
              }}
            />
          </div>

          <div className="th1-item-info">
            <div className="th1-item-price-row">
              <span className="th1-item-price">${bestSeller?.usdPrice || "0"}</span>

              {Number(bestSeller?.originalPrice || 0) > 0 && (
                <span className="th1-item-original-price">
                  ${Number(bestSeller.originalPrice).toFixed(2)}
                </span>
              )}
            </div>

            <div className="th1-item-name">
              {getTranslatedName(bestSeller, bestSeller.itemId)}
            </div>

            {getColorOptions(bestSeller).length > 0 && (
              <div className="th1-color-block" onClick={(e) => e.stopPropagation()}>
                <div className="th1-color-label">
                  Color: <span>{selectedColorByItem[bestSeller.id]}</span>
                </div>

                <div className="th1-color-options">
                  {getColorOptions(bestSeller).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`th1-color-circle ${
                        selectedColorByItem[bestSeller.id] === color ? "active" : ""
                      }`}
                      title={color}
                      aria-label={`Select ${color}`}
                      style={{ background: getColorSwatch(color) }}
                      onClick={(e) => handleColorSelect(bestSeller.id, color, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="th1-item-rating">
              {renderStars(bestSellerReview.rating, bestSeller)}
              {bestSellerReview.count > 0 && (
                <span className="th1-review-count">({bestSellerReview.count})</span>
              )}
            </div>

            <button
              type="button"
              className="th1-add-basket-btn"
              onClick={(e) =>
                handleAddToBasketPreview(
                  bestSeller,
                  selectedColorByItem[bestSeller.id],
                  getDisplayImage(bestSeller),
                  e
                )
              }
            >
              Add to Basket
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBestSellerSmallCard = () => {
    if (!bestSeller || shouldShowLargeBestSeller) return null;

    return (
      <div className={`th1-item-grid ${!isDesktop ? "mobile" : ""}`}>
        {renderProductCard(bestSeller, { badgeText: "Best Seller" })}
      </div>
    );
  };

  const renderDepartmentItems = () => {
    return (
      <div className="th1-department-view">
        <div className="th1-department-toolbar">
          <button
            type="button"
            className="th1-back-btn"
            onClick={handleBackToHome}
          >
            ← {t("back") || "Back"}
          </button>

          <div className="th1-department-current">
            <span>{t(selectedDepartment) || selectedDepartment}</span>
            <span className="th1-department-separator"> / </span>
            <span>{t(selectedBrandType) || selectedBrandType}</span>
          </div>
        </div>

        {departmentItemsLoading && (
          <p className="th1-message">{t("loading") || "Loading..."}</p>
        )}

        {departmentItemsError && (
          <p className="th1-message th1-error">
            {t("error_label") || "Error"}: {departmentItemsError}
          </p>
        )}

        {!departmentItemsLoading && !departmentItemsError && brandItems.length === 0 && (
          <p className="th1-message">{t("no_items_found") || "No items found"}</p>
        )}

        {!departmentItemsLoading && !departmentItemsError && brandItems.length > 0 && (
          <div className={`th1-item-grid ${!isDesktop ? "mobile" : ""}`}>
            {brandItems.map((item) => renderProductCard(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="th1-wrapper">
      {isDesktop ? (
        <div className="th1-container">
          <aside className="th1-sidebar">
            <div className="th1-sidebar-inner">
              {brandDetails?.logo ? (
                <img
                  src={brandDetails.logo}
                  alt={`${brandName} Logo`}
                  className="th1-logo"
                />
              ) : null}

              <div className="th1-sidebar-title">
                {t("departments_label") || "Departments"}
              </div>

              <div className="th1-type-list">
                {departments.map((department, index) => (
                  <div key={index} className="th1-department-block">
                    <div className="th1-department-name">{t(department?.name)}</div>

                    <div className="th1-brandtype-list">
                      {(department?.brandTypes || []).map((brandType, bIndex) => {
                        const isActive =
                          selectedDepartment === department?.name &&
                          selectedBrandType === brandType;

                        return (
                          <div
                            key={bIndex}
                            className={`th1-type-item ${isActive ? "active" : ""}`}
                            onClick={() =>
                              handleBrandTypeClick(department?.name, brandType)
                            }
                          >
                            {t(brandType)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="th1-main">
            <div className="th1-header">
              {brandDetails?.headerImage ? (
                <img
                  src={brandDetails.headerImage}
                  alt={`${brandName} Header`}
                  className="th1-header-image"
                />
              ) : null}
              <div className="th1-header-title">{brandName}</div>
            </div>

            {selectedDepartment && selectedBrandType ? (
              renderDepartmentItems()
            ) : (
              <>
                {shoeItems.length > 0 && (
                  <div className="th1-item-grid">
                    {shoeItems.map((item) => renderProductCard(item, { isTop: true }))}
                  </div>
                )}

                {renderBestSellerCard()}
                {renderBestSellerSmallCard()}

                {otherItems.length > 0 && (
                  <div className="th1-item-grid">
                    {otherItems.map((item) => renderProductCard(item, { isTop: true }))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      ) : (
        <div className="th1-mobile">
          <div className="th1-header">
            {brandDetails?.headerImage ? (
              <img
                src={brandDetails.headerImage}
                alt={`${brandName} Header`}
                className="th1-header-image"
              />
            ) : null}
            <div className="th1-header-title">{brandName}</div>
          </div>

          <div className="th1-mobile-nav">
            {brandDetails?.logo ? (
              <img
                src={brandDetails.logo}
                alt={`${brandName} Logo`}
                className="th1-mobile-logo"
              />
            ) : null}

            <div className="th1-mobile-type-list">
              {departments.map((department, index) => (
                <div key={index} className="th1-mobile-department">
                  <button
                    type="button"
                    className={`th1-mobile-department-title ${
                      expandedDeptIndex === index ? "active" : ""
                    }`}
                    onClick={() =>
                      setExpandedDeptIndex(index === expandedDeptIndex ? null : index)
                    }
                  >
                    {t(department?.name)}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {expandedDeptIndex !== null && (
            <>
              <div
                className="th1-mobile-dropdown-backdrop"
                onClick={() => setExpandedDeptIndex(null)}
              />

              <div className="th1-mobile-dropdown-panel">
                <div className="th1-mobile-dropdown-header">
                  <span className="th1-mobile-dropdown-title">
                    {t(departments?.[expandedDeptIndex]?.name)}
                  </span>

                  <button
                    type="button"
                    className="th1-mobile-dropdown-close"
                    onClick={() => setExpandedDeptIndex(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="th1-mobile-dropdown">
                  {(departments?.[expandedDeptIndex]?.brandTypes || []).map(
                    (brandType, bIndex) => {
                      const isActive =
                        selectedDepartment === departments?.[expandedDeptIndex]?.name &&
                        selectedBrandType === brandType;

                      return (
                        <button
                          key={bIndex}
                          type="button"
                          className={`th1-mobile-dropdown-item ${
                            isActive ? "active" : ""
                          }`}
                          onClick={() =>
                            handleBrandTypeClick(
                              departments?.[expandedDeptIndex]?.name,
                              brandType
                            )
                          }
                        >
                          {t(brandType)}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          )}

          {selectedDepartment && selectedBrandType ? (
            renderDepartmentItems()
          ) : (
            <>
              {renderBestSellerCard()}
              {renderBestSellerSmallCard()}

              {shoeItems.length > 0 && (
                <div className="th1-item-grid mobile">
                  {shoeItems.map((item) => renderProductCard(item, { isTop: true }))}
                </div>
              )}

              {otherItems.length > 0 && (
                <div className="th1-item-grid mobile">
                  {otherItems.map((item) => renderProductCard(item, { isTop: true }))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Theme1;