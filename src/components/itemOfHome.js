"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./itemOfhome.css";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";
import colorSwatches from "../../lib/colors.json";
import { useRouter, useParams } from "next/navigation";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

function ItemOfHome({ itemClicked }) {
  const router = useRouter();
const params = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [beautyImages, setBeautyImages] = useState([]);
  const [basketItems, setBasketItems] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState("all");
  const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
const [selectedType, setSelectedType] = useState("");

const routeType = params?.itemClicked;
  const currentType = normalizeText(itemClicked || routeType);
  const [selectedColor, setSelectedColor] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});
  const [brandThemes, setBrandThemes] = useState([]);

const setSelectedBrandName = useCheckoutStore(
  (state) => state.setSelectedBrandName
);

  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const setItemData = useCheckoutStore((state) => state.setItemData);

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

  useEffect(() => {
    const fetchBeautyImages = async () => {
      if (!itemClicked) return;

      try {
        const response = await axios.get(`${BASE_URL}/home_kitchen/images`);
        const imageData = Array.isArray(response.data) ? response.data : [];

        const filteredImages = imageData.filter(
          (image) =>
            image?.type?.toLowerCase() === itemClicked?.toLowerCase()
        );

        setBeautyImages(filteredImages);
      } catch (error) {
        console.error("Error fetching home images:", error);
      }
    };

    fetchBeautyImages();
  }, [itemClicked]);

 useEffect(() => {
  if (currentType) {
    setSelectedType(currentType);
  }
}, [currentType]);

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

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${BASE_URL}/items`);

        const fetchedItems = Array.isArray(response.data)
          ? response.data
          : response.data.items || [];

        const filteredItems = fetchedItems.filter(
          (item) => normalizeText(item.category) === "home_kitchen"
        );

        setItems(filteredItems);

        filteredItems.forEach((item) => {
          fetchReviews(item.itemId);
        });
      } catch (error) {
        console.error("Error fetching home items:", error);
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
          .map((x) => x?.item?.type || x?.item?.brandType || x?.details?.type)
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

  const homeBrandThemes = useMemo(() => {
  const homeBrandNames = new Set(brands.map((brand) => normalizeText(brand)));

  return brandThemes.filter((brand) =>
    homeBrandNames.has(normalizeText(brand?.brandName))
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
      normalizeText(item?.brand || itemData?.details?.brand) === selectedBrand;

    const matchesType =
      activeType === "all" || itemType === activeType;

    const matchesColor =
      selectedColor === "all" ||
      Object.keys(item?.imagesVariants || {}).includes(selectedColor);

    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

    return matchesBrand && matchesType && matchesColor && matchesPrice;
  });
}, [items, selectedBrand, selectedType, selectedColor, priceRange, itemClicked]);

console.log("itemClicked prop:", itemClicked);
console.log("selectedType:", selectedType);
console.log("items length:", items.length);
console.log(
  "types:",
  items.map((x) => ({
    itemType: x?.item?.type,
    brandType: x?.item?.brandType,
    detailsType: x?.details?.type,
    detailsBrandType: x?.details?.brandType,
  }))
);

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

  const handleVideoPlay = (id, e) => {
    e.stopPropagation();
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  const getEstimatedDeliveryDay = (daysToAdd = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return `${weekday} ${date.getDate()}`;
  };

  const handleAddToBasket = async (itemData, e) => {
    e.stopPropagation();

    const currentUser = auth?.currentUser;

    if (!currentUser) {
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "/home";

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

  if (loading) {
    return <div className="home-loading">{t("loading")}</div>;
  }

  return (
    <main className="home-page">
      {contextHolder}

      {beautyImages.length > 0 && (
        <section className="home-hero">
          {beautyImages.map((img, index) => (
            <img
              key={index}
              src={img.imageUrl}
              alt={itemClicked || "Home kitchen"}
              className="home-hero-image"
            />
          ))}
        </section>
      )}

      {homeBrandThemes.length > 0 && (
  <section className="home-brand-top">
    {homeBrandThemes.map((brand) => (
      <button
        key={brand.brandName}
        type="button"
        className="home-brand-logo-card"
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

      <section className="home-top-row">
        <div>
          <p className="home-eyebrow">Malidag Home</p>
          <h1 className="home-title">Home & Kitchen</h1>
        </div>

        <div className="home-count">{filteredItems.length} items</div>
      </section>

      <section className="home-mobile-filters">
        <div className="home-scroll-filters">
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

       <div className="home-scroll-filters">
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

        <div className="home-price-mobile">
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

      <section className="home-layout">
        <aside className="home-sidebar">
          <div className="home-sidebar-section">
            <h3>Brands</h3>

            <button
              className={`home-sidebar-btn ${
                selectedBrand === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedBrand("all")}
            >
              All
            </button>

            {brands.map((brand) => (
              <button
                key={brand}
                className={`home-sidebar-btn ${
                  selectedBrand === normalizeText(brand) ? "active" : ""
                }`}
                onClick={() => setSelectedBrand(normalizeText(brand))}
              >
                {brand}
              </button>
            ))}
          </div>

          <div className="home-sidebar-section">
            <h3>Types</h3>

            <button
              className={`home-sidebar-btn ${
                selectedType === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedType("all")}
            >
              All
            </button>

            {types.map((type) => (
              <button
                key={type}
                className={`home-sidebar-btn ${
                  selectedType === normalizeText(type) ? "active" : ""
                }`}
                onClick={() => setSelectedType(normalizeText(type))}
              >
                {String(type).replaceAll("_", " ")}
              </button>
            ))}
          </div>

          {colors.length > 0 && (
            <div className="home-sidebar-section">
              <h3>Colors</h3>

              <div className="home-color-options">
                <button
                  className={`home-color-circle all ${
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
                      className={`home-color-circle ${
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

          <div className="home-sidebar-section">
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

        <div className="home-grid">
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
                className="home-card"
                onClick={() => handleItemClick(id)}
              >
                <div className="home-media">
                  {activeVideoId === id && firstVideoUrl ? (
                    <video
                      src={firstVideoUrl}
                      controls
                      autoPlay
                      onEnded={handleVideoStop}
                      className="home-item-video"
                    />
                  ) : (
                    <>
                      {currentImages.length > 1 && (
                        <button
                          type="button"
                          className="home-image-arrow home-image-arrow-left"
                          onClick={(e) => handleImageArrow(itemData, "prev", e)}
                        >
                          ‹
                        </button>
                      )}

                      <img
                        src={displayImage}
                        alt={name || "Product"}
                        className="home-item-image"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/fallback.png";
                        }}
                      />

                      {currentImages.length > 1 && (
                        <button
                          type="button"
                          className="home-image-arrow home-image-arrow-right"
                          onClick={(e) => handleImageArrow(itemData, "next", e)}
                        >
                          ›
                        </button>
                      )}

                      {firstVideoUrl && (
                        <button
                          type="button"
                          className="home-play-button"
                          onClick={(e) => handleVideoPlay(id, e)}
                        >
                          ▶
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="home-product-brand">
                  {item?.brand || itemData?.details?.brand || "Malidag"}
                </div>

                <h3 className="home-item-name" title={name}>
                  {name?.length > 42 ? `${name.substring(0, 42)}...` : name}
                </h3>

                {finalRating && (
                  <div
                    className="home-item-stars"
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemData(itemData);
                      router.push(`/product/${id}/review`);
                    }}
                  >
                    <span>{Number(finalRating).toFixed(1)}/5</span>
                    <span>
                      {"★".repeat(Math.round(finalRating))}
                      {"☆".repeat(5 - Math.round(finalRating))}
                    </span>
                    <span>({reviewsData?.reviewsArray?.length || 0})</span>
                  </div>
                )}

                {colorOptions.length > 1 && (
                  <div
                    className="home-card-colors"
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
                          className={`home-card-color-circle ${
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
                        className="home-more-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(id);
                        }}
                      >
                        +{hiddenColorCount} more
                      </button>
                    )}
                  </div>
                )}

                <div className="home-delivery-info">
                  <div className="home-free-delivery">Free delivery</div>
                  <div className="home-delivery-date">
                    Get it by {getEstimatedDeliveryDay(7)}
                  </div>
                </div>

                <div className="home-item-prices">
                  <span className="home-item-price">${usdPrice}</span>

                  {Number(originalPrice) > 0 && (
                    <span className="home-item-original-price">
                      ${originalPrice}
                    </span>
                  )}

                  {sold && <span className="home-item-sold">{sold} sold</span>}
                </div>

                {numberOfItems && Number(numberOfItems) > 0 && (
                  <div className="home-stock-badge">
                    {numberOfItems} items in stock
                  </div>
                )}

                {isItemInBasket(itemId) ? (
                  <button
                    type="button"
                    className="home-added-cart-btn"
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
                    className="home-add-cart-btn"
                    onClick={(e) => handleAddToBasket(itemData, e)}
                  >
                    Add to cart
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default ItemOfHome;