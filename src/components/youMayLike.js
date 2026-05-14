"use client"

import React, { useState, useEffect, useContext } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import useScreenSize from "./useIsMobile";
import "./youMayLike.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { AppContext } from "./appContext";

const BASE_URL = "https://api.malidag.com";


function YouMayLike() {
  const router = useRouter();
  const appContext = useContext(AppContext);
  const user = appContext?.user || null;
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [userSearchHistory, setUserSearchHistory] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reviews, setReviews] = useState({});
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall, isVeryVerySmall,  } = useScreenSize();
const { t } = useTranslation();
 const itemsPerSlide = isMobile || isSmallMobile || isVerySmall ? 2 : 6;

  console.log("userId:", user?.uid);

  // Fetch user search history
  useEffect(() => {
    const fetchUserSearchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/search-items?userId=${user?.uid}`);
        const data = await response.json();
       setUserSearchHistory(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.userSearches)
          ? data.userSearches
          : []
      );
      } catch (error) {
        console.error("Error fetching user search history:", error);
      }
    };

    if (user?.uid) {
      fetchUserSearchHistory();
    }
  }, [user?.uid]);

 const fetchReviews = async (productId) => {
  if (!productId || reviews[productId]) return;

  try {
    const response = await fetch(`${BASE_URL}/get-reviews/${productId}`);
    const data = await response.json();

    if (data.success) {
      const reviewsArray = data.reviews || [];

      const totalRating = reviewsArray.reduce((acc, review) => {
        const rating = parseFloat(review.rating);
        return acc + (isNaN(rating) ? 4 : rating);
      }, 0);

      const averageRating = reviewsArray.length
        ? (totalRating / reviewsArray.length).toFixed(1)
        : null;

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          averageRating,
          reviewsArray,
        },
      }));
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }
};

  // Fetch items based on search history
  useEffect(() => {
    const fetchSuggestedItems = async () => {
      try {
       const response = await fetch(`${BASE_URL}/items`);
const data = await response.json();

const itemsArray = Array.isArray(data)
  ? data
  : Array.isArray(data?.items)
  ? data.items
  : [];

const searchedTerms = userSearchHistory
  .map((s) => String(s.search || "").toLowerCase().replace(/\+/g, " "))
  .filter(Boolean);

const matchedItems = itemsArray.filter((item) =>
  searchedTerms.some((term) =>
    item?.item?.name?.toLowerCase().includes(term) ||
    item?.item?.type?.toLowerCase().includes(term) ||
    item?.category?.toLowerCase().includes(term) ||
    item?.item?.theme?.toLowerCase().includes(term) ||
    item?.item?.brand?.toLowerCase().includes(term)
  )
);

setSuggestedItems(matchedItems);
matchedItems.forEach((item) => {
  if (item?.itemId) {
    fetchReviews(item.itemId);
  }
});
localStorage.setItem("suggestedItemsCount", matchedItems.length);
       
      } catch (error) {
        console.error("Error fetching suggested items:", error);
      }
    };

    if (userSearchHistory.length > 0) {
      fetchSuggestedItems();
    }
  }, [userSearchHistory]);

  const totalSlides = Math.ceil(suggestedItems.length / itemsPerSlide);
  const startIdx = currentSlide * itemsPerSlide;
  const currentItems = isMobile || isSmallMobile || isVerySmall
  ? suggestedItems
  : suggestedItems.slice(currentSlide * itemsPerSlide, currentSlide * itemsPerSlide + itemsPerSlide);

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? totalSlides - 1 : prev - 1));
  };


  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  return (
    <>
      {user && userSearchHistory.length > 0 && (
        <div className="you-may-like-carous">
          {user && suggestedItems.length > 0 ? (
            <>

            <div style={{
      display: "flex",
      justifyContent: "start",
      alignItems: "center",
      padding: "10px 0",
      fontWeight: "bold",
      fontSize: "20px",
      with: "100%"
    }}>
      <span>{t("based_on_browsing_history")} </span>
      <button
        style={{
          backgroundColor: "green",
          color: "white",
          border: "none",
          padding: "8px 14px",
          borderRadius: "5px",
          cursor: "pointer"
        }}
        onClick={() => router.push('/browsing')}
      >
        {t("view_more")}
      </button>
    </div>
              <div
                className="carousel-slid"
                style={{
                  overflowX: (isMobile || isSmallMobile || isTablet || isVerySmall || isVeryVerySmall) ? "auto" : "hidden"
                }}
              >
                {currentItems.map((item, index) => (
                  <div className="carousel-it" key={index}>
                    <img
                     src={
                      typeof item?.item?.images?.[0] === "string"
                        ? item.item.images[0]
                        : item?.item?.images?.[0]?.url || "/fallback.png"
                    }
                      alt={item.item.name}
                      className="carousel-ima"
                      style={{ cursor: "pointer" }}

                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/fallback.png";
                      }}
                      onClick={() => handleItemClick(item.id)}
                    />
                    <div className="reconded-price">${item.item.usdPrice}</div>
                   
                   {reviews[item.itemId]?.averageRating && (
                        <div
                          className="item-s"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/product/${item.id}/review`);
                          }}
                        >
                          <span>{reviews[item.itemId].averageRating}/5</span>{" "}
                          <span>
                            {"★".repeat(Math.round(Number(reviews[item.itemId].averageRating)))}
                            {"☆".repeat(
                              5 - Math.round(Number(reviews[item.itemId].averageRating))
                            )}
                          </span>{" "}
                          <span>
                            ({reviews[item.itemId]?.reviewsArray?.length || 0} reviews)
                          </span>
                        </div>
                      )}
                    <p className="item-na" onClick={() => handleItemClick(item.id)}>
                      {item.item.name}
                    </p>
                  </div>
                ))}
              </div>

              {isDesktop && suggestedItems.length > itemsPerSlide && (
                <div className="carousel-arr">
                  <LeftOutlined onClick={handlePrevSlide} className="arrow-butt" />
                  <RightOutlined onClick={handleNextSlide} className="arrow-butt" />
                </div>
              )}
            </>
          ) : (
            <p style={{ padding: "1rem", color: "#777" }}>No items matched your recent searches.</p>
          )}
        </div>
      )}
    </>
  );
}

export default YouMayLike;
