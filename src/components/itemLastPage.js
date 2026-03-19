"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic"; 
import Image from "next/image";
import { useRouter, useParams, usePathname } from 'next/navigation';
import axios from "axios";
import { useAccount } from "wagmi";
import { message } from "antd"; // For notifications
import Modal from "react-modal";
import { FaStar, FaChevronDown } from "react-icons/fa";
import FetchReviews from "./fetchReview";
import AnalyseReview from "./analyseReview";
import useFinalRating from "./finalRating";
import "./ItemLastPage.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ItemIdPage from "./itemIdPage";
import ImageZoom from "./imageZoom";
import ImageZoom1 from "./imageZoom1";
import useScreenSize from "./useIsMobile";
import AnalyseReviewSmallWidth from "./analyseReviewSmallwidth";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { auth } from "@/components/firebaseConfig";
import { useCheckoutStore } from "./checkoutStore";
import Head from "next/head";
import { useLang } from "./LanguageContext"; // ✅ global lang context
import ItemIdPageDesktop from "./itemIdPageDesktop";

// ⬇️ IMPORTANT: pick the default export explicitly
const Slider = dynamic(
  () => import('react-slick').then((m) => m.default),
  { ssr: false, loading: () => null }
);


const BASKET_API = "https://api.malidag.com/add-to-basket"
const BASE_URL = "https://api.malidag.com";
const TRANSACTION_API = "https://api.malidag.com/api/transaction";
const PRICE_API = "https://api.malidag.com/crypto-prices"; // Your crypto price endpoint
const LIKED_API = "https://api.malidag.com"; // Backend URL

const coinImages = {
  ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
  USDC: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
  BUSD: "https://assets.coingecko.com/coins/images/9576/large/BUSD.png?1568947766",
  SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422",
  BNB: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
  USDT: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
};

function ProductDetails({ basketItems,  country}) {

  const { address, isConnected, chain } = useAccount();
  const chainId = chain?.id;
  const [reviewCount, setReviewCount] = useState(0);
  const pathname = usePathname()
  const params = useParams(); // ✅ Fetch params client-side
 const { id, rating } = params
 const router = useRouter();
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null); // State for size
  const [selectedImage, setSelectedImage] = useState(null);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [itemsd, setItemId] = useState(null)
  const [selectedRating, setSelectedRating] = useState(null); // Store selected rating
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [zoomType, setZoomType] = useState('zoom1'); // Default zoom type is 'zoom'
 const ratingFromURL = rating;
  const buttonRef = useRef(null);  // Using useRef to get the button's position
  const modalRef = useRef(null);
  const {finalRating} = useFinalRating(itemsd)
  const detailsRef = useRef(null);
  const [isHoveringThumbnails, setIsHoveringThumbnails] = useState(false);
  const [isHoveringImageCenter, setIsHoveringImageCenter] = useState(false);
  const [detailsSectionAtTop, setDetailsSectionAtTop] = useState(false);
  const [isBasketVisible, setIsBasketVisible] = useState(false);
  const [detailsSectionAtBottom, setDetailsSectionAtBottom] = useState(false);
  const [zoomedPosition, setZoomedPosition] = useState({ x: 0, y: 0 });
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [selectedImageNumber, setSelectedImageNumber] = useState(0); // Default to the first image
  const [quantity, setQuantity] = useState(1); // Quantity state
  const [item, setItem] = useState(null);
   const {isMobile, isDesktop, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall} = useScreenSize()
   const [navigateToReview, setNavigateToReview] = useState(false);
const [ratingToPass, setRatingToPass] = useState(null);
const [openModalSmall, setOpenModalSmall] = useState(false);
const [pendingRating, setPendingRating] = useState(null); // stores the rating only temporarily
 const { t } = useTranslation();
 const [translation, setTranslation] = useState(null);
 const [ready, setReady] = useState(false);
  const setItemData = useCheckoutStore((state) => state.setItemData);
  const setRatingFilter = useCheckoutStore((state) => state.setRatingFilter);
  const setAuthState = useCheckoutStore((state) => state.setAuthState);
  const setSelectedBrandName = useCheckoutStore((state) => state.setSelectedBrandName);
const [messageApi, contextHolder] = message.useMessage();
const setCheckoutData = useCheckoutStore.getState().setCheckoutData;
const { lang } = useLang(); // ✅ use global language

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
      if (!itemId || !color) {
       
        return;
      }
      const response = await fetch(`https://api.malidag.com/api/zoom-setting?itemId=${itemId}&color=${color}&imageNumber=${imageNumber}`);
      const result = await response.json();
     
      if (response.ok) {
        setZoomType(result.zoomType); // Set the zoom type from the API response
      } else {
        setZoomType('zoom1')
      }
    } catch (error) {
      console.error('Failed to fetch zoom setting:', error);
    }
  };

   useEffect(() => {
    fetchZoomSetting(itemsd, selectedColor, selectedImageNumber); // Trigger the zoom setting fetch
   
  }, [itemsd, selectedColor, selectedImageNumber]);


  const checkDetailsSectionPosition = () => {
    if (detailsRef.current) {
        const rect = detailsRef.current.getBoundingClientRect();
        setDetailsSectionAtTop(rect.top <= 0);
       setDetailsSectionAtBottom(rect.bottom >=  window.innerHeight);
    }
};


 useEffect(() => {
    checkDetailsSectionPosition(); // Initial check on load
  
    // Recheck on scroll
    const handleScroll = () => {
      checkDetailsSectionPosition();
    };
  
    window.addEventListener('scroll', handleScroll);
  
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

 
  useEffect(() => {
    const handleWheel = (event) => {
        if (!detailsRef.current) return;

        const details = detailsRef.current;
        const delta = event.deltaY;

        const atTop = details.scrollTop === 0;
        const atBottom = details.scrollTop + details.clientHeight >= details.scrollHeight - 1;

        setDetailsSectionAtTop(atTop);
        setDetailsSectionAtBottom(atBottom);

        // If the user is hovering over images
        if (isHoveringThumbnails || isHoveringImageCenter) {
            if (
                (delta > 0 && atBottom) ||  // Allow scroll if at bottom and scrolling down
                (delta < 0 && atTop)        // Allow scroll if at top and scrolling up
            ) {
                return; // Let the page scroll normally
            } else {
                event.preventDefault(); // Prevent page scroll
                details.scrollTop += delta; // Scroll the details section instead
            }
        }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
        window.removeEventListener('wheel', handleWheel);
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
          top: buttonRect.top + window.scrollY + buttonRect.height + 10, // Adjust for offset and height of button
          left: buttonRect.left + window.scrollX,
        });
      }
    };

    // Add event listeners
    window.addEventListener("scroll", updateModalPosition);
    updateModalPosition(); // Set initial position

    // Cleanup on component unmount
    return () => {
      window.removeEventListener("scroll", updateModalPosition);
    };
  }, [buttonRef]);

  useEffect(() => {
    if (ratingFromURL) {
      setSelectedRating(parseFloat(ratingFromURL));
    }
  }, [ratingFromURL]);

  useEffect(() => {
  if (pathname.includes('product/')) {
    setIsBasketVisible(true);
  } else {
    setIsBasketVisible(false);
  }
}, [router.pathname]);

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
    const response = await axios.get(`https://api.malidag.com/translate/product/translate/${productId}/${lang}`);
    setTranslation(response.data.translation);
  } catch (error) {
    console.error("Translation fetch error:", error.message);
    setTranslation(null); // fallback to original if error
  }
};

// 🧠 Automatically re-fetch translation when language or product changes
useEffect(() => {
  if (!id || !i18n.language) return;

  fetchTranslation(id, i18n.language);
}, [id, i18n.language]);


 // Fetch all products function
 const fetchAllProducts = async () => {
  try {
     const response = await axios.get(`${BASE_URL}/item/${id}`);
    const foundProduct = response.data;

    setItem(foundProduct)
    if (foundProduct?.item) {
      const initialColor = Object.keys(foundProduct.item.imagesVariants)[0];
      setItemId(foundProduct.itemId);
      setProduct(foundProduct.item);
      const userLang = i18n.language || "en"; // using i18next detected language
      setSelectedColor(initialColor);
      setSelectedImage(foundProduct.item.imagesVariants[initialColor][0]);
      fetchTranslation(foundProduct.itemId, userLang);
      // Parse and set the initial size
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
  if (router) {
    fetchAllProducts();
  } else {
    fetchAllProducts();
  }
}, [id, router]);


   // Fetch crypto prices when the component mounts
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

    // Refresh crypto prices every 5 seconds
    const interval = setInterval(fetchCryptoPrices, 5000);
    return () => clearInterval(interval);
  }, []);

useEffect(() => {
  if (navigateToReview && ratingToPass !== null) {
    // Save data to Zustand store
    setItemData({ id, itemId: itemsd, item: product });
    setRatingFilter(ratingToPass);

    // Navigate to review page
     router.push(`/product/${id}/review`);

    // Reset local state flags after navigation
    setNavigateToReview(false);
    setRatingToPass(null);
  }
}, [navigateToReview, ratingToPass, id, itemsd, product, router, setItemData, setRatingFilter]);




 

   // Convert USD price to the product's cryptocurrency
   const convertToCrypto = (usdAmount, cryptoType) => {
    if (cryptoPrices[cryptoType]) {
      return (usdAmount / cryptoPrices[cryptoType]).toFixed(6); // Show up to 6 decimals
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
    setSelectedImageNumber(index)
  };

  // Add a handler to update the selected size
const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

 

  // Slick slider settings for videos
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
          top: rect.top + window.scrollY + 30, // Adjusted position
          left: rect.left + window.scrollX,
        });
      }
      setModalOpen(true);
    }
  };

  const handleAddToBasket = async (product) => {
    const currentUser = auth?.currentUser; // Get the authenticated user
    if (!currentUser) {
        alert(t("login_to_add_to_basket"));
       
        return;
    }

    try {
        const basketItem = {
            userId:  currentUser.uid,  // Get Firebase Auth userId (UID)
            item: {
                id: id,  // Ensure this matches backend expectations
                itemId: itemsd,
                name: product.name,
                price: product.usdPrice,
                color: selectedColor,
                size: selectedSize,
                image: selectedImage,
                brand: product.brand,
                brandPrice: product.brandPrice,
                quantity: 1, // Default quantity
            }
        };

        // Send the basket item to the backend
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
  const currentUser = auth?.currentUser
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
      image: product.images[0],
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
  setModalOpen(false)
}

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
          priority
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
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
          priority
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
          objectFit: "cover",
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
  97: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615", // BSC Testnet uses the same logo as BSC
  137: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912",
  // Add more networks as needed
};

const getNetworkName = (chainId) => {
  if (!chainId) {
    return (
      <div style={{ color: "red" }}>
       {t("not_connected")}
        <br />
        <a href="/supported-networks" style={{ color: "blue", textDecoration: "underline" }}>
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
    // Add other networks as needed
  }[chainId];

  if (!networkName) {
    return (
      <div style={{ color: "red" }}>
        {t("unknown_network")}
        <br />
        <a href="/supported-networks" style={{ color: "blue", textDecoration: "underline" }}>
          {t("learn_supported_networks")}
        </a>
      </div>
    );
  }

  if (!ready) return null; // or a loader

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




// Function to handle Buy Now click
const handleBuyNowClick = (itemId) => {
  if (!chainId) {
     messageApi.warning(t("wallet_not_connected_warning"));
    return; // Prevent navigation
  }

  // Reset checkout store for Buy Now flow
  // reset checkout store (important!)
  setCheckoutData({ isFromBasket: false });  // explicit reset

  // Navigate to checkout with the item ID
 router.push(
  `/checkout?itemId=${itemId}&quantity=${quantity}&selectedColor=${selectedColor}&selectedSize=${selectedSize}&tokenAmount=${product.usdPrice * quantity}&basket=false`
);

};

const handleQuantityChange = (amount) => {
  setQuantity((prev) => Math.max(1, prev + amount)); // Ensure it stays at least 1
};

const handleVisitBrand = async () => {
  if (!product?.brand || product.brand.trim() === "") return;

  try {
    const response = await axios.get("https://api.malidag.com/api/brands/themes");
    const themes = response.data;

    const matchedBrand = themes.find(
      (b) =>
        b.brandName.trim().toLowerCase() === product.brand.trim().toLowerCase()
    );

    if (matchedBrand?.theme) {
      const themeRoute = matchedBrand.theme.toLowerCase(); // e.g. "theme1"
      
      // Set the brand name globally
      setSelectedBrandName(product.brand);

      // Navigate to brand theme route
       router.push(`/brand/${themeRoute}/${encodeURIComponent(product.brand)}`);
    } else {
      console.warn("Theme not found for brand:", product.brand);
    }
  } catch (error) {
    console.error("Failed to fetch brand themes:", error);
  }
};




  return (
    <div className="product-details"  >

       <Head>
        <title>{product?.item?.name} | Malidag</title>
        <meta
          name="description"
          content={`Shop ${product?.item?.name} at Malidag — ${product?.item?.theme || 'Beauty & Care for You'}`}
        />
      </Head>
	
	 {contextHolder}

      <div className={`product-layout ${isDesktop || isTablet ? "layout-grid" : "layout-stack"}`}  style={{
    marginRight: isBasketVisible && isDesktop && basketItems?.length > 0 ? "0px" : "0px",
    display: isDesktop || isTablet ? "grid" : "block",
    gridTemplateColumns: isDesktop || isTablet ? "1fr 1fr 2fr" : undefined,
    alignItems: "start",
    gap: "20px",
  }}>
  
{/* Mobile: image slider */}
{!isDesktop && !isTablet && (
  <>
    <div className="mobile-slider-wrapper product-card" style={{ width: "100%", padding: "10px" }}>
      <Slider dots={true} infinite={false} speed={500} slidesToShow={1} slidesToScroll={1}>
        {product?.imagesVariants[selectedColor].map((image, index) => (
          <div key={index}>
            <img
              src={encodeURI(image)}
              alt={`Slide ${index}`}
              style={{
                width: "100%",
                height: "400px",
                objectFit: "contain"
              }}
              onClick={() => handleImageChange(image, index)}
            />
          </div>
        ))}
      </Slider>
    </div>
   {!isDesktop && !isTablet && product?.imagesVariants && Object.keys(product?.imagesVariants).length > 0 && (
  <div
    className=" mobile-color-thumbnails"
    style={{
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      marginTop: "10px",
      gap: "10px",
      height: "auto"
    }}
  >
    {Object.keys(product?.imagesVariants).map((color) => (
      <img
        key={color}
        src={encodeURI(product?.imagesVariants[color][0])}
        alt={`${color} option`}
        className={`color-thumbnail ${color === selectedColor ? "selected" : ""}`}
        onClick={() => handleColorChange(color)}
        style={{
          width: "50px",
          height: "50px",
          objectFit: "cover",
          borderRadius: "50%",
        }}
      />
    ))}
  </div>
)}
  </>
)}

{(!(isDesktop || isTablet)) && (
  <div className="mobile-product-info product-card" style={{maxHeight: "auto", maxWidth: "100%", position: "relative"}}>
     <h1 className="product-title" style={{color: "black"}}> {translation?.name || product?.name}</h1>

      {product?.brand && product?.brand.trim() !== "" && (
        <button onClick={handleVisitBrand} className="brand-visit-button">
          {t("visit_brand_button", { brand: product?.brand })}
        </button>
      )}

       <div style={{color: "black"}}> <div className="rating-dropdown rating-pill" style={{ display: "flex", alignItems: "center" }}>
        <span style={{marginRight: "10px", fontWeight: "bold", fontStyle: "italic"}} className="text-lg font-semibold">{finalRating || 0}</span>
                  {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
              <FaStar
                key={index}
                color={
                  starValue <= Math.floor(finalRating)
                    ? "gold"
                    : starValue - 0.5 <= finalRating
                    ? "goldenrod"
                    : "gray"
                }
              />
            );
          })}
          
          <span ref={buttonRef}>
  <FaChevronDown onClick={() => setOpenModalSmall(true)} style={{ cursor: "pointer", fontSize: "20px", marginLeft: "10px", marginTop: "5px" }} />
</span>

              
          </div></div>

           <div style={{position: "relative"}}> 
       {openModalSmall && itemsd && (
  <div
   className="modal-content premium-modal"
    style={{
      position: "absolute",
      top: `-20px`,
      right: `40px`,
      background: "white",
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
      zIndex: 9999,
      width: "300px",
      transition: "top 0.1s ease-out, left 0.1s ease-out",
    }}
  >
    <span className="close-btn" onClick={() => setOpenModalSmall(false)}>&times;</span>

    <AnalyseReviewSmallWidth
      productId={itemsd}
      id={id}
      item={product}
      onTriggerReviewNavigation={(rating) => {
        setOpenModalSmall(false);       // use openModalSmall for consistency
        setRatingToPass(rating);
        setNavigateToReview(true);
      }}
    />
  </div>
)}

<div className="network-row" style={{ display: "flex", alignItems: "center" }}>
  <span role="img" aria-label="network">🌐</span> {/* Keep the globe emoji for better UX */}
  <span style={{ marginLeft: "5px", fontWeight: "bold", color: "black" }}>
    {getNetworkName(chainId)}
  </span>
</div>

 <h1 style={{color: "black", fontSize: "14px", marginTop: "10px"}}> {t("size_name", { size: selectedSize })}</h1>

        {product?.size?.[selectedColor] && (
          <div>
            <label htmlFor="size-select" style={{ color: "black" }}>
             {t("select_size_label")}
            </label>
            <select
              id="size-select"
              value={selectedSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              style={{ margin: "0px", padding: "5px" }}
            >
              {product.size[selectedColor][0]
                .split(", ") // Split sizes into an array
                .map((size, index) => (
                  <option key={index} value={size.trim()}>
                    {size.trim()}
                  </option>
                ))}
            </select>
          </div>
        )}

            <div className="price-row" style={{ display: "flex", justifyContent: "start", alignItems: "center" }}>
            
          <h2 style={{color: "black", fontStyle: "italic"}}>${product?.usdPrice * quantity}</h2>

            <h4 style={{color: "black", fontStyle: "italic", paddingLeft: "20px", paddingRight: "20px"}}> ≈ </h4>

           {/* Show Converted Crypto Price */}
      {product?.usdPrice && cryptoPrices[product?.cryptocurrency] ? (
        <h3 style={{ color: "black" }}>
          {convertToCrypto(product?.usdPrice * quantity, product?.cryptocurrency)}  {coinImages[product?.cryptocurrency] && (
            <Image
              src={encodeURI(coinImages[product?.cryptocurrency])}
              alt={product.cryptocurrency}
              style={{
                width: "24px",
                height: "24px",
                marginLeft: "8px",
              }}
            />
          )} {product?.cryptocurrency}
        </h3>
      ) : (
        <h3 style={{ color: "gray" }}>{t("fetching_crypto_price")}</h3>
      )}
      </div>
       {/* Quantity Selector */}
       <div className="quantity-row" style={{ display: "flex", alignItems: "center", maxWidth: "200px", top: "0", marginBottom: "10px" }}>
        <span style={{marginBottom: "5px", fontStyle: "italic"}}>{t("quantity")}</span>
    <div className="quantity-control" style={{ display: "flex", alignItems: "center", border: "1px solid gray", borderRadius: "100px", marginLeft: "20px" }}>
     
      <div
       className="qty-btn" onClick={() => handleQuantityChange(-1)} 
        style={{ padding: "5px 10px", marginRight: "5px", cursor: "pointer" }}
      >
        -
      </div>
      <span style={{ fontSize: "18px", fontWeight: "bold", color: "black" }}>
        {quantity}
      </span>
      <div
        className="qty-btn" onClick={() => handleQuantityChange(1)}
        style={{ padding: "5px 10px", marginLeft: "5px", cursor: "pointer" }}
      >
        +
      </div>
      </div>
    </div>
        <div className="action-row" style={{ display: "flex", alignItems: "center", justifyContent: "start", padding: "5px" }}>
        
        <button className="buy-now-button" onClick={() => handleBuyNowClick(id)}>
          {t("buy_now")}
        </button>
     
        <button className="add-to-basket" onClick={() => handleAddToBasket(product)}>{t("add_to_basket")}</button>
        <button className="like-botton" onClick={() => handleLikeItem(product)}>{t("like")}</button>
        </div>
        <p className="sold-badge" style={{ color: "red", fontSize: "15px" }}>
  {t("items_already_sold", { count: product?.sold })}
</p>
        </div>

         {/* Video Slider */}
         <div>
{validVideos?.length > 0 && (
 <div className="product-videos product-card">
    <h2 style={{ color: "black" }}>{t("product_videos")}</h2>

    {validVideos?.length === 1 ? (
      <div>
        <video
          src={validVideos[0]}
          controls
          style={{ width: "100%", maxWidth: "600px", height: "400px" }}
        />
      </div>
    ) : (
      <Slider {...videoSliderSettings}>
        {validVideos.map((videoUrl, index) => (
          <div key={index}>
            <video
              src={videoUrl}
              controls
              style={{ width: "100%", maxWidth: "600px", height: "400px" }}
            />
          </div>
        ))}
      </Slider>
    )}
  </div>
)}
</div>


  <div>
     <p className="product-copy" style={{ color: "black", display: "flex" }}>
  <strong style={{ marginRight: "20px" }}>{t("product_detail")}</strong>
  {translation?.text || product?.text}
</p>

<p className="product-copy" style={{ color: "black", display: "flex" }}>
  <strong style={{ marginRight: "20px" }}>{t("about_this_item")}</strong>
  {translation?.productDetail01 || product?.productDetail01}
</p>
         <h1 style={{color: "black", fontSize: "14px"}}>{t("product_id", { id: itemsd })}</h1>
  </div>

   {/* Modal for Transaction Form */}
      <div  style={{width: "100%"}}>
      <ItemIdPage id={itemsd}/>
      </div>
     
      <FetchReviews  productId={itemsd} selectedRating={selectedRating} />
      
      
      {/* ✅ Show "See All Reviews" only if reviewCount > 11 */}
   {reviewCount > 11 && (
  <div
    onClick={() => {
      setItemData({
        id: id,
        itemId: itemsd,
        item: product,
      });
      setAuthState(true);
      setRatingFilter(selectedRating);

      router.push("/reviewPage");
    }}
    style={{
      cursor: "pointer",
      color: "blue",
      textDecoration: "underline",
      marginLeft: "20px",
      marginTop: "10px",
      fontSize: "14px",
      marginBottom: "20px",
    }}
  >
    {t("see_all_reviews")}
  </div>
)}
  

  </div>
)}

{/* LEFT THUMBNAILS */}
<div style={{ display: isDesktop? "flex" : "none", alignItems: "center", justifyContent: "flex-start" }}>
    <div>
      <div
        {...(isDesktop && {
          onMouseEnter: handleMouseEnterThumbnails,
          onMouseLeave: handleMouseLeaveThumbnails,
        })}
        className="left-thumbnails"
        style={{
          width: isBasketVisible && basketItems?.length > 0 ? "100px" : "100px",
          height: isTablet ? "300px" : "379px",
        }}
      >
        {product?.imagesVariants?.[selectedColor]?.map((image, index) => (
          <Image
            key={index}
            src={encodeURI(image)}
            width={20}
            height={20}
            alt={`${selectedColor} variant ${index + 1}`}
            className={`thumbnail ${selectedImage === image ? "active" : ""}`}
            onClick={() => handleImageChange(image, index)}
          />
        ))}
      </div>
    </div>

<div>
     {(isDesktop || isTablet) && (
   
 <div
  {...(isDesktop && {
    onMouseEnter: handleMouseEnterThumbnails,
    onMouseLeave: handleMouseLeaveThumbnails,
  })}
  className="main-image-panel"
  style={{
    width: isTablet ? "300px" : isDesktop && basketItems?.length > 0 ? "200px" : "400px",
    height: isTablet ? "400px" : "350px",
    padding: "20px",
    background: "white",
    alignItems: "center",
    display: "flex",
    marginTop: "50px",
    justifyContent: "start",
    objectFit: "contain",
    borderRadius: "12px",
  }}
>
  {renderImageZoom}
  </div>
     )}
     </div>
 </div>

       <div >
        {(isDesktop || isTablet) && (
<div className="details-section-container">
        <div
        
       className={`details-section premium-panel ${detailsSectionAtTop ? "at-top" : ""} ${detailsSectionAtBottom ? "at-bottom" : ""}`} style={{display: (isDesktop || isTablet) ? "block" : "none" , maxWidth: isBasketVisible && isDesktop && basketItems?.length > 0 ? "65%" : isBasketVisible && isTablet && basketItems?.length > 0 ? "100%" : "auto", padding: "20px", maxHeight: "600px", overflowY: "auto"}}  ref={detailsRef}
         >
        <div>
           {/* Conditionally render Zoomed Portion only when the cursor is inside the image */}
 {isZoomVisible && zoomType === "zoom1" && isDesktop && (() => {
  const panelWidth = 720;
  const panelHeight = 450; // should match your lens height
  const zoomWidthScale = 1;
  const zoomHeightScale = 1.6;

  const zoomedImageWidth = panelWidth * zoomWidthScale;
  const zoomedImageHeight = panelHeight * zoomHeightScale;

  const maxOffsetX = Math.max(0, zoomedImageWidth - panelWidth);
  const maxOffsetY = Math.max(0, zoomedImageHeight - panelHeight);

  const offsetX = Math.max(
    0,
    Math.min(zoomedPosition.x * zoomedImageWidth - panelWidth / 2, maxOffsetX)
  );

  const offsetY = Math.max(
    0,
    Math.min(zoomedPosition.y * zoomedImageHeight - panelHeight / 2, maxOffsetY)
  );

  return (
    <div
      className="zoomed-view"
      style={{
        position: "fixed",
        top: "90px",
        right: "20px",
        width: `${panelWidth}px`,
        height: `${panelHeight}px`,
        overflow: "hidden",
        border: "1px solid #ddd",
        backgroundColor: "#fff",
        boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
        zIndex: 1200,
      }}
    >
      <img
        src={selectedImage}
        alt="Zoomed"
        draggable={false}
        style={{
          position: "absolute",
          left: `-${offsetX}px`,
          top: `-${offsetY}px`,
          width: `${zoomedImageWidth}px`,
          height: `${zoomedImageHeight}px`,
          objectFit: "contain",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
})()}

        <h1 style={{color: "black"}}> {translation?.name || product?.name}</h1>
        {/* Check if the product brand exists and is not empty */}
       {product?.brand && product?.brand.trim() !== "" && (
        <button onClick={handleVisitBrand} className="brand-visit-button">
         {t("visit_brand_button", { brand: product?.brand })}
        </button>
      )}
        <div className="product-info">
        <div style={{color: "black"}}> <div className="rating-dropdown rating-pill" style={{ display: "flex", alignItems: "center" }}>
        <span style={{marginRight: "10px", fontWeight: "bold", fontStyle: "italic"}} className="text-lg font-semibold">{finalRating || 0}</span>
                  {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
              <FaStar
                key={index}
                color={
                  starValue <= Math.floor(finalRating)
                    ? "gold"
                    : starValue - 0.5 <= finalRating
                    ? "goldenrod"
                    : "gray"
                }
              />
            );
          })}
          
          <span ref={buttonRef}>
  <FaChevronDown  onClick={toggleModal} style={{ cursor: "pointer", fontSize: "20px", marginLeft: "10px", marginTop: "5px" }} />
</span>

              
          </div></div>
          <div style={{position: "relative"}}> 
          {modalOpen && itemsd && (
        <div
       className="modal-content premium-modal"
        ref={modalRef}
        style={{
          position: "absolute",
          top: `-20px`,
          right: `40px`,
          background: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
         zIndex: 1000,
          width: "300px", // Adjust width as needed
          transition: "top 0.1s ease-out, left 0.1s ease-out", // Smooth position updates
        }}
        >
        <span className="close-btn" onClick={closeModal}>&times;</span>
    <AnalyseReview productId={itemsd} id={id} onRatingClick={setSelectedRating}   />
  </div>
            )}

            {/* Display the network name dynamically */}
<div style={{ display: "flex", alignItems: "center" }}>
  <span role="img" aria-label="network">🌐</span> {/* Keep the globe emoji for better UX */}
  <span style={{ marginLeft: "5px", fontWeight: "bold", color: "black" }}>
    {getNetworkName(chainId)}
  </span>
</div>

            <div className="price-row" style={{ display: "flex", justifyContent: "start", alignItems: "center" }}>
            
          <h2 style={{color: "black", fontStyle: "italic"}}>${product?.usdPrice * quantity}</h2>

            <h4 style={{color: "black", fontStyle: "italic", paddingLeft: "20px", paddingRight: "20px"}}> ≈ </h4>

           {/* Show Converted Crypto Price */}
      {product?.usdPrice && cryptoPrices[product?.cryptocurrency] ? (
        <h3 style={{ color: "black" }}>
          {convertToCrypto(product?.usdPrice * quantity, product?.cryptocurrency)}  {coinImages[product?.cryptocurrency] && (
            <img
              src={coinImages[product?.cryptocurrency]}
              alt={product?.cryptocurrency}
              style={{
                width: "24px",
                height: "24px",
                marginLeft: "8px",
              }}
            />
          )} {product?.cryptocurrency}
        </h3>
      ) : (
        <h3 style={{ color: "gray" }}>{t("fetching_crypto_price")}</h3>
      )}
      </div>
       {/* Quantity Selector */}
       <div className="quantity-row" style={{ display: "flex", alignItems: "center", maxWidth: "200px", top: "0", marginBottom: "10px" }}>
        <span style={{marginBottom: "5px", fontStyle: "italic"}}>{t("quantity")}</span>
    <div className="quantity-control" style={{ display: "flex", alignItems: "center", border: "1px solid gray", borderRadius: "100px", marginLeft: "20px" }}>
     
      <div
       className="qty-btn" onClick={() => handleQuantityChange(-1)}
        style={{ padding: "5px 10px", marginRight: "5px", cursor: "pointer" }}
      >
        -
      </div>
      <span style={{ fontSize: "18px", fontWeight: "bold", color: "black" }}>
        {quantity}
      </span>
      <div
       className="qty-btn" onClick={() => handleQuantityChange(1)}
        style={{ padding: "5px 10px", marginLeft: "5px", cursor: "pointer" }}
      >
        +
      </div>
      </div>
    </div>
        <div className="action-row" style={{ display: "flex", alignItems: "center", justifyContent: "start", padding: "5px" }}>
        
        <button className="buy-now-button" onClick={() => handleBuyNowClick(id)}>
         {t("buy_now")}
        </button>
     
        <button className="add-to-basket" onClick={() => handleAddToBasket(product)}>{t("add_to_basket")}</button>
        <button className="like-botton" onClick={() => handleLikeItem(product)}>{t("like")}</button>
        </div>
        <p className="sold-badge" style={{ color: "red", fontSize: "15px" }}>
  {t("items_already_sold", { count: product?.sold })}
</p>
        </div>
        <h1 style={{color: "black", fontSize: "14px"}}>  {t("color_name", { color: selectedColor })}</h1>
        </div>
       
        </div>
        
         {/* ✅ For desktop layout — place elsewhere in the layout */}
{(isDesktop || isTablet) && product?.imagesVariants && (
  <div className="right-colors desktop-color-thumbnails">
    {Object.keys(product.imagesVariants).map((color) => (
      <Image
        key={color}
        src={encodeURI(product.imagesVariants[color][0])}
        alt={`${color} option`}
         width={60}     // 👈 pick a fixed size for your thumbnails
        height={60}
        className={`color-thumbnail ${color === selectedColor ? "selected" : ""}`}
        onClick={() => handleColorChange(color)}
      />
    ))}
  </div>
)}

        
        <h1 style={{color: "black", fontSize: "14px"}}>  {t("size_name", { size: selectedSize })}</h1>

        {product?.size?.[selectedColor] && (
          <div>
            <label htmlFor="size-select" style={{ color: "black" }}>
              {t("select_size_label")}
            </label>
            <select
              id="size-select"
              value={selectedSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              style={{ margin: "10px", padding: "5px" }}
            >
              {product?.size[selectedColor][0]
                .split(", ") // Split sizes into an array
                .map((size, index) => (
                  <option key={index} value={size.trim()}>
                    {size.trim()}
                  </option>
                ))}
            </select>
          </div>
        )}
      
        <p style={{color: "black",  display: "flex"}}> <strong style={{marginRight: "20px"}}>{t("product_detail")}</strong> {translation?.text || product?.text}</p>
        <p style={{color: "black",  display: "flex"}}> <strong style={{marginRight: "20px"}}>{t("about_this_item")}</strong>  {translation?.productDetail01 || product?.productDetail01}</p>
        <h1 style={{color: "black", fontSize: "14px"}}>{t("product_id", { id: itemsd })}</h1>


        </div>
  </div>
         )}

         </div>




      </div>

      
      {(isDesktop || isTablet) && (
        <div>
{validVideos?.length > 0 && (
 <div className="product-videos product-card">
    <h2 style={{ color: "black" }}>{t("product_videos")}</h2>

    {validVideos?.length === 1 ? (
      <div>
        <video
          src={validVideos[0]}
          controls
          style={{ width: "100%", maxWidth: "600px", height: "400px" }}
        />
      </div>
    ) : (
      <Slider {...videoSliderSettings}>
        {validVideos.map((videoUrl, index) => (
          <div key={index}>
            <video
              src={videoUrl}
              controls
              style={{ width: "100%", maxWidth: "600px", height: "400px" }}
            />
          </div>
        ))}
      </Slider>
    )}
  </div>
)}
</div>
 )}


       {/* Modal for Transaction Form */}
       {(isDesktop || isTablet) && (
        <div>
      <div style={{marginRight: isBasketVisible && basketItems?.length > 0 ? "150px" : "0" }}>
      <ItemIdPageDesktop id={itemsd}/>
      </div>
     
      <FetchReviews  productId={itemsd} selectedRating={selectedRating} />
     

       {/* ✅ Show "See All Reviews" only if reviewCount > 11 */}
    {parseInt(localStorage.getItem("reviewCount") || "0", 10) > 11 && (
  <div
    onClick={() => {
      setItemData({
        id: id,
        itemId: itemsd,
        item: product,
      });
      setAuthState(true);
      setRatingFilter(selectedRating);
      router.push("/review");
    }}
    style={{
      cursor: "pointer",
      color: "blue",
      textDecoration: "underline",
      marginLeft: "20px",
      marginTop: "10px",
      fontSize: "14px",
      marginBottom: "20px",
    }}
  >
    {t("see_all_reviews")}
  </div>
)}
      </div>
       )}
     
      
    </div>
     
  );
}

export default ProductDetails;
