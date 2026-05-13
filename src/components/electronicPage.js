'use client';

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Head from "next/head";
import "./electronicPage.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import colorSwatches from "../../lib/colors.json";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

function ElectronicPage() {
  const electronicType = "electronic";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [translations, setTranslations] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);

  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});
  const [brandThemes, setBrandThemes] = useState([]);
  const [basketItems, setBasketItems] = useState([]);

  const setSelectedBrandName = useCheckoutStore(
    (state) => state.setSelectedBrandName
  );

  const router = useRouter();
  const { isVerySmall } = useScreenSize();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const readableType = "Electronics";
  const normalizeText = (value) => String(value || "").trim().toLowerCase();

  const fetchTranslation = async (productId, lang) => {
    if (!productId || translations[productId]?.[lang]) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/translate/product/translate/${productId}/${lang}`
      );

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: response.data.translation,
        },
      }));
    } catch (error) {
      console.error(`Error fetching translation for ${productId}`, error);
    }
  };

  const fetchUserBasket = async () => {
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      setBasketItems([]);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/basket/${currentUser.uid}`);
      setBasketItems(response.data.basket || []);
    } catch (error) {
      console.error("Error fetching basket:", error);
      setBasketItems([]);
    }
  };

  const fetchReviews = async (productId) => {
    if (!productId) return;

    try {
      const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

      if (response.data.success) {
        const reviewsArray = response.data.reviews || [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

        setReviews((prevReviews) => ({
          ...prevReviews,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const isElectronicMatch = (itemData) => {
    const details = itemData?.details || {};
    const category = normalizeText(itemData.category || details.category);

    return (
      category === "electronic" ||
      category === "electronics"
    );
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchUserBasket();
    });

    return () => unsubscribe();
  }, []);

  const getBasketQuantity = (itemId) => {
    const basketItem = basketItems.find((item) => item.itemId === itemId);
    return Number(basketItem?.quantity || 0);
  };

  const isItemInBasket = (itemId) => {
    return getBasketQuantity(itemId) > 0;
  };

  useEffect(() => {
    const fetchElectronicItems = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${BASE_URL}/items`);
        const allItems = Array.isArray(response.data) ? response.data : [];
        const fetchedItems = allItems.filter(isElectronicMatch);
        const lang = i18n.language || "en";

        setItems(fetchedItems);

        fetchedItems.forEach((itemData) => {
          if (itemData?.itemId) {
            fetchTranslation(itemData.itemId, lang);
            fetchReviews(itemData.itemId);
          }
        });
      } catch (error) {
        console.error("Error fetching electronic items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchElectronicItems();
  }, [electronicType]);

  useEffect(() => {
    const lang = i18n.language || "en";
    items.forEach((itemData) => fetchTranslation(itemData.itemId, lang));
  }, [i18n.language, items]);

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

  const getColorSwatch = (colorName = "") => {
    const color = colorName.trim().toLowerCase();
    return colorSwatches[color] || null;
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

  const getColorFilterPreviewImage = (color) => {
    for (const itemData of items) {
      const variantImages = sortImages(
        itemData?.item?.imagesVariants?.[color] || []
      );

      const firstImage = getImageUrl(variantImages?.[0]);
      if (firstImage) return firstImage;
    }

    return "";
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

  const brands = useMemo(() => {
    return [
      ...new Set(
        items.map((x) => x?.item?.brand || x?.details?.brand).filter(Boolean)
      ),
    ];
  }, [items]);

  const types = useMemo(() => {
    return [
      ...new Set(
        items
          .map((x) => x?.item?.type || x?.item?.brandType)
          .filter(Boolean)
      ),
    ];
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
    const prices = items.map((x) => Number(x?.item?.usdPrice || 0));
    return Math.ceil(Math.max(...prices, 100));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((itemData) => {
      const item = itemData.item || {};
      const price = Number(item?.usdPrice || 0);
      const itemType = normalizeText(item?.type || item?.brandType);

      const matchesBrand =
        selectedBrand === "all" ||
        normalizeText(item?.brand || itemData?.details?.brand) === selectedBrand;

      const matchesType =
        selectedType === "all" ||
        itemType === selectedType ||
        itemType.includes(selectedType);

      const matchesColor =
        selectedColor === "all" ||
        Object.keys(item?.imagesVariants || {}).includes(selectedColor);

      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesBrand && matchesType && matchesColor && matchesPrice;
    });
  }, [items, selectedBrand, selectedType, selectedColor, priceRange]);

  const electronicBrandThemes = useMemo(() => {
    const electronicBrandNames = new Set(
      brands.map((brand) => normalizeText(brand))
    );

    return brandThemes.filter((brand) =>
      electronicBrandNames.has(normalizeText(brand?.brandName))
    );
  }, [brandThemes, brands]);

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    const translated = translations[itemId]?.[lang]?.name;
    const fallback = item?.name || "Electronic item";
    const nameToShow = translated || fallback;

    return nameToShow.length > 20
      ? `${nameToShow.substring(0, 20)}...`
      : nameToShow;
  };

  const getEstimatedDeliveryDay = (daysToAdd = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const day = date.getDate();

    return `${weekday} ${day}`;
  };

  const handleVideoPlay = (id, e) => {
    e.stopPropagation();
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleAddToBasket = async (itemData, e) => {
    e.stopPropagation();

    const currentUser = auth?.currentUser;

    if (!currentUser) {
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname
          : "/electronic";

      router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      const item = itemData?.item || {};
      const details = itemData?.details || {};
      const colorOptions = getColorOptions(itemData);

      const selectedColorForBasket =
        selectedColorByItem[itemData.id] || colorOptions?.[0] || null;

      const variantImages = item?.imagesVariants?.[selectedColorForBasket] || [];

      const basketImage =
        getImageUrl(sortImages(variantImages)?.[0]) ||
        getImageUrl(item?.images?.[0]);

      const basketItem = {
        userId: currentUser.uid,

        item: {
          id: itemData.id,
          itemId: itemData.itemId,
          name: item.name,
          price: Number(item.usdPrice || 0),
          color: selectedColorForBasket,
          size: null,
          image: basketImage,
          brand: item.brand || details.brand,
          brandPrice: item.brandPrice,
          quantity: 1,
          shippingCountry: details?.country || itemData?.details?.country || "",
          selectedCountry: "",
          eurText: details?.eurText || "",
          poundText: details?.poundText || "",
          brlText: details?.brlText || "",
          tryText: details?.tryText || "",
          audText: details?.audText || "",
          sarText: details?.sarText || "",
        },
      };

      const response = await axios.post(BASKET_API, basketItem);

      if (response.status === 200 || response.status === 201) {
        await fetchUserBasket();
        messageApi.success(`${item.name} added to cart`);
      } else {
        messageApi.error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding item to basket:", error);
      messageApi.error("Error adding to cart");
    }
  };

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  if (!items || items.length === 0) {
    return <div className="no-results-message">No electronics found.</div>;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${readableType} store - Malidag`,
    url: "https://www.malidag.com/electronic",
    description: "Browse electronics and devices on Malidag.",
    publisher: {
      "@type": "Organization",
      name: "Malidag",
      url: "https://www.malidag.com",
    },
  };

  return (
    <>
      <Head>
        <title>{readableType} store | Malidag</title>
        <meta
          name="description"
          content="Shop electronics and devices on Malidag."
        />
        <link rel="canonical" href="https://www.malidag.com/electronic" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      {contextHolder}

      <div className="electronic-page-wrapper">
        <div className="electronic-brand-top">
          {electronicBrandThemes.map((brand) => (
            <button
              key={brand.brandName}
              className="electronic-brand-logo-card"
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

        <div className="electronic-hero-row">
          <div>
            <div className="electronic-eyebrow">Malidag Electronics</div>
            <h1>{readableType} store</h1>
          </div>

          <div className="electronic-count">{filteredItems.length} items</div>
        </div>

        <div className="mobile-filters-wrapper electronic-mobile-filters">
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
                  selectedBrand === normalizeText(brand) ? "active-filter" : ""
                }
                onClick={() => setSelectedBrand(normalizeText(brand))}
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
                className={
                  selectedType === normalizeText(type) ? "active-filter" : ""
                }
                onClick={() => setSelectedType(normalizeText(type))}
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
                      : { backgroundImage: `url("${previewImage}")` }
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

        <div className="electronic-layout">
          <aside className="electronic-sidebar">
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
                    selectedBrand === normalizeText(brand) ? "active" : ""
                  }`}
                  onClick={() => setSelectedBrand(normalizeText(brand))}
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
                    selectedType === normalizeText(type) ? "active" : ""
                  }`}
                  onClick={() => setSelectedType(normalizeText(type))}
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
                          : { backgroundImage: `url("${previewImage}")` }
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

          <div className="electronic-items-grid">
            {filteredItems.map((itemData) => {
              const { id, itemId, item } = itemData;
              const {
                name,
                usdPrice,
                originalPrice,
                numberOfItems,
                videos,
              } = item || {};

              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData.averageRating;
              const colorOptions = getColorOptions(itemData);
              const selectedColorForItem = selectedColorByItem[id];
              const displayImage = getDisplayImage(itemData);
              const currentImages = getCurrentImages(itemData);
              const normalizedVideos = Array.isArray(videos) ? videos : [videos];

              const firstVideoUrl = normalizedVideos.find(
                (video) => typeof video === "string" && video.endsWith(".mp4")
              );

              const visibleColorOptions = colorOptions.slice(0, 3);
              const hiddenColorCount = Math.max(colorOptions.length - 3, 0);

              const brandDelivery =
                brandThemes?.find(
                  (x) =>
                    x?.brandName?.trim()?.toLowerCase() ===
                    (item?.brand || itemData?.details?.brand || "")
                      ?.trim()
                      ?.toLowerCase()
                )?.delivery || null;

              return (
                <div
                  key={id}
                  className="electronic-card"
                  onClick={() => handleItemClick(id)}
                >
                  <div className="electronic-card-media">
                    {activeVideoId === id && firstVideoUrl ? (
                      <video
                        src={firstVideoUrl}
                        controls
                        autoPlay
                        onEnded={handleVideoStop}
                      />
                    ) : (
                      <>
                        {currentImages.length > 1 && (
                          <button
                            type="button"
                            className="image-arrow image-arrow-left"
                            aria-label="Previous image"
                            onClick={(e) =>
                              handleImageArrow(itemData, "prev", e)
                            }
                          >
                            ‹
                          </button>
                        )}

                        <img
                          src={displayImage}
                          alt={name}
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
                            onClick={(e) =>
                              handleImageArrow(itemData, "next", e)
                            }
                          >
                            ›
                          </button>
                        )}

                        {firstVideoUrl && (
                          <button
                            type="button"
                            className="electronic-play-button"
                            aria-label="Play product video"
                            onClick={(e) => handleVideoPlay(id, e)}
                          >
                            ▶
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="electronic-product-brand">
                    {item?.brand || itemData?.details?.brand || "Malidag"}
                  </div>

                  <div
                    className="electronic-product-name"
                    title={getTranslatedName(item, itemId)}
                  >
                    {getTranslatedName(item, itemId)}
                  </div>

                  {finalRating && (
                    <div
                      className="electronic-stars"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/product/${id}/review`);
                      }}
                      title={t("view_reviews")}
                    >
                      <span className="electronic-rating-number">
                        {Number(finalRating).toFixed(1)}/5
                      </span>

                      <span className="electronic-rating-stars">
                        {"★".repeat(Math.round(finalRating))}
                        {"☆".repeat(5 - Math.round(finalRating))}
                      </span>

                      <span className="electronic-review-count">
                        ({reviewsData?.reviewsArray?.length || 0} reviews)
                      </span>
                    </div>
                  )}

                  {colorOptions.length > 1 && (
                    <div
                      className="electronic-color-options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {visibleColorOptions.map((color) => {
                        const swatchColor = getColorSwatch(color);
                        const variantImages = sortImages(
                          item?.imagesVariants?.[color] || []
                        );

                        const firstVariantImage = getImageUrl(
                          variantImages?.[0]
                        );

                        return (
                          <button
                            key={color}
                            type="button"
                            className={`electronic-color-circle ${
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

                  <div className="electronic-delivery-info">
                    {brandDelivery?.isFree && (
                      <div className="electronic-free-delivery">
                        Free delivery
                      </div>
                    )}

                    <div className="electronic-delivery-date">
                      Get it by{" "}
                      {getEstimatedDeliveryDay(
                        brandDelivery?.estimatedDaysMin || 7
                      )}
                    </div>
                  </div>

                  <div className="electronic-price-row">
                    <div className="electronic-price">
                      <span>$</span>
                      {usdPrice}
                    </div>

                    {Number(originalPrice) > 0 && (
                      <div className="electronic-original-price">
                        ${originalPrice}
                      </div>
                    )}
                  </div>

                  {numberOfItems && Number(numberOfItems) > 0 && (
                    <div className="electronic-stock-badge">
                      {numberOfItems} items in stock
                    </div>
                  )}

                  {isItemInBasket(itemId) ? (
                    <button
                      type="button"
                      className="electronic-added-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/basket");
                      }}
                    >
                      <span className="electronic-cart-icon">🛒</span>
                      <span className="electronic-cart-added-text">
                        {getBasketQuantity(itemId)}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="electronic-add-cart-btn"
                      onClick={(e) => handleAddToBasket(itemData, e)}
                    >
                      Add to cart
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default ElectronicPage;