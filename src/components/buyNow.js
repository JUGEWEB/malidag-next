"use client";

import React, { useState, useEffect, useRef } from "react";
import { App, Button } from "antd"; // Ant Design for notifications
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import axios from "axios"
import { useAccount, useNetwork, useBalance,  useReadContracts, useConnect, useDisconnect  } from "wagmi";
import { formatUnits, parseAbi } from "viem";
import "./buyNow.css"; // Import styles
import { auth } from "./firebaseConfig";
import useScreenSize from "./useIsMobile";
import { Trans } from 'react-i18next';
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "./checkoutStore";




const walletLogos = {
  metamask: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
  walletconnect: "https://seeklogo.com/images/W/walletconnect-logo-EE83B50C97-seeklogo.com.png",
  coinbase: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Coinbase_Navy_Logo.svg/1024px-Coinbase_Navy_Logo.svg.png",
  safe: "https://upload.wikimedia.org/wikipedia/commons/8/80/Gnosis_Safe_Logo.png",
};


// 🏦 ERC-20 Token and Native Token Addresses by Chain ID
const tokenAddresses = {
  1: { // Ethereum Mainnet
    ETH: { address: null, symbol: "ETH" }, // Native ETH (No address needed)
    BNB: { address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", symbol: "BNB" },
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC" },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT" },
  },
  56: { // Binance Smart Chain
    BNB: { address: null, symbol: "BNB" }, // Native BNB (No address needed)
    ETH: { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", symbol: "ETH" },
    USDT: { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT" },
    BUSD: { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", symbol: "BUSD" },
    USDC: { address: "0x8965349fb649A33a30cbFDa057D8eC2C48AbE2A2", symbol: "USDC" },
  },
  97: { // Binance Smart Chain Testnet
    BNB: { address: null, symbol: "BNB" }, // Native BNB
    USDC: { address: "0x64544969ed7EBf5f083679233325356EbE738930", symbol: "USDC" },
    USDT: { address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", symbol: "USDT" },
    BUSD: { address: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee", symbol: "BUSD" },
  },
  137: { // Polygon
    MATIC: { address: null, symbol: "MATIC" }, // Native MATIC (No address needed)
    USDT: { address: "0x3813e82e6f7098b9583FC0F33a962D02018B6803", symbol: "USDT" },
    BNB: { address: "0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3", symbol: "BNB" },
    ETH: { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", symbol: "ETH" },
  },
};


 // Mapping of symbols to logo URLs
 const logoUrls = {
  ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
  USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
  BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
  SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422",
  BNB: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
  USDT: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
};



const BuyNow = ({   itemId,
  quantity: initialQuantity,
  selectedColor,
  selectedSize,
  tokenAmount: initialTokenAmount,
  basket,
  basketItems,
  userAddresses,
  user,
  allCountries,
  country,
   }) => {
    const [item, setItem] = useState(null);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trustInfoVisible, setTrustInfoVisible] = useState(true);
    const pathname = usePathname();
     const [quantity, setQuantity] = useState(initialQuantity);
     const [tokenAmount, setTokenAmount] = useState(initialTokenAmount);
    const erc20Abi = parseAbi(["function balanceOf(address) view returns (uint256)"]);
    const id = itemId
    const [nativeBalance, setNativeBalance] = useState(null);
    const [cryptoPrices, setCryptoPrices] = useState({});
    const [tokenBalances, setTokenBalances] = useState([]);
    const [crypto24hPercentageChanges, setCrypto24hPercentageChanges] = useState({});
    const [estimatedGas, setEstimatedGas] = useState(null);
    const [gasFee, setGasFee] = useState(null);
    const [error, setError] = useState(null);
    const [deliveryInformation, setDeliveryInformation] = useState([]);
    const [selectedCurrency, setSelectedCurrency] = useState(null); // or initial selected currency
    const checkoutData = useCheckoutStore((state) => state.checkoutData);
    const setCheckoutData = useCheckoutStore((state) => state.setCheckoutData); // ✅ grab setter
    const [payItem, setPayItem] = useState(null)
    const [color, setColor] = useState(null);
    const [size, setSize] = useState(null);
    const [checkLoading, setCheckLoading] = useState(false)
    const [brand, setBrand] = useState(null)
     const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall, isVeryVerySmall} = useScreenSize()
     const { address, isConnected, chain } = useAccount();
      const { connectors, connect, pendingConnector } = useConnect();
    const [selectedDeliveryInfo, setSelectedDeliveryInfo] = useState(null);
       const { t } = useTranslation();
       const [translations, setTranslations] = useState({});
       const { disconnect } = useDisconnect();
     const chainId = chain?.id || null
     const { message } = App.useApp(); // ✅ like messageApi

    const router = useRouter();

    const isCheckoutPage = pathname === "/checkout";

    const fetchTranslation = async (productId, lang) => {
  if (translations[productId]?.[lang]) return; // Skip if already fetched
  try {
    const response = await axios.get(`https://api.malidag.com/translate/product/translate/${productId}/${lang}`);
    setTranslations(prev => ({
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
  if (basket === "false") {
    // ✅ force reset on mount when basket=false
    setCheckoutData({ isFromBasket: false });
  } else if (basket === "true") {
    // ✅ set flag when basket=true
    setCheckoutData({ isFromBasket: true });
  }
}, [basket, setCheckoutData]);


    useEffect(() => {
      const fetchCryptoData = async () => {
        try {
          const pricesResponse = await axios.get("https://api.malidag.com/crypto-prices");
    
          setCryptoPrices(pricesResponse.data);
        } catch (error) {
          console.error("Error fetching crypto data:", error);
        }
      };
    
      fetchCryptoData();
      const interval = setInterval(fetchCryptoData, 10000); // Fetch every 10 seconds
    
      return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    useEffect(() => {
      const fetchItem = async () => {
        if (id === "false" && basket === "true") {
          console.log("checkoutData", checkoutData)
          // If there's no ID but a basket exists, set product from basket
          setProduct(checkoutData); // Assuming `checkoutData` contains the basket items
          setPayItem(checkoutData);
          setItem(null); // No single item to set
          setLoading(false);
          return;
        }
    
        if (!id) return; // Stop execution if no id and no basket
    
        // If there's an id and basket is false, proceed to fetch the item from the server
        try {
          // Fetch all items from the server
          const response = await axios.get(`https://api.malidag.com/items`);
    
          // Ensure response contains the 'items' array
          if (response.data && response.data.items) {
            // Find the item with the matching ID
            const foundItem = response.data.items.find(item => String(item.id) === String(id));

    
            if (foundItem) {
              setItem(foundItem.item);
              setProduct(foundItem.item);
              setPayItem(foundItem.itemId)
              setBrand(foundItem.item.brand)

              const lang = i18n.language || "en";
  if (foundItem.itemId) fetchTranslation(foundItem.itemId, lang);
            } else {
              console.warn("Item not found for ID:", id);
              setItem(null); // Set item to null if not found
            }
          } else {
            console.warn("Response doesn't contain items:", response.data);
            setItem(null); // Handle case when 'items' is missing in the response
          }
        } catch (error) {
          console.error("Error fetching item:", error);
          setItem(null); // Set item to null on error
        } finally {
          setLoading(false); // Stop loading state
        }
      };
    
      fetchItem();
    }, [id, basket, checkoutData]); // Dependency array includes basket & checkoutData
    


// Define native tokens by chain
const nativeTokens = {
  1: "ETH",  // Ethereum Mainnet
  56: "BNB", // Binance Smart Chain
  97: "BNB",
  137: "MATIC", // Polygon
};

console.log("Item ID:", itemId); // Debugging
const tokenDecimals = {
  USDT: chainId === 56 ? 18 : 6,  // 🔥 USDT has 18 decimals on BSC, 6 on ETH
  USDC: 6,  
  BNB: 18,
  ETH: 18,
  BUSD: 18,
};

const fetchNativeBalance = async (address, chainId) => {
  try {
    const response = await fetch(`https://api.malidag.com/balance?address=${address}&chainId=${chainId}`);
    const data = await response.json();
    return data.balance; // Native balance in ether/BNB
  } catch (error) {
    console.error("Error fetching native balance:", error);
    return null;
  }
};

const getTranslatedName = (item, itemId) => {
  const lang = i18n.language || "en";
  const translated = translations[itemId]?.[lang]?.name;
  const fallback = item?.name || t("no_name_available");
  return translated || fallback;
};


const fetchTokenBalance = async (address, tokenAddress, chainId) => {
  try {
    const response = await fetch(`https://api.malidag.com/token-balance?address=${address}&tokenAddress=${tokenAddress}&chainId=${chainId}`);
    const data = await response.json();
    return data.balance; // Token balance formatted
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return null;
  }
};

 // Fetch native balance (ETH/BNB/MATIC)
 useEffect(() => {
  const fetchBalances = async () => {
    const nativeBal = await fetchNativeBalance(address, chainId);
    setNativeBalance({ formatted: nativeBal, symbol: chainId === nativeTokens[chainId] });
  };

  if (address && chainId) {
    fetchBalances();
  }
}, [address, chainId]);

// Fetch ERC-20 token balances
useEffect(() => {
  const fetchAllTokenBalances = async () => {
    const balances = await Promise.all(
      Object.keys(tokenAddresses[chainId]).map(async (symbol) => {
        const tokenData = tokenAddresses[chainId][symbol];

        // Skip native tokens and handle them separately
        if (tokenData.address === null) {
          return { symbol, balance: nativeBalance ? nativeBalance.formatted : '0' };
        }

        // Fetch ERC-20 token balances using the token address
        const balance = await fetchTokenBalance(address, tokenData.address, chainId);
        return { symbol, balance };
      })
    );
    setTokenBalances(balances);
  };

  if (address && chainId) {
    fetchAllTokenBalances();
  }
}, [address, chainId, tokenAddresses, nativeBalance]);


useEffect(() => {
  const fetchDeliveryInfo = async () => {
    try {
      const user = auth?.currentUser;
      if (!user) return;

      const response = await axios.get(
        `https://api.malidag.com/user/delivery-get/${user.uid}`
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
      console.error("❌ Error fetching delivery info:", error);
      setDeliveryInformation([]);
      setSelectedDeliveryInfo(null);
    }
  };

  fetchDeliveryInfo();
}, [user]);

const convertUsdToCrypto = (usdAmount, cryptoSymbol) => {
  const price = cryptoPrices[cryptoSymbol]; // Get USD price of the crypto
  return price ? (usdAmount / price).toFixed(6) : 0; // Convert USD to crypto amount
};


useEffect(() => {
  if (id === "false" && basket === "true") {
    // Ensure checkoutData and items exist before accessing them
    if (checkoutData?.items?.length > 0) {
      const totalUsdPrice = parseFloat(checkoutData.totalPrice || 0).toFixed(2);

      setSelectedCurrency(checkoutData.currency || "USD"); // Fallback to USD if null
      setTokenAmount(totalUsdPrice); // Set token amount from basket
    }
  } else if (id && basket === "false") {
    // Ensure product exists before accessing usdPrice
    if (product) {
      const tokenAmountRaw = (product.usdPrice || 0) * quantity;
      setSelectedCurrency(product.cryptocurrency || "USD"); // Default to USD
      setTokenAmount(tokenAmountRaw);
    } else {
      console.warn("Product is null or undefined, cannot calculate token amount.");
    }
  }
}, [product, quantity, chainId, cryptoPrices, checkoutData, basket]);

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
      value: tokenAmount, // ✅ Send only USD value
      currency: selectedCurrency,
    };

    // Fetch gas estimate
    const response = await axios.post("https://api.malidag.com/estimate-gas", txData);

    if (response.data.estimatedGas) {
      const gasLimitWithBuffer = Math.ceil(response.data.estimatedGas * 1.2);
      setEstimatedGas(gasLimitWithBuffer);
      setGasFee(response.data.gasFee);
    } else {
      throw new Error(t("gas_estimation_failed"));
    }
  } catch (err) {
    console.error("❌ Gas Estimation Error:", err);
    setError(err.response?.data?.error || t("error_estimating_gas"));
  }
};

useEffect(() => {

  if (tokenAmount && selectedCurrency && address) {
    estimateGas();
  }
}, [tokenAmount, selectedCurrency, chainId, address]);


const handleBuyNow = async () => {
  if (!selectedDeliveryInfo || Object.keys(selectedDeliveryInfo).length === 0) {
    message.error(t("fill_delivery_info"));
    return;
  }

  if (!isConnected || !address) {
    message.error(t("connect_wallet_first"));
    return;
  }

  if (!payItem) {
    message.error(t("invalid_product_details"));
    return;
  }

  const tokenSymbol = selectedCurrency;
  const requiredCryptoAmount = convertUsdToCrypto(tokenAmount, tokenSymbol);

  // 🛍 Build items payload
  let items = [];

  if (basket === "true" && Array.isArray(checkoutData?.items)) {
    items = checkoutData.items.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity || 1,
      color: item.color || "noColor",
      size: item.size || "nosize",
      price: item.price || "0",
      brand: item.brand || "Unknown", // ✅ Add brand from basket item
      brandPrice: item.brandPrice || "0" // ✅ Add brand from basket item
    }));
  } else {
    // Single item
    const newSize = selectedSize && selectedSize !== "null" ? selectedSize : "nosize";
    const newColor = selectedColor && selectedColor !== "null" ? selectedColor : "noColor";

    items = [
      {
        itemId: payItem,
        quantity: quantity || 1,
        size: newSize,
        color: newColor,
        price: item.usdPrice || "0",
        brand: item?.brand || "Unknown", // ✅ Pull from product info
        brandPrice: item.brandPrice || "0" // ✅ Add brand from basket item
      }
    ];
  }

  if (isInsufficientBalance(tokenAmount, tokenSymbol)) {
    message.error(t('insufficient_balance', { token: tokenSymbol }));
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
      items // ✅ Now an array of item(s)
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



   // 🏷 Extract First Name from Firebase
   const getFirstName = () => {
    if (user?.displayName) {
      return user.displayName.split(" ")[0]; // Get first word of displayName
    } else if (user?.email) {
      return user.email.split("@")[0]; // Use email prefix if no displayName
    } else {
      return null; // Default fallback
    }
  };

  const firstName = getFirstName();

  const isInsufficientBalance = (usdPrice, selectedCrypto) => {
    const cryptoToCheck = selectedCrypto;

    // Conditionally handle usdPrice when checkoutData exists
    const priceToUse = usdPrice;

    // Ensure we are passing a valid value for conversion
    const requiredCryptoAmount = convertUsdToCrypto(priceToUse, cryptoToCheck);

    const nativeToken = nativeTokens[chainId];
    const margin = 0.00000001; 

    if (cryptoToCheck === nativeToken) {
        return parseFloat(Number(nativeBalance?.formatted || "0").toFixed(8)) + margin < parseFloat(requiredCryptoAmount);
    }
    
    const userToken = tokenBalances.find(token => token.symbol === cryptoToCheck);
    const userBalance = userToken ? parseFloat(Number(userToken.balance).toFixed(6)) : 0;
    return userBalance + margin < parseFloat(requiredCryptoAmount);
};


  

  const handleQuantityChange = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const getConnectedWallet = () => {
    if (connectors) {
      if (connectors.find(conn => conn.id === "metaMaskSDK")) return { name: "MetaMask", logo: walletLogos.metamask };
      if (connectors.find(conn => conn.id === "walletConnect")) return { name: "WalletConnect", logo: walletLogos.walletconnect };
      if (connectors.find(conn => conn.id === "coinbaseWalletSDK")) return { name: "Coinbase Wallet", logo: walletLogos.coinbase };
      if (connectors.find(conn => conn.id === "safe")) return { name: "Safe", logo: walletLogos.safe };
    }
    return null;
  };

  const connectedWallet = getConnectedWallet();
  
  
  

  const backToProduct = () => {
    router.push(`/product/${id}`)
  }
  
  return (
    <div>
   {selectedDeliveryInfo && (
  <div style={{
    backgroundColor: "#d4edda", 
    color: "#155724", 
    padding: "20px", 
    borderRadius: "8px", 
    fontSize: "16px", 
    fontWeight: "500", 
    maxWidth: (isDesktop || isTablet) ? "600px" : "100%", 
    margin: "20px auto", 
    textAlign: "center",
    border: "1px solid #c3e6cb"
  }}>
    <Trans 
      i18nKey="email_notice"
      values={{ email: selectedDeliveryInfo.email }}
      components={{ strong: <strong style={{ color: '#007bff' }} /> }}
    />
  </div>
)}

    <div style={{display:(isDesktop || isTablet) ? "flex" : "", justifyContent: "space-between"}}>

       <div style={{display: (isDesktop || isTablet) ? "none" : "", padding: "10px"}} className="checkout-containerSmall">
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
      <img src={item?.images?.[0]} alt={item?.name} className="item-ige" />
      <h3 className="item-ne">
 {getTranslatedName(item, payItem).length > 25 ? "..." : ""}
</h3>

    </div>
  ) : (
    <p>{t("item_not_found")}</p>
  )}
</div>

    <div className="buy-now-container">
      <h2>{t("greeting_ready_to_shop", { firstName })}</h2>
      {/* Delivery Information */}
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
   <Link  href="/deliveryInformation">{t("modify_delivery_info")}</Link>
   </div>
          ) : (

          <div>
          <p className="error-text">{t("please_fill_delivery_info")}</p>
          <Link  href="/deliveryInformation">{t("add_delivery_info")}</Link>
          </div>
        )}
      </div>

      <div className="buy-now-item-information">
  {!checkoutData || checkoutData === undefined ? (
    <p>{t("loading_item_details")}</p>
  ) : checkoutData?.isFromBasket ? ( 
    <p>{t("items_in_basket_checkout", { count: checkoutData?.items?.length })}</p>
  ) : item ? (
    <div className="ferty">
      <div 
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "20px", marginBottom: "20px" }}
      >
        <img src={item?.images?.[0]} alt={item?.name} className="img-ferty" />
        <h3 className="fabrice">
 {getTranslatedName(item, payItem).slice(0, 25)}
</h3>
      </div>
      
      {/* Quantity Control */}
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

      {/* Price Calculation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
       <p className="voyeur">{t("total_price_usd", { price: tokenAmount.toFixed(2) })}</p>
        {"\u2248"}
        <p>{convertUsdToCrypto(tokenAmount, selectedCurrency)} {selectedCurrency}</p>
      </div>
      
      {/* Color & Size Selection */}
     <div style={{ marginTop: "-10px" }}>
  {selectedColor && selectedColor.trim() !== "" && (
    <p className="maybe">{t("color_label", { color: selectedColor })}</p>
  )}
  {selectedSize && selectedSize !== "null" && selectedSize.trim() !== "" && (
    <p className="sometime">{t("size_label", { size: selectedSize })}</p>
  )}
</div>
    </div>
  ) : (
    <p>{t("item_not_found")}</p>
  )}
</div>


      {/* Payment Method */}
      <div className="section">
        <h3>{t("payment_method")}</h3>
       {isConnected && connectedWallet ? (
    <p>
       {t("connected_wallet")}
      <img 
        src={connectedWallet.logo} 
        alt={connectedWallet.name} 
        style={{ width: "34px", height: "34px", marginLeft: "8px", verticalAlign: "middle" }} 
      />
       {connectedWallet.name} 
    </p>
  ) : (
    <p>{t("no_wallet_connected")}</p>
  )}

{isConnected && (
         <p style={{ maxWidth: "100%", maxHeight: "auto" }}>
  {t("address_label", {
    shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
  })}
</p>
       )}
      </div>

      {/* Available Balance */}
      <div className="section">
         {/* Native Balance */}
      {nativeBalance ? (
        <p style={{ color: "black" }}>
  {t("native_balance", {
    balance: nativeBalance.formatted,
    symbol: nativeBalance.symbol
  })}
</p>
      ) : (
        <p>{t("loading_token_balances")}</p>
      )}

      {/* Token Balances */}
      {tokenBalances.length > 0 ? (
        <ul>
          {tokenBalances.map(({ symbol, balance }) => (
            <div key={symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "400px", color: "black",  }}>
              <div style={{ display: "flex", alignItems: "center", width: "100px", backgroundColor: "gray", marginBottom: "10px" }}>
                {logoUrls[symbol] && (
                  <img
                    src={logoUrls[symbol]}
                    alt={`${symbol} logo`}
                    style={{ width: "24px", height: "24px", marginRight: "8px" }}
                  />
                )}
                <div style={{ color: "white" }}>{symbol}:</div>
              </div>
              <div style={{ alignItems: "center", justifyContent: "start", maxWidth: "100%", display: "flex", backgroundColor: "yellow", height: "auto" }}>
               {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
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
       <p style={{ color: "red" }}>
      {t("gas_fee_error", { error })}
    </p>
    ) : estimatedGas && gasFee ? (
        <>
            <p>{t("estimated_gas_units", { units: estimatedGas })}</p>
            <p>
        {t("gas_fee_amount", {
          fee: gasFee,
          symbol: nativeTokens[chainId]
        })}
      </p>
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
      balance:
        selectedCurrency === nativeTokens[chainId]
          ? nativeBalance?.formatted || "0"
          : tokenBalances.find(token => token.symbol === selectedCurrency)?.balance || "0",
      currency: selectedCurrency
    })}
    <br />
    {t("required_amount", {
      requiredAmount: convertUsdToCrypto(tokenAmount, selectedCurrency),
      currency: selectedCurrency
    })}
  </p>
) : (
  <p className="success-text">
    {t("enough_balance", { currency: selectedCurrency })}
    <br />
    {t("your_balance", {
      balance:
        selectedCurrency === nativeTokens[chainId]
          ? nativeBalance?.formatted || "0"
          : tokenBalances.find(token => token.symbol === selectedCurrency)?.balance || "0",
      currency: selectedCurrency
    })}
    <br />
    {t("item_price", {
      requiredAmount: convertUsdToCrypto(tokenAmount, selectedCurrency),
      currency: selectedCurrency
    })}
    <br />
    {t("click_buy_to_proceed")}
  </p>
)}


      {/* Buy Now Button */}
      <Button className="buy-now-btn" onClick={handleBuyNow} disabled={isInsufficientBalance(tokenAmount, selectedCurrency)}>{t("buy_now_button")}</Button>

      {/* Trust Information */}
      {trustInfoVisible && (
        <div className="trust-info">
          <h3>{t("trust_security_title")}</h3>
          <p>{t("trust_security_line1")}</p>
          <p>{t("trust_security_line2")}</p>
        </div>
      )}
    </div>
    <div style={{display: (isDesktop || isTablet) ? "" : "none"}} className="checkout-container">
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
      <img src={item?.images?.[0]} alt={item?.name} className="item-ige" />
      <h3 className="item-ne">
 {getTranslatedName(item, payItem).slice(0, 25)}
</h3>

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

