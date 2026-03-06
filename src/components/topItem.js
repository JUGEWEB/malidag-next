"use client"

import React, { useState, useEffect } from "react";
import "./recomendedItem.css";
import { useRouter, usePathname } from "next/navigation";

const BASE_URL = "https://api.malidag.com"; // Replace with your actual API URL

function TopItem() {
   const router = useRouter();
  const [topSoldItems, setTopSoldItems] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
 

  useEffect(() => {
    const fetchTopSoldItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/items`);
        const data = await response.json();

        // Sort items by "sold" in descending order and take the top 100
        const sortedItems = data.items.sort((a, b) => b.item.sold - a.item.sold).slice(0, 100);

        setTopSoldItems(sortedItems);
      } catch (error) {
        console.error("Error fetching top sold items:", error);
      } finally {
        setLoading(false); // Stop loading after data fetch
      }
    };

    fetchTopSoldItems();
  }, []);

   // Handle item click to navigate to product details page
   const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`); // Navigate to the product details page
    }
  };

  return (
    <div className="recommended-items-container">
      <h2 className="recommended-title">Top Items</h2>
      {loading ? (
        <div className="loading-indicator">Loading...</div>
      ) : topSoldItems.length > 0 ? (
        <div className="recommended-grid">
          {topSoldItems.map((item) => (
            <div className="recommended-item" key={item.id}>
              <div className="rec-img">
                <img
                  src={item.item.images[0]} // Assuming the first image is the main image
                  alt={item.item.name}
                  className="recommended-image"
                  onClick={() => handleItemClick(item.id)} // Pass the correct id
                />
              </div>
              <div className="recommended-info">
                <p className="recommended-name"   onClick={() => handleItemClick(item.id)} >{item.item.name}</p>
                <div className="recommended-price">
                  Sold: {item.item.sold}
                </div>
                <div className="recommended-price">${item.item.usdPrice}</div>
                <a
                  href={`https://www.malidag.com/#/product/${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="recommended-link"
                >
                  View Item
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-items">No items found.</div>
      )}
    </div>
  );
}

export default TopItem;
