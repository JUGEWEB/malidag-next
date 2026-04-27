'use client';

import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next'; // or from next-i18next
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "./checkoutStore";
import { Popover, Select, Button, message } from "antd";
import { auth } from "@/components/firebaseConfig";
import "./saveToBasket.css";
import axios from "axios"
import { useAccount } from "wagmi";
import {
  getCountryConfig,
  getCountryCode,
  normalizeCountryName,
  isPaypalSupported,
} from "./countryUtils";

const BASKET_API = "https://api.malidag.com"; // Change this if your backend is running elsewhere
const CRYPTO_API = "https://api.malidag.com/crypto-prices"; // Your Crypto API

const coinImages = {
  ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
  USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
  BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
  SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422",
  BNB: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
  USDT: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
  // You can add more if you want
};

const stablecoinOptions = [
  {
    value: "USDT",
    label: "Tether",
    image: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
  },
  {
    value: "USDC",
    label: "USD Coin",
    image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
  },
  {
    value: "BUSD",
    label: "Binance USD",
    image: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
  },
];

const cryptoOptions = [
  { value: "ETH", label: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880" },
  { value: "BNB", label: "Binance Coin", image: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615" },
  { value: "USDT", label: "Tether", image: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707" },
  { value: "SOL", label: "Solana", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422" },
  { value: "USDC", label: "USD Coin", image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389" },
  { value: "BUSD", label: "Binance USD", image: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766" }
];


const parseShippableCountries = (countryValue) => {
  return String(countryValue || "")
    .split(",")
    .map((entry) => getCountryCode(entry) || normalizeCountryName(entry))
    .filter(Boolean);
};

const AddToBasket = () => {
  const [basket, setBasket] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(false); // For handling API loading states
  const router = useRouter();
  const setCheckoutData = useCheckoutStore((state) => state.setCheckoutData);
  const user = auth?.currentUser;
  const { t } = useTranslation();
   const [messageApi, contextHolder] = message.useMessage();
 const [paymentMethod, setPaymentMethod] = useState("crypto");
const [selectedStablecoin, setSelectedStablecoin] = useState(stablecoinOptions[0]);
const [lockedCountry, setLockedCountry] = useState(null);
const countryCurrencyConfig = getCountryConfig(lockedCountry?.name || "");
const paypalAvailable = isPaypalSupported(lockedCountry?.name || "");
const selectedCountryCode = getCountryCode(lockedCountry?.name || "");
const { address, isConnected } = useAccount();

const getLocalizedBasketItemPrice = (basketItem) => {
  const field = countryCurrencyConfig.priceField;

  if (field === "usdPrice") {
    return Number.parseFloat(basketItem.price || basketItem.usdPrice || 0) || 0;
  }

  return (
    Number.parseFloat(
      basketItem?.[field] ||
      basketItem?.details?.[field] ||
      basketItem?.price ||
      basketItem?.usdPrice ||
      0
    ) || 0
  );
};

const getUsdBasketItemPrice = (basketItem) => {
  return Number.parseFloat(
    basketItem?.usdPrice || basketItem?.price || 0
  ) || 0;
};

const totalPriceLocalized = basket.reduce((sum, item) => {
  const localizedPrice = getLocalizedBasketItemPrice(item);
  return sum + localizedPrice * (item.quantity || 1);
}, 0);

const totalPriceUsd = basket.reduce((sum, item) => {
  const usdPrice = getUsdBasketItemPrice(item);
  return sum + usdPrice * (item.quantity || 1);
}, 0);

  // Fetch user's basket when component mounts
  useEffect(() => {
    if (user) {
      fetchBasket();
    }
    fetchCryptoPrices();
  }, [user]);

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

const cryptoAvailable = isConnected;

  const fetchBasket = async () => {
    try {
      const response = await axios.get(`${BASKET_API}/basket/${user?.uid}`);
      if (response.data.basket) {
        setBasket(response.data.basket);
      }
    } catch (error) {
      console.error("Error fetching basket:", error);
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

const invalidBasketItems = basket.filter((item) => {
  const shippableCountries = parseShippableCountries(
    item?.shippingCountry || item?.shippableCountries || ""
  );

  if (!selectedCountryCode) return true;
  if (shippableCountries.length === 0) return true;

  return !shippableCountries.includes(selectedCountryCode);
});

const allBasketItemsShippable =
  basket.length > 0 && invalidBasketItems.length === 0;

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
   // Fetch real-time crypto prices
   const fetchCryptoPrices = async () => {
    try {
      const response = await axios.get(CRYPTO_API);
      setCryptoPrices(response.data);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
    }
  };

   // Convert total price to selected cryptocurrency
 const selectedCryptoPrice = cryptoPrices[selectedStablecoin.value] || 1;
const totalPriceCrypto = totalPriceUsd / selectedCryptoPrice;

    // Proceed to Checkout
 const handleCheckout = () => {
  if (basket.length === 0) {
    messageApi.error("Your basket is empty.");
    return;
  }

  if (!lockedCountry?.name) {
    messageApi.error("Please select a delivery country first.");
    return;
  }

  if (!allBasketItemsShippable) {
    messageApi.error("One or more items cannot be shipped to this country.");
    return;
  }

  if (paymentMethod === "crypto" && !isConnected) {
    messageApi.error("Please connect your wallet first.");
    return;
  }

  if (paymentMethod === "paypal" && !paypalAvailable) {
    messageApi.error("PayPal is not supported for this country.");
    return;
  }

  const checkoutData = {
    isFromBasket: true,
    items: basket.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      itemId: item.itemId,
      color: item.color,
      size: item.size,
      brand: item.brand,
      brandPrice: item.brandPrice || "0",
      price: item.price,
      eurText: item?.eurText || "",
      poundText: item?.poundText || "",
      brlText: item?.brlText || "",
      tryText: item?.tryText || "",
      audText: item?.audText || "",
      sarText: item?.sarText || "",
      image: item.image || "/placeholder.png",
      name: item.name || "Product",
      shippingCountry: item?.shippingCountry || item?.shippableCountries || "",
      selectedCountry: item?.selectedCountry || "",
    })),
    paymentMethod,
   currency:
  paymentMethod === "crypto"
    ? selectedStablecoin.value
    : countryCurrencyConfig.currency,
    totalPrice: paymentMethod === "crypto" ? totalPriceUsd : totalPriceLocalized,
    selectedCountry: lockedCountry?.name || "",
  };

  setCheckoutData(checkoutData);

  if (paymentMethod === "crypto") {
    router.push(`/checkout?itemId=false&basket=true&paymentMethod=crypto`);
    return;
  }

  if (paymentMethod === "paypal") {
    router.push(`/paypalCheckout?itemId=false&basket=true&paymentMethod=paypal`);
    return;
  }

  router.push(`/cardCheckout?itemId=false&basket=true&paymentMethod=card`);
};

const cannotCheckout =
  basket.length === 0 ||
  !lockedCountry?.name ||
  !allBasketItemsShippable ||
  (paymentMethod === "crypto" && !isConnected) ||
  (paymentMethod === "paypal" && !paypalAvailable);

  console.log("basket item", basket[0]);

  return (
    <div className="basket-container" style={{
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: "20px",
    gap: "20px",
  }}>
      <div>
      <h2>🛒 {t("basket_title")}</h2>
      {basket.length === 0 ? (
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
               {contextHolder} {/* ✅ Needed for antd message */}
              <div>
              {/* Item Image */}
              <div style={{display: "flex", alignItems: "center", justifyContent: "start"}}>
              <img src={imageUrl} alt={name} className="basket-item-image" />

              {/* Clickable Name */}
              <div
                className="basket-item-name"
                title={name}
                onClick={() => router.push(`/product/${id}`)}
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
  <h3 style={{ color: "#222" }}>💳 {t("basket_payment_method")}</h3>

  <Select
    value={paymentMethod}
    onChange={setPaymentMethod}
    style={{ width: 220 }}
    options={[
      { value: "crypto", label: "Crypto" },
      { value: "paypal", label: "PayPal" },
      { value: "card", label: "Card" },
    ]}
  />

  {paymentMethod === "crypto" && (
    <div style={{ marginTop: "16px" }}>
      {!isConnected ? (
        <p style={{ color: "red" }}>
          Please connect your wallet first to pay with crypto.
        </p>
      ) : (
        <>
          <Select
            value={selectedStablecoin.value}
            onChange={(value) => {
              const found = stablecoinOptions.find((coin) => coin.value === value);
              setSelectedStablecoin(found);
            }}
            style={{ width: 220 }}
            optionLabelProp="label"
          >
            {stablecoinOptions.map((coin) => (
              <Select.Option key={coin.value} value={coin.value} label={coin.label}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={coin.image}
                    alt={coin.label}
                    style={{ width: 20, height: 20, marginRight: 8 }}
                  />
                  {coin.label}
                </div>
              </Select.Option>
            ))}
          </Select>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              color: "#222",
            }}
          >
            <img
              src={selectedStablecoin.image}
              alt={selectedStablecoin.label}
              style={{ width: 25, height: 25, marginRight: 10 }}
            />
            <strong>{selectedStablecoin.label}</strong>
          </div>

          <div style={{ marginTop: "10px", fontSize: "16px", color: "#444" }}>
            ≈ {totalPriceCrypto.toFixed(6)} {selectedStablecoin.value}
          </div>
        </>
      )}
    </div>
  )}

  {paymentMethod === "paypal" && (
    <div style={{ marginTop: "16px" }}>
      {paypalAvailable ? (
        <p style={{ color: "green" }}>PayPal is available for this country.</p>
      ) : (
        <p style={{ color: "red" }}>
          PayPal is not supported for the selected country.
        </p>
      )}
    </div>
  )}

  {paymentMethod === "card" && (
    <div style={{ marginTop: "16px" }}>
      <p style={{ color: "green" }}>Card payment is available.</p>
    </div>
  )}

  {!allBasketItemsShippable && (
    <p style={{ color: "red", marginTop: "12px" }}>
      One or more items in your basket cannot be shipped to {lockedCountry?.name || "the selected country"}.
    </p>
  )}

 <div style={{ marginTop: "20px", fontSize: "18px", fontWeight: "bold", color: "#222" }}>
  🛍️ {t("basket_total_price")}:{" "}
  <span style={{ color: "green" }}>
   {countryCurrencyConfig.symbol}{totalPriceLocalized.toFixed(2)}
  </span>
</div>

{paymentMethod === "crypto" && isConnected && (
  <div style={{ marginTop: "10px", fontSize: "16px", color: "#444" }}>
    ≈ {totalPriceCrypto.toFixed(6)} {selectedStablecoin.value}
  </div>
)}

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
