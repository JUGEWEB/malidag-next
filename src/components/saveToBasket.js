'use client';

import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next'; // or from next-i18next
import { useRouter } from "next/navigation";
import { Popover, Button, message } from "antd";
import { auth } from "@/components/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import "./saveToBasket.css";
import axios from "axios"
import {
  getCountryConfig,
  getCountryCode,
} from "./countryUtils";
import Loading from "./loading";

const BASKET_API = "https://api.malidag.com"; // Change this if your backend is running elsewhere



const parseShippableCountries = (countryValue) => {
  return String(countryValue || "")
    .split(",")
    .map((entry) =>
      entry.trim().toLowerCase()
    )
    .filter(Boolean);
};

const AddToBasket = () => {
  const [basket, setBasket] = useState([]);
  const [loading, setLoading] = useState(false); // For handling API loading states
  const router = useRouter();
const [user, setUser] = useState(null);
const [authReady, setAuthReady] = useState(false);
const [basketLoaded, setBasketLoaded] =
  useState(false);
  const { t } = useTranslation();
   const [messageApi, contextHolder] = message.useMessage();
const [lockedCountry, setLockedCountry] = useState(null);
const countryCurrencyConfig = getCountryConfig(lockedCountry?.name || "");
const selectedCountryCode = getCountryCode(lockedCountry?.name || "");
const [rates, setRates] = useState(null);

const getUsdBasketItemPrice = (basketItem) => {
  return Number.parseFloat(
    basketItem?.usdPrice || basketItem?.price || 0
  ) || 0;
};

const getLocalizedBasketItemPrice = (basketItem) => {
  const usdPrice = getUsdBasketItemPrice(basketItem);
  const currency = countryCurrencyConfig.currency;

  if (!currency || currency === "USD") {
    return usdPrice;
  }

  const rate = rates?.[currency];

  if (!rate) {
    return usdPrice;
  }

  return usdPrice * rate;
};


const totalPriceLocalized = basket.reduce((sum, item) => {
  const localizedPrice = getLocalizedBasketItemPrice(item);
  return sum + localizedPrice * (item.quantity || 1);
}, 0);

const totalPriceUsd = basket.reduce((sum, item) => {
  const usdPrice = getUsdBasketItemPrice(item);
  return sum + usdPrice * (item.quantity || 1);
}, 0);

const isItemShippable =
  (item) => {
    if (
      !selectedCountryCode
    ) {
      return false;
    }

    const countries =
      parseShippableCountries(
        item?.shippingCountry ||
          ""
      );

    return countries.includes(
      selectedCountryCode
        .toLowerCase()
    );
  };

const hasUnavailableItems =
  basket.some(
    (item) =>
      item.productUnavailable ||
      !isItemShippable(
        item
      )
  );

 useEffect(() => {
  if (!authReady) {
    return;
  }

  if (!user?.uid) {
    setBasket([]);
    setBasketLoaded(true);
    return;
  }

  fetchBasket();
}, [
  authReady,
  user,
]);

useEffect(() => {
  const unsubscribe =
    onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser || null);
        setAuthReady(true);
      }
    );

  return () => unsubscribe();
}, []);

  useEffect(() => {
  const syncCountry = () => {
    try {
      const savedCountry = localStorage.getItem("selectedCountry");
      if (savedCountry) {
        setLockedCountry(JSON.parse(savedCountry));
      } else {
        setLockedCountry(null);
      }
    } catch (err) {
      console.error("Failed to sync country:", err);
      setLockedCountry(null);
    }
  };

  syncCountry();
  window.addEventListener("countryChanged", syncCountry);

  return () => {
    window.removeEventListener("countryChanged", syncCountry);
  };
}, []);

useEffect(() => {
  const fetchRates = async () => {
    try {
      const response = await axios.get(`${BASKET_API}/prices/rates`);
      setRates(response.data.rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  fetchRates();
}, []);


 const fetchBasket = async () => {
  if (!user?.uid) {
    return;
  }

  try {
    setBasketLoaded(false);

    const response = await axios.get(
      `${BASKET_API}/basket/${user.uid}`
    );

    const nextBasket =
      Array.isArray(response.data?.basket)
        ? response.data.basket
        : [];

    setBasket(nextBasket);
  } catch (error) {
    console.error(
      "Error fetching basket:",
      error
    );

    setBasket([]);
  } finally {
    setBasketLoaded(true);
  }
};

  // Remove item from basket using API
  const removeFromBasket = async (itemId) => {
    try {
      const response = await axios.delete(`${BASKET_API}/remove-from-basket/${user?.uid}/${itemId}`);

      if (response.status === 200) {
       setBasket((prevBasket) => prevBasket.filter((item) => item.itemId !== itemId));
       messageApi.success("Item removed from basket!");
      }
    } catch (error) {
      console.error("Error removing item from basket:", error);
    }
  };

   // Update item quantity in the basket
   const updateQuantity = async (id, newQuantity) => {
    if (!user || newQuantity < 1) return; // Prevent quantity from being less than 1
    try {
      setLoading(true);
      const response = await axios.put(`${BASKET_API}/update-quantity/${user?.uid}/${id}`, {
        quantity: newQuantity,
      });

      if (response.status === 200) {
        setBasket((prevBasket) =>
          prevBasket.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLoading(false);
    }
  };

 const totalPrice = basket.reduce((sum, item) => {
  const localizedPrice = getLocalizedBasketItemPrice(item);
  return sum + localizedPrice * (item.quantity || 1);
}, 0);

const acknowledgePriceChange =
  async (itemId) => {
    if (!user?.uid || !itemId) {
      return;
    }

    try {
      const response =
  await axios.patch(
    `${BASKET_API}/basket/${user.uid}/${itemId}/acknowledge-price`
  );

console.log(
  "ACK PRICE RESPONSE:",
  response.status,
  response.data
);

      setBasket(
        (prevBasket) =>
          prevBasket.map(
            (item) =>
              item.itemId === itemId
                ? {
                    ...item,
                    priceChange:
                      null,
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        "Error acknowledging price change:",
        error
      );

      messageApi.error(
        "Failed to acknowledge price change."
      );
    }
  };

    // Proceed to Checkout
const handleCheckout = () => {
  if (basket.length === 0) {
    messageApi.error("Your basket is empty.");
    return;
  }

  if (!lockedCountry?.name) {
    messageApi.error(
      "Please select a delivery country first."
    );
    return;
  }

  if (!selectedCountryCode) {
    messageApi.error(
      "Invalid delivery country."
    );
    return;
  }

  if (hasUnavailableItems) {
    return;
  }

  router.push(
    `/${selectedCountryCode}/cardCheckout?basket=true&paymentMethod=card`
  );
};

const cannotCheckout =
  basket.length === 0 ||
  !lockedCountry?.name ||
  !selectedCountryCode ||
  hasUnavailableItems;

  console.log("basket item", basket[0]);

  return (
    <div className="basket-container" style={{
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: "20px",
    gap: "20px",
  }}>
     {contextHolder} 
      <div>
      <h2>🛒 {t("basket_title")}</h2>
     {!authReady || !basketLoaded ? (
  <Loading />
) : basket.length === 0 ? (
  <p>{t("basket_empty")}</p>
) : (
        basket.map((item, index) => {
          if (!item) return null; // Ensure item exists

          const { id, name, price, image, quantity, color, size, itemId } = item;
          const slicedName = name.length > 20 ? name.slice(0, 20) + "..." : name;
          const imageUrl = image || "placeholder.jpg";
          const itemLocalizedPrice = getLocalizedBasketItemPrice(item);
          const itemTotalLocalized = itemLocalizedPrice * (quantity || 1);
          console.log("itemId:", itemId)

          return (
            <div key={index} className="basket-item">
              {/* ✅ Needed for antd message */}
              <div>
              {/* Item Image */}
              <div style={{display: "flex", alignItems: "center", justifyContent: "start"}}>
              <img src={imageUrl} alt={name} className="basket-item-image" />

              {/* Clickable Name */}
              <div
                className="basket-item-name"
                title={name}
                onClick={() => router.push(
  `/${selectedCountryCode}/product/${id}`
)}
              >
                {slicedName} - <div
  className="basket-Price"
  style={{
    color: "black",
    fontWeight: "bold",
    backgroundColor: "orange",
    width: "80px",
    borderRadius: "50px",
    display: "flex",
    justifyContent: "center",
    marginTop: "10px",
  }}
>
  {countryCurrencyConfig.symbol}{itemTotalLocalized.toFixed(2)}
</div>
              </div>
              <div>
              <Popover content={t('basket_remove_item')} trigger="hover">
              <button className="remove-btn" onClick={() => removeFromBasket(itemId)}>🗑️</button>
              </Popover>
              </div>
              </div>
              {color !== null && (
              <p style={{color: "black", fontStyle: "italic"}}>{t("color")}: {color}</p>
            )}
            {size !== null && (
              <p style={{color: "black", fontStyle: "italic"}}>{t("size")}: {size} </p>
            )}

           {item.priceChange && (
  <div
    style={{
      color: "#d46b08",
      fontWeight: "bold",
      marginTop: "8px",
      marginBottom: "8px",
    }}
  >
    <span>
      Price changed from $
      {Number(
        item.priceChange.oldPrice
      ).toFixed(2)}
      {" to $"}
      {Number(
        item.priceChange.newPrice
      ).toFixed(2)}
      .
    </span>

    <button
      type="button"
      onClick={() =>
        acknowledgePriceChange(
          item.itemId
        )
      }
      style={{
        marginLeft: "10px",
        cursor: "pointer",
        color: "blue"
      }}
    >
      Got it
    </button>
  </div>
)}

            {item.productUnavailable && (
                <p
                  style={{
                    color: "red",
                    fontWeight:
                      "bold",
                  }}
                >
                  This product is no
                  longer available.
                </p>
              )}

              {!item.productUnavailable &&
                selectedCountryCode &&
                !isItemShippable(
                  item
                ) && (
                  <p
                    style={{
                      color: "red",
                      fontWeight:
                        "bold",
                    }}
                  >
                    This item can no
                    longer be delivered
                    to{" "}
                    {lockedCountry?.name}.
                  </p>
                )}
              </div>
               {/* Quantity Controls */}
               <div
                style={{
                  color: "black",
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "10px",
                 
                }}
              >
                <div style={{ border: "2px solid #222",
                  borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100px", height: "30px"}}>
                <div
                  className="quantity-btn"
                  onClick={() => updateQuantity(id, quantity - 1)}
                  disabled={quantity <= 1 || loading}
                >
                  -
                </div>
                <span style={{ margin: "0 10px", fontSize: "18px" , fontWeight: "bold"}}>{quantity}</span>
                <div
                  className="quantity-btn"
                  onClick={() => updateQuantity(id, quantity + 1)}
                  disabled={loading}
                >
                  +
                </div>
                </div>
              </div>
             
            
            </div>
          );
        })
      )}
      </div>
     <div>
 <h3 style={{ color: "#222" }}>
  💳 {t("basket_payment_method")}
</h3>

<div
  style={{
    marginTop: "16px",
  }}
>
  <p
    style={{
      color: "green",
    }}
  >
    {t("pay_with_card")}
  </p>
</div>


 <div style={{ marginTop: "20px", fontSize: "18px", fontWeight: "bold", color: "#222" }}>
  🛍️ {t("basket_total_price")}:{" "}
  <span style={{ color: "green" }}>
   {countryCurrencyConfig.symbol}{totalPriceLocalized.toFixed(2)}
  </span>
</div>

<Button
  type="primary"
  onClick={handleCheckout}
  disabled={cannotCheckout}
  style={{ marginTop: "20px" }}
>
  {t("basket_proceed_to_checkout")}
</Button>
</div>
    </div>
  );
};

export default AddToBasket;
