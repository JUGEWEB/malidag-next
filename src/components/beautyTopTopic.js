'use client';


import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import "./beautyTopTopic.css";
import AnalyseReview from "./analyseReview"; // Import your AnalyseReview component
import { Trans } from 'react-i18next';
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const BASE_URL = "https://api.malidag.com";


const BeautyTopTopic = ({ type }) => {
  const [topBeautyItems, setTopBeautyItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // Store the selected item (instead of just itemId)
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemProductId, setSelectedItemProductId] = useState(null); // Store `itemId` for AnalyseReview
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
   const [reviews, setReviews] = useState({}); // Store reviews data
   const [translations, setTranslations] = useState({});
   const { t } = useTranslation();
 
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTranslation = async (productId, lang) => {
  if (translations[productId]?.[lang]) return;
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
    const fetchTopBeautyItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = response.data.items;


        // Filter items by type and where sold >= 100
        const filteredItems = data.filter(
          (item) => item.category === "Beauty" && item.item.type.toLowerCase() === type.toLowerCase() && item.item.sold >= 100
        );

        const lang = i18n.language || "en";
filteredItems.forEach(itemData => {
  if (itemData?.itemId) fetchTranslation(itemData.itemId, lang);
});

        setTopBeautyItems(filteredItems);

          filteredItems.forEach((itemData) => {
  if (itemData?.itemId) {
    fetchReviews(itemData.itemId);
  }
});
      } catch (error) {
        console.error("Error fetching top beauty items:", error);
      } finally {
        setLoading(false);
      }
    };

   

    if (type) {
      fetchTopBeautyItems();
      
    }
  }, [type]);

  useEffect(() => {
  const lang = i18n.language || "en";
  topBeautyItems.forEach(itemData => {
    if (itemData?.itemId) fetchTranslation(itemData.itemId, lang);
  });
}, [i18n.language, topBeautyItems]);


const getTranslatedName = (item, itemId) => {
  const lang = i18n.language || "en";
  const translated = translations[itemId]?.[lang]?.name;
  return translated || item.name;
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


  const openModal = (item, event) => {
    setSelectedItem(item); // Store the entire item object
    setSelectedItemId(item.id); // Store only the ID for navigation
    setSelectedItemProductId(item.itemId); // Store `itemId` for AnalyseReview

    // Get button position relative to the page
    const rect = event.target.getBoundingClientRect();
    setModalPosition({
      top: rect.top + window.scrollY + 30, 
      left: rect.left + window.scrollX + 10,
    });

    setModalOpen(true);
};


const closeModal = () => {
    setSelectedItemId(null);
    setSelectedItemProductId(null);
    setModalOpen(false);
  };

  const handleRatingClick = (rating) => {
    console.log(`User selected ${rating} stars for product ID: ${selectedItemId}`);
    if (selectedItemId) {
      router.push(`/product/${selectedItemId}`);
    } else {
      console.error("Error: Product ID is undefined");
    }
  };


 if (loading) return (
  <div className="loading-message">
    {t('loading')} {t(type.replace("-", " "))} {t('top_items')}...
  </div>
);


  return (
    <div className="beauty-top-container">
   <h2 className="beauty-top-title">
  {t(type.replace("-", " "))} - {t('top_items')}
</h2>
    <div className="ms-grid">
      {topBeautyItems.length === 0 ? (
       <p>{t('no_top_selling_items', { type: t(type.replace("-", " ")) })}</p>
      ) : (
        topBeautyItems.map((itemData) => {
           const { id, itemId, item } = itemData;
           const reviewsData = reviews[itemId] || {}; // Ensure it exists
            const finalRating = reviewsData ? reviewsData.averageRating : t("no_rating");

            return (
           
          <div
            key={id}
            className="m-card"
           
          >
            {/* Image on the left */}
            <img
              src={item.images[0]}
              alt={item.name}
              className="m-image"
              onClick={() => router.push(`/product/${id}`)}
            />

            {/* Details on the right */}
            <div className="m-details">
           <div className="rating-name-wrapper">
  <div className="item-stars">
    {finalRating !== "No rating"
      ? "★".repeat(Math.round(finalRating)) +
        "☆".repeat(5 - Math.round(finalRating))
      : t("no_rating")}
  </div>
  <h3 className="m-name" onClick={() => router.push(`/product/${id}`)}>
    {getTranslatedName(item, itemId).length > 80 
    ? getTranslatedName(item, itemId).slice(0, 80) + '...' 
    : getTranslatedName(item, itemId)}
  </h3>
</div>
              <p className="m-sold">{t("sold")}: {item.sold} {t("items")}</p>
             
            </div>
           
          </div>
            )
})
      )}
    </div>
     {/* Modal (Always Appears Next to Clicked Button) */}
     {modalOpen && selectedItemProductId && (
        <div
          className="modal-content"
          style={{
            position: "absolute",
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
            zIndex: 1000,
            color: "black"
          }}
        >
          <span className="close-btn" onClick={closeModal}>&times;</span>
          <AnalyseReview productId={selectedItemProductId} id={selectedItemId} onRatingClick={handleRatingClick} />
        </div>
      )}
  </div>
);
};


export default BeautyTopTopic;
