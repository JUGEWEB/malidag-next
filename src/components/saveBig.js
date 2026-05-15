"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./saveBig.css";
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import colorSwatches from "../../lib/colors.json";

const BASE_URL = "https://api.malidag.com";

const BASKET_API = "https://api.malidag.com/add-to-basket";

function SaveBig() {
  const router = useRouter();
  const setItemData = useCheckoutStore((state) => state.setItemData);
const [reviews, setReviews] = useState({});
  const [types, setTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
  const [bestSellerId, setBestSellerId] = useState(null);
  const [basketItems, setBasketItems] = useState([]);

  useEffect(() => {
    const fetchFilteredItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = response.data || [];

       const filteredData = data.filter((item) => {
  const usdPrice = parseFloat(item?.item?.usdPrice || 0);
  const originalPrice = parseFloat(item?.item?.originalPrice || 0);
  const discount =
    originalPrice > 0 ? (originalPrice - usdPrice) / originalPrice : 0;

  return originalPrice > usdPrice && discount <= 0.2;
});

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item?.item?.type || "Other";
          if (!acc[type]) acc[type] = [];
          acc[type].push(item);
          return acc;
        }, {});

        const bestSeller = [...filteredData].sort(
  (a, b) => Number(b?.item?.sold || 0) - Number(a?.item?.sold || 0)
)[0];

setBestSellerId(bestSeller?.id || null);

        const initialColors = {};

        filteredData.forEach((product) => {
          if (product?.itemId) fetchReviews(product.itemId);

          const colorKeys = Object.keys(product?.item?.imagesVariants || {});
          if (colorKeys.length > 0) {
            initialColors[product.id] = colorKeys[0];
          }
        });

        setSelectedColorByItem(initialColors);
        setTypes(groupedData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredItems();
  }, []);

  const allItems = useMemo(() => Object.values(types).flat(), [types]);

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
      router.push(`/itemOfKids/${gender}/${formattedType}`);
    } else if (category === "beauty") {
      router.push(`/itemOfItems/${formattedType}`);
    } else if (category === "shoes") {
      router.push(`/itemOfShoes/${gender}-${formattedType}`);
    } else if (category === "clothes" && gender === "women") {
      router.push(`/item-of-women/${formattedType}`);
    } else if (category === "clothes" && gender === "men") {
      router.push(`/item-of-men/${formattedType}`);
    } else if (category === "electronic") {
      router.push(`/itemOfElectronic/${formattedType}`);
    } else if (category === "home_kitchen") {
      router.push(`/itemOfHome/${formattedType}`);
    } else if (category === "pet_care") {
      router.push(`/petCare/${gender}/${formattedType}`);
    }  else if (
  category === "jewelry"
) {
  router.push(`/jewelry/${formattedType}`);
} else {
      console.warn("No route matched for:", { type, category, gender });
    }
  };

  const fetchUserBasket = async () => {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    setBasketItems([]);
    return;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/basket/${currentUser.uid}`
    );

    setBasketItems(response.data.basket || []);
  } catch (error) {
    console.error("Error fetching basket:", error);
    setBasketItems([]);
  }
};

const getBasketQuantity = (itemId) => {
  const basketItem = basketItems.find(
    (item) => item.itemId === itemId
  );

  return Number(basketItem?.quantity || 0);
};

const isItemInBasket = (itemId) => {
  return getBasketQuantity(itemId) > 0;
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

      setReviews((prev) => ({
        ...prev,
        [productId]: { averageRating, reviewsArray },
      }));
    }
  } catch (error) {
    setReviews((prev) => ({
      ...prev,
      [productId]: {
        averageRating: 4.3,
        reviewsArray: Array(133).fill({ rating: 4.3 }),
      },
    }));
  }
};

  const handleItemClick = (id) => {
    router.push(`/product/${id}`);
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();
    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  };

  const getColorOptions = (product) => {
    return Object.keys(product?.item?.imagesVariants || {});
  };

  const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

  const getDisplayImage = (product) => {
  const selectedColor = selectedColorByItem[product.id];
  const variants = product?.item?.imagesVariants || {};

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number" ? a.position : 999999;
      const posB =
        typeof b === "object" && typeof b?.position === "number" ? b.position : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object" ? a?.filename || "" : String(a || "").split("/").pop() || "";
      const nameB =
        typeof b === "object" ? b?.filename || "" : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(product?.item?.images?.[0]) || "/fallback.png";
};

const getColorSwatch = (colorName = "") => {
  const color = colorName.trim().toLowerCase();

  return colorSwatches[color] || null;
};

  const getDiscountPercentage = (usdPrice, originalPrice) => {
  const current = Number(usdPrice || 0);
  const original = Number(originalPrice || 0);

  if (!original || current >= original) return 0;
  return Math.round(((original - current) / original) * 100);
};

 const handleAddToBasketPreview = async (
  product,
  selectedColor,
  selectedImage,
  e
) => {
  e.stopPropagation();

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    router.push(`/auth?redirect=${encodeURIComponent("/save-big")}`);
    return;
  }

  try {
    const item = product?.item || {};
    const details = product?.details || {};

    const basketItem = {
      userId: currentUser.uid,
      item: {
        id: product.id,
        itemId: product.itemId,
        name: item.name,
        price: Number(item.usdPrice || 0),
        color: selectedColor || null,
        size: null,
        image: selectedImage,
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
}
  } catch (error) {
    console.error("Error adding item to basket:", error);
  }
};

  const renderStars = (rating) => {
  const safeRating = Math.round(Number(rating) || 0);

  return (
    <span className="bbe-stars-container">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < safeRating ? "bbe-star filled" : "bbe-star empty"}
        >
          ★
        </span>
      ))}
    </span>
  );
};

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(() => {
    fetchUserBasket();
  });

  return () => unsubscribe();
}, []);

  if (loading) {
    return (
      <div className="item-spinner-wrapper">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="bbe-container">
      <div className="bbe-type-list">
        {Object.entries(types).map(([type, items]) => {
          const firstItem = items[0];
          const category = firstItem?.category?.toLowerCase();
          const gender = firstItem?.item?.genre || "Unisex";
          const label = category === "electronic" ? type : `${gender} ${type}`;

          return (
            <div
              key={type}
              className="bbe-type-item"
              onClick={() => handleNavigateByType(firstItem)}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div className="bbe-item-grid">
        {allItems.map((product) => {
          const { id, item } = product;
          const selectedColor = selectedColorByItem[id];
          const colorOptions = getColorOptions(product);
          const displayImage = getDisplayImage(product);
          const isBestSeller = id === bestSellerId;
          const discountPercentage = getDiscountPercentage(item?.usdPrice, item?.originalPrice);

          return (
           <div key={id} className="bbe-item-card">
  <div className="bbe-item-media">
    {isBestSeller && (
      <div className="bbe-image-badge bbe-image-badge-best">
        Best Seller
      </div>
    )}

    {discountPercentage > 0 && (
      <div className="bbe-image-badge bbe-image-badge-discount">
        -{discountPercentage}%
      </div>
    )}

    <img
      src={displayImage}
      alt={item?.name}
      onClick={() => handleItemClick(id)}
      className="bbe-item-image"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/fallback.png";
      }}
    />
  </div>

  <div className="bbe-item-info" onClick={() => handleItemClick(id)}>
   <div className="bbe-item-brand">
  {item?.brand || product?.details?.brand || "Malidag"}
</div>

<div className="bbe-item-name">
  {item?.name?.length > 70 ? `${item.name.slice(0, 70)}...` : item?.name}
</div>

<div className="bbe-item-price-row">
  <span className="bbe-item-price">${item?.usdPrice}</span>

  <span className="bbe-deals-badge">Deal</span>

  {Number(item?.originalPrice || 0) > 0 && (
    <span className="bbe-item-original-price">
      ${Number(item.originalPrice).toFixed(2)}
    </span>
  )}
</div>

<div
  className="bbe-item-rating"
  onClick={(e) => {
    e.stopPropagation();
    router.push(`/product/${id}/review`);
  }}
  title="View reviews"
>
  {(() => {
    const reviewData = reviews[product.itemId] || {};
    const rating = Number(reviewData.averageRating || 4.3);
    const reviewCount = reviewData.reviewsArray?.length || 133;

    return (
      <>
        <span className="bbe-rating-number">{rating.toFixed(1)}/5</span>
        {renderStars(rating)}
        <span className="bbe-review-count">({reviewCount} reviews)</span>
      </>
    );
  })()}
</div>

{colorOptions.length > 1 && (
  <div className="bbe-color-block" onClick={(e) => e.stopPropagation()}>
    <div className="bbe-color-label">
      Color: <span>{selectedColor}</span>
    </div>

    <div className="bbe-color-options">
      {colorOptions.slice(0, 3).map((color) => (
        <button
          key={color}
          type="button"
          className={`bbe-color-circle ${
            selectedColor === color ? "active" : ""
          }`}
          title={color}
          aria-label={`Select ${color}`}
         style={
  getColorSwatch(color)
    ? { background: getColorSwatch(color) }
    : {
        backgroundImage: `url("${getImageUrl(
          product?.item?.imagesVariants?.[color]?.[0]
        )}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
}
          onClick={(e) => handleColorSelect(id, color, e)}
        />
      ))}

      {colorOptions.length > 3 && (
        <button
          type="button"
          className="bbe-more-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(id);
          }}
        >
          +{colorOptions.length - 3} colors more
        </button>
      )}
    </div>
  </div>
)}

{Number(item?.numberOfItems || product?.details?.numberItemText || 0) > 0 && (
  <div
    className={
      Number(item?.numberOfItems || product?.details?.numberItemText || 0) < 100
        ? "bbe-stock-badge low"
        : "bbe-stock-badge"
    }
  >
    {Number(item?.numberOfItems || product?.details?.numberItemText || 0) < 100
      ? `Only ${item?.numberOfItems || product?.details?.numberItemText} left in stock`
      : `${item?.numberOfItems || product?.details?.numberItemText} items in stock`}
  </div>
)}

{isItemInBasket(product.itemId) ? (
  <button
    type="button"
    className="bbe-added-basket-btn"
    onClick={(e) => {
      e.stopPropagation();
      router.push("/basket");
    }}
  >
    <span className="bbe-cart-icon">🛒</span>

    <span className="bbe-cart-count">
      {getBasketQuantity(product.itemId)}
    </span>
  </button>
) : (
  <button
    type="button"
    className="bbe-add-basket-btn"
    onClick={(e) =>
      handleAddToBasketPreview(
        product,
        selectedColor,
        displayImage,
        e
      )
    }
  >
    Add to Basket
  </button>
)}

  </div>
</div>
          );
        })}
      </div>
    </div>
  );
}

export default SaveBig;