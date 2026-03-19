'use client';


import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from "chart.js";
import useFinalRating from "./finalRating"; // ✅ Import the custom hook
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import "./analyseReview.css"

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const AnalyseReview = ({ productId, onRatingClick, id  }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const { finalRating, loading, error, ratingPercentages } = useFinalRating(productId); // ✅ Use the hook
   const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall, isVeryVerySmall} = useScreenSize()
  const router = useRouter();
   const { t } = useTranslation();

 const handleStarClick = (rating) => {
  console.log("Clicked star:", rating); // 👈 add this
  setSelectedRating((prev) => (prev === rating ? null : rating));
    onRatingClick(rating);
    router.push(`/product/${id}?rating=${rating}`);
   
};


  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <>
        {"★".repeat(fullStars)}
        {halfStar && "⭐"}
        {"☆".repeat(emptyStars)}
      </>
    );
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>{t("review_title")}</h2>
      {error && <p style={{ color: "red" }}>{t("review_error")} {error}</p>}
      {loading && <p>{t("review_loading")}</p>}
      {finalRating && !loading && (
        <div style={{ maxHeight: "200px" }}>
          <h3>
            {t("rating")}: {finalRating}/5{" "}
            <span style={{ color: "#FFD700", fontSize: "24px" }}>{renderStars(finalRating)}</span>
          </h3>

          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="Stars" style={{ marginBottom: "5px", display: "flex", alignItems: "center", height:  ((isDesktop || isTablet)) ?  "30px" : "20px" }}  onClick={() => handleStarClick(star)}>
              <div
             
                style={{
                  cursor: "pointer",
                  color: selectedRating === star ? "#ffcc00" : "#000",
                  fontWeight: selectedRating === star ? "bold" : "normal",
                }}
              >
                <div style={{ display: "flex", marginRight: "5px" }}>
                  <div style={{ marginRight: "5px" }}>{star}</div> {t("stars_label")}:
                </div>
              </div>
              <div
             
                style={{
                  width: "100%",
                  height: "20px",
                  backgroundColor: "#ddd",
                  borderRadius: "5px",
                  cursor: "pointer",
                 
                }}
               
              >
                <div
                  style={{
                    width: `${ratingPercentages[star - 1]}%`,
                    height: "100%",
                    backgroundColor: "orange",
                    cursor: "pointer",
                    borderRadius: "5px",
                    transition: "width 1s ease-in-out",
                  }}
                />
              </div>
              <div style={{ marginLeft: "5px", cursor: "pointer" }}>
                {ratingPercentages[star - 1]}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyseReview;
