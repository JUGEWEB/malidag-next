"use client"

import React, {
  useState,
  useEffect,
  useContext,
} from "react";

import axios from "axios";
import { AppContext } from "./appContext";
import FetchReviews from "./fetchReview";
import { useRouter } from 'next/navigation';
import useFinalRating from "./finalRating";
import useScreenSize from "./useIsMobile";
import ProductSchema from "./productShema";
import { useCheckoutStore } from "./checkoutStore";
import { auth } from "@/components/firebaseConfig";
import {
  useTranslation
} from "react-i18next";
import './reviewPage.css'

const BASE_URL =
  "https://api.malidag.com";


function ReviewPage({ productId, product, reviews, avg, count }) {

     const router = useRouter();
const {
  itemData,
  authState = false,
  ratingFilter = null
} = useCheckoutStore();
const [selectedRating, setSelectedRating] = useState(ratingFilter);
const [
  reviewLikedItems,
  setReviewLikedItems,
] = useState([]);
const {isMobile, isTablet, isSmallMobile, isDesktop, isVerySmall} = useScreenSize()
const {
  t,
  i18n
} = useTranslation();
const [
  reviewItemTranslations,
  setReviewItemTranslations,
] = useState({});

const [
  currentProductTranslation,
  setCurrentProductTranslation,
] = useState(null);
const {
  country,
  basketItems
} = useContext(AppContext);

const countryCode =
  country?.code?.toLowerCase();

const withCountry = (path) => {
  if (!path) {
    return `/${countryCode}`;
  }

  const cleanPath =
    path.replace(
      /^\/(fr|gb|br|us|de|ie|au|be)(\/|$)/,
      "/"
    );

  return `/${countryCode}${
    cleanPath.startsWith("/")
      ? cleanPath
      : `/${cleanPath}`
  }`;
};
   

     // Get the final rating and rating percentages using the custom hook
  const { finalRating, loading, error, ratingPercentages } = useFinalRating(productId);


    const handleRatingFilter = (rating) => {
        // If the user selects the same rating again, we clear the filter
        setSelectedRating(selectedRating === rating ? null : rating);
      };

    const goToLike = () => {
  router.push(
    withCountry(
      "/likeditem"
    )
  );
};

     const goToProduct = (id) => {
  if (!id) return;

  router.push(
    withCountry(
      `/product/${id}`
    )
  );
};

     const hasBasket =
  Array.isArray(basketItems) &&
  basketItems.length > 0;

const shouldOffsetForBasket =
  isDesktop && hasBasket;

      // Function to render filled stars based on the finalRating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating); // Number of full stars
    const halfStar = rating % 1 >= 0.5 ? 1 : 0; // Half star if remainder >= 0.5
    const emptyStars = 5 - fullStars - halfStar; // Empty stars

    const starArray = [
      ...Array(fullStars).fill("★"),  // Full stars
      ...Array(halfStar).fill("☆"),   // Half star
      ...Array(emptyStars).fill("☆"), // Empty stars
    ];

    return starArray.map((star, index) => (
      <span key={index} style={{ color: star === "★" ? "#ffcc00" : "#ddd" }}>
        {star}
      </span>
    ));
  };

  useEffect(() => {
  let cancelled = false;

  const fetchReviewLikedItems =
    async (userId) => {
      if (!userId) {
        if (!cancelled) {
          setReviewLikedItems([]);
        }

        return;
      }

      try {
        const response =
          await axios.get(
            `${BASE_URL}/liked-items/${userId}`
          );

        if (cancelled) {
          return;
        }

        const items =
          response.data
            ?.likedItems || [];

        setReviewLikedItems(
          items
        );
      } catch (error) {
        console.error(
          "Error fetching review liked items:",
          error
        );

        if (!cancelled) {
          setReviewLikedItems([]);
        }
      }
    };

  const unsubscribe =
    auth.onAuthStateChanged(
      (user) => {
        if (!user) {
          setReviewLikedItems(
            []
          );

          return;
        }

        fetchReviewLikedItems(
          user.uid
        );
      }
    );

  return () => {
    cancelled = true;

    unsubscribe();
  };
}, []);

useEffect(() => {
  let cancelled = false;

  const translateLikedItems =
    async () => {
      const lang =
        (
          i18n.resolvedLanguage ||
          i18n.language ||
          "en"
        )
          .split("-")[0]
          .toLowerCase();

      /*
       * English is the original product language,
       * so no API translation is necessary.
       */
      if (lang === "en") {
        setReviewItemTranslations(
          {}
        );

        return;
      }

      /*
       * Product translation API currently supports:
       * en, fr, br
       */
      if (
        !["fr", "br"].includes(
          lang
        )
      ) {
        setReviewItemTranslations(
          {}
        );

        return;
      }

      const uniqueItemIds = [
        ...new Set(
          reviewLikedItems
            .map((item) =>
              String(
                item?.itemId ||
                ""
              )
            )
            .filter(Boolean)
        ),
      ];

      if (
        uniqueItemIds.length === 0
      ) {
        setReviewItemTranslations(
          {}
        );

        return;
      }

      try {
        const results =
          await Promise.allSettled(
            uniqueItemIds.map(
              async (itemId) => {
                const response =
                  await axios.get(
                    `${BASE_URL}/translate/product/translate/${encodeURIComponent(
                      itemId
                    )}/${encodeURIComponent(
                      lang
                    )}`
                  );

               return {
  itemId,
  translation:
    response.data
      ?.translation ||
    null,
};
              }
            )
          );

        if (cancelled) {
          return;
        }

        const translations = {};

        results.forEach(
          (result) => {
            if (
              result.status !==
              "fulfilled"
            ) {
              return;
            }

            const {
              itemId,
              translation,
            } = result.value;

            translations[itemId] =
              translation;
          }
        );

        setReviewItemTranslations(
          translations
        );
      } catch (error) {
        console.error(
          "Error translating review liked items:",
          error
        );

        if (!cancelled) {
          setReviewItemTranslations(
            {}
          );
        }
      }
    };

  translateLikedItems();

  return () => {
    cancelled = true;
  };
}, [
  reviewLikedItems,
  i18n.resolvedLanguage,
  i18n.language,
]);

useEffect(() => {
  let cancelled = false;

  const translateCurrentProduct =
    async () => {
      const rawLanguage =
        i18n.resolvedLanguage ||
        i18n.language ||
        "en";

      const shortLanguage =
        rawLanguage
          .split("-")[0]
          .toLowerCase();

      const lang = [
        "en",
        "fr",
        "br",
      ].includes(shortLanguage)
        ? shortLanguage
        : "en";

      /*
       * English uses the original
       * product name.
       */
      if (lang === "en") {
        setCurrentProductTranslation(
          null
        );
        return;
      }

      if (!productId) {
        setCurrentProductTranslation(
          null
        );
        return;
      }

      try {
        const response =
          await axios.get(
            `${BASE_URL}/translate/product/translate/${encodeURIComponent(
              productId
            )}/${encodeURIComponent(
              lang
            )}`
          );

        if (cancelled) {
          return;
        }

        setCurrentProductTranslation(
          response.data
            ?.translation ||
            null
        );
      } catch (error) {
        console.error(
          "Error translating current product:",
          error
        );

        if (!cancelled) {
          setCurrentProductTranslation(
            null
          );
        }
      }
    };

  translateCurrentProduct();

  return () => {
    cancelled = true;
  };
}, [
  productId,
  i18n.language,
  i18n.resolvedLanguage,
]);

const getLikedImage = (
  item
) => {
  const firstImage =
    item?.item?.images?.[0];

  if (
    typeof firstImage ===
    "string"
  ) {
    return firstImage;
  }

  if (
    firstImage &&
    typeof firstImage ===
      "object"
  ) {
    return (
      firstImage.url ||
      item?.image ||
      "/fallback.png"
    );
  }

  return (
    item?.image ||
    "/fallback.png"
  );
};

const getLikedName = (
  item
) => {
  const itemId =
    String(
      item?.itemId ||
      ""
    );

  const translation =
    reviewItemTranslations[
      itemId
    ];

  const translatedName =
    translation?.name ||
    translation?.itemName;

  const originalName =
    item?.item?.name ||
    item?.details?.itemName ||
    item?.name ||
    t("product");

  return (
    translatedName ||
    originalName
  );
};

const currentProductName =
  currentProductTranslation
    ?.name ||
  currentProductTranslation
    ?.itemName ||
  product?.name ||
  t("product");


    return (
        <div  className="review-page"
  style={{
    width: shouldOffsetForBasket
      ? "calc(100% - 120px)"
      : "100%",
    marginRight: shouldOffsetForBasket
      ? "120px"
      : "0px",
    boxSizing: "border-box",
    transition:
      "width 0.25s ease, margin-right 0.25s ease",
  }}>
          <ProductSchema productId={productId} />

            {(!(isDesktop || isTablet)) && (
               
            <div className="productIDSmall" onClick={() => goToProduct(productId)} style={{border: "2px solid #222", borderRadius: "5px", marginTop: "20px", alignItems: "center", display: "flex", justifyContent: "center", maxWidth: "100%", marginRight: "20px", cursor: "pointer"}}>
                <img style={{maxWidth: "100px"}} src={product?.images[0]} alt={currentProductName}/>
                <div style={{color: "#222",  textOverflow: "ellipsis" , maxWidth: "100%"}}>{currentProductName}</div>
            </div>
               
                )}
          <div style={{display: "flex", alignItems: "center", justifyContent: "start", overflowX: "auto", width: "100%"}}>
        
                </div>
            <div style={{display:(isDesktop || isTablet) ? "flex": "", justifyContent: "space-between", width: "95%", padding: "20px", alignItems: "center"}}>
                <div>
                 
                <div style={{ color: "black", marginLeft: "10px", fontWeight: "bold", marginBottom: "10px" }}>
                    {t("rating")}: {finalRating} {renderStars(finalRating)}
      </div>
                <div style={{color: "black", marginBottom: "20px", border: "2px solid #222", width: "100px", display: "flex", justifyContent: "center",  padding: "5px 10px",marginLeft: "10px"}}>{t("filter_reviews")}:</div>
                
                <div style={{ display: "flex", alignItems: "center", overflowX: "auto" }}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating}>
                  {/* Rating Percentage */}
                  <div style={{marginLeft: "10px"}}>
                  <div style={{padding: "5px", color: "black" }}>
                  <div style={{ marginRight: "5px" }}>{rating}{" "}
                  {rating === 1
                    ? t("stars_label_singular")
                    : t("stars_label")}:</div>
                </div>
                <div style={{ width: "100%", height: "20px", backgroundColor: "#ddd" }}>
                  <div
                    style={{
                      width: `${ratingPercentages[rating - 1]}%`,
                      height: "100%",
                      backgroundColor: "orange",
                      transition: "width 1s ease-in-out",
                     
                    }}
                  />
                </div>
                <div style={{ marginLeft: "5px" }}>
                  {ratingPercentages[rating - 1]}%
                </div>
                </div>
            <button
              key={rating}
              onClick={() => handleRatingFilter(rating)}
              style={{
                marginLeft: "10px",
                backgroundColor: selectedRating === rating ? "#ddd" : "transparent",
                border: "1px solid #ccc",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
             {rating}{" "}
            {rating === 1
              ? t("stars_label_singular")
              : t("stars_label")}
            ⭐
            </button>
            </div>
          ))}
        </div>

         {
  reviewLikedItems.length > 0 && (
    <div className="review-liked-section">
      <div className="review-liked-header">
        <span className="review-liked-title">
          {t("review_items_you_liked")}
        </span>

        <button
          type="button"
          className="review-liked-view-all"
          onClick={goToLike}
        >
        {t("view_all")}
          <span aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <div className="review-liked-scroll">
        {reviewLikedItems
          .slice(0, 6)
          .map((item) => {
            const image =
              getLikedImage(
                item
              );

            const name =
              getLikedName(
                item
              );

            return (
              <button
                type="button"
                key={
                  item.id ||
                  item.itemId
                }
                className="review-liked-card"
               onClick={() =>
                goToProduct(item.id)
              }
              >
                <div className="review-liked-image-wrapper">
                  <img
                    src={image}
                    alt={name}
                    className="review-liked-image"
                    loading="lazy"
                    onError={(
                      event
                    ) => {
                      event.currentTarget.onerror =
                        null;

                      event.currentTarget.src =
                        "/fallback.png";
                    }}
                  />
                </div>

                <span className="review-liked-name">
                  {name}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  )}
                </div>
                {(isDesktop || isTablet) && (
               
            <div className="productID" onClick={() => goToProduct(product?.id)} style={{border: "2px solid #222", borderRadius: "5px", marginTop: "20px", alignItems: "center", display: "flex", justifyContent: "center", maxWidth: "30%", marginRight: "20px", cursor: "pointer"}}>
                <img style={{maxWidth: "100px"}} src={product?.images[0]} alt={currentProductName}/>
                <div style={{color: "#222"}}>{currentProductName}</div>
            </div>
               
                )}
            </div>
       <div
  style={{
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  }}
>

         <div
  className="review-results-wrapper"
  style={{
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    paddingLeft: "10px",
    paddingRight:
      shouldOffsetForBasket
        ? "20px"
        : "10px",
    boxSizing: "border-box",
    overflow: "hidden",
  }}
>
  <FetchReviews
    productId={productId}
    selectedRating={selectedRating}
    onRatingClick={setSelectedRating}
  />
</div>
           
        </div>
        </div>
    )
}


export default ReviewPage
