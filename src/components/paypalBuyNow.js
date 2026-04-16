"use client";

import React, { useEffect, useMemo, useState } from "react";
import { App } from "antd";
import Link from "next/link";
import Script from "next/script";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useCheckoutStore } from "./checkoutStore";
import { useTranslation, Trans } from "react-i18next";
import {
  getCountryConfig,
  getCountryCode,
  normalizeCountryName,
} from "./countryUtils";
import "./paypalBuyNow.css";

const API_BASE_URL = "https://api.malidag.com";
const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID";

  console.log("Using PayPal Client ID:", PAYPAL_CLIENT_ID);


const parseShippableCountries = (countryValue) => {
  return String(countryValue || "")
    .split(",")
    .map((entry) => getCountryCode(entry) || normalizeCountryName(entry))
    .filter(Boolean);
};


const getLocalizedItemPrice = (productData, currencyConfig) => {
  if (!productData) return 0;

  const details = productData.details || {};
  const field = currencyConfig.priceField;

  if (field === "usdPrice") {
    return Number.parseFloat(productData.usdPrice || details.usdText || 0) || 0;
  }

  return (
    Number.parseFloat(details[field] || productData[field] || productData.usdPrice || details.usdText || 0) || 0
  );
};

const formatDisplayAmount = (amount, currencyConfig) => {
  const safeAmount = Number(amount || 0).toFixed(2);

  if (currencyConfig.currency === "USDT") {
    return `${safeAmount} USDT`;
  }

  return `${currencyConfig.symbol}${safeAmount}`;
};

const PayPalBuyNow = ({
  quantity: initialQuantity,
  selectedColor,
  selectedSize,
  tokenAmount: initialTokenAmount,
  basket,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
 const { message, notification } = App.useApp();
  const { t } = useTranslation();

  const checkoutData = useCheckoutStore((state) => state.checkoutData);
  const setCheckoutData = useCheckoutStore((state) => state.setCheckoutData);

  const urlItemId = searchParams.get("itemId") || "";
  const urlQuantity =
    Number(searchParams.get("quantity")) || initialQuantity || 1;
  const urlSelectedColor =
    searchParams.get("selectedColor") || selectedColor || "";
  const urlSelectedSize = searchParams.get("selectedSize") || selectedSize || "";
  const urlTokenAmount =
    Number(searchParams.get("tokenAmount")) || initialTokenAmount || 0;
  const urlBasket = searchParams.get("basket") || basket || "false";

  const [item, setItem] = useState(null);
  const [product, setProduct] = useState(null);
  const [payItem, setPayItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [selectedDeliveryInfo, setSelectedDeliveryInfo] = useState(null);
  const [lockedCountry, setLockedCountry] = useState(null);

  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalRendered, setPaypalRendered] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

 const headerCountryName = lockedCountry?.name || "";

const currencyConfig = useMemo(() => {
  return getCountryConfig(headerCountryName);
}, [headerCountryName]);

const selectedCountryCode = useMemo(() => {
  return getCountryCode(headerCountryName);
}, [headerCountryName]);


const isItemShippableToCountry = useMemo(() => {
  if (!item) return false;

  const shippableCountries = parseShippableCountries(
    item?.details?.country || item?.country || ""
  );

  if (!selectedCountryCode) return false;

  return shippableCountries.includes(selectedCountryCode);
}, [item, selectedCountryCode]);

 const totalAmount = useMemo(() => {
  if (urlBasket === "true") {
    return Number(parseFloat(checkoutData?.totalPrice || 0).toFixed(2));
  }

  if (product) {
    const localizedUnitPrice = getLocalizedItemPrice(product, currencyConfig);
    return Number((localizedUnitPrice * urlQuantity).toFixed(2));
  }

  return Number(parseFloat(urlTokenAmount || 0).toFixed(2));
}, [urlBasket, checkoutData?.totalPrice, product, urlQuantity, urlTokenAmount, currencyConfig]);

  const orderItems = useMemo(() => {
    if (urlBasket === "true" && Array.isArray(checkoutData?.items)) {
      return checkoutData.items.map((basketItem) => ({
        itemId: basketItem.itemId,
        quantity: basketItem.quantity || 1,
        color: basketItem.color || "noColor",
        size: basketItem.size || "nosize",
        price: basketItem.price || "0",
        brand: basketItem.brand || "Unknown",
        brandPrice: basketItem.brandPrice || "0",
        image: basketItem.image || "/placeholder.png",
        name: basketItem.name || "Product",
      }));
    }

    return [
      {
        itemId: payItem,
        quantity: urlQuantity || 1,
        color:
          urlSelectedColor && urlSelectedColor !== "null"
            ? urlSelectedColor
            : "noColor",
        size:
          urlSelectedSize && urlSelectedSize !== "null"
            ? urlSelectedSize
            : "nosize",
       price: String(getLocalizedItemPrice(item, currencyConfig) || "0"),
       currency: currencyConfig.currency,
        brand: item?.brand || "Unknown",
        brandPrice: item?.brandPrice || "0",
        image: item?.images?.[0] || "/placeholder.png",
        name: item?.name || "Product",
      },
    ];
  }, [
    urlBasket,
    checkoutData,
    payItem,
    urlQuantity,
    urlSelectedColor,
    urlSelectedSize,
    item,
  ]);

  const previewImage = useMemo(() => {
    if (urlBasket === "true" && orderItems.length > 0) {
      return orderItems[0]?.image || "/placeholder.png";
    }

    return item?.images?.[0] || "/placeholder.png";
  }, [urlBasket, orderItems, item]);

  const basketItemCount = useMemo(() => {
  if (urlBasket !== "true") return 0;
  return Array.isArray(checkoutData?.items) ? checkoutData.items.length : 0;
}, [urlBasket, checkoutData]);

  const basketTotalQuantity = useMemo(() => {
  if (urlBasket !== "true" || !Array.isArray(orderItems)) return urlQuantity || 1;

  return orderItems.reduce((sum, item) => {
    return sum + Number(item.quantity || 1);
  }, 0);
}, [urlBasket, orderItems, urlQuantity]);

const previewTitle = useMemo(() => {
  if (urlBasket === "true") {
    return `Proceeding with ${basketItemCount} item${basketItemCount > 1 ? "s" : ""}`;
  }

  return item?.name || "Product";
}, [urlBasket, basketItemCount, item]);

   console.log({
  paypalReady,
  paypalRendered,
  hasPaypal: typeof window !== "undefined" ? !!window.paypal : false,
  selectedDeliveryInfo,
  totalAmount,
});

const isBasketShippableToCountry = useMemo(() => {
  if (urlBasket !== "true") return false;
  if (!selectedCountryCode) return false;
  if (!Array.isArray(checkoutData?.items) || checkoutData.items.length === 0) return false;

  return checkoutData.items.every((basketItem) => {
    const shippableCountries = parseShippableCountries(
      basketItem?.shippingCountry || basketItem?.shippableCountries || ""
    );

    return shippableCountries.includes(selectedCountryCode);
  });
}, [urlBasket, checkoutData, selectedCountryCode]);

const canShipToSelectedCountry = useMemo(() => {
  if (urlBasket === "true") {
    return isBasketShippableToCountry;
  }

  return isItemShippableToCountry;
}, [urlBasket, isBasketShippableToCountry, isItemShippableToCountry]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser || null);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedCountry = localStorage.getItem("selectedCountry");
      if (savedCountry) {
        setLockedCountry(JSON.parse(savedCountry));
      }
    } catch (err) {
      console.error("Failed to read selected country:", err);
    }
  }, []);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);

        if (!urlItemId || urlItemId === "false") {
          setItem(null);
          setProduct(null);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/items`);
        const normalizedItemId = String(urlItemId).trim();
        const itemsArray = Array.isArray(response.data) ? response.data : [];

        const foundItem = itemsArray.find(
          (entry) =>
            String(entry?.itemId ?? "").trim() === normalizedItemId ||
            String(entry?.id ?? "").trim() === normalizedItemId
        );

        if (!foundItem) {
          setItem(null);
          setProduct(null);
          return;
        }

        const productData = foundItem.item || foundItem;
        const mergedProductData = {
          ...productData,
          details: foundItem.details || productData.details || {},
        };

        setItem(mergedProductData);
        setProduct(mergedProductData);
        setPayItem(foundItem.itemId || foundItem.id);
      } catch (error) {
        console.error("Error fetching item:", error);
        setItem(null);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [urlItemId]);

  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      try {
        if (!authReady || !firebaseUser) return;

        const response = await axios.get(
          `${API_BASE_URL}/user/delivery-get/${firebaseUser.uid}`
        );

        const addresses = response.data.addresses || [];
        const backendSelectedIndex = response.data.selectedIndex;

        const normalizedLockedCountry =
          lockedCountry?.name?.trim().toLowerCase() || "";

        const selectedAddress =
          backendSelectedIndex !== null &&
          backendSelectedIndex >= 0 &&
          addresses[backendSelectedIndex]
            ? addresses[backendSelectedIndex]
            : null;

        const selectedMatchesCountry =
          selectedAddress &&
          selectedAddress.country?.trim().toLowerCase() === normalizedLockedCountry;

        if (!normalizedLockedCountry) {
          if (selectedAddress) {
            setSelectedDeliveryInfo(selectedAddress);
          } else if (addresses.length > 0) {
            setSelectedDeliveryInfo(addresses[0]);
          } else {
            setSelectedDeliveryInfo(null);
          }
          return;
        }

        if (selectedMatchesCountry) {
          setSelectedDeliveryInfo(selectedAddress);
          return;
        }

        const firstMatchingEntry = addresses.find(
          (address) =>
            address?.country?.trim().toLowerCase() === normalizedLockedCountry
        );

        if (firstMatchingEntry) {
          setSelectedDeliveryInfo(firstMatchingEntry);
          return;
        }

       // STRICT MODE: only allow matching country
       setSelectedDeliveryInfo(null);
      } catch (error) {
        console.error("Error fetching delivery info:", error);
        setSelectedDeliveryInfo(null);
      }
    };

    fetchDeliveryInfo();
  }, [authReady, firebaseUser, lockedCountry]);

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
  setPaypalRendered(false);

  const container = document.getElementById("paypal-button-container");
  if (container) {
    container.innerHTML = "";
  }

  if (typeof window !== "undefined" && window.paypal) {
    setPaypalReady(true);
  }
}, [
  headerCountryName,
  currencyConfig.currency,
  currencyConfig.paypalSupported,
  isItemShippableToCountry,
  selectedDeliveryInfo,
]);

 

 useEffect(() => {
  if (!currencyConfig.paypalSupported) return;
 if (!canShipToSelectedCountry) return;
  if (!paypalReady || paypalRendered) return;
  if (!window.paypal) return;
  if (!selectedDeliveryInfo) return;
  if (!totalAmount || totalAmount <= 0) return;

  const container = document.getElementById("paypal-button-container");
  if (!container) return;

  container.innerHTML = "";

  window.paypal
    .Buttons({
      style: {
        layout: "vertical",
        shape: "rect",
        label: "paypal",
      },

      createOrder: async () => {
        if (!selectedDeliveryInfo) {
          message.error(t("fill_delivery_info"));
          throw new Error("Missing delivery info");
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/paypal/create-order`,
          {
            amount: totalAmount,
            currency: currencyConfig.currency,
            fullName: selectedDeliveryInfo.fullName || "",
            streetAddress: selectedDeliveryInfo.streetName || "",
            town: selectedDeliveryInfo.town || "",
            postalCode: selectedDeliveryInfo.postalCode || "",
            country: selectedDeliveryInfo.country || "",
          }
        );

        return response.data.id;
      },

      onApprove: async (data, actions) => {
        try {
          setIsSubmittingOrder(true);

          const response = await axios.post(
            `${API_BASE_URL}/api/paypal/capture-order`,
            {
              paypalOrderId: data.orderID,
              amount: totalAmount,
              currency: currencyConfig.currency,
              userId: firebaseUser?.uid || "",
              fullName: selectedDeliveryInfo.fullName,
              email: selectedDeliveryInfo.email,
              streetAddress: selectedDeliveryInfo.streetName,
              companyName: selectedDeliveryInfo.companyName,
              country: selectedDeliveryInfo.country,
              town: selectedDeliveryInfo.town,
              postalCode: selectedDeliveryInfo.postalCode || "",
              items: orderItems,
              paymentMethod: "paypal",
            }
          );

         if (response.data?.success) {
        notification.success({
          message: "Payment Successful 🎉",
          description:
            "Your payment has been made successfully. We will send you a confirmation email shortly.",
          placement: "topRight",
          duration: 5,
        });

        return;
      }

          throw new Error("PayPal capture failed");
        } catch (error) {
          const issue = error?.response?.data?.details?.[0]?.issue;

          if (issue === "INSTRUMENT_DECLINED") {
            return actions.restart();
          }

          console.error("PayPal approval error:", error?.response?.data || error);
          message.error("PayPal payment failed.");
        } finally {
          setIsSubmittingOrder(false);
        }
      },

      onError: (err) => {
        console.error("PayPal button error:", err);
        message.error("PayPal payment failed.");
      },

      onCancel: () => {
        message.info("PayPal payment was cancelled.");
      },
    })
    .render("#paypal-button-container")
    .then(() => {
      setPaypalRendered(true);
    })
    .catch((err) => {
      console.error("Error rendering PayPal buttons:", err);
    });
}, [
  paypalReady,
  paypalRendered,
  selectedDeliveryInfo,
  totalAmount,
  currencyConfig.paypalSupported,
  currencyConfig.currency,
  isItemShippableToCountry,
  firebaseUser,
  orderItems,
  message,
  t,
  router,
]);

  if (loading) {
    return <div className="paypal-page-loading">Loading...</div>;
  }

  return (
    <>
   {currencyConfig.paypalSupported && canShipToSelectedCountry ? (
  <Script
    key={currencyConfig.currency}
    src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${currencyConfig.currency}&intent=capture`}
    strategy="afterInteractive"
   onLoad={() => {
  setPaypalReady(true);
}}
  />
) : null}

      <div className="checkout-shell-paypal">
        <div className="checkout-container-paypal">
          <div className="checkout-left-paypal">
            {selectedDeliveryInfo && (
              <div className="paypal-notice-paypal">
                <Trans
                  i18nKey="email_notice"
                  values={{ email: selectedDeliveryInfo.email }}
                  components={{ strong: <strong className="paypal-notice-email-paypal" /> }}
                />
              </div>
            )}

            <div className="section-paypal">
              <h3>{t("delivery_information")}</h3>

              {selectedDeliveryInfo ? (
                <div className="delivery-card-paypal">
                  <p>{selectedDeliveryInfo.fullName}</p>
                  <p>{selectedDeliveryInfo.streetName}</p>
                  {selectedDeliveryInfo.companyName ? (
                    <p>{selectedDeliveryInfo.companyName}</p>
                  ) : null}
                  <p>{selectedDeliveryInfo.email}</p>
                  <p>{selectedDeliveryInfo.town}</p>
                  <p>{selectedDeliveryInfo.postalCode || ""}</p>
                  <p>{selectedDeliveryInfo.country}</p>

                  <Link className="section-link-paypal" href="/deliveryInformation">
                    {t("modify_delivery_info")}
                  </Link>
                  {!canShipToSelectedCountry && (
                    <p className="error-text-paypal">
                      {urlBasket === "true"
                        ? `One or more basket items cannot be shipped to ${selectedDeliveryInfo.country}.`
                        : `This item cannot be shipped to ${selectedDeliveryInfo.country}.`}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="error-text-paypal">{t("please_fill_delivery_info")}</p>
                  <Link className="section-link-paypal" href="/deliveryInformation">
                    {t("add_delivery_info")}
                  </Link>
                </div>
              )}
            </div>

            <div className="section-paypal">
              <h3>Pay with PayPal</h3>

            {!selectedDeliveryInfo ? (
  <p className="error-text-paypal">Please add delivery information first.</p>
) : !canShipToSelectedCountry ? (
  <p className="error-text-paypal">
    {urlBasket === "true"
      ? "One or more basket items cannot be shipped to the selected country."
      : "This item cannot be shipped to the selected country."}
  </p>
) : !currencyConfig.paypalSupported ? (
  <p className="error-text-paypal">
    PayPal is not supported for this delivery country. Price is shown in USDT fallback.
  </p>
) : (
  <>
    <div id="paypal-button-container" />
    {isSubmittingOrder ? (
      <p className="paypal-loading-text-paypal">Saving your order...</p>
    ) : null}
  </>
)}
            </div>
          </div>

          <div className="checkout-right-paypal">
            <div className="summary-card-paypal">
             {urlBasket !== "true" && (
              <div className="summary-image-wrap-paypal">
                <img
                  src={previewImage}
                  alt={previewTitle}
                  className="summary-image-paypal"
                />
              </div>
            )}

              <div className="summary-content-paypal">
                <span className="summary-badge-paypal">Order summary</span>

                <h3 className="summary-title-paypal">{previewTitle}</h3>

                {urlBasket === "true" ? (
                <p className="summary-meta-paypal">
                  Your selected basket items are ready for checkout.
                </p>
              ) : null}

                {urlBasket !== "true" && urlSelectedColor ? (
                  <p className="summary-meta-paypal">Color: {urlSelectedColor}</p>
                ) : null}

                {urlBasket !== "true" &&
                urlSelectedSize &&
                urlSelectedSize !== "null" ? (
                  <p className="summary-meta-paypal">Size: {urlSelectedSize}</p>
                ) : null}

              {urlBasket !== "true" && (
                  <p className="summary-meta-paypal">Quantity: {urlQuantity}</p>
                )}

                <div className="summary-divider-paypal" />

                <div className="summary-row-paypal">
                  <span>Subtotal</span>
                 <span>{formatDisplayAmount(totalAmount, currencyConfig)}</span>
                </div>

                <div className="summary-row-paypal">
                  <span>Shipping</span>
                  <span>Included</span>
                </div>

                <div className="summary-total-paypal">
                  <span>Total</span>
                 <span>{formatDisplayAmount(totalAmount, currencyConfig)}</span>
                </div>

                <p className="summary-secure-paypal">
                  Secure payment processed with PayPal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayPalBuyNow;