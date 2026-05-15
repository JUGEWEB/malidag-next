"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import "./itemOfWomen.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";
import colorSwatches from "../../lib/colors.json";

const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

function ItemOfWomen() {
  const router = useRouter();
  const params = useParams();
  const { itemClicked } = params;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [beautyImages, setBeautyImages] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [reviews, setReviews] = useState({});
  const [selectedBrand, setSelectedBrand] = useState("all");
const [selectedColor, setSelectedColor] = useState("all");
const [priceRange, setPriceRange] = useState([0, 10000]);
const [basketItems, setBasketItems] = useState([]);
const [brandThemes, setBrandThemes] = useState([]);
const [selectedColorByItem, setSelectedColorByItem] = useState({});
const [selectedImageIndexByItem, setSelectedImageIndexByItem] = useState({});
const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { isMobile, isDesktop, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall } =
    useScreenSize();

  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const setSelectedBrandName = useCheckoutStore(
  (state) => state.setSelectedBrandName
);
const [messageApi, contextHolder] = message.useMessage();

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(`https://api.malidag.com/get-reviews/${productId}`);
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
    const fetchBeautyImages = async () => {
      try {
        const response = await axios.get("https://api.malidag.com/women/images");
        const filteredImages = response.data.filter(
          (image) => (image.type || "").toLowerCase() === (itemClicked || "").toLowerCase()
        );
        setBeautyImages(filteredImages);
      } catch (error) {
        console.error("Error fetching beauty images:", error);
      }
    };

    fetchBeautyImages();
  }, [itemClicked]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
       const response = await axios.get(`${BASE_URL}/items`);

const allItems = Array.isArray(response.data) ? response.data : [];

const filteredItems = allItems.filter((itemData) => {
  const item = itemData?.item || {};
  const details = itemData?.details || {};

  const genre = normalizeText(item.genre || details.genre);
  const type = normalizeText(
    item.type || item.brandType || details.type || details.brandType
  );

  return genre === "women" && type === normalizeText(itemClicked);
});

setItems(filteredItems);

        filteredItems.forEach((item) => {
          fetchReviews(item.itemId);
        });
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [itemClicked]);

  const brands = useMemo(() => {
  return [
    ...new Set(
      items.map((x) => x?.item?.brand || x?.details?.brand).filter(Boolean)
    ),
  ];
}, [items]);

const womenBrandThemes = useMemo(() => {
  const brandNames = new Set(brands.map((brand) => normalizeText(brand)));

  return brandThemes.filter((brand) =>
    brandNames.has(normalizeText(brand?.brandName))
  );
}, [brandThemes, brands]);

const colors = useMemo(() => {
  const allColors = [];

  items.forEach((itemData) => {
    Object.keys(itemData?.item?.imagesVariants || {}).forEach((color) => {
      allColors.push(color);
    });
  });

  return [...new Set(allColors)];
}, [items]);

const getColorSwatch = (colorName = "") => {
  const color = colorName.trim().toLowerCase();
  return colorSwatches[color] || null;
};

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

  const getAllSizes = (items) => {
    const allSizes = items.map((item) => {
      const sizes = Object.values(item?.item?.size || {});
      return sizes.flat().map((size) => size.split(",").map((s) => s.trim())).flat();
    });

    return [...new Set(allSizes.flat().filter(Boolean))];
  };

  const filterItemsBySize = (size) => {
    return items.filter((item) => {
      const availableSizes = Object.values(item?.item?.size || {}).flat();
      return availableSizes.some((s) => s.split(",").map((x) => x.trim()).includes(size));
    });
  };

  const fetchUserBasket = async () => {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    setBasketItems([]);
    return;
  }

  const response = await axios.get(`${BASE_URL}/basket/${currentUser.uid}`);
  setBasketItems(response.data.basket || []);
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

const getEstimatedDeliveryDay = (daysToAdd = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);

  return `${date.toLocaleDateString("en-US", { weekday: "long" })} ${date.getDate()}`;
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

const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";

  if (typeof imageEntry === "string") return imageEntry;

  if (typeof imageEntry === "object" && imageEntry.url) {
    return imageEntry.url;
  }

  return "";
};

const getColorOptions = (itemData) => {
  return Object.keys(itemData?.item?.imagesVariants || {});
};

const getCurrentImages = (itemData) => {
  const variants = itemData?.item?.imagesVariants || {};
  const selectedColorForItem = selectedColorByItem[itemData.id];

  if (
    selectedColorForItem &&
    Array.isArray(variants[selectedColorForItem])
  ) {
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

  const filteredItems = useMemo(() => {
  return items.filter((itemData) => {
    const item = itemData.item || {};
    const price = Number(item?.usdPrice || 0);

    const matchesBrand =
      selectedBrand === "all" ||
      normalizeText(item?.brand || itemData?.details?.brand) === selectedBrand;

    const matchesColor =
      selectedColor === "all" ||
      Object.keys(item?.imagesVariants || {}).includes(selectedColor);

    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

    return matchesBrand && matchesColor && matchesPrice;
  });
}, [items, selectedBrand, selectedColor, priceRange]);

  const handleVideoPlay = (id) => {
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleNavigate = (id) => {
    router.push(`/product/${id}`);
  };

  const handleAddToBasket = async (itemData, e) => {
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/";

    router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    return;
  }

  try {
    const item = itemData?.item || {};
    const details = itemData?.details || {};

    const basketItem = {
      userId: currentUser.uid,
      item: {
        id: itemData.id,
        itemId: itemData.itemId,
        name: item.name,
        price: Number(item.usdPrice || 0),
        color: null,
        size: selectedSize || null,
        image: item?.images?.[0] || "/fallback.png",
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

 const displayedItems = selectedSize
  ? filterItemsBySize(selectedSize).filter((itemData) =>
      filteredItems.some((x) => x.id === itemData.id)
    )
  : filteredItems;

  if (loading) return <div className="item-loading">{t("loading")}</div>;

  return (
    <div className="women-item-page">
       {contextHolder}
      <div className="women-item-shell">
       <section className="women-item-topbar">
  <div className="women-item-breadcrumb">
    <span>Malidag</span>
    <span className="dot">•</span>
    <span className="current">{String(itemClicked).replaceAll("_", " ")}</span>
  </div>

  <div className="women-item-count">
    {filteredItems.length} items
  </div>
</section>

{womenBrandThemes.length > 0 && (
  <section className="women-brand-top">
    {womenBrandThemes.map((brand) => (
      <button
        key={brand.brandName}
        type="button"
        className="women-brand-logo-card"
        onClick={() => {
          const themeRoute = brand?.theme?.trim()?.toLowerCase();
          if (!themeRoute || !brand?.brandName) return;

          setSelectedBrandName(brand.brandName);
          router.push(`/brand/${themeRoute}/${encodeURIComponent(brand.brandName)}`);
        }}
      >
        <img src={brand.logo} alt={`${brand.brandName} logo`} />
      </button>
    ))}
  </section>
)}

        {beautyImages.length > 0 && (
          <section className="women-item-hero">
            {beautyImages.map((img, index) => (
              <div key={index} className="women-item-hero-frame">
      <img
        src={img.imageUrl}
        alt={itemClicked}
        className="women-item-hero-image"
      />
    </div>
            ))}
          </section>
        )}

       {!isDesktop && (
  <section className="women-mobile-sticky-bar">
    {womenBrandThemes.length > 0 && (
      <div className="women-mobile-brand-strip">
        {womenBrandThemes.map((brand) => (
          <button
            key={brand.brandName}
            type="button"
            className="women-mobile-brand-logo"
            onClick={() => {
              const themeRoute = brand?.theme?.trim()?.toLowerCase();
              if (!themeRoute || !brand?.brandName) return;

              setSelectedBrandName(brand.brandName);
              router.push(`/brand/${themeRoute}/${encodeURIComponent(brand.brandName)}`);
            }}
          >
            <img src={brand.logo} alt={`${brand.brandName} logo`} />
          </button>
        ))}
      </div>
    )}

    <button
      type="button"
      className="women-mobile-filter-toggle"
      onClick={() => setMobileFiltersOpen((prev) => !prev)}
    >
      Filters
    </button>
  </section>
)}

{!isDesktop && mobileFiltersOpen && (
  <aside className="women-mobile-filter-panel">
    <div className="size-filter-container">
      <h3>{t("filter_by_size")}</h3>

      <div className="sizes-list">
        {getAllSizes(items).map((size) => (
          <button
            key={size}
            className={`size-button ${selectedSize === size ? "active" : ""}`}
            onClick={() => setSelectedSize(size)}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="women-filter-section">
        <h3>Colors</h3>

        <div className="women-color-options">
          <button
            className={`women-color-circle all ${
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
                type="button"
                className={`women-color-circle ${
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

      {(selectedSize || selectedColor !== "all") && (
        <button
          className="clear-filter"
          onClick={() => {
            setSelectedSize(null);
            setSelectedColor("all");
          }}
        >
          {t("clear_filter")}
        </button>
      )}
    </div>
  </aside>
)}

        <div className="women-item-content">
          {isDesktop && (
            <>
            <aside className="size-filter-card desktop">
              <div className="size-filter-container">
                <h3>{t("filter_by_size")}</h3>

                <div className="sizes-list">
                  {getAllSizes(items).map((size) => (
                    <button
                      key={size}
                      className={`size-button ${selectedSize === size ? "active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>

               {(selectedSize || selectedColor !== "all") && (
                  <button className="clear-filter" onClick={() => {
  setSelectedSize(null);
  setSelectedColor("all");
}}>
                    {t("clear_filter")}
                  </button>
                )}
              </div>

               <div className="women-filter-section">
  <h3>Colors</h3>

  <div className="women-color-options">
    <button
      className={`women-color-circle all ${
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
          type="button"
          className={`women-color-circle ${
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

            </aside>
</>
          )}

          <div
            className="women-items-grid"
            style={{
              gridTemplateColumns: isVeryVerySmall
                ? "repeat(1, 1fr)"
                : isVerySmall || isSmallMobile
                ? "repeat(2, 1fr)"
                : isMobile || isTablet
                ? "repeat(3, 1fr)"
                : "repeat(3, 1fr)",
            }}
          >
            {displayedItems.map((itemData) => {
              const { itemId, id, item } = itemData;
              const {
                  name,
                  usdPrice,
                  originalPrice,
                  sold,
                  videos,
                  numberOfItems,
                } = item;

              const reviewsData = reviews[itemId] || {};
              const finalRating = reviewsData?.averageRating || null;

              const normalizedVideos = Array.isArray(videos) ? videos : [videos];
              const firstVideoUrl = normalizedVideos.find(
                (video) => typeof video === "string" && video.endsWith(".mp4")
              );

              const colorOptions = getColorOptions(itemData);
                  const selectedColorForItem = selectedColorByItem[id];
                  const displayImage = getDisplayImage(itemData);
                  const currentImages = getCurrentImages(itemData);

                  const visibleColorOptions = colorOptions.slice(0, 4);
                  const hiddenColorCount = Math.max(colorOptions.length - 4, 0);

              return (
                <div key={id} className="itm-card">
                  <div className="item-media-box">
                    {activeVideoId === id && firstVideoUrl ? (
                      <video
                        src={firstVideoUrl}
                        controls
                        autoPlay
                        onEnded={handleVideoStop}
                        className="item-video"
                      />
                    ) : (
                      <>

                      {currentImages.length > 1 && (
                        <button
                          type="button"
                          className="women-image-arrow women-image-arrow-left"
                          onClick={(e) => handleImageArrow(itemData, "prev", e)}
                        >
                          ‹
                        </button>
                      )}

                      {currentImages.length > 1 && (
                        <button
                          type="button"
                          className="women-image-arrow women-image-arrow-right"
                          onClick={(e) => handleImageArrow(itemData, "next", e)}
                        >
                          ›
                        </button>
                      )}
                        <img
                          className="item-imageof"
                         src={displayImage}
                          alt={name}
                          onClick={() => handleNavigate(id)}
                        />

                        {firstVideoUrl && (
                          <button
                            className="play-button"
                            onClick={() => handleVideoPlay(id)}
                            type="button"
                          >
                            ▶
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="item-details" onClick={() => handleNavigate(id)}>
                    <div className="item-name" title={name}>
                      {name?.length > 42 ? `${name.substring(0, 42)}...` : name}
                    </div>

                    {colorOptions.length > 1 && (
  <div
    className="women-card-colors"
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
          className={`women-card-color-circle ${
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
        className="women-more-colors"
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

                    <div className="item-prices">
                      <div className="item-price-row">
                        <span className="item-price">${usdPrice}</span>

                        {Number(originalPrice) > 0 && (
                          <span className="item-original-price">${originalPrice}</span>
                        )}

                        <span className="item-sold">
                          {sold} <strong>{t("sold")}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="women-delivery-info">
                      <div className="women-free-delivery">Free delivery</div>
                      <div className="women-delivery-date">
                        Get it by {getEstimatedDeliveryDay(7)}
                      </div>
                    </div>

                    {numberOfItems && Number(numberOfItems) > 0 && (
                      <div className="women-stock-badge">
                        {numberOfItems} items in stock
                      </div>
                    )}

                    {isItemInBasket(itemId) ? (
                      <button
                        type="button"
                        className="women-added-cart-btn"
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
                        className="women-add-cart-btn"
                        onClick={(e) => handleAddToBasket(itemData, e)}
                      >
                        Add to cart
                      </button>
                    )}

                    <div
                      className="item-type-stars"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemData(itemData);
                        router.push("/reviewPage");
                      }}
                      title={t("view_reviews")}
                    >
                      {finalRating
                        ? "★".repeat(Math.round(finalRating)) +
                          "☆".repeat(5 - Math.round(finalRating))
                        : t("no_rating")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemOfWomen;