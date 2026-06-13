"use client";

import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "./appContext";
import axios from "axios";
import "./itemPage.css";
import { useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";
import colors from "../../lib/colors.json";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";

function ItemPage({ searchTerm }) {
  const router = useRouter();
  const { country } = useContext(AppContext);
const countryCode = country?.code || "fr";

const withCountry = (path) => {
  if (!countryCode) return path;
  return `/${countryCode}${path.startsWith("/") ? path : `/${path}`}`;
};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reviews, setReviews] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  const { isMobile, isTablet, isVerySmall, isSmallMobile } = useScreenSize();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);
  const [bestSellerId, setBestSellerId] = useState(null);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [selectedBrand, setSelectedBrand] = useState("all");
const [selectedBrandType, setSelectedBrandType] = useState("all");
const [selectedType, setSelectedType] = useState("all");
const [selectedSize, setSelectedSize] = useState("all");
const [selectedColor, setSelectedColor] = useState("all");
const [priceRange, setPriceRange] = useState([1, 10000]);
const [brandThemes, setBrandThemes] = useState([]);
const [messageApi, contextHolder] = message.useMessage();
const [basketItems, setBasketItems] = useState([]);


const BASE_URL = "https://api.malidag.com";
const BASKET_API = "https://api.malidag.com/add-to-basket";

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

const isItemInBasket = (itemId) => {
  return getBasketQuantity(itemId) > 0;
};

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
    const fetchItems = async () => {
      if (!searchTerm) return;

      setLoading(true);

      try {
       const response = await axios.get(
  `https://api.malidag.com/items/${encodeURIComponent(searchTerm)}?country=${encodeURIComponent(countryCode)}`
);
       const matchedItems = response.data.items || [];
setItems(matchedItems);

const initialColors = {};

matchedItems.forEach((product) => {
  const colorKeys = Object.keys(product?.item?.imagesVariants || {});
  if (colorKeys.length > 0) {
    initialColors[product.id] = colorKeys[0];
  }
});

setSelectedColorByItem(initialColors);

const bestSeller = [...matchedItems].sort(
  (a, b) => Number(b?.item?.sold || b?.details?.soldText || 0) - Number(a?.item?.sold || a?.details?.soldText || 0)
)[0];

setBestSellerId(bestSeller?.id || null);

matchedItems.forEach((item) => fetchReviews(item.itemId));
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [searchTerm, countryCode]);

  const handleAddToBasket = async (itemData, e) => {
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/";

   router.push(withCountry(`/auth?redirect=${encodeURIComponent(currentPath)}`));
    return;
  }

  try {
    const item = itemData?.item || {};
    const colorOptions = getColorOptions(itemData);

    const selectedColorForBasket =
      selectedColorByItem[itemData.id] || colorOptions?.[0] || null;

    const variantImages = item?.imagesVariants?.[selectedColorForBasket] || [];

    const basketImage =
      getImageUrl(variantImages?.[0]) || getImageUrl(item?.images?.[0]);

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
        brand: item.brand,
        brandPrice: item.brandPrice,
        quantity: 1,
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

const categoryTypes = Array.from(
  new Map(
    items
      .filter((itemData) => itemData?.item?.type && itemData?.item?.genre)
      .map((itemData) => [
        `${itemData.item.genre} ${itemData.item.type}`,
        itemData,
      ])
  ).entries()
);

  const brands = Array.from(
    new Set(items.map((item) => item?.item?.brand).filter(Boolean))
  );

 const brandTypes = Array.from(
  new Map(
    items
      .filter((itemData) => itemData?.item?.brandType && itemData?.item?.brand)
      .map((itemData) => [
        `${itemData.item.brandType} ${itemData.item.brand}`,
        itemData,
      ])
  ).entries()
);

  const handleVideoPlay = (id) => {
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleItemClick = (id) => {
    if (id) {
     router.push(withCountry(`/product/${id}`));
    }
  };

 const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

const formatRoute = (value) =>
  encodeURIComponent(
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
  );

const getBrandTheme = (brandName) => {
  const match = brandThemes.find(
    (x) => normalizeText(x?.brandName) === normalizeText(brandName)
  );

  return match?.theme?.trim()?.toLowerCase() || "brand";
};

const formatTypeForUrl = (type) =>
  encodeURIComponent(String(type || "").toLowerCase().replace(/\s+/g, "-"));

const handleNavigateByType = (firstItem) => {
  const type = (firstItem?.item?.type || "").toLowerCase();
  const category = (firstItem?.category || "").toLowerCase();
  const gender = (firstItem?.item?.genre || "").toLowerCase();

  const formattedType = formatTypeForUrl(type);

  if (
    ["clothes", "toys", "accessories", "gear", "toy"].includes(category) &&
    ["boy", "girl", "babies", "babyboy", "babygirl", "kids", "kid"].includes(gender)
  ) {
   router.push(withCountry(`/itemOfKids/${gender}/${formattedType}`));
  } else if (category === "beauty") {
   router.push(withCountry(`/itemOfItems/${formattedType}`));
  } else if (category === "shoes") {
    router.push(withCountry(`/itemOfShoes/${gender}-${formattedType}`));
  } else if (category === "clothes" && gender === "women") {
    router.push(withCountry(`/item-of-women/${formattedType}`));
  } else if (category === "clothes" && gender === "men") {
    router.push(withCountry(`/item-of-men/${formattedType}`));
  } else if (category === "electronic") {
    router.push(withCountry(`/itemOfElectronic/${formattedType}`));
  } else if (category === "home_kitchen") {
    router.push(withCountry(`/itemOfHome/${formattedType}`));
  } else if (category === "pet_care") {
    router.push(withCountry(`/petCare/${gender}/${formattedType}`));
  } else if (category === "jewelry") {
    router.push(withCountry(`/jewelry/${formattedType}`));
  } else {
    console.warn("No route matched for:", { type, category, gender });
  }
};

const handleLinkClick = (label, value, sourceItem = null) => {
  setMenuOpen(false);

  if (label === "type") {
    handleNavigateByType(sourceItem);
    return;
  }

  if (label === "brand") {
    const theme = getBrandTheme(value);
   router.push(withCountry(`/brand/${theme}/${encodeURIComponent(value)}`));
    return;
  }

  if (label === "brandType") {
    const brand = sourceItem?.item?.brand || sourceItem?.details?.brand || brands[0];
    if (!brand) return;

    const theme = getBrandTheme(brand);

    router.push(
      `/brand/${theme}/${encodeURIComponent(brand)}?brandType=${encodeURIComponent(value)}`
    );
  }
};

useEffect(() => {
  const fetchBrandThemes = async () => {
    try {
      const res = await axios.get("https://api.malidag.com/api/brands/themes");
      setBrandThemes(res.data || []);
    } catch (error) {
      console.error("Failed to fetch brand themes:", error);
    }
  };

  fetchBrandThemes();
}, []);

  const isSmallScreen = isMobile || isTablet || isVerySmall || isSmallMobile;

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  if (!items || items.length === 0) {
    return (
      <div className="no-results-message">
        {t("no_results_found", { term: searchTerm })}
      </div>
    );
  }

  const handleColorSelect = (itemId, color, e) => {
  e.stopPropagation();
  setSelectedColorByItem((prev) => ({
    ...prev,
    [itemId]: color,
  }));
};

const getColorOptions = (itemData) => {
  return Object.keys(itemData?.item?.imagesVariants || {});
};

const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

const getDisplayImage = (itemData) => {
  const selectedColor = selectedColorByItem[itemData.id];
  const variants = itemData?.item?.imagesVariants || {};

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number"
          ? a.position
          : 999999;

      const posB =
        typeof b === "object" && typeof b?.position === "number"
          ? b.position
          : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object"
          ? a?.filename || ""
          : String(a || "").split("/").pop() || "";

      const nameB =
        typeof b === "object"
          ? b?.filename || ""
          : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(itemData?.item?.images?.[0]) || "/fallback.png";
};

const getColorSwatch = (colorName = "") => {
  const key = String(colorName).trim().toLowerCase();

  return colors[key] || null;
};

const getSizeOptionsForItem = (itemData) => {
  const sizeMap = itemData?.item?.size || {};
  const allOptions = Object.values(sizeMap).flat();

  return allOptions.flatMap((option) => {
    if (!option) return [];

    if (typeof option === "object") {
      return option.value ? [String(option.value).trim()] : [];
    }

    if (typeof option === "string") {
      return option
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return [];
  });
};

const sizes = Array.from(
  new Set(
    items
      .flatMap(getSizeOptionsForItem)
      .map((size) => String(size).trim())
      .filter(Boolean)
  )
);

const colorFilterOptions = Array.from(
  new Set(
    items.flatMap((itemData) =>
      Object.keys(itemData?.item?.imagesVariants || {})
    )
  )
);

const maxPrice = Math.max(
  1,
  Math.ceil(
    Math.max(...items.map((x) => Number(x?.item?.usdPrice || 0)), 100)
  )
);

const filteredItems = items.filter((itemData) => {
  const item = itemData?.item || {};
  const price = Number(item.usdPrice || 0);

 const itemSizes = getSizeOptionsForItem(itemData).map(normalizeText);

  const matchesType =
    selectedType === "all" || normalizeText(item.type) === selectedType;

  const matchesBrand =
    selectedBrand === "all" || normalizeText(item.brand) === selectedBrand;

  const matchesBrandType =
    selectedBrandType === "all" ||
    normalizeText(item.brandType) === selectedBrandType;

  const matchesSize =
    selectedSize === "all" || itemSizes.includes(selectedSize);

  const matchesColor =
    selectedColor === "all" ||
    Object.keys(item.imagesVariants || {}).includes(selectedColor);

  const matchesPrice =
    price >= Math.max(1, priceRange[0]) && price <= priceRange[1];

  return (
    matchesType &&
    matchesBrand &&
    matchesBrandType &&
    matchesSize &&
    matchesColor &&
    matchesPrice
  );
});

  return (
    <div className="page-layout-cc">
      {contextHolder}
      {isSmallScreen && (
        <div className="mobile-top-bar-cc">
          <div className="mobile-results-title-cc">
            {t("search_results")}
          </div>

          <button
            className="mobile-menu-icon-button-cc"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open menu"
          >
             Filters
          </button>
        </div>
      )}

      <aside
        className={`sidebar-filters-cc ${isSmallScreen ? "mobile-sidebar-cc" : ""} ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="sidebar-block-cc">
          <div className="sidebar-title-cc">{t("related_types")}</div>
          <div className="sidebar-links-cc">
           {categoryTypes.map(([type, firstItem], index) => (
            <div
              key={index}
              className="sidebar-main-link-cc"
              onClick={() => handleLinkClick("type", type, firstItem)}
            >
              {type}
            </div>
          ))}
          </div>
        </div>

        {brands.length > 0 && (
          <div className="sidebar-block-cc">
            <div className="sidebar-title-cc">Related Brands</div>
            <div className="sidebar-links-cc">
              {brands.map((brand, index) => (
                <div
                  key={index}
                  className="sidebar-main-link-cc"
                  onClick={() => handleLinkClick("brand", brand)}
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        )}

        {brandTypes.length > 0 && (
          <div className="sidebar-block-cc">
            <div className="sidebar-title-cc">Brand Types</div>
            <div className="sidebar-links-cc">
             {brandTypes.map(([label, sourceItem], index) => (
  <div
    key={index}
    className="sidebar-main-link-cc"
    onClick={() =>
      handleLinkClick("brandType", sourceItem?.item?.brandType, sourceItem)
    }
  >
    {label}
  </div>
))}
            </div>
          </div>
        )}

        <div className="sidebar-block-cc filter-section-cc">
  <div className="sidebar-title-cc">Filters</div>

  <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
    <option value="all">All Sizes</option>
    {sizes.map((size) => (
      <option key={size} value={normalizeText(size)}>
        {size}
      </option>
    ))}
  </select>

 <div className="filter-colors-cc">
  <button
    type="button"
    className={`filter-color-circle-cc ${
      selectedColor === "all" ? "active" : ""
    }`}
    onClick={() => setSelectedColor("all")}
    title="All Colors"
  >
    All
  </button>

  {colorFilterOptions.map((color) => {
    const swatch = getColorSwatch(color);

    return (
      <button
        key={color}
        type="button"
        className={`filter-color-circle-cc ${
          selectedColor === color ? "active" : ""
        }`}
        onClick={() => setSelectedColor(color)}
        title={color}
        style={
          swatch
            ? { background: swatch }
            : {
                backgroundImage: `url(${getImageUrl(
                  items.find((x) =>
                    x?.item?.imagesVariants?.[color]
                  )?.item?.imagesVariants?.[color]?.[0]
                )})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
        }
      />
    );
  })}
</div>

  <input
    type="range"
    min="50"
    max={maxPrice}
    value={Math.min(priceRange[1], maxPrice)}
    onChange={(e) => setPriceRange([1, Number(e.target.value)])}
  />

  <span>Up to ${Math.min(priceRange[1], maxPrice)}</span>
</div>
      </aside>

      <main className="item-page-container-cc">
        {!isSmallScreen && (
          <div className="desktop-results-title-cc">
            {t("search_results")}
          </div>
        )}

        <div className="search-results-container-cc">
         {filteredItems.map((itemData) => {
  const { itemId, id, item = {}, details = {} } = itemData;

  const name =
    item.name ||
    details.itemName ||
    itemData.name ||
    "Unnamed item";

  const usdPrice = parseFloat(item.usdPrice || details.usdText || 0);
  const originalPrice = parseFloat(
    item.originalPrice || details.originalPrice || 0
  );

 const sold = item.sold || details.soldText || "";
const numericSold = Number(sold) || 0;
const hasSold = numericSold > 0;
const isBestSeller = id === bestSellerId;

  const reductionPercentage =
    originalPrice > 0 && usdPrice >= 0 && usdPrice < originalPrice
      ? Math.round(((originalPrice - usdPrice) / originalPrice) * 100)
      : 0;

  const reviewsData = reviews[itemId] || {};
  const finalRating = reviewsData?.averageRating || t("no_rating");

 const displayPrice = usdPrice ? usdPrice.toFixed(2) : "0.00";

  const normalizedVideos = Array.isArray(item.videos)
    ? item.videos
    : item.videos
    ? [item.videos]
    : [];

  const firstVideoUrl = normalizedVideos.find(
    (video) => typeof video === "string" && video.endsWith(".mp4")
  );

 const firstImage = getDisplayImage(itemData);
const colorOptions = getColorOptions(itemData);
const selectedColor = selectedColorByItem[id];
const visibleColorOptions = colorOptions.slice(0, 4);
const hiddenColorCount = Math.max(colorOptions.length - 4, 0);
const brandDelivery =
  brandThemes?.find(
    (x) =>
      normalizeText(x?.brandName) ===
      normalizeText(item?.brand || details?.brand)
  )?.delivery || null;

const hasFreeDelivery = Boolean(brandDelivery?.isFree);

  return (
    <div key={id} className="item-card-cc">
      <div className="item-media-box-cc">
        <div className={`item-badge-cc ${isBestSeller ? "item-badge-best-cc" : "item-badge-top-cc"}`}>
        {isBestSeller ? t("best_seller") : t("topIt")}
      </div>
        {activeVideoId === id && firstVideoUrl ? (
          <video
            src={firstVideoUrl}
            controls
            autoPlay
            onEnded={handleVideoStop}
            style={{ width: "100%", height: "230px", objectFit: "contain" }}
          />
        ) : (
          <>
            <img
              className="item-image-cc"
              src={firstImage}
              onClick={() => handleItemClick(id)}
              alt={name}
              style={{ width: "100%", height: "230px", objectFit: "contain" }}
            />
            {firstVideoUrl && (
             <button
              type="button"
              className="play-button-cc"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoPlay(id);
              }}
              aria-label="Play product video"
            >
              ▶
            </button>
            )}
          </>
        )}
      </div>

    <div onClick={() => handleItemClick(id)} className="item-details-cc">

      {colorOptions.length > 0 && (
  <div className="item-color-block-cc">
    <div className="item-color-label-cc">
      {t("color")}: <span>{selectedColor}</span>
    </div>

   <div className="item-color-options-cc">
    {visibleColorOptions.map((color) => {
  const swatch = getColorSwatch(color);

  return (
    <button
      key={color}
      type="button"
      className={`item-color-circle-cc ${
        selectedColor === color ? "active" : ""
      }`}
      onClick={(e) => handleColorSelect(id, color, e)}
      title={color}
      aria-label={`Select ${color} color`}
      style={
        swatch
          ? { background: swatch }
          : {
              backgroundImage: `url(${getImageUrl(
                item?.imagesVariants?.[color]?.[0]
              )})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
      }
    />
  );
})}

{hiddenColorCount > 0 && (
  <button
    type="button"
    className="more-colors-btn-cc"
    onClick={(e) => {
      e.stopPropagation();
      handleItemClick(id);
    }}
  >
    +{hiddenColorCount} colors more
  </button>
)}
    </div>
  </div>
)}
  <div className="item-name-cc" title={name}>
    {name.length > 40 ? `${name.substring(0, 40)}...` : name}
  </div>

 <div className="item-service-row-cc">
  {hasFreeDelivery && (
    <span className="item-service-pill-cc">Free delivery</span>
  )}

  <span className="item-service-pill-cc item-service-muted-cc">
    Easy returns
  </span>
</div>

  <div className="item-prices-cc">
    <div className="item-price-row-cc">
     <span className="item-price-cc">${displayPrice}</span>

      {originalPrice > 0 && (
        <span className="item-original-price-cc">
          ${originalPrice.toFixed(2)}
        </span>
      )}

      {reductionPercentage > 0 && (
        <span className="item-reduction-cc">
          -{reductionPercentage}% off
        </span>
      )}
    </div>
  </div>

 {hasSold && (
  <div className="item-meta-row-cc">
    <span className="item-sold-cc">
      {numericSold} <span className="sold-label-cc">{t("sold")}</span>
    </span>
  </div>
)}

  <div
    className="item-type-stars-cc"
    onClick={(e) => {
      e.stopPropagation();
      setItemData(itemData);
     router.push(withCountry(`/product/${id}/review`));
    }}
    title={t("view_reviews")}
  >
    {finalRating
      ? "★".repeat(Math.round(finalRating)) +
        "☆".repeat(5 - Math.round(finalRating))
      : t("no_rating")}
  </div>

 {isItemInBasket(itemId) ? (
  <button
    type="button"
    className="added-to-basket-btn-cc"
    onClick={(e) => {
      e.stopPropagation();
      router.push(withCountry("/basket"));
    }}
  >
    🛒 {getBasketQuantity(itemId)}
  </button>
) : (
  <button
    type="button"
    className="add-to-basket-btn-cc"
    onClick={(e) => handleAddToBasket(itemData, e)}
  >
    Add to cart
  </button>
)}
</div>
</div>
  );
})}
        </div>
      </main>
    </div>
  );
}

export default ItemPage;