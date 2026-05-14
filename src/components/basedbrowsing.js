"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import "./fashionForAllPage.css";
import "./basedbrowsing.css";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { AppContext } from "./appContext";
import { useCheckoutStore } from "./checkoutStore";
import colorSwatches from "../../lib/colors.json";

const BASE_URL = "https://api.malidag.com";

function Browsing() {
  const appContext = useContext(AppContext);
  const user = appContext?.user || null;

  const router = useRouter();
  const { t } = useTranslation();

  const setSelectedBrandName = useCheckoutStore(
    (state) => state.setSelectedBrandName
  );

  const [userSearchHistory, setUserSearchHistory] = useState([]);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [brandThemes, setBrandThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState({});
  const [reviews, setReviews] = useState({});

  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});

  const normalizeBrand = (brand = "") => brand.trim().toLowerCase();

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

      return posA - posB;
    });
  };

  const getColorSwatch = (colorName = "") => {
    const color = colorName.trim().toLowerCase();
    return colorSwatches[color] || null;
  };

  const getEstimatedDeliveryDay = (daysToAdd = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return `${weekday} ${date.getDate()}`;
  };

  const fetchTranslation = async (productId, lang) => {
    if (!productId || translations[productId]?.[lang]) return;

    try {
      const response = await fetch(
        `${BASE_URL}/translate/product/translate/${productId}/${lang}`
      );
      const data = await response.json();

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: data.translation,
        },
      }));
    } catch (error) {
      console.error(`Error fetching translation for product ${productId}`, error);
    }
  };

  const fetchReviews = async (productId) => {
    if (!productId || reviews[productId]) return;

    try {
      const response = await fetch(`${BASE_URL}/get-reviews/${productId}`);
      const data = await response.json();

      if (data.success) {
        const reviewsArray = data.reviews || [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
    }
  };

  useEffect(() => {
    const fetchBrandThemes = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/brands/themes`);
        const data = await res.json();
        setBrandThemes(data || []);
      } catch (err) {
        console.error("Failed to fetch brand themes", err);
      }
    };

    fetchBrandThemes();
  }, []);

  useEffect(() => {
    const fetchUserSearchHistory = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/search-items?userId=${user.uid}`);
        const data = await response.json();

        setUserSearchHistory(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.userSearches)
            ? data.userSearches
            : []
        );
      } catch (error) {
        console.error("Error fetching user search history:", error);
        setUserSearchHistory([]);
      }
    };

    fetchUserSearchHistory();
  }, [user?.uid]);

  useEffect(() => {
    const fetchSuggestedItems = async () => {
      if (!userSearchHistory.length) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`${BASE_URL}/items`);
        const data = await response.json();

        const itemsArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        const terms = userSearchHistory
          .map((s) =>
            String(s.search || "")
              .toLowerCase()
              .replace(/\+/g, " ")
              .trim()
          )
          .filter(Boolean);

        const matchedItems = itemsArray.filter((itemData) =>
          terms.some((term) => {
            const item = itemData?.item || {};

            const searchBlob = [
              item?.name,
              item?.type,
              item?.theme,
              item?.brand,
              itemData?.category,
              itemData?.details?.category,
              itemData?.details?.brand,
              itemData?.details?.brandType,
              itemData?.details?.department,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchBlob.includes(term);
          })
        );

        setSuggestedItems(matchedItems);

        const lang = i18n.language || "en";

        matchedItems.forEach((itemData) => {
          if (itemData?.itemId) {
            fetchTranslation(itemData.itemId, lang);
            fetchReviews(itemData.itemId);
          }
        });
      } catch (error) {
        console.error("Error fetching suggested items:", error);
        setSuggestedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedItems();
  }, [userSearchHistory]);

  useEffect(() => {
    const lang = i18n.language || "en";

    suggestedItems.forEach((itemData) => {
      if (itemData?.itemId) fetchTranslation(itemData.itemId, lang);
    });
  }, [suggestedItems, i18n.language]);

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    const translated = translations[itemId]?.[lang]?.name;
    const fallback = item?.name || "Product";
    const nameToShow = translated || fallback;

    return nameToShow.length > 20
      ? nameToShow.substring(0, 20) + "..."
      : nameToShow;
  };

  const allBrowsingItems = useMemo(() => {
    return suggestedItems.map((itemData) => {
      const item = itemData?.item || {};

      return {
        ...itemData,
        brand: normalizeBrand(
          item?.brand || itemData?.details?.brand || "Malidag"
        ),
        item: {
          ...item,
          brand: item?.brand || itemData?.details?.brand || "Malidag",
          type: item?.type || itemData?.details?.brandType || itemData?.category,
          images: item?.images || [],
          imagesVariants: item?.imagesVariants || {},
          usdPrice: item?.usdPrice || 0,
          sold: item?.sold,
        },
      };
    });
  }, [suggestedItems]);

  const brands = useMemo(() => {
    return [...new Set(allBrowsingItems.map((x) => x.brand).filter(Boolean))];
  }, [allBrowsingItems]);

  const types = useMemo(() => {
    return [...new Set(allBrowsingItems.map((x) => x.item.type).filter(Boolean))];
  }, [allBrowsingItems]);

  const colors = useMemo(() => {
    const allColors = [];

    allBrowsingItems.forEach((itemData) => {
      Object.keys(itemData?.item?.imagesVariants || {}).forEach((color) => {
        allColors.push(color);
      });
    });

    return [...new Set(allColors)];
  }, [allBrowsingItems]);

  const maxPrice = useMemo(() => {
    const prices = allBrowsingItems.map((x) => Number(x?.item?.usdPrice || 0));
    return Math.ceil(Math.max(...prices, 100));
  }, [allBrowsingItems]);

  const filteredItems = useMemo(() => {
    return allBrowsingItems.filter((itemData) => {
      const item = itemData.item;
      const price = Number(item?.usdPrice || 0);

      const matchesBrand =
        selectedBrand === "all" || normalizeBrand(itemData.brand) === selectedBrand;

      const matchesType = selectedType === "all" || item?.type === selectedType;

      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      const matchesColor =
        selectedColor === "all" ||
        Object.keys(item?.imagesVariants || {}).includes(selectedColor);

      return matchesBrand && matchesType && matchesPrice && matchesColor;
    });
  }, [allBrowsingItems, selectedBrand, selectedType, selectedColor, priceRange]);

  const getColorFilterPreviewImage = (color) => {
    for (const itemData of allBrowsingItems) {
      const variantImages = sortImages(itemData?.item?.imagesVariants?.[color] || []);
      const firstImage = getImageUrl(variantImages?.[0]);

      if (firstImage) return firstImage;
    }

    return "";
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.item?.imagesVariants || {});
  };

  const getCurrentImages = (product) => {
    const variants = product?.item?.imagesVariants || {};
    const selectedColorForItem = selectedColorByItem[product.id];

    if (selectedColorForItem && Array.isArray(variants[selectedColorForItem])) {
      return sortImages(variants[selectedColorForItem]);
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

    return (
      getImageUrl(images[index]) ||
      getImageUrl(product?.item?.images?.[0]) ||
      "/fallback.png"
    );
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

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  return (
    <div className="fashion-page-wrapper browsing-page-wrapper">
      <div className="fashion-brand-top">
        {brandThemes
          .filter((b) =>
            brands.includes(normalizeBrand(b.brandName))
          )
          .map((brand) => (
            <button
              key={brand.brandName}
              className="fashion-brand-logo-card"
              onClick={() => {
                const themeRoute = brand?.theme?.trim()?.toLowerCase();

                if (!themeRoute || !brand?.brandName) return;

                setSelectedBrandName(brand.brandName);

                router.push(
                  `/brand/${themeRoute}/${encodeURIComponent(brand.brandName)}`
                );
              }}
            >
              <img src={brand.logo} alt={`${brand.brandName} logo`} />
            </button>
          ))}
      </div>

      <div className="mobile-filters-wrapper">
        <div className="mobile-scroll-filters">
          <button
            className={selectedBrand === "all" ? "active-filter" : ""}
            onClick={() => setSelectedBrand("all")}
          >
            All Brands
          </button>

          {brands.map((brand) => (
            <button
              key={brand}
              className={
                selectedBrand === normalizeBrand(brand) ? "active-filter" : ""
              }
              onClick={() => setSelectedBrand(normalizeBrand(brand))}
            >
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
              {String(type).replaceAll("_", " ")}
            </button>
          ))}
        </div>

        <div className="mobile-color-filters">
          <button
            className={`mobile-color-circle all ${
              selectedColor === "all" ? "active" : ""
            }`}
            onClick={() => setSelectedColor("all")}
          >
            All
          </button>

          {colors.map((color) => {
            const swatchColor = getColorSwatch(color);
            const previewImage = getColorFilterPreviewImage(color);

            return (
              <button
                key={color}
                className={`mobile-color-circle ${
                  selectedColor === color ? "active" : ""
                }`}
                title={color}
                aria-label={`Filter ${color}`}
                style={
                  swatchColor
                    ? { background: swatchColor }
                    : {
                        backgroundImage: `url("${previewImage}")`,
                        backgroundSize: "300%",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }
                }
                onClick={() => setSelectedColor(color)}
              />
            );
          })}
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

      <div className="fashion-layout">
        <aside className="fashion-sidebar">
          <div className="sidebar-section">
            <h3>Brands</h3>

            <button
              className={`sidebar-btn ${
                selectedBrand === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedBrand("all")}
            >
              All
            </button>

            {brands.map((brand) => (
              <button
                key={brand}
                className={`sidebar-btn ${
                  selectedBrand === normalizeBrand(brand) ? "active" : ""
                }`}
                onClick={() => setSelectedBrand(normalizeBrand(brand))}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <h3>Types</h3>

            <button
              className={`sidebar-btn ${
                selectedType === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedType("all")}
            >
              All
            </button>

            {types.map((type) => (
              <button
                key={type}
                className={`sidebar-btn ${
                  selectedType === type ? "active" : ""
                }`}
                onClick={() => setSelectedType(type)}
              >
                {String(type).replaceAll("_", " ")}
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <h3>Colors</h3>

            <div className="sidebar-color-options">
              <button
                className={`sidebar-color-circle all ${
                  selectedColor === "all" ? "active" : ""
                }`}
                onClick={() => setSelectedColor("all")}
              >
                All
              </button>

              {colors.map((color) => {
                const swatchColor = getColorSwatch(color);
                const previewImage = getColorFilterPreviewImage(color);

                return (
                  <button
                    key={color}
                    className={`sidebar-color-circle ${
                      selectedColor === color ? "active" : ""
                    }`}
                    title={color}
                    aria-label={`Filter ${color}`}
                    style={
                      swatchColor
                        ? { background: swatchColor }
                        : {
                            backgroundImage: `url("${previewImage}")`,
                            backgroundSize: "300%",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }
                    }
                    onClick={() => setSelectedColor(color)}
                  />
                );
              })}
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
        </aside>

        <div className="fashion-items-grid">
          {filteredItems.length > 0 ? (
            filteredItems.map((itemData) => {
              const { id, item, itemId, brand } = itemData;

              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating || null;

              const colorOptions = getColorOptions(itemData);
              const selectedColorForItem = selectedColorByItem[id];
              const displayImage = getDisplayImage(itemData);
              const currentImages = getCurrentImages(itemData);

              const brandDelivery =
                brandThemes?.find(
                  (x) =>
                    x?.brandName?.trim()?.toLowerCase() ===
                    brand?.trim()?.toLowerCase()
                )?.delivery || null;

              const visibleColorOptions = colorOptions.slice(0, 3);
              const hiddenColorCount = Math.max(colorOptions.length - 3, 0);

              return (
                <div
                  key={id}
                  className="fashion-card"
                  onClick={() => handleItemClick(id)}
                >
                  <div
                    className="fashion-card-media"
                    style={{
                      background: "white",
                      zIndex: "1",
                      paddingTop: "20px",
                      filter: "brightness(0.97)",
                      width: "100%",
                      height: "300px",
                      marginBottom: "10px",
                      marginTop: "10px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
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
                      src={displayImage}
                      alt={item?.name || "Product"}
                      style={{
                        width: "100%",
                        height: "300px",
                        objectFit: "contain",
                        display: "block",
                      }}
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

                    <div className="fashion-badge">{t("topIt")}</div>
                  </div>

                  <div className="fashion-product-brand">
                    {item?.brand || brand}
                  </div>

                  <div className="fashion-product-name">
                    {getTranslatedName(item, itemId)}
                  </div>

                  {colorOptions.length > 1 && (
                    <div
                      className="fashion-color-options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {visibleColorOptions.map((color) => {
                        const swatchColor = getColorSwatch(color);
                        const variantImages = sortImages(
                          item?.imagesVariants?.[color] || []
                        );
                        const firstVariantImage = getImageUrl(variantImages?.[0]);

                        return (
                          <button
                            key={color}
                            type="button"
                            className={`fashion-color-circle ${
                              selectedColorForItem === color ? "active" : ""
                            }`}
                            title={color}
                            aria-label={`Select ${color}`}
                            onClick={(e) => handleColorSelect(id, color, e)}
                            style={
                              swatchColor
                                ? { background: swatchColor }
                                : {
                                    backgroundImage: `url("${firstVariantImage}")`,
                                    backgroundSize: "300%",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                  }
                            }
                          />
                        );
                      })}

                      {hiddenColorCount > 0 && (
                        <button
                          type="button"
                          className="more-colors-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(id);
                          }}
                        >
                          +{hiddenColorCount} colors more
                        </button>
                      )}
                    </div>
                  )}

                  {(brandDelivery?.isFree || !brandDelivery) && (
                    <div className="fashion-delivery-info">
                      <div className="fashion-free-delivery">Free delivery</div>

                      <div className="fashion-delivery-date">
                        Get it by{" "}
                        {getEstimatedDeliveryDay(
                          brandDelivery?.estimatedDaysMax || 7
                        )}
                      </div>
                    </div>
                  )}

                  <div className="item-price">
                    <span className="price-currency">$</span>
                    {item?.usdPrice || 0}
                  </div>

                  {item?.sold && Number(item.sold) > 0 && (
                    <div className="fashion-sold-badge">
                      {item.sold}+ sold out worldwide
                    </div>
                  )}

                  <div
                    className="item-type-stars"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (finalRating) router.push(`/product/${id}/review`);
                    }}
                  >
                    {finalRating &&
                      "★".repeat(Math.round(finalRating)) +
                        "☆".repeat(5 - Math.round(finalRating))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-items">{t("no_browsing_recommendations")}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Browsing;