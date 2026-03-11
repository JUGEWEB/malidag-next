'use client';

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import "./personalCare.css";
import RecommendedItem from "./personalRecommend";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

const BASE_URLs = "https://api.malidag.com";
const BASE_URL = "https://api.malidag.com";
const CRYPTO_URL = "https://api.malidag.com/crypto-prices";

const CACHE_KEYS = {
  BEAUTY_TYPES: "beauty_types_cache",
  BEAUTY_ITEMS: "beauty_items_cache",
};

const CACHE_TTL = 1000 * 60 * 30;

function PersonalCare({ lang }) {
  const router = useRouter();
  const [types, setTypes] = useState({});
  const [mtypes, setMTypes] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);

  const { isDesktop, isTablet } = useScreenSize();
  const { t } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  const hasCachedContent = useMemo(() => {
    return mtypes.length > 0 || Object.keys(types).length > 0;
  }, [mtypes, types]);

  const getCache = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;

      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  };

  const setCache = (key, data) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error(`Error writing cache for ${key}:`, error);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

      if (response.data.success) {
        const reviewsArray = response.data.reviews || [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: { averageRating, reviewsArray },
        }));
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setReviews((prev) => ({
          ...prev,
          [productId]: { averageRating: null, reviewsArray: [] },
        }));
      } else {
        console.error("Error fetching reviews:", error);
      }
    }
  };

  useEffect(() => {
    const cachedTypes = getCache(CACHE_KEYS.BEAUTY_TYPES);
    const cachedItems = getCache(CACHE_KEYS.BEAUTY_ITEMS);

    if (cachedTypes) {
      setMTypes(cachedTypes);
    }

    if (cachedItems) {
      setTypes(cachedItems);
    }

    if (cachedTypes || cachedItems) {
      setLoading(false);

      const cachedProductIds = Object.values(cachedItems || {})
        .flat()
       .map((product) => product?.itemId)
        .filter(Boolean);

      Promise.all(cachedProductIds.map((id) => fetchReviews(id))).catch((error) =>
        console.error("Error fetching cached reviews:", error)
      );
    }
  }, []);

  useEffect(() => {
    const fetchCategoryTypes = async () => {
      try {
        const response = await axios.get(`${BASE_URLs}/categories/Beauty`);
        const data = Array.isArray(response.data) ? response.data : [];

        setMTypes(data);
        setCache(CACHE_KEYS.BEAUTY_TYPES, data);
      } catch (error) {
        console.error("Error fetching Beauty category items:", error);
        setMTypes([]);
      }
    };

    const fetchBeautyItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = Array.isArray(response.data) ? response.data : [];

        const filteredData = data.filter(
          (item) =>
            item?.category?.toLowerCase() === "beauty" &&
            Number(item?.item?.sold ?? 0) >= 100
        );

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item?.item?.type || "Other";

          if (!acc[type]) {
            acc[type] = [];
          }

          if (acc[type].length < 10) {
            acc[type].push(item);
          }

          return acc;
        }, {});

        setTypes(groupedData);
        setCache(CACHE_KEYS.BEAUTY_ITEMS, groupedData);

        const productIds = Object.values(groupedData)
          .flat()
         .map((product) => product?.itemId)
          .filter(Boolean);

        await Promise.all(productIds.map((id) => fetchReviews(id)));
      } catch (error) {
        console.error("Error fetching items:", error);
        setTypes({});
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryTypes();
    fetchBeautyItems();
  }, []);

  const renderStars = (rating) => {
    const roundedRating = Math.round(Number(rating) || 0);

    const stars = Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`star ${index < roundedRating ? "filled" : "empty"}`}
      >
        ★
      </span>
    ));

    return <div className="stars-container">{stars}</div>;
  };

  const getCryptoIcon = (cryptocurrency) => {
    const cryptoIcons = {
      USDT: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
      USDC: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
      BUSD: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
    };

    return cryptoIcons[cryptocurrency] || "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png";
  };

  const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  const handleCategoryClick = (category) => {
    if (category) {
      const formattedCategory = category.toLowerCase();
      router.push(`/itemOfItems/${formattedCategory}`);
    }
  };

  if (loading && !hasCachedContent) {
    return (
      <div className="personal-care-container">
        <div style={{ padding: "20px" }}>
          <div
            style={{
              width: "220px",
              height: "34px",
              borderRadius: "12px",
              margin: "0 auto 24px auto",
              background:
                "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
              backgroundSize: "400% 100%",
              animation: "shine 1.4s ease infinite",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "16px",
              overflowX: "auto",
              padding: "10px 0 20px 0",
            }}
          >
            {[...Array(4)].map((_, index) => (
              <div key={index} style={{ minWidth: "100px", textAlign: "center" }}>
                <div
                  style={{
                    width: isDesktop || isTablet ? "140px" : "90px",
                    height: isDesktop || isTablet ? "140px" : "90px",
                    borderRadius: "50%",
                    margin: "0 auto 10px auto",
                    background:
                      "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                    backgroundSize: "400% 100%",
                    animation: "shine 1.4s ease infinite",
                  }}
                />
                <div
                  style={{
                    width: "70px",
                    height: "12px",
                    borderRadius: "8px",
                    margin: "0 auto",
                    background:
                      "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                    backgroundSize: "400% 100%",
                    animation: "shine 1.4s ease infinite",
                  }}
                />
              </div>
            ))}
          </div>

          {[...Array(2)].map((_, sectionIndex) => (
            <div key={sectionIndex} style={{ marginBottom: "28px" }}>
              <div
                style={{
                  width: "180px",
                  height: "22px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  background:
                    "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                  backgroundSize: "400% 100%",
                  animation: "shine 1.4s ease infinite",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  gridTemplateColumns:
                    isDesktop || isTablet ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
                }}
              >
                {[...Array(6)].map((_, cardIndex) => (
                  <div
                    key={cardIndex}
                    style={{
                      borderRadius: "16px",
                      overflow: "hidden",
                      background: "#fff",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "200px",
                        background:
                          "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                        backgroundSize: "400% 100%",
                        animation: "shine 1.4s ease infinite",
                      }}
                    />
                    <div style={{ padding: "12px" }}>
                      <div
                        style={{
                          width: "80px",
                          height: "16px",
                          borderRadius: "8px",
                          marginBottom: "10px",
                          background:
                            "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                          backgroundSize: "400% 100%",
                          animation: "shine 1.4s ease infinite",
                        }}
                      />
                      <div
                        style={{
                          width: "100%",
                          height: "18px",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          background:
                            "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                          backgroundSize: "400% 100%",
                          animation: "shine 1.4s ease infinite",
                        }}
                      />
                      <div
                        style={{
                          width: "75%",
                          height: "18px",
                          borderRadius: "8px",
                          background:
                            "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                          backgroundSize: "400% 100%",
                          animation: "shine 1.4s ease infinite",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <style jsx>{`
            @keyframes shine {
              0% {
                background-position: 100% 0;
              }
              100% {
                background-position: -100% 0;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-care-container">
      <h2 className="personal-care-title">Malidag Beauty</h2>

      <div
        style={{
          width: "100%",
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div className="beauty-category">
          {mtypes.length === 0 ? (
            <div>No types found for Beauty category</div>
          ) : (
            mtypes.map((typeObj, index) => (
              <div key={typeObj._id || index} style={{ margin: "10px" }}>
                <div
                  className="type-image-i"
                  style={{
                    width: isDesktop || isTablet ? "200px" : "100px",
                    height: isDesktop || isTablet ? "200px" : "100px",
                    borderRadius: isDesktop || isTablet ? "200px" : "100px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={typeObj?.image}
                    alt={typeObj?.type}
                    onClick={() => handleCategoryClick(typeObj?.type)}
                    style={{
                      width: "100%",
                      height: isDesktop || isTablet ? "200px" : "100px",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                  />
                </div>
                <h3
                  className="type-title"
                  style={{
                    color: "green",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {typeObj?.type}
                </h3>
              </div>
            ))
          )}
        </div>
      </div>

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
        <div key={type} style={{ margin: "10px" }}>
          <h3 style={{ marginBottom: "10px", fontWeight: "bold" }}>
            {type} Top Items
          </h3>

          <div
            style={{
              display: "grid",
              gap: "5px",
              padding: "0px 0",
              gridTemplateColumns:
                isDesktop || isTablet ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
            }}
          >
           {items.slice(0, 5).map(({ id, item, itemId }, index) => {
            const ratingObj = reviews[itemId];
              const averageRating = ratingObj?.averageRating;

              return (
                <div
                  key={id || index}
                  style={{ background: "#fff", overflow: "hidden" }}
                >
                  <div
                    style={{
                      filter: "brightness(0.880000000) contrast(1.2)",
                      backgroundColor: "white",
                    }}
                  >
                    <img
                      src={item?.images?.[0] || "/placeholder.png"}
                      alt={item?.name || "Product"}
                      onClick={() => handleItemClick(id)}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "contain",
                        cursor: "pointer",
                      }}
                    />
                  </div>

                  <div
                    onClick={() => handleItemClick(id)}
                    style={{
                      padding: "10px",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#333",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "5px",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>
                        ${item?.usdPrice || "0"}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {item?.cryptocurrency || "USDT"}

                        <img
                          src={getCryptoIcon(item?.cryptocurrency)}
                          alt={item?.cryptocurrency || "crypto"}
                          className="crypto-icon"
                          style={{ width: "16px", height: "16px" }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        marginBottom: "5px",
                        fontSize: "28px",
                        fontWeight: "bold",
                      }}
                    >
                      {item?.name
                        ? item.name.length > 150
                          ? `${item.name.substring(0, 150)}...`
                          : item.name
                        : "Unnamed product"}
                    </div>

                    <div className="item-rating">
                      {averageRating ? renderStars(averageRating) : renderStars(0)}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      {averageRating
                        ? `${averageRating}/5`
                        : "No reviews yet"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <RecommendedItem />
    </div>
  );
}

export default PersonalCare;