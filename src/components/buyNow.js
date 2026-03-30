"use client";

import React, { useState, useEffect } from "react";
import { App, Button } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import axios from "axios";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import "./buyNow.css";
import { auth } from "./firebaseConfig";
import useScreenSize from "./useIsMobile";
import { Trans } from "react-i18next";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "./checkoutStore";

const walletLogos = {
  metamask: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
  walletconnect:
    "https://seeklogo.com/images/W/walletconnect-logo-EE83B50C97-seeklogo.com.png",
  coinbase:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Coinbase_Navy_Logo.svg/1024px-Coinbase_Navy_Logo.svg.png",
  safe: "https://upload.wikimedia.org/wikipedia/commons/8/80/Gnosis_Safe_Logo.png",
};

const tokenAddresses = {
  1: {
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC" },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT" },
  },
  56: {
    USDT: { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT" },
    BUSD: { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", symbol: "BUSD" },
    USDC: { address: "0x8965349fb649A33a30cbFDa057D8eC2C48AbE2A2", symbol: "USDC" },
  },
  97: {
    USDC: { address: "0x64544969ed7EBf5f083679233325356EbE738930", symbol: "USDC" },
    USDT: { address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", symbol: "USDT" },
    BUSD: { address: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee", symbol: "BUSD" },
  },
  137: {
    USDT: { address: "0x3813e82e6f7098b9583FC0F33a962D02018B6803", symbol: "USDT" },
  },
};

const logoUrls = {
  USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
  BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
  USDT: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
};

const BuyNow = ({
  quantity: initialQuantity,
  selectedColor,
  selectedSize,
  tokenAmount: initialTokenAmount,
  basket,
  basketItems,
  user,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const urlItemId = searchParams.get("itemId") || "";
  const urlQuantity = Number(searchParams.get("quantity")) || initialQuantity || 1;
  const urlSelectedColor = searchParams.get("selectedColor") || selectedColor || "";
  const urlSelectedSize = searchParams.get("selectedSize") || selectedSize || "";
  const urlTokenAmount = Number(searchParams.get("tokenAmount")) || initialTokenAmount || 0;
  const urlBasket = searchParams.get("basket") || basket || "false";
  const paymentMethod = searchParams.get("paymentMethod") || "";

  const id = urlItemId;

  const [item, setItem] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trustInfoVisible, setTrustInfoVisible] = useState(true);
  const [quantity, setQuantity] = useState(urlQuantity);
  const [tokenAmount, setTokenAmount] = useState(urlTokenAmount);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [gasFee, setGasFee] = useState(null);
  const [error, setError] = useState(null);
  const [deliveryInformation, setDeliveryInformation] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [payItem, setPayItem] = useState(null);
  const [brand, setBrand] = useState(null);
  const [selectedDeliveryInfo, setSelectedDeliveryInfo] = useState(null);
  const [translations, setTranslations] = useState({});

  const checkoutData = useCheckoutStore((state) => state.checkoutData);
  const setCheckoutData = useCheckoutStore((state) => state.setCheckoutData);

  const { isDesktop, isTablet } = useScreenSize();
  const { address, isConnected, chain } = useAccount();
  const { connectors } = useConnect();
  useDisconnect();
  const { t } = useTranslation();
  const { message } = App.useApp();

  const chainId = chain?.id || null;
  const isCheckoutPage = pathname === "/checkout";

  const imageSrc = item?.images?.[0] || "/placeholder.png";

  const fetchTranslation = async (productId, lang) => {
    if (translations[productId]?.[lang]) return;

    try {
      const response = await axios.get(
        `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
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

  useEffect(() => {
    if (urlBasket === "false") {
      setCheckoutData({ isFromBasket: false });
    } else if (urlBasket === "true") {
      setCheckoutData({ isFromBasket: true });
    }
  }, [urlBasket, setCheckoutData]);

  useEffect(() => {
    setQuantity(urlQuantity);
  }, [urlQuantity]);

  useEffect(() => {
    if (urlTokenAmount > 0) {
      setTokenAmount(urlTokenAmount);
    }
  }, [urlTokenAmount]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);

        if (!urlItemId || urlItemId === "false") {
          setItem(null);
          setProduct(null);
          return;
        }

        const response = await axios.get("https://api.malidag.com/items");
        const normalizedItemId = String(urlItemId).trim();
        const itemsArray = Array.isArray(response.data) ? response.data : [];

        const foundItem = itemsArray.find(
          (product) =>
            String(product?.itemId ?? "").trim() === normalizedItemId ||
            String(product?.id ?? "").trim() === normalizedItemId
        );

        if (!foundItem) {
          console.warn("Item not found for:", normalizedItemId);
          setItem(null);
          setProduct(null);
          return;
        }

        const productData = foundItem.item || foundItem;

        setItem(productData);
        setProduct(productData);
        setPayItem(foundItem.itemId || foundItem.id);
        setBrand(productData?.brand || foundItem?.details?.brand || "");

        const lang = i18n.language || "en";
        if (foundItem.itemId || foundItem.id) {
          fetchTranslation(foundItem.itemId || foundItem.id, lang);
        }
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

  const getTranslatedName = (itemValue, itemIdValue) => {
    const lang = i18n.language || "en";
    const translated = translations[itemIdValue]?.[lang]?.name;
    const fallback = itemValue?.name || t("no_name_available");
    return translated || fallback;
  };

  const fetchTokenBalance = async (walletAddress, tokenAddress, currentChainId) => {
    try {
      const response = await fetch(
        `https://api.malidag.com/token-balance?address=${walletAddress}&tokenAddress=${tokenAddress}&chainId=${currentChainId}`
      );
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllTokenBalances = async () => {
      if (!chainId || !tokenAddresses[chainId] || !address) return;

      const balances = await Promise.all(
        Object.keys(tokenAddresses[chainId]).map(async (symbol) => {
          const tokenData = tokenAddresses[chainId][symbol];
          const balance = await fetchTokenBalance(address, tokenData.address, chainId);
          return { symbol, balance };
        })
      );

      setTokenBalances(balances);
    };

    fetchAllTokenBalances();
  }, [address, chainId]);

  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      try {
        const currentUser = auth?.currentUser;
        if (!currentUser) return;

        const response = await axios.get(
          `https://api.malidag.com/user/delivery-get/${currentUser.uid}`
        );

        const { addresses, selectedIndex } = response.data;

        if (addresses && addresses.length > 0) {
          setDeliveryInformation(addresses);

          if (selectedIndex !== null && selectedIndex >= 0) {
            setSelectedDeliveryInfo(addresses[selectedIndex]);
          } else {
            setSelectedDeliveryInfo(null);
          }
        } else {
          setDeliveryInformation([]);
          setSelectedDeliveryInfo(null);
        }
      } catch (error) {
        console.error("Error fetching delivery info:", error);
        setDeliveryInformation([]);
        setSelectedDeliveryInfo(null);
      }
    };

    fetchDeliveryInfo();
  }, [user]);

  useEffect(() => {
    if (urlBasket === "true") {
      if (checkoutData?.items?.length > 0) {
        const totalUsdPrice = parseFloat(checkoutData.totalPrice || 0).toFixed(2);
        setSelectedCurrency(checkoutData.currency || "USDT");
        setTokenAmount(Number(totalUsdPrice));
      }
    } else if (urlItemId && urlBasket === "false" && product) {
      const tokenAmountRaw = (product.usdPrice || 0) * quantity;
      setSelectedCurrency(product.cryptocurrency || "USDT");
      setTokenAmount(tokenAmountRaw);
    }
  }, [product, quantity, checkoutData, urlBasket, urlItemId]);

  const estimateGas = async () => {
    setError(null);

    try {
      if (!selectedCurrency || !tokenAmount || tokenAmount <= 0) {
        setError(t("invalid_token_or_amount"));
        return;
      }

      const txData = {
        chainId: Number(chainId),
        from: address,
        to: "0xC702A2E4848466346c7cA61Ef5CC77C0cCBA2261",
        value: tokenAmount,
        currency: selectedCurrency,
      };

      const response = await axios.post("https://api.malidag.com/estimate-gas", txData);

      if (response.data.estimatedGas) {
        const gasLimitWithBuffer = Math.ceil(response.data.estimatedGas * 1.2);
        setEstimatedGas(gasLimitWithBuffer);
        setGasFee(response.data.gasFee);
      } else {
        throw new Error(t("gas_estimation_failed"));
      }
    } catch (err) {
      console.error("Gas Estimation Error:", err);
      setError(err.response?.data?.error || t("error_estimating_gas"));
    }
  };

  useEffect(() => {
    if (tokenAmount && selectedCurrency && address) {
      estimateGas();
    }
  }, [tokenAmount, selectedCurrency, chainId, address]);

  const isInsufficientBalance = (usdPrice, selectedCrypto) => {
    const userToken = tokenBalances.find((token) => token.symbol === selectedCrypto);
    const userBalance = userToken ? parseFloat(userToken.balance || "0") : 0;
    const requiredAmount = parseFloat(Number(usdPrice || 0).toFixed(2));

    return userBalance < requiredAmount;
  };

  const handleBuyNow = async () => {
    if (!selectedDeliveryInfo || Object.keys(selectedDeliveryInfo).length === 0) {
      message.error(t("fill_delivery_info"));
      return;
    }

    if (!isConnected || !address) {
      message.error(t("connect_wallet_first"));
      return;
    }

    if (!payItem && urlBasket !== "true") {
      message.error(t("invalid_product_details"));
      return;
    }

    const tokenSymbol = selectedCurrency;
    const requiredCryptoAmount = Number(tokenAmount).toFixed(2);

    let items = [];

    if (urlBasket === "true" && Array.isArray(checkoutData?.items)) {
      items = checkoutData.items.map((basketItem) => ({
        itemId: basketItem.itemId,
        quantity: basketItem.quantity || 1,
        color: basketItem.color || "noColor",
        size: basketItem.size || "nosize",
        price: basketItem.price || "0",
        brand: basketItem.brand || "Unknown",
        brandPrice: basketItem.brandPrice || "0",
      }));
    } else {
      const newSize =
        urlSelectedSize && urlSelectedSize !== "null" ? urlSelectedSize : "nosize";
      const newColor =
        urlSelectedColor && urlSelectedColor !== "null" ? urlSelectedColor : "noColor";

      items = [
        {
          itemId: payItem,
          quantity: quantity || 1,
          size: newSize,
          color: newColor,
          price: item?.usdPrice || "0",
          brand: item?.brand || "Unknown",
          brandPrice: item?.brandPrice || "0",
        },
      ];
    }

    if (isInsufficientBalance(tokenAmount, tokenSymbol)) {
      message.error(t("insufficient_balance", { token: tokenSymbol }));
      return;
    }

    try {
      message.loading(t("processing_transaction"), 0);

      const response = await axios.post("https://api.malidag.com/api/transaction", {
        chainId,
        recipient: "0x40c61A01639BA0d675509878d58864B9C9F65fbf",
        amount: requiredCryptoAmount,
        fullName: selectedDeliveryInfo.fullName,
        email: selectedDeliveryInfo.email,
        userAddress: address,
        streetAddress: selectedDeliveryInfo.streetName,
        companyName: selectedDeliveryInfo.companyName,
        country: selectedDeliveryInfo.country,
        town: selectedDeliveryInfo.town,
        cryptoSymbol: tokenSymbol,
        tokenAddress: tokenAddresses[chainId]?.[tokenSymbol]?.address || null,
        items,
      });

      message.destroy();

      if (response.data.success) {
        message.success(t("payment_successful"));
      } else {
        message.error(t("transaction_failed"));
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      message.error(t("transaction_failed"));
    }
  };

  const getFirstName = () => {
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return null;
  };

  const firstName = getFirstName();

  const handleQuantityChange = (amount) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const getConnectedWallet = () => {
    if (connectors) {
      if (connectors.find((conn) => conn.id === "metaMaskSDK")) {
        return { name: "MetaMask", logo: walletLogos.metamask };
      }
      if (connectors.find((conn) => conn.id === "walletConnect")) {
        return { name: "WalletConnect", logo: walletLogos.walletconnect };
      }
      if (connectors.find((conn) => conn.id === "coinbaseWalletSDK")) {
        return { name: "Coinbase Wallet", logo: walletLogos.coinbase };
      }
      if (connectors.find((conn) => conn.id === "safe")) {
        return { name: "Safe", logo: walletLogos.safe };
      }
    }
    return null;
  };

  const connectedWallet = getConnectedWallet();

  const backToProduct = () => {
    router.push(`/product/${id}`);
  };

  const selectedTokenBalance =
    tokenBalances.find((token) => token.symbol === selectedCurrency)?.balance || "0";

  return (
    <div>
      {selectedDeliveryInfo && (
        <div
          style={{
            backgroundColor: "#d4edda",
            color: "#155724",
            padding: "20px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            maxWidth: isDesktop || isTablet ? "600px" : "100%",
            margin: "20px auto",
            textAlign: "center",
            border: "1px solid #c3e6cb",
          }}
        >
          <Trans
            i18nKey="email_notice"
            values={{ email: selectedDeliveryInfo.email }}
            components={{ strong: <strong style={{ color: "#007bff" }} /> }}
          />
        </div>
      )}

      <div
        style={{
          display: isDesktop || isTablet ? "flex" : "",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{ display: isDesktop || isTablet ? "none" : "", padding: "10px" }}
          className="checkout-containerSmall"
        >
          {loading ? (
            <p>{t("loading_item_details")}</p>
          ) : item ? (
            <div
              className="item-deils"
              onClick={backToProduct}
              style={{
                marginRight: isCheckoutPage && basketItems?.length > 0 ? "120px" : "0px",
              }}
            >
              <img src={imageSrc} alt={item?.name || "product image"} className="item-ige" />
              <h3 className="item-ne">{getTranslatedName(item, payItem).slice(0, 25)}</h3>
            </div>
          ) : (
            <p>{t("item_not_found")}</p>
          )}
        </div>

        <div className="buy-now-container">
          <h2>{t("greeting_ready_to_shop", { firstName })}</h2>

          <div className="section">
            <h3>{t("delivery_information")}</h3>
            {selectedDeliveryInfo ? (
              <div>
                <div>
                  <p>{selectedDeliveryInfo.fullName}</p>
                  <p>{selectedDeliveryInfo.streetName}</p>
                  <p>{selectedDeliveryInfo.companyName}</p>
                  <p>{selectedDeliveryInfo.email}</p>
                  <p>{selectedDeliveryInfo.town}</p>
                  <p>{selectedDeliveryInfo.country}</p>
                </div>
                <Link href="/deliveryInformation">{t("modify_delivery_info")}</Link>
              </div>
            ) : (
              <div>
                <p className="error-text">{t("please_fill_delivery_info")}</p>
                <Link href="/deliveryInformation">{t("add_delivery_info")}</Link>
              </div>
            )}
          </div>

          <div className="buy-now-item-information">
            {loading ? (
              <p>{t("loading_item_details")}</p>
            ) : urlBasket === "true" && checkoutData?.isFromBasket ? (
              <p>{t("items_in_basket_checkout", { count: checkoutData?.items?.length })}</p>
            ) : item ? (
              <div className="ferty">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60px",
                    marginBottom: "20px",
                    gap: "10px",
                  }}
                >
                  <img src={imageSrc} alt={item?.name || "product image"} className="img-ferty" />
                  <h3 className="fabrice">{getTranslatedName(item, payItem).slice(0, 25)}</h3>
                </div>

                <div className="coolte">
                  <div
                    style={{ marginLeft: "10px", cursor: "pointer" }}
                    onClick={() => handleQuantityChange(-1)}
                  >
                    -
                  </div>
                  <span>{quantity}</span>
                  <div
                    style={{ marginRight: "10px", cursor: "pointer" }}
                    onClick={() => handleQuantityChange(1)}
                  >
                    +
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <p className="voyeur">
                    {t("total_price_usd", { price: Number(tokenAmount || 0).toFixed(2) })}
                  </p>
                  {"\u2248"}
                  <p>
                    {Number(tokenAmount || 0).toFixed(2)} {selectedCurrency}
                  </p>
                </div>

                <div style={{ marginTop: "-10px" }}>
                  {urlSelectedColor && urlSelectedColor.trim() !== "" && (
                    <p className="maybe">{t("color_label", { color: urlSelectedColor })}</p>
                  )}
                  {urlSelectedSize &&
                    urlSelectedSize !== "null" &&
                    urlSelectedSize.trim() !== "" && (
                      <p className="sometime">{t("size_label", { size: urlSelectedSize })}</p>
                    )}
                </div>
              </div>
            ) : (
              <p>{t("item_not_found")}</p>
            )}
          </div>

          <div className="section">
            <h3>{t("payment_method")}</h3>
            {isConnected && connectedWallet ? (
              <p>
                {t("connected_wallet")}
                <img
                  src={connectedWallet.logo}
                  alt={connectedWallet.name}
                  style={{
                    width: "34px",
                    height: "34px",
                    marginLeft: "8px",
                    verticalAlign: "middle",
                  }}
                />
                {connectedWallet.name}
              </p>
            ) : (
              <p>{t("no_wallet_connected")}</p>
            )}

            {paymentMethod && <p>Method: {paymentMethod}</p>}

            {isConnected && (
              <p style={{ maxWidth: "100%", maxHeight: "auto" }}>
                {t("address_label", {
                  shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
                })}
              </p>
            )}
          </div>

          <div className="section">
            {tokenBalances.length > 0 ? (
              <ul>
                {tokenBalances.map(({ symbol, balance }) => (
                  <div
                    key={symbol}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      maxWidth: "400px",
                      color: "black",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100px",
                        backgroundColor: "gray",
                        marginBottom: "10px",
                      }}
                    >
                      {logoUrls[symbol] && (
                        <img
                          src={logoUrls[symbol]}
                          alt={`${symbol} logo`}
                          style={{ width: "24px", height: "24px", marginRight: "8px" }}
                        />
                      )}
                      <div style={{ color: "white" }}>{symbol}:</div>
                    </div>
                    <div
                      style={{
                        alignItems: "center",
                        justifyContent: "start",
                        maxWidth: "100%",
                        display: "flex",
                        backgroundColor: "yellow",
                        height: "auto",
                      }}
                    >
                      {Number(balance).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      })}
                    </div>
                  </div>
                ))}
              </ul>
            ) : (
              <p>{t("loading_token_balances")}</p>
            )}
          </div>

          <div>
            <h3>{t("network_gas_fee_estimate")}</h3>
            {loading ? (
              <p>{t("estimating_gas")}</p>
            ) : error ? (
              <p style={{ color: "red" }}>{t("gas_fee_error", { error })}</p>
            ) : estimatedGas && gasFee ? (
              <>
                <p>{t("estimated_gas_units", { units: estimatedGas })}</p>
                <p>{t("gas_fee_amount", { fee: gasFee, symbol: chain?.nativeCurrency?.symbol || "" })}</p>
              </>
            ) : (
              <p>{t("no_gas_fee_data")}</p>
            )}
          </div>

          {isInsufficientBalance(tokenAmount, selectedCurrency) ? (
            <p className="error-text">
              ⚠️ {t("not_enough_balance", { currency: selectedCurrency })}
              <br />
              {t("current_balance", {
                balance: selectedTokenBalance,
                currency: selectedCurrency,
              })}
              <br />
              {t("required_amount", {
                requiredAmount: Number(tokenAmount || 0).toFixed(2),
                currency: selectedCurrency,
              })}
            </p>
          ) : (
            <p className="success-text">
              {t("enough_balance", { currency: selectedCurrency })}
              <br />
              {t("your_balance", {
                balance: selectedTokenBalance,
                currency: selectedCurrency,
              })}
              <br />
              {t("item_price", {
                requiredAmount: Number(tokenAmount || 0).toFixed(2),
                currency: selectedCurrency,
              })}
              <br />
              {t("click_buy_to_proceed")}
            </p>
          )}

          <Button
            className="buy-now-btn"
            onClick={handleBuyNow}
            disabled={isInsufficientBalance(tokenAmount, selectedCurrency)}
          >
            {t("buy_now_button")}
          </Button>

          {trustInfoVisible && (
            <div className="trust-info">
              <h3>{t("trust_security_title")}</h3>
              <p>{t("trust_security_line1")}</p>
              <p>{t("trust_security_line2")}</p>
            </div>
          )}
        </div>

        <div
          style={{ display: isDesktop || isTablet ? "" : "none" }}
          className="checkout-container"
        >
          {loading ? (
            <p>{t("loading_item_details")}</p>
          ) : item ? (
            <div
              className="item-deils"
              onClick={backToProduct}
              style={{
                marginRight: isCheckoutPage && basketItems?.length > 0 ? "120px" : "0px",
              }}
            >
              <img src={imageSrc} alt={item?.name || "product image"} className="item-ige" />
              <h3 className="item-ne">{getTranslatedName(item, payItem).slice(0, 25)}</h3>
            </div>
          ) : (
            <p>{t("item_not_found")}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyNow;