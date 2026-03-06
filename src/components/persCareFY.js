'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import "./personalCare.css";
import RecommendedItem from "./personalRecommend";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";


const BASE_URLs = "https://api.malidag.com"; // Replace with the new API URL for categories (the server you provided)
const BASE_URL = "https://api.malidag.com"; // Replace with your actual API URL
const CRYPTO_URL = "https://api.malidag.com/crypto-prices"; // Your crypto prices endpoint

function PersonalCare({ lang }) {
   const router = useRouter();
  const [types, setTypes] = useState({});
  const [mtypes, setMTypes] = useState({})
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall} = useScreenSize()
  const { t } = useTranslation();
 

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  useEffect(() => {
    // Fetch types and images for the Beauty category
    const fetchBeautyItems = async () => {
      try {
        const response = await axios.get(`${BASE_URLs}/categories/Beauty`);
        const data = response.data; // Should return the array of types with images

        setMTypes(data); // Update state with the types and images
      } catch (error) {
        console.error("Error fetching Beauty category items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBeautyItems();
}, []);

  useEffect(() => {
    const fetchBeautyItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = response.data.items;

        // Filter for "Beauty" category and group by type
        const filteredData = data.filter(item => item.category === "Beauty" && item.item.sold >= 100);
        const groupedData = filteredData.reduce((acc, item) => {
          const type = item.item.type || "Other";

          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(item);

          return acc;
        }, {});

        setTypes(groupedData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBeautyItems();

     // Fetch crypto prices
     const fetchCryptoPrices = async () => {
        try {
          const response = await axios.get(CRYPTO_URL);
          setCryptoPrices(response.data);
        } catch (error) {
          console.error("Error fetching crypto prices:", error);
        }
      };
  
      fetchCryptoPrices();
       // Optionally, refresh crypto prices at intervals
    const intervalId = setInterval(fetchCryptoPrices, 5000); // Refresh every 5 seconds
    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  const renderStars = (rating) => {
    const stars = Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`star ${index < rating ? "filled" : "empty"}`}
      >
        ★
      </span>
    ));
    return <div className="stars-container">{stars}</div>;
  };

  const convertToCrypto = (usdPrice, cryptocurrency) => {
    if (!cryptoPrices[cryptocurrency]) return null;
    return (usdPrice / cryptoPrices[cryptocurrency]).toFixed(2);
  };

  const getCryptoIcon = (cryptocurrency) => {
    const cryptoIcons = {
        USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
        ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
        BNB: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
        SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
        BUSD: "https://cryptologos.cc/logos/binance-usd-busd-logo.png",
        USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", // Updated URL
    };
    return cryptoIcons[cryptocurrency] || "/crypto-icons/default.png";
  };

  if (loading) return <div className="loading-message">Loading Beauty Items...</div>;

   // Handle item click to navigate to product details page
   const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`); // Navigate to the product details page
    }
  };

  const handleCategoryClick = (category) => {
    if (category) {
      const formattedCategory = category.toLowerCase(); // Convert to lowercase
      router.push(`/items/${formattedCategory}`); // Navigate to the corresponding route
    }
  };

  return (
    <div className="personal-care-container">
      <h2 className="personal-care-title">Malidag Beauty</h2>
      <div style={{width: "100%", alignItems: "center", display: "flex", justifyContent: "center"}}>
          {/* Display categories and images */}
      <div className="beauty-category">
        {Object.values(mtypes).length === 0 ? (
          <div>No types found for Beauty category</div>
        ) : (
          Object.values(mtypes).map((typeObj, index) => (
            <div key={index} style={{margin: "10px"}} >
             
              <div className="type-image-i" style={{width: (isDesktop || isTablet) ? "200px" : "100px", height: (isDesktop || isTablet) ? "200px" : "100px", borderRadius: (isDesktop || isTablet) ? "200px" : "100px", overflow: "hidden"}}>
                <img
                  src={typeObj.image}
                  alt={typeObj.type}
                 
                  onClick={() => handleCategoryClick(typeObj.type)}
                  style={{width: "100%", height: (isDesktop || isTablet) ? "200px" : "100px", objectFit: "contain"}}
                />
              </div>
              <h3 className="type-title"style={{color: 'green', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{typeObj.type}</h3>
            </div>
          ))
        )}
      </div>
      </div>

      {/* Horizontal scroll of types (Top topics) */}
<div
  style={{
    display: "flex",
    overflowX: "auto",
    gap: "12px",
    padding: "10px 15px",
    marginBottom: "20px",
    scrollbarWidth: "none",
  }}
>
  {Object.keys(types).map((type, idx) => (
    <div
      key={idx}
      onClick={() => router.push(`/beauty/top/${type.toLowerCase()}`)}
      style={{
        flex: "0 0 auto",
        background: "#f0f0f0",
        padding: "10px 20px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        color: "#333",
        whiteSpace: "nowrap",
      }}
    >
      Top {type}
    </div>
  ))}
</div>


     {Object.entries(types).map(([type, items]) => (
  <div key={type} style={{margin: "10px"}}>
    <h3 style={{ marginBottom: "10px", fontWeight: "bold" }}>{type} Top Items</h3>

    <div
      style={{
        display: "grid",
        gap: "5px",
        padding: "0px 0",
        gridTemplateColumns: isDesktop || isTablet ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
      }}
    >
      {items.slice(0, 5).map(({ id, item }) => (
        <div key={id} style={{ background: "#fff", overflow: "hidden",  }}>
          <div style={{filter: "brightness(0.880000000) contrast(1.2)", backgroundColor: "white"}}>
            <img
              src={item.images[0]}
              alt={item.name}
              onClick={() => handleItemClick(id)}
              style={{
                width: "100%",
                height: (isDesktop || isTablet) ? "200px" : "200px",
                objectFit: "contain",
                cursor: "pointer",
              }}
            />
          </div>

          <div
            onClick={() => handleItemClick(id)}
            style={{ padding: "10px", cursor: "pointer", fontSize: "14px", color: "#333" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <div style={{ fontWeight: "bold" }}>${item.usdPrice}</div>
              <div style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                {convertToCrypto(item.usdPrice, item.cryptocurrency)
                  ? `${convertToCrypto(item.usdPrice, item.cryptocurrency)} ${item.cryptocurrency}`
                  : "Loading..."}
                <img
                  src={getCryptoIcon(item.cryptocurrency)}
                  alt={item.cryptocurrency}
                  className="crypto-icon"
                  style={{ width: "16px", height: "16px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "5px", fontSize: "28px" , fontWeight: "bold"}}>
              {item.name.length > 150 ? `${item.name.substring(0, 150)}...` : item.name}
            </div>

            <div className="item-rating">
              {renderStars(item.rating || 0)}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
))}

      < RecommendedItem />
    </div>
  );
}

export default PersonalCare;
