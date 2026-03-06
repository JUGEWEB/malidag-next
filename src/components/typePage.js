"use client"

import React, { useEffect, useState } from "react";
import { DownOutlined, PlayCircleOutlined, UpOutlined } from "@ant-design/icons";
import axios from "axios";
import "./typePage.css";
import { FaPlay } from "react-icons/fa"; // FontAwesome play ico
import { useRouter, usePathname } from "next/navigation";
import { useCheckoutStore } from "./checkoutStore";
import useScreenSize from "./useIsMobile";

function TypePage() {
   const router = useRouter();

  const [items, setItems] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [categoryTypes, setCategoryTypes] = useState([]); // Related types for the selected category
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [allItems, setAllItems] = useState([]); // All fetched items
  const [reviews, setReviews] = useState({}); // Store reviews data
  const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall, isVeryVerySmall} = useScreenSize()
  const { setItemData } = useCheckoutStore();
 
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
 // Fetch reviews from the endpoint
const fetchReviews = async (productId) => {
  try {
    const response = await axios.get(`https://api.malidag.com/get-reviews/${productId}`);
    if (response.data.success) {
      const reviewsArray = response.data.reviews || [];
      const totalRating = reviewsArray.reduce((acc, review) => {
        let rating = parseFloat(review.rating);
        return acc + (isNaN(rating) ? 4 : rating); // default fallback
      }, 0);
      const averageRating = reviewsArray.length
        ? (totalRating / reviewsArray.length).toFixed(2)
        : null;

      setReviews((prevReviews) => ({
        ...prevReviews,
        [productId]: { averageRating, reviewsArray },
      }));
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // ✅ No reviews, safely set empty
      setReviews((prevReviews) => ({
        ...prevReviews,
        [productId]: { averageRating: null, reviewsArray: [] },
      }));
    } else {
      console.error("Error fetching reviews:", error);
    }
  }
};

  

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`https://api.malidag.com/items`);
        const fetchedItems = response.data.items || [];
  
        setAllItems(fetchedItems); // Store all fetched items
       
        // Get the date exactly two months ago from today
        const today = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(today.getMonth() - 2);
  
        // Filter items created within the last two months
        const filteredItems = fetchedItems.filter((item) => {
          const createdAt = new Date(item.createdAt);
          return !isNaN(createdAt) && createdAt >= twoMonthsAgo;
        });
  
        setItems(filteredItems);
  
        // Get unique categories from the filtered items
        const uniqueCategories = [...new Set(filteredItems.map((item) => item.category))];

        // Set the id for the review based on the first item (or any logic you prefer)
     
       // Fetch reviews for each item
       filteredItems.forEach((item) => {
        fetchReviews(item.itemId); // Fetch reviews for each product
      });
  
        if (uniqueCategories.length > 0) {
          // Find all related types from items in the same categories
          const relatedTypes = fetchedItems
            .filter((item) => uniqueCategories.includes(item.category))
            .map((item) => item.item.type);
  
          setCategoryTypes([...new Set(relatedTypes)]); // Ensure unique types
        }
  
        // Fetch crypto prices
        const cryptoSymbols = [
          ...new Set(filteredItems.map((item) => `${item.item.cryptocurrency}USDT`)),
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
  
  
  const handleVideoPlay = (id, videoUrl) => {
    console.log('Playing video:', videoUrl); // Debugging line
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const getItemsByType = (relatedType) => {
    return allItems
      .filter((item) => item.item.type === relatedType)
      .slice(0, 9); // Limit to 9 items
  };

  const toggleDropdown = (relatedType) => {
    setDropdownOpen((prevState) => ({
      [relatedType]: !prevState[relatedType] // Only keep the clicked dropdown open
    }));
  };
  

  if (loading) {
    return (
      <div
        className="loading-message"
        style={{
          width: "100%",
          height: "500px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.2rem",
          color: "#555",
          backgroundColor: "white",
        }}
      >
    
      </div>
    );
  }
  
  if (!items || items.length === 0) {
    return (
      <div
        className="no-results-message"
        style={{
          width: "100%",
          height: "500px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.1rem",
          fontWeight: "500",
          color: "#777",
          backgroundColor: "#fff3f3",
          border: "1px solid #ffdddd",
          borderRadius: "8px",
        }}
      >
        No items found 😔
      </div>
    );
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
  
  <div style={{ whiteSpace: "nowrap" }}>Related Types:</div>

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
        <div style={{color: "blue", textDecoration: "underline", cursor: "pointer"}}> view {relatedType} page</div>
      </div>

    )
  ))}
</div>

       
      <div className="item-type-container">
        <div className="search-results-type-container"style={{
  display: "grid",
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
      ? "repeat(4, 1fr)"
      : "repeat(5, 1fr)",
}}>
          {items.map((itemData) => {
            const {itemId, id, item } = itemData;
            const { name, usdPrice, originalPrice, cryptocurrency, sold, videos } = item;
            const cryptoSymbol = `${cryptocurrency}USDT`;
            const crypto = String(cryptocurrency);
            const cryptoPriceInUSD = cryptoPrices[cryptoSymbol] || 0;
            const itemPriceInCrypto =
              cryptoPriceInUSD > 0 ? (usdPrice / cryptoPriceInUSD).toFixed(6) : "N/A";
               // Get the average rating from the fetched reviews

               const reviewsData = reviews[itemId] || {}; // Ensure it exists
            const finalRating = reviewsData ? reviewsData.averageRating : "No rating";
              const normalizedVideos = Array.isArray(videos) ? videos : [videos];
            const firstVideoUrl = normalizedVideos.find(
              (video) => typeof video === "string" && video.endsWith(".mp4")
            );

            return (
              <div key={id} className="item-type-card" style={{width :"100%", maxWidth: "100%"}}>
                <div
                  style={{
                    background: "white",
                    zIndex: "1",
                    filter: "brightness(0.880000000) contrast(1.2)",
                    width: "100%",
                    height:(isVerySmall) ? "190px" :  "250px",
                    marginBottom: "10px",
                    marginTop: "10px",
                    position: "relative",
                  }}
                >
                   {activeVideoId === id && firstVideoUrl  ? (
                    <video
                      src={firstVideoUrl}
                      controls
                      autoPlay
                      onEnded={handleVideoStop}
                      style={{ width: "100%",
                        height: (isVerySmall) ? "190px" :  "250px",
                        objectFit: "contain" }}
                    />
                  ) : (
                    <>
                      <img
                        
                        src={item.images[0] || "/path/to/placeholder.jpg"}
                        onClick={() => handleItemClick(id)} // Pass the correct id
                        alt={name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/path/to/placeholder.jpg";
                         
                        }}
                       style={{ width: "100%",
  height:(isVerySmall) ? "190px" :  "250px",
  objectFit: "contain"}}
                      />
                      {firstVideoUrl && ( 

                      <PlayCircleOutlined
                      onClick={() => handleVideoPlay(id)}
                      style={{
                        position: "absolute",
                        left: "20px",
                        bottom: "0px",
                        zIndex: "2",
                        fontSize: "2rem",
                        color: "black",
                        cursor: "pointer",
                        textShadow: "0 0 6px rgba(0, 0, 0, 0.7)"
                      }}
                      />
                      )}
                    </>
                  )}
                </div>
                <div className="item-type-details">
                  <div  onClick={() => handleItemClick(id)} className="item-type-name" title={name}>
                    {name.length > 20 ? `${name.substring(0, 20)}...` : name}
                  </div>
                  <div  onClick={() => handleItemClick(id)} className="item-type-prices">
                    <span className="item-type-price" style={{marginRight: "5px"}}>${usdPrice}</span>
                    {originalPrice > 0 && (
                      <span className="item-original-type-price">${originalPrice}</span>
                    )}
                    <span className="item-type-sold">{sold} sold</span>
                  </div>
                 
              <div
  className="item-type-stars"
  onClick={() => {
    setItemData(itemData); // ✅ Store globally
    router.push('/review'); // ✅ Navigate
  }}
  title="View reviews of this item"
>
  {finalRating
    ? "★".repeat(Math.round(finalRating)) + "☆".repeat(5 - Math.round(finalRating))
    : "No reviews yet"}
</div>

                  
                  <div className="item-type-date">
                  Added on{" "}
                  {new Date(itemData.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false, // 24-hour format
                  })}
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

export default TypePage;
