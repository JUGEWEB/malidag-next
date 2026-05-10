"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./fashionForAllPage.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "./checkoutStore";

function ItemFashionPage() {
  const [brandGroups, setBrandGroups] = useState([]);
  const [topItemsPerBrand, setTopItemsPerBrand] = useState({});
  const [bestSellersByBrand, setBestSellersByBrand] = useState({});
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall } = useScreenSize();
   const [reviews, setReviews] = useState({}); // Store reviews data
   const { push } = useRouter();
  const [brandThemes, setBrandThemes] = useState([]);
  const [translations, setTranslations] = useState({});
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);
  const setSelectedBrandName = useCheckoutStore((state) => state.setSelectedBrandName);
  const [selectedBrand, setSelectedBrand] = useState("all");
const [selectedType, setSelectedType] = useState("all");
const [selectedColor, setSelectedColor] = useState("all");
const [priceRange, setPriceRange] = useState([0, 10000]);

const [selectedColorByItem, setSelectedColorByItem] = useState({});
const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});

const fetchTranslation = async (productId, lang) => {
  if (translations[productId]?.[lang]) return;
  try {
    const response = await axios.get(`https://api.malidag.com/translate/product/translate/${productId}/${lang}`);
    setTranslations((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [lang]: response.data.translation,
      },
    }));
  } catch (error) {
    console.error(`Error fetching translation for ${productId}:`, error);
  }
};

  // Fetch reviews from the endpoint
                const fetchReviews = async (productId) => {
                  try {
                    const response = await axios.get(`https://api.malidag.com/get-reviews/${productId}`);
                    if (response.data.success) {
                     
                      const reviewsArray = response.data.reviews || [];
                      const totalRating = reviewsArray.reduce((acc, review) => {
                        let rating = parseFloat(review.rating);
                        return acc + (isNaN(rating) ? 4 : rating); // If rating is invalid, treat as 5 stars
                      }, 0);
                      const averageRating = reviewsArray.length ? (totalRating / reviewsArray.length).toFixed(2) : null;
              
                      setReviews((prevReviews) => ({
                        ...prevReviews,
                        [productId]: { averageRating, reviewsArray },
                      }));
              
                    }
                  } catch (error) {
                    console.error("Error fetching reviews:", error);
                  }
                };

                useEffect(() => {
  const fetchBrandThemes = async () => {
    try {
      const res = await fetch("https://api.malidag.com/api/brands/themes");
      const data = await res.json();
      setBrandThemes(data || []);
    } catch (err) {
      console.error("Failed to fetch brand themes", err);
    }
  };
  fetchBrandThemes();
}, []);

  // Fetch brands from clothing, shoes, and bags
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const categories = ["clothing", "shoes", "bags"];
        const brandSets = await Promise.all(
          categories.map((cat) =>
            axios
              .get(`https://api.malidag.com/api/categories/${cat}/brands`)
              .then((res) => res.data?.brands || [])
              .catch(() => [])
          )
        );

        // Merge all brands and remove duplicates by name
        const mergedBrands = Array.from(
          new Map(
            brandSets.flat().map((brand) => [brand.brand, brand])
          ).values()
        );

        setBrandGroups(mergedBrands);
      } catch (error) {
        console.error("Error fetching fashion brands:", error);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchTopItemsAndBestSellers = async () => {
      const itemsMap = {};
      const bestSellerMap = {};
      const allSymbols = new Set();

      await Promise.all(
        brandGroups.map(async (group) => {
          const brandName = group.brand;
          try {
            const topItemsRes = await axios.get(
              `https://api.malidag.com/api/brands/${encodeURIComponent(brandName)}/top-items`
            );
            const bestSellerRes = await axios.get(
              `https://api.malidag.com/api/brands/${encodeURIComponent(brandName)}/best-seller`
            );

            const topItems = topItemsRes.data || [];
           itemsMap[brandName.trim().toLowerCase()] = topItems;


            const bestSellerId = bestSellerRes.data?.id;
            if (bestSellerId) {
              bestSellerMap[brandName] = bestSellerId;
            }

            topItems.forEach((item) => {
              if (item.cryptocurrency) {
                allSymbols.add(item.cryptocurrency);
              }
            });

            const lang = i18n.language || "en";
itemsMap[brandName.trim().toLowerCase()]?.forEach((item) => {
  fetchTranslation(item.itemId, lang);
});


             // Fetch reviews for each item
       topItems.forEach((item) => {
        fetchReviews(item.itemId); // Fetch reviews for each product
      });
          } catch (error) {
            console.warn(`Error fetching items for ${brandName}`, error);
          }
        })
      );

      setTopItemsPerBrand(itemsMap);
      setBestSellersByBrand(bestSellerMap);
      setLoading(false);
    };

    if (brandGroups.length > 0) {
      fetchTopItemsAndBestSellers();
    }
  }, [brandGroups]);

  useEffect(() => {
  const lang = i18n.language || "en";
  Object.values(topItemsPerBrand).flatMap(items =>
    items.forEach(item => fetchTranslation(item.itemId, lang))
  );
}, [i18n.language, topItemsPerBrand]);

const getTranslatedName = (item, itemId) => {
  const lang = i18n.language || "en";
  const translated = translations[itemId]?.[lang]?.name;
  const fallback = item.name;
  const nameToShow = translated || fallback;
  return nameToShow.length > 20 ? nameToShow.substring(0, 20) + "..." : nameToShow;
};

const normalizeBrand = (brand = "") => brand.trim().toLowerCase();

const allFashionItems = useMemo(() => {
  return Object.entries(topItemsPerBrand).flatMap(([brand, items]) =>
    items.map((rawItem) => ({
      id: rawItem.id,
      itemId: rawItem.itemId,
      brand,
      item: {
        name: rawItem.name,
        brand,
        type: rawItem.type,
        images: rawItem.images || [],
        imagesVariants: rawItem.imagesVariants || {},
        usdPrice: rawItem.usdPrice,
        cryptocurrency: rawItem.cryptocurrency,
        sold: rawItem.sold,
      },
    }))
  );
}, [topItemsPerBrand]);

const brands = useMemo(() => {
  return [...new Set(allFashionItems.map((x) => x.brand).filter(Boolean))];
}, [allFashionItems]);

const types = useMemo(() => {
  return [...new Set(allFashionItems.map((x) => x.item.type).filter(Boolean))];
}, [allFashionItems]);

const colors = useMemo(() => {
  const allColors = [];

  allFashionItems.forEach((itemData) => {
    Object.keys(itemData?.item?.imagesVariants || {}).forEach((color) => {
      allColors.push(color);
    });
  });

  return [...new Set(allColors)];
}, [allFashionItems]);

const maxPrice = useMemo(() => {
  const prices = allFashionItems.map((x) => Number(x?.item?.usdPrice || 0));
  return Math.ceil(Math.max(...prices, 100));
}, [allFashionItems]);

const filteredItems = useMemo(() => {
  return allFashionItems.filter((itemData) => {
    const item = itemData.item;
    const price = Number(item?.usdPrice || 0);

    const matchesBrand =
      selectedBrand === "all" || normalizeBrand(itemData.brand) === selectedBrand;

    const matchesType =
      selectedType === "all" || item?.type === selectedType;

    const matchesPrice =
      price >= priceRange[0] && price <= priceRange[1];

    const matchesColor =
      selectedColor === "all" ||
      Object.keys(item?.imagesVariants || {}).includes(selectedColor);

    return matchesBrand && matchesType && matchesPrice && matchesColor;
  });
}, [allFashionItems, selectedBrand, selectedType, selectedColor, priceRange]);

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
    navy: "#1e3a8a",
  };

  return swatches[color] || null;
};

const getColorFilterPreviewImage = (color) => {
  for (const itemData of allFashionItems) {
    const variantImages = sortImages(itemData?.item?.imagesVariants?.[color] || []);
    const firstImage = getImageUrl(variantImages?.[0]);

    if (firstImage) return firstImage;
  }

  return "";
};

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

const getEstimatedDeliveryDay = (daysToAdd = 7) => {
  const date = new Date();

  date.setDate(date.getDate() + daysToAdd);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
};


  const handleItemClick = (id) => {
    if (id) push(`/product/${id}`);
  };

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  return (
  <div className="fashion-page-wrapper">
    <div className="fashion-brand-top">
      {brandThemes
        .filter((b) =>
          Object.keys(topItemsPerBrand).includes(normalizeBrand(b.brandName))
        )
        .map((brand) => (
          <button
            key={brand.brandName}
            className="fashion-brand-logo-card"
            onClick={() => {
              setSelectedBrand(normalizeBrand(brand.brandName));
              setSelectedBrandName(brand.brandName);
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
            className={selectedBrand === normalizeBrand(brand) ? "active-filter" : ""}
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
            {type.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <div className="mobile-color-filters">
        <button
          className={`mobile-color-circle all ${selectedColor === "all" ? "active" : ""}`}
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
            className={`sidebar-btn ${selectedBrand === "all" ? "active" : ""}`}
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
            className={`sidebar-btn ${selectedType === "all" ? "active" : ""}`}
            onClick={() => setSelectedType("all")}
          >
            All
          </button>

          {types.map((type) => (
            <button
              key={type}
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
        {filteredItems.map((itemData) => {
          const { id, itemId, item, brand } = itemData;
          const reviewsData = reviews[itemId] || {};
          const finalRating = reviewsData?.averageRating || null;
          const isBestSeller = id === bestSellersByBrand[brand];
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
                height: isVerySmall ? "230px" : "300px",
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
                alt={item.name}
                style={{
                  width: "100%",
                  height: isVerySmall ? "230px" : "300px",
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

              <div className={isBestSeller ? "fashion-badge best" : "fashion-badge"}>
                {isBestSeller ? t("best_seller") : t("topIt")}
              </div>
            </div>

              <div className="fashion-product-brand">
                {item?.brand || brand}
              </div>

              <div className="fashion-product-name">
                {getTranslatedName(item, itemId)}
              </div>

             {colorOptions.length > 0 && (
                <div
                  className="fashion-color-options"
                  onClick={(e) => e.stopPropagation()}
                >
               {visibleColorOptions.map((color) => {
                  const swatchColor = getColorSwatch(color);

                  const variantImages = sortImages(item?.imagesVariants?.[color] || []);
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

              {brandDelivery?.isFree && (
              <div className="fashion-delivery-info">
                <div className="fashion-free-delivery">
                  Free delivery
                </div>

                <div className="fashion-delivery-date">
                  Get it by{" "}
                  {getEstimatedDeliveryDay(
                    brandDelivery?.estimatedDaysMax || 7
                  )}
                </div>
              </div>
            )}
              <div className="item-price">${item.usdPrice}</div>

            {item?.sold && Number(item.sold) > 0 && (
              <div className="fashion-sold-badge">
                {item.sold}+ sold out worldwide
              </div>
            )}

              <div
                className="item-type-stars"
                onClick={(e) => {
                  e.stopPropagation();
                  if (finalRating) {
                    setItemData(itemData);
                    push("/reviewPage");
                  }
                }}
              >
                {finalRating &&
                  "★".repeat(Math.round(finalRating)) +
                    "☆".repeat(5 - Math.round(finalRating))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
}

export default ItemFashionPage;
