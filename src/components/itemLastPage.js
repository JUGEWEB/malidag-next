"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams, usePathname } from "next/navigation";
import axios from "axios";
import { useAccount } from "wagmi";
import { message } from "antd";
import useFinalRating from "./finalRating";
import "./ItemLastPage.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageZoom from "./imageZoom";
import ImageZoom1 from "./imageZoom1";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { auth } from "@/components/firebaseConfig";
import { useCheckoutStore } from "./checkoutStore";
import Head from "next/head";
import { useLang } from "./LanguageContext";

import ProductDetailsPhone from "./ProductDetailsPhone";
import ProductDetailsTablet from "./ProductDetailsTablet";
import ProductDetailsDesktop from "./ProductDetailsDesktop";

// ⬇️ IMPORTANT: pick the default export explicitly
const Slider = dynamic(() => import("react-slick").then((m) => m.default), {
  ssr: false,
  loading: () => null,
});

const BASKET_API = "https://api.malidag.com/add-to-basket";
const BASE_URL = "https://api.malidag.com";
const PRICE_API = "https://api.malidag.com/crypto-prices";
const LIKED_API = "https://api.malidag.com";

const coinImages = {
  ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
  USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
  BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
  SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422",
  BNB: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
  USDT: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
};

function ProductDetails({ basketItems, country }) {
  const { address, isConnected, chain } = useAccount();
  const chainId = chain?.id;

  const [reviewCount, setReviewCount] = useState(0);
  const pathname = usePathname();
  const params = useParams();
  const { id, rating } = params;
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [itemsd, setItemId] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [zoomType, setZoomType] = useState("zoom1");

  const ratingFromURL = rating;
  const buttonRef = useRef(null);
  const modalRef = useRef(null);
  const { finalRating } = useFinalRating(itemsd);
  const detailsRef = useRef(null);

  const [isHoveringThumbnails, setIsHoveringThumbnails] = useState(false);
  const [isHoveringImageCenter, setIsHoveringImageCenter] = useState(false);
  const [detailsSectionAtTop, setDetailsSectionAtTop] = useState(false);
  const [isBasketVisible, setIsBasketVisible] = useState(false);
  const [detailsSectionAtBottom, setDetailsSectionAtBottom] = useState(false);
  const [zoomedPosition, setZoomedPosition] = useState({ x: 0, y: 0 });
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [selectedImageNumber, setSelectedImageNumber] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [item, setItem] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const {
    isMobile,
    isDesktop,
    isTablet,
    isSmallMobile,
    isVerySmall,
  } = useScreenSize();

  const isPhone = isMobile || isSmallMobile || isVerySmall;

  const [navigateToReview, setNavigateToReview] = useState(false);
  const [ratingToPass, setRatingToPass] = useState(null);
  const [openModalSmall, setOpenModalSmall] = useState(false);
  const [pendingRating, setPendingRating] = useState(null);

  const { t } = useTranslation();
  const [translation, setTranslation] = useState(null);
  const [ready, setReady] = useState(false);

  const setItemData = useCheckoutStore((state) => state.setItemData);
  const setRatingFilter = useCheckoutStore((state) => state.setRatingFilter);
  const setAuthState = useCheckoutStore((state) => state.setAuthState);
  const setSelectedBrandName = useCheckoutStore(
    (state) => state.setSelectedBrandName
  );

  const [messageApi, contextHolder] = message.useMessage();
  const setCheckoutData = useCheckoutStore.getState().setCheckoutData;
  const { lang } = useLang();

  const validVideos = Array.isArray(product?.videos)
    ? product.videos.filter((v) => {
        return (
          typeof v === "string" &&
          v.trim().toLowerCase().match(/\.(mp4|webm)$/)
        );
      })
    : [];

  const handleMouseEnterThumbnails = () => setIsHoveringThumbnails(true);
  const handleMouseLeaveThumbnails = () => setIsHoveringThumbnails(false);

  const handleMouseEnterImageCenter = () => setIsHoveringImageCenter(true);
  const handleMouseLeaveImageCenter = () => setIsHoveringImageCenter(false);

  const fetchZoomSetting = async (itemId, color, imageNumber) => {
    try {
      if (!itemId || !color) return;

      const response = await fetch(
        `https://api.malidag.com/api/zoom-setting?itemId=${itemId}&color=${color}&imageNumber=${imageNumber}`
      );
      const result = await response.json();

      if (response.ok) {
        setZoomType(result.zoomType);
      } else {
        setZoomType("zoom1");
      }
    } catch (error) {
      console.error("Failed to fetch zoom setting:", error);
    }
  };

  useEffect(() => {
    fetchZoomSetting(itemsd, selectedColor, selectedImageNumber);
  }, [itemsd, selectedColor, selectedImageNumber]);

  const checkDetailsSectionPosition = () => {
    if (detailsRef.current) {
      const rect = detailsRef.current.getBoundingClientRect();
      setDetailsSectionAtTop(rect.top <= 0);
      setDetailsSectionAtBottom(rect.bottom >= window.innerHeight);
    }
  };

  useEffect(() => {
    checkDetailsSectionPosition();

    const handleScroll = () => {
      checkDetailsSectionPosition();
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleWheel = (event) => {
      if (!detailsRef.current) return;

      const details = detailsRef.current;
      const delta = event.deltaY;

      const atTop = details.scrollTop === 0;
      const atBottom =
        details.scrollTop + details.clientHeight >= details.scrollHeight - 1;

      setDetailsSectionAtTop(atTop);
      setDetailsSectionAtBottom(atBottom);

      if (isHoveringThumbnails || isHoveringImageCenter) {
        if ((delta > 0 && atBottom) || (delta < 0 && atTop)) {
          return;
        } else {
          event.preventDefault();
          details.scrollTop += delta;
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [isHoveringThumbnails, isHoveringImageCenter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setModalOpen(false);
      }
    };

    if (modalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalOpen]);

  useEffect(() => {
    const updateModalPosition = () => {
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        setModalPosition({
          top: buttonRect.top + window.scrollY + buttonRect.height + 10,
          left: buttonRect.left + window.scrollX,
        });
      }
    };

    window.addEventListener("scroll", updateModalPosition);
    updateModalPosition();

    return () => {
      window.removeEventListener("scroll", updateModalPosition);
    };
  }, []);

  useEffect(() => {
    if (ratingFromURL) {
      setSelectedRating(parseFloat(ratingFromURL));
    }
  }, [ratingFromURL]);

  useEffect(() => {
    if (pathname.includes("product/")) {
      setIsBasketVisible(true);
    } else {
      setIsBasketVisible(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang).then(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [lang]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const count = parseInt(localStorage.getItem("reviewCount") || "0", 10);
      setReviewCount(count);
    }
  }, []);

  const fetchTranslation = async (productId, lang) => {
    try {
      const response = await axios.get(
        `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
      );
      setTranslation(response.data.translation);
    } catch (error) {
      console.error("Translation fetch error:", error.message);
      setTranslation(null);
    }
  };

  useEffect(() => {
    if (!id || !i18n.language) return;
    fetchTranslation(id, i18n.language);
  }, [id, i18n.language]);

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/item/${id}`);
      const foundProduct = response.data;

      setItem(foundProduct);

      if (foundProduct?.item) {
        const initialColor = Object.keys(foundProduct.item.imagesVariants)[0];
        setItemId(foundProduct.itemId);
        setProduct(foundProduct.item);

        const userLang = i18n.language || "en";
        setSelectedColor(initialColor);
        setSelectedImage(foundProduct.item.imagesVariants[initialColor][0]);
        fetchTranslation(foundProduct.itemId, userLang);

        const sizesString = foundProduct.item.size?.[initialColor]?.[0] || "";
        const sizesArray = sizesString.split(", ").map((size) => size.trim());
        const initialSize = sizesArray[0] || null;
        setSelectedSize(initialSize);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, [id]);

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        const response = await axios.get(PRICE_API);
        setCryptoPrices(response.data);
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
      }
    };

    fetchCryptoPrices();

    const interval = setInterval(fetchCryptoPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigateToReview && ratingToPass !== null) {
      setItemData({ id, itemId: itemsd, item: product });
      setRatingFilter(ratingToPass);

      router.push(`/product/${id}/review`);

      setNavigateToReview(false);
      setRatingToPass(null);
    }
  }, [
    navigateToReview,
    ratingToPass,
    id,
    itemsd,
    product,
    router,
    setItemData,
    setRatingFilter,
  ]);

  const convertToCrypto = (usdAmount, cryptoType) => {
    if (cryptoPrices[cryptoType]) {
      return (usdAmount / cryptoPrices[cryptoType]).toFixed(6);
    }
    return t("loading");
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setSelectedImage(product.imagesVariants[color][0]);

    const sizesString = product.size?.[color]?.[0] || "";
    const sizesArray = sizesString.split(", ").map((size) => size.trim());
    setSelectedSize(sizesArray[0] || t("no_size_available"));
  };

  const handleImageChange = (image, index) => {
    setSelectedImage(image);
    setSelectedImageNumber(index);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

  const videoSliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  const toggleModal = () => {
    if (modalOpen) {
      setModalOpen(false);
    } else {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setModalPosition({
          top: rect.top + window.scrollY + 30,
          left: rect.left + window.scrollX,
        });
      }
      setModalOpen(true);
    }
  };

  const handleAddToBasket = async (product) => {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      alert(t("login_to_add_to_basket"));
      return;
    }

    try {
      const basketItem = {
        userId: currentUser.uid,
        item: {
          id: id,
          itemId: itemsd,
          name: product.name,
          price: product.usdPrice,
          color: selectedColor,
          size: selectedSize,
          image: selectedImage,
          brand: product.brand,
          brandPrice: product.brandPrice,
          quantity: 1,
        },
      };

      const response = await axios.post(BASKET_API, basketItem);

      if (response.status === 200 || response.status === 201) {
        alert(t("basket_add_success", { product: product.name }));
      } else {
        alert(t("basket_add_failed"));
      }
    } catch (error) {
      console.error("Error adding item to basket:", error);
      alert(t("basket_add_error"));
    }
  };

  const handleLikeItem = async (product) => {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      alert(t("like_login_required"));
      return;
    }

    try {
      const likedItem = {
        userId: currentUser?.uid,
        id: id,
        name: product.name,
        price: product.usdPrice,
        image: product.images?.[0],
      };

      const response = await axios.post(`${LIKED_API}/like-item`, likedItem);

      if (response.status === 200 || response.status === 201) {
        alert(t("like_success", { product: product.name }));
      } else {
        alert(t("like_failed"));
      }
    } catch (error) {
      console.error("Error liking item:", error);
    }
  };

  const handleMouseMove = ({ xPercent, yPercent }) => {
    setZoomedPosition({
      x: xPercent,
      y: yPercent,
    });
  };

  const handleMouseEnterImage = () => {
    if (isDesktop) {
      setIsZoomVisible(true);
    }
  };

  const handleMouseLeaveImage = () => {
    if (isDesktop) {
      setIsZoomVisible(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const renderImageZoom = () => {
    if (!selectedImage) return null;

    if (isTablet) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={encodeURI(selectedImage)}
            alt="Selected product"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      );
    }

    if (zoomType === "nozoom") {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={encodeURI(selectedImage)}
            alt="Selected product"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      );
    }

    if (zoomType === "zoom") {
      return (
        <ImageZoom
          selectedImage={selectedImage}
          basketItems={basketItems}
          alt="Selected product"
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            cursor: "zoom-in",
          }}
        />
      );
    }

    if (zoomType === "zoom1") {
      return (
        <ImageZoom1
          isZoomVisible={isZoomVisible}
          selectedImage={selectedImage}
          onMouseMove={handleMouseMove}
          zoomedPosition={zoomedPosition}
          onMouseEnter={handleMouseEnterImage}
          onMouseLeave={handleMouseLeaveImage}
          basketItems={basketItems}
        />
      );
    }

    return null;
  };

  const networkLogos = {
    1: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
    56: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
    97: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
    137: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912",
  };

  const getNetworkName = (chainId) => {
    if (!chainId) {
      return (
        <div style={{ color: "red" }}>
          {t("not_connected")}
          <br />
          <a
            href="/supported-networks"
            style={{ color: "blue", textDecoration: "underline" }}
          >
            {t("learn_supported_networks")}
          </a>
        </div>
      );
    }

    const networkName = {
      1: "Ethereum Mainnet",
      56: "Binance Smart Chain",
      97: "BSC Testnet",
      137: "Polygon",
    }[chainId];

    if (!networkName) {
      return (
        <div style={{ color: "red" }}>
          {t("unknown_network")}
          <br />
          <a
            href="/supported-networks"
            style={{ color: "blue", textDecoration: "underline" }}
          >
            {t("learn_supported_networks")}
          </a>
        </div>
      );
    }

    if (!ready) return null;

    return (
      <div style={{ color: "green", display: "flex", alignItems: "center" }}>
        {t("connected_to_network", { network: networkName })}
        {networkLogos[chainId] && (
          <img
            src={networkLogos[chainId]}
            alt={networkName}
            style={{ width: "20px", height: "20px", marginLeft: "8px" }}
          />
        )}
      </div>
    );
  };

  const handlePaymentOptionSelect = (method) => {
  if (method === "crypto" && !chainId) {
    messageApi.warning("Connect your wallet first");
    return;
  }

  setCheckoutData({
    isFromBasket: false,
    paymentMethod: method,
  });

  router.push(
    `/checkout?itemId=${itemsd}&quantity=${quantity}&selectedColor=${selectedColor}&selectedSize=${selectedSize}&tokenAmount=${
      product.usdPrice * quantity
    }&basket=false&paymentMethod=${method}`
  );

  setPaymentModalOpen(false);
};

 const handleBuyNowClick = () => {
  setPaymentModalOpen(true);
};

  const handleQuantityChange = (amount) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const handleVisitBrand = async () => {
    if (!product?.brand || product.brand.trim() === "") return;

    try {
      const response = await axios.get(
        "https://api.malidag.com/api/brands/themes"
      );
      const themes = response.data;

      const matchedBrand = themes.find(
        (b) =>
          b.brandName.trim().toLowerCase() ===
          product.brand.trim().toLowerCase()
      );

      if (matchedBrand?.theme) {
        const themeRoute = matchedBrand.theme.toLowerCase();
        setSelectedBrandName(product.brand);
        router.push(`/brand/${themeRoute}/${encodeURIComponent(product.brand)}`);
      } else {
        console.warn("Theme not found for brand:", product.brand);
      }
    } catch (error) {
      console.error("Failed to fetch brand themes:", error);
    }
  };

  return (
    <div>
      <Head>
        <title>{product?.name || "Malidag"}</title>
        <meta
          name="description"
          content={`Shop ${product?.name || "this product"} at Malidag — ${
            product?.theme || "Beauty & Care for You"
          }`}
        />
      </Head>

      {contextHolder}

      <div
      >
        {isPhone && product && (
          <ProductDetailsPhone
            product={product}
            translation={translation}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            selectedRating={selectedRating}
            quantity={quantity}
            finalRating={finalRating}
            itemsd={itemsd}
            id={id}
            chainId={chainId}
            reviewCount={reviewCount}
            openModalSmall={openModalSmall}
            setOpenModalSmall={setOpenModalSmall}
            setRatingToPass={setRatingToPass}
            setNavigateToReview={setNavigateToReview}
            setItemData={setItemData}
            setAuthState={setAuthState}
            setRatingFilter={setRatingFilter}
            router={router}
            t={t}
            buttonRef={buttonRef}
            validVideos={validVideos}
            Slider={Slider}
            videoSliderSettings={videoSliderSettings}
            cryptoPrices={cryptoPrices}
            convertToCrypto={convertToCrypto}
            coinImages={coinImages}
            getNetworkName={getNetworkName}
            handleVisitBrand={handleVisitBrand}
            handleColorChange={handleColorChange}
            handleImageChange={handleImageChange}
            handleSizeChange={handleSizeChange}
            handleQuantityChange={handleQuantityChange}
            handleBuyNowClick={handleBuyNowClick}
            handleAddToBasket={handleAddToBasket}
            handleLikeItem={handleLikeItem}
          />
        )}

        {isTablet && !isPhone && !isDesktop && product && (
          <ProductDetailsTablet
            basketItems={basketItems}
            isBasketVisible={isBasketVisible}
            selectedColor={selectedColor}
            selectedImage={selectedImage}
            product={product}
            translation={translation}
            finalRating={finalRating}
            itemsd={itemsd}
            id={id}
            chainId={chainId}
            quantity={quantity}
            selectedSize={selectedSize}
            selectedRating={selectedRating}
            reviewCount={reviewCount}
            modalOpen={modalOpen}
            modalRef={modalRef}
            buttonRef={buttonRef}
            toggleModal={toggleModal}
            closeModal={closeModal}
            detailsRef={detailsRef}
            detailsSectionAtTop={detailsSectionAtTop}
            detailsSectionAtBottom={detailsSectionAtBottom}
            validVideos={validVideos}
            Slider={Slider}
            videoSliderSettings={videoSliderSettings}
            cryptoPrices={cryptoPrices}
            convertToCrypto={convertToCrypto}
            coinImages={coinImages}
            getNetworkName={getNetworkName}
            renderImageZoom={renderImageZoom}
            handleImageChange={handleImageChange}
            handleColorChange={handleColorChange}
            handleSizeChange={handleSizeChange}
            handleQuantityChange={handleQuantityChange}
            handleBuyNowClick={handleBuyNowClick}
            handleAddToBasket={handleAddToBasket}
            handleLikeItem={handleLikeItem}
            handleVisitBrand={handleVisitBrand}
            setItemData={setItemData}
            setAuthState={setAuthState}
            setRatingFilter={setRatingFilter}
            router={router}
            t={t}
          />
        )}

        {isDesktop && product && (
          <ProductDetailsDesktop
            basketItems={basketItems}
            isBasketVisible={isBasketVisible}
            selectedColor={selectedColor}
            selectedImage={selectedImage}
            product={product}
            translation={translation}
            finalRating={finalRating}
            itemsd={itemsd}
            id={id}
            chainId={chainId}
            quantity={quantity}
            selectedSize={selectedSize}
            selectedRating={selectedRating}
            reviewCount={reviewCount}
            modalOpen={modalOpen}
            modalRef={modalRef}
            buttonRef={buttonRef}
            toggleModal={toggleModal}
            closeModal={closeModal}
            detailsRef={detailsRef}
            detailsSectionAtTop={detailsSectionAtTop}
            detailsSectionAtBottom={detailsSectionAtBottom}
            validVideos={validVideos}
            Slider={Slider}
            videoSliderSettings={videoSliderSettings}
            cryptoPrices={cryptoPrices}
            convertToCrypto={convertToCrypto}
            coinImages={coinImages}
            getNetworkName={getNetworkName}
            renderImageZoom={renderImageZoom}
            handleImageChange={handleImageChange}
            handleColorChange={handleColorChange}
            handleSizeChange={handleSizeChange}
            handleQuantityChange={handleQuantityChange}
            handleBuyNowClick={handleBuyNowClick}
            handleAddToBasket={handleAddToBasket}
            handleLikeItem={handleLikeItem}
            handleVisitBrand={handleVisitBrand}
            setItemData={setItemData}
            setAuthState={setAuthState}
            setRatingFilter={setRatingFilter}
            router={router}
            t={t}
            isZoomVisible={isZoomVisible}
            zoomType={zoomType}
            zoomedPosition={zoomedPosition}
            selectedImageForZoom={selectedImage}
          />
        )}

        {paymentModalOpen && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
    onClick={() => setPaymentModalOpen(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        minWidth: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <h3 style={{ margin: 0 }}>Choose payment method</h3>

      <button onClick={() => handlePaymentOptionSelect("card")}>
        Pay with Card
      </button>

      <button onClick={() => handlePaymentOptionSelect("paypal")}>
        PayPal
      </button>

      <button onClick={() => handlePaymentOptionSelect("crypto")}>
        Crypto
      </button>

      <button onClick={() => setPaymentModalOpen(false)}>
        Cancel
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}

export default ProductDetails;