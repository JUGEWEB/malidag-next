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
import "./paypalBuyNow.css";

const API_BASE_URL = "https://api.malidag.com";
const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID";

  console.log("Using PayPal Client ID:", PAYPAL_CLIENT_ID);

const PayPalBuyNow = ({
  quantity: initialQuantity,
  selectedColor,
  selectedSize,
  tokenAmount: initialTokenAmount,
  basket,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { message } = App.useApp();
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

  const totalAmount = useMemo(() => {
    if (urlBasket === "true" && checkoutData?.items?.length > 0) {
      return Number(parseFloat(checkoutData.totalPrice || 0).toFixed(2));
    }

    if (product) {
      return Number(((product.usdPrice || 0) * urlQuantity).toFixed(2));
    }

    return Number(parseFloat(urlTokenAmount || 0).toFixed(2));
  }, [urlBasket, checkoutData, product, urlQuantity, urlTokenAmount]);

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
        price: item?.usdPrice || "0",
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

  const previewTitle = useMemo(() => {
    if (urlBasket === "true") {
      return `${orderItems.length} item(s)`;
    }

    return item?.name || "Product";
  }, [urlBasket, orderItems, item]);

   console.log({
  paypalReady,
  paypalRendered,
  hasPaypal: typeof window !== "undefined" ? !!window.paypal : false,
  selectedDeliveryInfo,
  totalAmount,
});

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
    if (urlBasket === "false") {
      setCheckoutData({ isFromBasket: false });
    } else if (urlBasket === "true") {
      setCheckoutData({ isFromBasket: true });
    }
  }, [urlBasket, setCheckoutData]);

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

        if (selectedAddress) {
          setSelectedDeliveryInfo(selectedAddress);
        } else if (addresses.length > 0) {
          setSelectedDeliveryInfo(addresses[0]);
        } else {
          setSelectedDeliveryInfo(null);
        }
      } catch (error) {
        console.error("Error fetching delivery info:", error);
        setSelectedDeliveryInfo(null);
      }
    };

    fetchDeliveryInfo();
  }, [authReady, firebaseUser, lockedCountry]);

  const saveSuccessfulPayPalOrder = async (paypalOrder) => {
    if (!selectedDeliveryInfo) {
      throw new Error("Missing delivery info");
    }

    return axios.post(`${API_BASE_URL}/api/paypal-transaction`, {
      paypalOrderId: paypalOrder.id,
      paypalStatus: paypalOrder.status,
      paypalPayerId: paypalOrder?.payer?.payer_id || "",
      paypalEmail: paypalOrder?.payer?.email_address || "",
      amount: totalAmount,
      currency: "USD",
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
    });
  };

  useEffect(() => {
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

        createOrder: async (_data, actions) => {
          if (!selectedDeliveryInfo) {
            message.error(t("fill_delivery_info"));
            throw new Error("Missing delivery info");
          }

          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: "USD",
                  value: totalAmount.toFixed(2),
                },
                shipping: {
                  name: {
                    full_name: selectedDeliveryInfo.fullName || "",
                  },
                  address: {
                    address_line_1: selectedDeliveryInfo.streetName || "",
                    admin_area_2: selectedDeliveryInfo.town || "",
                    postal_code: selectedDeliveryInfo.postalCode || "",
                    country_code: "US",
                  },
                },
              },
            ],
          });
        },

        onApprove: async (_data, actions) => {
          try {
            setIsSubmittingOrder(true);
            const details = await actions.order.capture();
            await saveSuccessfulPayPalOrder(details);
            message.success(t("payment_successful"));
            router.push("/success");
          } catch (error) {
            console.error("PayPal approval error:", error);
            message.error("PayPal payment succeeded, but order saving failed.");
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
    message,
    t,
    router,
  ]);

  if (loading) {
    return <div className="paypal-page-loading">Loading...</div>;
  }

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`}
        strategy="afterInteractive"
        onLoad={() => setPaypalReady(true)}
      />

      <div className="checkout-shell">
        <div className="checkout-container">
          <div className="checkout-left">
            {selectedDeliveryInfo && (
              <div className="paypal-notice">
                <Trans
                  i18nKey="email_notice"
                  values={{ email: selectedDeliveryInfo.email }}
                  components={{ strong: <strong className="paypal-notice-email" /> }}
                />
              </div>
            )}

            <div className="section">
              <h3>{t("delivery_information")}</h3>

              {selectedDeliveryInfo ? (
                <div className="delivery-card">
                  <p>{selectedDeliveryInfo.fullName}</p>
                  <p>{selectedDeliveryInfo.streetName}</p>
                  {selectedDeliveryInfo.companyName ? (
                    <p>{selectedDeliveryInfo.companyName}</p>
                  ) : null}
                  <p>{selectedDeliveryInfo.email}</p>
                  <p>{selectedDeliveryInfo.town}</p>
                  <p>{selectedDeliveryInfo.postalCode || ""}</p>
                  <p>{selectedDeliveryInfo.country}</p>

                  <Link className="section-link" href="/deliveryInformation">
                    {t("modify_delivery_info")}
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="error-text">{t("please_fill_delivery_info")}</p>
                  <Link className="section-link" href="/deliveryInformation">
                    {t("add_delivery_info")}
                  </Link>
                </div>
              )}
            </div>

            <div className="section">
              <h3>Pay with PayPal</h3>

              {!selectedDeliveryInfo ? (
                <p className="error-text">Please add delivery information first.</p>
              ) : (
                <>
                  <div id="paypal-button-container" />
                  {isSubmittingOrder ? (
                    <p className="paypal-loading-text">Saving your order...</p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="checkout-right">
            <div className="summary-card">
              <div className="summary-image-wrap">
                <img
                  src={previewImage}
                  alt={previewTitle}
                  className="summary-image"
                />
              </div>

              <div className="summary-content">
                <span className="summary-badge">Order summary</span>

                <h3 className="summary-title">{previewTitle}</h3>

                {urlBasket !== "true" && urlSelectedColor ? (
                  <p className="summary-meta">Color: {urlSelectedColor}</p>
                ) : null}

                {urlBasket !== "true" &&
                urlSelectedSize &&
                urlSelectedSize !== "null" ? (
                  <p className="summary-meta">Size: {urlSelectedSize}</p>
                ) : null}

                <p className="summary-meta">Quantity: {urlQuantity}</p>

                <div className="summary-divider" />

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Shipping</span>
                  <span>Included</span>
                </div>

                <div className="summary-total">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>

                <p className="summary-secure">
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