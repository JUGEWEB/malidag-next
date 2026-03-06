"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import './itemPage.css';
import { useRouter } from "next/navigation";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import { useCheckoutStore } from "./checkoutStore";

function ItemPage({searchTerm}) {
   const router = useRouter()
  const [items, setItems] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const {isMobile, isDesktop, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall} = useScreenSize()
   const [reviews, setReviews] = useState({}); // Store reviews data
   const { t } = useTranslation();

    const setItemData = useCheckoutStore((state) => state.setItemData);

 

  const fetchCryptoPrices = async (symbols) => {
    try {
      const response = await axios.get("https://api.malidag.com/crypto-prices");
     
  
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

   // Fetch reviews from the endpoint
        const fetchReviews = async (productId) => {
          try {
            const response = await axios.get(`https://api.malidag.com/get-reviews/${productId}`);
            if (response.data.success) {
             
              const reviewsArray = response.data.reviews || [];
              const totalRating = reviewsArray.reduce((acc, review) => {
                let rating = parseFloat(review.rating);
                return acc + (isNaN(rating) ? 4 : rating); // If rating is invalid, treat as 5 stars
              }, 0);
              const averageRating = reviewsArray.length ? (totalRating / reviewsArray.length).toFixed(2) : null;
      
              setReviews((prevReviews) => ({
                ...prevReviews,
                [productId]: { averageRating, reviewsArray },
              }));
      
            }
          } catch (error) {
            console.error("Error fetching reviews:", error);
          }
        };
      

 useEffect(() => {
  const fetchItems = async () => {
    if (!searchTerm) return;

    setLoading(true);

    try {
      // ✅ Call your backend’s hybrid search endpoint
      const response = await axios.get(`https://api.malidag.com/items/${encodeURIComponent(searchTerm)}`);
      const matchedItems = response.data.items || [];

      // ✅ Update item list
      setItems(matchedItems);

      // ✅ Collect unique categories
      const uniqueCategories = [...new Set(matchedItems.map(item => item.category))];
      setCategories(uniqueCategories);

      // ✅ Fetch reviews for each matched item
      matchedItems.forEach(item => fetchReviews(item.itemId));

      // ✅ Collect crypto symbols & fetch prices
      const cryptoSymbols = [...new Set(matchedItems.map(item => item.item.cryptocurrency))];
      await fetchCryptoPrices(cryptoSymbols);

    } catch (error) {
      console.error("❌ Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchItems();
}, [searchTerm]);

  const toggleDropdown = (category) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  

  const categorizedItems = categories.reduce((acc, category) => {
    acc[category] = items.filter((item) => item.category === category);
    return acc;
  }, {});
  // Create a list of unique item types from the fetched items
const categoryTypes = Array.from(
  new Set(items.map((item) => item.item.type).filter(Boolean))
);



  const getHotItems = (categoryItems) => {
    return [...categoryItems]
      .sort((a, b) => b.item.sold - a.item.sold)
      .slice(0, 4); // Top 3 sold items
  };

  const getItemsByType = (type) => {
  return items.filter(item => item.item.type === type);
};


  const handleVideoPlay = (id, videoUrl) => {
    console.log('Playing video:', videoUrl); // Debugging line
    setActiveVideoId(id);
  };
  
  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  if (!items || items.length === 0) {
    return <div className="no-results-message"> {t("no_results_found", { term: searchTerm })}</div>;
  }

   // Handle item click to navigate to product details page
   const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`); // Navigate to the product details page
    }
  };

  return (
    <>
   {/* ✅ 1. HEADER SECTION - Titles and Types */}
       <div style={{width: "100%", maxWidth: "100%"}}>
   <div className="item-type-title">
     
     <div style={{ whiteSpace: "nowrap" }}>{t("related_types")}</div>
   
     <div  className="related-type-info" >
     {categoryTypes.map((relatedType, index) => (
      
         <div key={index}
           className="related-type-type"
           onClick={() => toggleDropdown(relatedType)}
         >
           {relatedType}
           <div>
           {dropdownOpen[relatedType] ? (
       <UpOutlined style={{ marginLeft: "5px" }} />
     ) : (
       <DownOutlined style={{ marginLeft: "5px" }} />
     )}
     </div>
         </div>
         
      
     ))}
      </div>
     
   </div>
   </div>
   
   {/* ✅ 2. DROPDOWN SECTION (Separate) */}
   <div className="dropdown-section" style={{ marginTop: "-20px", position: "relative" }}>
     {categoryTypes.map((relatedType, index) => (
       dropdownOpen[relatedType] && (
         <div
           key={index}
           className="stable-type-dropdown"
         >
           <div className="circular-items" style={{ display: "flex", gap: "15px", flexWrap:(isDesktop || isTablet || isMobile) ? "wrap" : undefined, overflowX: (isSmallMobile || isVerySmall) ? "auto" : undefined, overflowY: (isDesktop || isMobile || isTablet) ? "auto" : undefined, height: (isDesktop || isMobile || isTablet) ? "100%" : "auto",  }}>
             <div style={{ display: "flex", flexWrap:(isDesktop || isTablet || isMobile) ? "wrap" : undefined , gap: "15px" }}>
             {getItemsByType(relatedType).map((item, idx) => (
               <div key={idx} className="circular-item">
                 <div
                   className="hovitem"
                 >
                   <img
                     src={item.item.images[0] || "/path/to/placeholder.jpg"}
                     alt={item.item.name}
                     className="circular-item-image"
                     onClick={() => handleItemClick(item.id)}
                     onError={(e) => {
                       e.target.onerror = null;
                       e.target.src = "/path/to/placeholder.jpg";
                     }}
                   />
                 </div>
                 <div className="circular-item-name">
                   {item.item.name.length > 20 ? `${item.item.name.substring(0, 20)}...` : item.item.name}
                 </div>
                
               </div>
             ))}
           </div>
             </div>
           <div style={{color: "blue", textDecoration: "underline", cursor: "pointer"}}>{t("view_type_page", { type: relatedType })}</div>
         </div>
   
       )
     ))}
   </div>
    <div className="item-page-container" style={{marginTop: "80px"}}>
      <div className="search-results-container">
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

          return (
            <div key={id} className="item-card">
              <div
                style={{
                  background: 'white',
                  zIndex: '1',
                  filter: "brightness(0.880000000) contrast(1.2)",
                  width: '100%',
                  height: '230px',
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
                    style={{ width: '100%x', height: '230px', objectFit: 'contain' }}
                  />
                ) : (
                  <>
                    <img
                      className="item-image"
                      src={item.images[0]}
                      onClick={() => handleItemClick(id)} // Attach the click handle
                      alt={name}
                     style={{ width: '100%', height: '230px', objectFit: 'contain' }}
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
                  {name.length > 20 ? `${name.substring(0, 20)}...` : name}
                </div>
                <div className="item-prices">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="item-price">${usdPrice}</span>
                    {originalPrice > 0 && (
                      <span className="item-original-price" >${originalPrice}</span>
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
                    />
                    <span className="item-crypto-price">
                      {itemPriceInCrypto !== "N/A"
                        ? `${itemPriceInCrypto} ${cryptocurrency}`
                        :  t("price_unavailable")}
                    </span>
                  </div>
                </div>
                    <div
  className="item-type-stars"
  onClick={() => {
    setItemData(itemData); // Store the item data in Zustand
    router.push("/reviewPage"); // Navigate to the review page
  }}
  title={t("view_reviews")}
>
  {finalRating
    ? "★".repeat(Math.round(finalRating)) + "☆".repeat(5 - Math.round(finalRating))
    : t("no_rating")}
</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
    
  );
}

export default ItemPage;
