"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./woFashion.css";
import RecommendedItem from "./personalRecommend";
import { useRouter, usePathname } from "next/navigation";
import Slider from "react-slick";


const BASE_URLs = "https://api.malidag.com"; // Replace with the new API URL for categories (the server you provided)
const BASE_URL = "https://api.malidag.com"; // Replace with your actual API URL
const CRYPTO_URL = "https://api.malidag.com/crypto-prices"; // Your crypto prices endpoint

function WoFashion() {
  const router = useRouter();
  const [types, setTypes] = useState({});
  const [mtypes, setMTypes] = useState({})
  const [loadingMTypes, setLoadingMTypes] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
 
  


  useEffect(() => {
    // Fetch types and images for the Beauty category
    const fetchBeautyItems = async () => {
      try {
        const response = await axios.get(`${BASE_URLs}/categories/WomenFashion`);
        const data = response.data; // Should return the array of types with images

        setMTypes(data); // Update state with the types and images
        setLoadingMTypes(false);
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

    // Filter items where genre includes "women" and category is not "Beauty"
    const filteredData = data.filter(
        (item) =>
          item.item.genre.includes("women") && item.category !== "Beauty"
      );

      // Group filtered items by type
      const groupedData = filteredData.reduce((acc, item) => {
        const type = item.item.type || "Other"; // Use "Other" if type is missing
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
      }, {});

      setTypes(groupedData);
      setLoadingTypes(false);
     
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


   // Handle item click to navigate to product details page
   const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`); // Navigate to the product details page
    }
  };

  const handleCategoryClick = (category) => {
    if (category) {
      let formattedCategory = category.toLowerCase().trim(); // Convert to lowercase and trim spaces
  
      // Normalize "shirt and tshirt" to "shirt"
      if (formattedCategory.includes("shirt and")) {
        formattedCategory = "shirt";
      }
  
      router.push(`/item-of-women/${encodeURIComponent(formattedCategory)}`); // Encode URL to handle special characters
    }
  };
  
  

  return (
    <div className="personal-care-container">
     <div style={{ padding: "20px" }}>
  {/* Display categories and images */}
  {loadingMTypes ? (
    <div className="section-spinner-wrapper">
      <div className="section-spinner"></div>
    </div>
  ) : Object.values(mtypes).length === 0 ? (
    <div>No types found for Beauty category</div>
  ) : (
    <Slider
      dots={true}
      infinite={false}
      speed={500}
      slidesToShow={3}
      slidesToScroll={1}
      responsive={[
        {
          breakpoint: 1024,
          settings: { slidesToShow: 2 },
        },
        {
          breakpoint: 600,
          settings: { slidesToShow: 1 },
        },
      ]}
    >
      {Object.values(mtypes).map((typeObj, index) => (
        <div key={index} className="type-section">
          <div className="type-image-id">
            <img
              src={typeObj.image}
              alt={typeObj.type}
              className="type-image-imgid"
              onClick={() => handleCategoryClick(typeObj.type)}
            />
            <div style={{color: "white", backgroundColor: "black", padding: "20px", position: "absolute", bottom: "20px"}}  onClick={() => handleCategoryClick(typeObj.type)}>View more</div>
          </div>
          <h3 className="type-title" style={{ color: "black", display: "flex", justifyContent: "center", width: "100%" }}>
            {typeObj.type}
          </h3>
        </div>
      ))}
    </Slider>
  )}
</div>


    {/* Horizontal scroll of type names (Top Topics) */}
{/* Horizontal scroll of type names (Top Topics) */}
<div
  style={{
    display: 'flex',
    overflowX: 'auto',
    gap: '16px',
    padding: '10px',
    marginBottom: '20px',
    height: '100px', // slightly taller for visual clarity
    alignItems: 'center',
    position: 'relative'
  }}
>
  {loadingTypes ? (
    <div className="section-spinner-wrapper">
      <div className="section-spinner"></div>
    </div>
  ) : (
    Object.keys(types).map((type, index) => (
      <div
        key={index}
        onClick={() => router.push(`/women-toptopic/${type.toLowerCase()}`)}
        style={{
          flex: '0 0 auto',
          width: '160px',
          height: '100px',
          backgroundImage: `url('https://api.malidag.com/images/1752764163519-steptodown.com980265.webp')`, // ✅ Replace with your image
          backgroundSize: 'cover',
          backgroundPosition: 'center ',
          borderRadius: '10px',
          position: 'relative',
          cursor: 'pointer',
          fontWeight: 'bold',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.7)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '10px'
          }}
        />
        <span style={{ position: 'relative', zIndex: 1 }}>
          Top {type}
        </span>
      </div>
    ))
  )}
</div>



{/* All images grid (merged across types) */}
<div style={{ padding: '10px' }}>
  {loadingTypes ? (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '12px'
    }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image" />
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  ) : (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '12px'
    }}>
      {Object.values(types).flat().map(({ id, item }) => (
        <div
          key={id}
          onClick={() => handleItemClick(id)}
          style={{
            background: '#fff',
            padding: '10px',
            border: '1px solid #eee',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <img
            src={item.images[0]}
            alt={item.name}
            style={{ width: '100%', height: '160px', objectFit: 'contain', marginBottom: '8px' }}
          />
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>${item.usdPrice}</div>
          <div style={{ fontSize: '12px', color: '#555' }}>
            {item.name.length > 50 ? `${item.name.substring(0, 50)}...` : item.name}
          </div>
        </div>
      ))}
    </div>
  )}
</div>


<div style={{width: "100%"}}>
      < RecommendedItem />
      </div>
    </div>
  );
}

export default WoFashion;
