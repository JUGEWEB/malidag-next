"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import './itemPage.css';
import useScreenSize from "./useIsMobile";
import languages from "@/i18nLanguages";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "./checkoutStore";
import Head from "next/head";



function ItemHomePage() {
  const [items, setItems] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [reviews, setReviews] = useState({}); // Store reviews data
  const [translations, setTranslations] = useState({});
             const {isMobile, isDesktop, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall} = useScreenSize()
   const router = useRouter();
    const { t } = useTranslation();
    const { setItemData } = useCheckoutStore();

    const baseUrl = "https://www.malidag.com";
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  console.log('video', activeVideoId)

  const fetchCryptoPrices = async (symbols) => {
    try {
      const response = await axios.get("https://api.malidag.com/crypto-prices");
      console.log("Response data:", response.data);
  
      // Filter the response data based on the provided symbols
      const prices = symbols.reduce((acc, symbol) => {
        if (response.data[symbol]) {
          acc[symbol] = parseFloat(response.data[symbol]); // Parse the price to a float
        }
        return acc;
      }, {});
  
      setCryptoPrices(prices);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
    }
  };

const fetchTranslation = async (productId, lang) => {
  // Avoid re-fetching if already present
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
    console.error(`Translation fetch error for ${productId}:`, error.message);
  }
};



  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`https://api.malidag.com/items/`);
        const fetchedItems = response.data || [];
        
        // Filter items by category: "clothes" and "shoes"
        const filteredItems = fetchedItems.filter(
          (item) => item.item.genre === "home"
        );
        
        setItems(filteredItems);

        for (const product of filteredItems) {
  const productId = product.itemId;
  const lang = i18n.language || "en";
  fetchTranslation(productId, lang);
}
  
        const uniqueCategories = [...new Set(filteredItems.map(item => item.category))];
        setCategories(uniqueCategories);
  
        const cryptoSymbols = [
          ...new Set(filteredItems.map((item) => `${item.item.cryptocurrency}`)),
        ];
        await fetchCryptoPrices(cryptoSymbols);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchItems();
  }, []);


useEffect(() => {
  if (!items.length) return;

  const lang = i18n.language || "en";

  items.forEach((product) => {
    fetchTranslation(product.itemId, lang);
  });
}, [i18n.language, items]);


  

  const toggleDropdown = (category) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  const categorizedItems = categories.reduce((acc, category) => {
    acc[category] = items.filter((item) => item.category === category);
    return acc;
  }, {});

  const getHotItems = (categoryItems) => {
    return [...categoryItems]
      .sort((a, b) => b.item.sold - a.item.sold)
      .slice(0, 4); // Top 3 sold items
  };


  const handleVideoPlay = (id, videoUrl) => {
    console.log('Playing video:', videoUrl); // Debugging line
    setActiveVideoId(id);
  };
  
  const handleVideoStop = () => {
    setActiveVideoId(null);
  };


   // Handle item click to navigate to product details page
   const handleItemClick = (id) => {
    if (id) {
     router.push(`/product/${id}`); // Navigate to the product details page
    }
  };

  return (
    <div style={{maxWidth: "100%", width: "100%",  overflow: "hidden"}}>

       <Head>
        {/* Canonical URL */}
        <link rel="canonical" href={`${baseUrl}${currentPath}`} />

        {/* All hreflang tags */}
        {languages.map((lang) => (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={`${baseUrl}/${lang}${currentPath}`}
          />
        ))}

        {/* Optional x-default fallback */}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${baseUrl}/en${currentPath}`}
        />

        {/* OpenGraph tags */}
        <meta property="og:title" content="Home & Kitchen - Malidag" />
        <meta
          property="og:description"
          content="Explore quality home & kitchen items at Malidag. Available in 107 languages."
        />
        <meta property="og:url" content={`${baseUrl}${currentPath}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.malidag.com/og-image.jpg" />
      </Head>

    <div style={{width: "100%", height: "auto", maxWidth: "100%", overflow: "hidden"}}>
      <img src="https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2Fsteptodown.com479163.jpg?alt=media&token=0abc0129-3e54-4b9c-ba3d-ed4d9e61e960" alt="home and kitchen page" style={{width: "100%", height: "400px", objectFit: "cover", overflow: "hidden"}} />
    </div>
   
    <div style={{
  display: "grid",
  width: "100%",
  maxWidth: "100%",
  gap: "5px",
  padding: "5px",
  gridTemplateColumns:
    isVerySmall
      ? "repeat(2, 1fr)"
      : isVeryVerySmall
      ? "repeat(1, 1fr)"
      : isSmallMobile
      ? "repeat(2, 1fr)"
      : isMobile
      ? "repeat(3, 1fr)"
      : isTablet
      ? "repeat(3, 1fr)"
      : "repeat(3, 1fr)"}}>

      
        {items.map((itemData) => {
          const {itemId, id, item } = itemData;
          const { name, usdPrice, originalPrice, cryptocurrency, sold, videos } = item;
          const cryptoSymbol = `${cryptocurrency}`;
          const crypto = String(cryptocurrency);
          const reviewsData = reviews[itemId] || {}; // Ensure it exists
            const finalRating = reviewsData ? reviewsData.averageRating : t("no_rating");
          const cryptoPriceInUSD = cryptoPrices[cryptoSymbol] || 0;
          const itemPriceInCrypto =
            cryptoPriceInUSD > 0 ? (usdPrice / cryptoPriceInUSD).toFixed(6) : "N/A";

            const normalizedVideos = Array.isArray(videos) ? videos : [videos];
            const firstVideoUrl = normalizedVideos.find(
              (video) => typeof video === "string" && video.endsWith(".mp4")
            );
           const translated = translations[itemId]?.[i18n.language];
const productName = translated?.name || name;
const handleReviewClick = (itemData) => {
  setItemData(itemData);
  router.push("/reviewPage");
};


          return (
            <div key={id} >
              <div
                style={{
                  background: 'white',
                  zIndex: '1',
                 paddingTop: "20px",
                 filter: "brightness(0.880000000) contrast(1.2)",
                  width: '100%',
                  height:(isVerySmall) ? "230px" :  "300px",
                  marginBottom: '10px',
                  marginTop: '10px',
                  position: 'relative',
                }}
              >
                {activeVideoId === id && firstVideoUrl  ? (
                  <video
                    src={firstVideoUrl}
                    controls
                    autoPlay
                    onEnded={handleVideoStop}
                    style={{ width: "100%",
                      height: (isVerySmall) ? "230px" :  "300px",
                      objectFit: "contain" }}
                  />
                ) : (
                  <>
                    <img
                      className="item-image"
                      src={item.images[0]}
                      onClick={() => handleItemClick(id)} // Attach the click handle
                      alt={name}
                       style={{ width: "100%",
                        height:(isVerySmall) ? "230px" :  "300px",
                        objectFit: "contain"}}
                    />
                     {firstVideoUrl && ( 
                      <div
                        className="play-button"
                        onClick={() => handleVideoPlay(id)}
                        style={{
                          position: 'absolute',
                          left: '20px',
                          bottom: '0px',
                          zIndex: '2',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '1.5rem',
                          color: 'white',
                          textShadow: '0 0 5px rgba(0,0,0,0.5)',
                          cursor: 'pointer',
                        }}
                      >
                        ▶️
                      </div>
                    )}
                  </>
                )}
              </div>
              <div  onClick={() => handleItemClick(id)}  className="item-details">
                <div className="item-name" title={name}>
                 {productName.length > 20 ? `${productName.substring(0, 20)}...` : productName}
                </div>
                <div className="item-prices">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="item-price">${usdPrice}</span>
                    {originalPrice > 0 && (
                      <span className="item-original-price">${originalPrice}</span>
                    )}
                    <span
                      className="item-sold"
                      style={{ display: "flex", marginLeft: "10px", fontSize: "0.8rem", color: "black" }}
                    >
                      {sold}{" "}
                      <div style={{ marginLeft: "5px", fontWeight: "bold", color: "red" }}>
                        {t("sold")}
                      </div>
                    </span>
                  </div>
                  <div className="item-crypto">
                    <img
                      src={`https://raw.githubusercontent.com/atomiclabs/cryptocurrency-icons/master/svg/color/${crypto.toLowerCase()}.svg`}
                      alt={cryptocurrency}
                      className="crypto-icon"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://cryptologos.cc/logos/binance-usd-busd-logo.png";
                      }}
                    />
                    <span className="item-crypto-price">
                      {itemPriceInCrypto !== "N/A"
                        ? `${itemPriceInCrypto} ${cryptocurrency}`
                        : t("price_unavailable")}
                    </span>
                  </div>
                </div>
                 <div className="item-type-stars"  onClick={() => handleReviewClick(itemData)} title={t("view_reviews")}>
                {finalRating ? "★".repeat(Math.round(finalRating)) + "☆".repeat(5 - Math.round(finalRating)) : t("no_rating")}
                </div>
              </div>
            </div>
          );
        })}
     
    </div>
    </div>
    
  );
}

export default ItemHomePage;
