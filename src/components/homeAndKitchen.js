"use client";

import React, { useState, useEffect } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons"; // Import arrow icons from Ant Design
import "./homeAndKitchen.css";
import { useRouter } from "next/navigation";

const BASE_URL = "https://api.malidag.com"; // Replace with your actual API URL
const ITEMS_PER_SLIDE = 6; // Number of items to display per slide
const MAX_ITEMS = 17; // Maximum number of items to fetch/display

function Home() {
  const [items, setItems] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter(); // ✅ Next.js navigation



  useEffect(() => {
    const fetchFashionItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/items`);
        const data = await response.json();

        // Filter items with "fashion" in the category or theme
        const fashionItems = data.items.filter((item) => {
          const category = item.category?.toLowerCase() || "";
          const theme = item.item?.theme?.toLowerCase() || "";
          const name = item.item?.name?.toLowerCase() || "";
          return category.includes("bed") || theme.includes("bed") || name.includes("bed");
        });

        // Limit to max items and set state
        setItems(fashionItems.slice(0, MAX_ITEMS));
      } catch (error) {
        console.error("Error fetching fashion items:", error);
      }
    };

    fetchFashionItems();
  }, []);

  // Calculate total slides
  const totalSlides = Math.ceil(items.length / ITEMS_PER_SLIDE);

  // Get items for the current slide
  const startIndex = currentSlide * ITEMS_PER_SLIDE;
  const endIndex = startIndex + ITEMS_PER_SLIDE;
  const currentItems = items.slice(startIndex, endIndex);

  // Navigation handlers
  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

   // Handle item click to navigate to product details page
   const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`); // Navigate to the product details page
    }
  };

  return (
    <div className="fashion-car">
      <div className="carousel-s">
        {currentItems.map((item, index) => (
          <div key={item.id || index} className="carousel">
            <img
              src={item.item?.images[0]} // Display the first image of each item
              alt={item.item?.name || "Fashion Item"}
              onClick={() => handleItemClick(item.id)} // Attach the click handle
              className="carousel-"
              style={{cursor: "pointer"}}
            />
            
          </div>
        ))}
      </div>
      <div className="carousel-a">
              <LeftOutlined onClick={handlePrevSlide} className="arrow-b" />
              <RightOutlined onClick={handleNextSlide} className="arrow-b" />
            </div>
    </div>
  );
}

export default Home;
