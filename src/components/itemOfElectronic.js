"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./itemOfElectronic.css";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";
import colorSwatches from "../../lib/colors.json";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

function ItemOfElectronic({ itemClicked }) {
  const router = useRouter();
  const params = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [basketItems, setBasketItems] = useState([]);
  const [brandThemes, setBrandThemes] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedType, setSelectedType] = useState("");
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});

  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const setItemData = useCheckoutStore((state) => state.setItemData);
  const setSelectedBrandName = useCheckoutStore(
    (state) => state.setSelectedBrandName
  );

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replaceAll("-", "_")
      .replaceAll(" ", "_");

  const routeType = params?.itemClicked;
  const currentType = normalizeText(itemClicked || routeType);

  useEffect(() => {
    if (currentType) {
      setSelectedType(currentType);
    }
  }, [currentType]);

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

  const isItemInBasket = (itemId) => getBasketQuantity(itemId) > 0;

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

        setReviews((prev) => ({
          ...prev,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${BASE_URL}/items`);

        const fetchedItems = Array.isArray(response.data)
          ? response.data
          : response.data.items || [];

        const electronicItems = fetchedItems.filter((itemData) => {
          const category = normalizeText(
            itemData?.category || itemData?.details?.category
          );

          return category === "electronic" || category === "electronics";
        });

        setItems(electronicItems);

        electronicItems.forEach((itemData) => {
          fetchReviews(itemData.itemId);
        });
      } catch (error) {
        console.error("Error fetching electronic items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    const fetchBrandThemes = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/brands/themes`);
        setBrandThemes(response.data || []);
      } catch (error) {
        console.error("Failed to fetch brand themes:", error);
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

  const getColorOptions = (itemData) => {
    return Object.keys(itemData?.item?.imagesVariants || {});
  };

  const getCurrentImages = (itemData) => {
    const variants = itemData?.item?.imagesVariants || {};
    const selectedColorForItem = selectedColorByItem[itemData.id];

    if (selectedColorForItem && Array.isArray(variants[selectedColorForItem])) {
      return sortImages(variants[selectedColorForItem]);
    }

    const firstColor = Object.keys(variants)[0];

    if (firstColor && Array.isArray(variants[firstColor])) {
      return sortImages(variants[firstColor]);
    }

    return itemData?.item?.images || [];
  };

  const getDisplayImage = (itemData) => {
    const images = getCurrentImages(itemData);
    const index = selectedImageIndexByItem[itemData.id] || 0;

    return (
      getImageUrl(images[index]) ||
      getImageUrl(itemData?.item?.images?.[0]) ||
      "/fallback.png"
    );
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
          .map(
            (x) =>
              x?.item?.type ||
              x?.item?.brandType ||
              x?.details?.type ||
              x?.details?.brandType
          )
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

  const electronicBrandThemes = useMemo(() => {
    const brandNames = new Set(brands.map((brand) => normalizeText(brand)));

    return brandThemes.filter((brand) =>
      brandNames.has(normalizeText(brand?.brandName))
    );
  }, [brandThemes, brands]);

  const maxPrice = useMemo(() => {
    const prices = items.map((x) => Number(x?.item?.usdPrice || 0));
    return Math.ceil(Math.max(...prices, 100));
  }, [items]);

  const filteredItems = useMemo(() => {
    const activeType = normalizeText(selectedType || currentType);

    return items.filter((itemData) => {
      const item = itemData.item || {};
      const price = Number(item?.usdPrice || 0);

      const itemType = normalizeText(
        item?.type ||
          item?.brandType ||
          itemData?.details?.type ||
          itemData?.details?.brandType
      );

      const matchesBrand =
        selectedBrand === "all" ||
        normalizeText(item?.brand || itemData?.details?.brand) ===
          selectedBrand;

      const matchesType =
        activeType === "all" || !activeType || itemType === activeType;

      const matchesColor =
        selectedColor === "all" ||
        Object.keys(item?.imagesVariants || {}).includes(selectedColor);

      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesBrand && matchesType && matchesColor && matchesPrice;
    });
  }, [items, selectedBrand, selectedType, selectedColor, priceRange, currentType]);

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

  const handleImageArrow = (itemData, direction, e) => {
    e.stopPropagation();

    const images = getCurrentImages(itemData);
    if (images.length <= 1) return;

    setSelectedImageIndexByItem((prev) => {
      const current = prev[itemData.id] || 0;
      const next =
        direction === "next"
          ? (current + 1) % images.length
          : (current - 1 + images.length) % images.length;

      return {
        ...prev,
        [itemData.id]: next,
      };
    });
  };

  const getEstimatedDeliveryDay = (daysToAdd = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return `${weekday} ${date.getDate()}`;
  };

  const handleNavigate = (id) => {
    if (id) router.push(`/product/${id}`);
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
          brandPrice: item.brandPrice || details.brandPrice,
          quantity: 1,
          shippingCountry: details?.country || "",
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

  const readableTitle = currentType
    ? currentType.replaceAll("_", " ")
    : "electronics";

  if (loading) {
    return <div className="electronic-loading">{t("loading")}</div>;
  }

  return (
    <main className="electronic-page-wrapper">
      {contextHolder}

      {electronicBrandThemes.length > 0 && (
        <section className="electronic-brand-top">
          {electronicBrandThemes.map((brand) => (
            <button
              key={brand.brandName}
              type="button"
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
        </section>
      )}

      <section className="electronic-hero-row">
        <div>
          <p className="electronic-eyebrow">Malidag Electronics</p>
          <h1 className="electronic-title">{readableTitle}</h1>
        </div>

        <div className="electronic-count">{filteredItems.length} items</div>
      </section>

      <section className="electronic-mobile-filters">
        <div className="electronic-scroll-filters">
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

        <div className="electronic-scroll-filters">
          <button
            className={selectedType === "all" ? "active-filter" : ""}
            onClick={() => setSelectedType("all")}
          >
            All
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

        <div className="electronic-price-mobile">
          <input
            type="range"
            min="0"
            max={maxPrice}
            value={Math.min(priceRange[1], maxPrice)}
            onChange={(e) => setPriceRange([0, Number(e.target.value)])}
          />
          <span>Max: ${Math.min(priceRange[1], maxPrice)}</span>
        </div>
      </section>

      <section className="electronic-layout">
        <aside className="electronic-sidebar">
          <div className="electronic-sidebar-section">
            <h3>Brands</h3>

            <button
              className={`electronic-sidebar-btn ${
                selectedBrand === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedBrand("all")}
            >
              All
            </button>

            {brands.map((brand) => (
              <button
                key={brand}
                className={`electronic-sidebar-btn ${
                  selectedBrand === normalizeText(brand) ? "active" : ""
                }`}
                onClick={() => setSelectedBrand(normalizeText(brand))}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="electronic-sidebar-section">
            <h3>Types</h3>

            <button
              className={`electronic-sidebar-btn ${
                selectedType === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedType("all")}
            >
              All
            </button>

            {types.map((type) => (
              <button
                key={type}
                className={`electronic-sidebar-btn ${
                  selectedType === normalizeText(type) ? "active" : ""
                }`}
                onClick={() => setSelectedType(normalizeText(type))}
              >
                {String(type).replaceAll("_", " ")}
              </button>
            ))}
          </div>

          {colors.length > 0 && (
            <div className="electronic-sidebar-section">
              <h3>Colors</h3>

              <div className="electronic-color-options">
                <button
                  className={`electronic-color-circle all ${
                    selectedColor === "all" ? "active" : ""
                  }`}
                  onClick={() => setSelectedColor("all")}
                >
                  All
                </button>

                {colors.map((color) => {
                  const swatchColor = getColorSwatch(color);

                  return (
                    <button
                      key={color}
                      className={`electronic-color-circle ${
                        selectedColor === color ? "active" : ""
                      }`}
                      title={color}
                      aria-label={`Filter ${color}`}
                      style={swatchColor ? { background: swatchColor } : {}}
                      onClick={() => setSelectedColor(color)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="electronic-sidebar-section">
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

        <div className="electronic-list-wrapper">
          {filteredItems.map((itemData) => {
            const { id, itemId, item } = itemData;
            const {
              name,
              usdPrice,
              originalPrice,
              sold,
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

            return (
              <article
                key={id}
                className="electronic-list-card"
                onClick={() => handleNavigate(id)}
              >
                <div className="electronic-list-media">
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
                          className="electronic-image-arrow electronic-image-arrow-left"
                          onClick={(e) => handleImageArrow(itemData, "prev", e)}
                        >
                          ‹
                        </button>
                      )}

                      <img
                        src={displayImage}
                        alt={name || "Product"}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/fallback.png";
                        }}
                      />

                      {currentImages.length > 1 && (
                        <button
                          type="button"
                          className="electronic-image-arrow electronic-image-arrow-right"
                          onClick={(e) => handleImageArrow(itemData, "next", e)}
                        >
                          ›
                        </button>
                      )}

                      {firstVideoUrl && (
                        <button
                          type="button"
                          className="electronic-play-button"
                          onClick={(e) => handleVideoPlay(id, e)}
                        >
                          ▶
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="electronic-list-details">
                  <div className="electronic-product-brand">
                    {item?.brand || itemData?.details?.brand || "Malidag"}
                  </div>

                  <h3 className="electronic-product-name">{name}</h3>

                  {finalRating && (
                    <div
                      className="electronic-stars"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemData(itemData);
                        router.push(`/product/${id}/review`);
                      }}
                    >
                      <span className="electronic-rating-number">
                        {Number(finalRating).toFixed(1)}/5
                      </span>

                      <span className="electronic-rating-stars">
                        {"★".repeat(Math.round(finalRating))}
                        {"☆".repeat(5 - Math.round(finalRating))}
                      </span>

                      <span className="electronic-review-count">
                        ({reviewsData?.reviewsArray?.length || 0})
                      </span>
                    </div>
                  )}

                  {colorOptions.length > 1 && (
                    <div
                      className="electronic-card-colors"
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
                            className={`electronic-card-color-circle ${
                              selectedColorForItem === color ? "active" : ""
                            }`}
                            title={color}
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
                          className="electronic-more-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(id);
                          }}
                        >
                          +{hiddenColorCount} more
                        </button>
                      )}
                    </div>
                  )}

                  <div className="electronic-delivery-info">
                    <div className="electronic-free-delivery">
                      Free delivery
                    </div>
                    <div className="electronic-delivery-date">
                      Get it by {getEstimatedDeliveryDay(7)}
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

                    {sold && (
                      <div className="electronic-sold-badge">{sold} sold</div>
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
                      🛒 {getBasketQuantity(itemId)}
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
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default ItemOfElectronic;