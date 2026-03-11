'use client';

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./FashionKick.css";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import ShoeRecommended from "./shoeRecomended";

const BASE_URLs = "https://api.malidag.com";
const BASE_URL = "https://api.malidag.com";

const CACHE_KEYS = {
  FASHION_TYPES: "fashionkick_types_cache",
  FASHION_ITEMS: "fashionkick_items_cache",
};

const CACHE_TTL = 1000 * 60 * 30;

function FashionKick({ initialMTypes = [], initialTypes = {} }) {
  const [types, setTypes] = useState(initialTypes);
  const [mtypes, setMTypes] = useState(initialMTypes);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState({});
  const [reviews, setReviews] = useState({});
  const router = useRouter();
  const { t } = useTranslation();

  const typeTranslationKeys = {
    "Men sneakers": "men_sneakers",
    "Girls boots": "girls_boots",
    "Women boots": "women_boots",
    "Women sneakers": "women_sneakers",
    "Men boots": "men_boots",
  };

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

  const fetchTranslation = async (productId, lang) => {
    if (!productId) return;
    if (translations[productId]?.[lang]) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/translate/product/translate/${productId}/${lang}`
      );

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: response.data?.translation || {},
        },
      }));
    } catch (error) {
      console.error(`Translation fetch error for ${productId}:`, error.message);
    }
  };

  const fetchReviews = async (productId) => {
    if (!productId) return;

    try {
      const response = await axios.get(`${BASE_URL}/get-reviews/${productId}`);

      if (response.data?.success) {
        const reviewsArray = Array.isArray(response.data.reviews)
          ? response.data.reviews
          : [];

        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = Number(review?.rating);
          return acc + (Number.isNaN(rating) ? 0 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? totalRating / reviewsArray.length
          : null;

        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating,
            count: reviewsArray.length,
            reviewsArray,
          },
        }));
      } else {
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating: null,
            count: 0,
            reviewsArray: [],
          },
        }));
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        setReviews((prev) => ({
          ...prev,
          [productId]: {
            averageRating: null,
            count: 0,
            reviewsArray: [],
          },
        }));
      } else {
        console.error("Error fetching reviews:", error);
      }
    }
  };

  useEffect(() => {
    const cachedTypes = getCache(CACHE_KEYS.FASHION_TYPES);
    const cachedItems = getCache(CACHE_KEYS.FASHION_ITEMS);

    if (cachedTypes) {
      setMTypes(cachedTypes);
    }

    if (cachedItems) {
      setTypes(cachedItems);
    }

    if (cachedTypes || cachedItems) {
      setLoading(false);

      const cachedProductIds = Object.values(cachedItems || {})
        .flatMap((genreMap) => Object.values(genreMap))
        .flatMap((genreObj) => genreObj.items || [])
        .map((product) => product?.itemId)
        .filter(Boolean);

      Promise.all(
        cachedProductIds.map((itemId) =>
          Promise.all([
            fetchReviews(itemId),
            fetchTranslation(itemId, i18n.language || "en"),
          ])
        )
      ).catch((error) => {
        console.error("Error fetching cached reviews/translations:", error);
      });
    }
  }, []);

  useEffect(() => {
    const fetchFashionCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URLs}/categories/FashionKick`);
        const data = Array.isArray(response.data) ? response.data : [];
        setMTypes(data);
        setCache(CACHE_KEYS.FASHION_TYPES, data);
      } catch (error) {
        console.error("Error fetching FashionKick categories:", error);
        setMTypes([]);
      }
    };

    const fetchItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = Array.isArray(response.data) ? response.data : [];

        const filteredData = data.filter((item) => {
          const category = (item?.category || "").toLowerCase();
          const sold = Number(item?.item?.sold ?? 0);
          return category === "shoes" && sold >= 100;
        });

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item?.item?.type || "Other";
          const genre = item?.item?.genre || "General";

          if (!acc[type]) acc[type] = {};
          if (!acc[type][genre]) acc[type][genre] = { genre, items: [] };

          // cache/store only first 10 items per type+genre
          if (acc[type][genre].items.length < 10) {
            acc[type][genre].items.push({
              id: item?.id,
              itemId: item?.itemId,
              item: item?.item || {},
            });
          }

          return acc;
        }, {});

        setTypes(groupedData);
        setCache(CACHE_KEYS.FASHION_ITEMS, groupedData);

        const lang = i18n.language || "en";

        const productIds = Object.values(groupedData)
          .flatMap((genreMap) => Object.values(genreMap))
          .flatMap((genreObj) => genreObj.items || [])
          .map((product) => product?.itemId)
          .filter(Boolean);

        await Promise.all(
          productIds.map((itemId) =>
            Promise.all([fetchTranslation(itemId, lang), fetchReviews(itemId)])
          )
        );
      } catch (error) {
        console.error("Error fetching items:", error);
        setTypes({});
      } finally {
        setLoading(false);
      }
    };

    fetchFashionCategories();
    fetchItems();
  }, []);

  useEffect(() => {
    if (!Object.keys(types).length) return;

    const lang = i18n.language || "en";

    Object.values(types).forEach((genreMap) => {
      Object.values(genreMap).forEach((genreObj) => {
        genreObj.items.forEach(({ itemId }) => {
          fetchTranslation(itemId, lang);
        });
      });
    });
  }, [types, i18n.language]);

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    const translated = translations[itemId]?.[lang]?.name;
    const fallback = item?.name || "Unnamed product";
    const nameToShow = translated || fallback;

    return nameToShow.length > 60
      ? `${nameToShow.substring(0, 60)}...`
      : nameToShow;
  };

  const renderStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);

    return (
      <div
        style={{
          display: "flex",
          gap: "2px",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "4px",
        }}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            style={{
              color: index < rounded ? "#f5a623" : "#d9d9d9",
              fontSize: "14px",
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  const handleCategoryClick = (category) => {
    if (category) {
      const formattedCategory = category.toLowerCase().replace(/\s+/g, "-");
      router.push(`/itemOfShoes/${encodeURIComponent(formattedCategory)}`);
    }
  };

  const topicCards = useMemo(() => {
    return Object.entries(types).flatMap(([type, genres]) =>
      Object.keys(genres).map((genre) => ({
        type,
        genre,
        key: `${type}-${genre}`,
      }))
    );
  }, [types]);

  const allItems = useMemo(() => {
    return Object.values(types)
      .flatMap((genreMap) => Object.values(genreMap))
      .flatMap((genreObj) => genreObj.items);
  }, [types]);

  if (loading && !hasCachedContent) {
    return (
      <div style={{ padding: "20px" }}>
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
                  width: "100px",
                  height: "100px",
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

        <div
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            padding: "10px 0 20px 0",
          }}
        >
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              style={{
                minWidth: "160px",
                height: "100px",
                borderRadius: "10px",
                background:
                  "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                backgroundSize: "400% 100%",
                animation: "shine 1.4s ease infinite",
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px",
            padding: "10px 0",
          }}
        >
          {[...Array(8)].map((_, cardIndex) => (
            <div
              key={cardIndex}
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                background: "#fff",
                border: "1px solid #eee",
                padding: "10px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "180px",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                  backgroundSize: "400% 100%",
                  animation: "shine 1.4s ease infinite",
                  marginBottom: "10px",
                }}
              />
              <div
                style={{
                  width: "60px",
                  height: "16px",
                  borderRadius: "8px",
                  margin: "0 auto 10px auto",
                  background:
                    "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                  backgroundSize: "400% 100%",
                  animation: "shine 1.4s ease infinite",
                }}
              />
              <div
                style={{
                  width: "90%",
                  height: "14px",
                  borderRadius: "8px",
                  margin: "0 auto 8px auto",
                  background:
                    "linear-gradient(90deg, #f3f3f3 25%, #ececec 37%, #f3f3f3 63%)",
                  backgroundSize: "400% 100%",
                  animation: "shine 1.4s ease infinite",
                }}
              />
              <div
                style={{
                  width: "70%",
                  height: "14px",
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
    );
  }

  return (
    <div>
      <div className="beauty-fackik">
        {mtypes.length === 0 ? (
          <div>{t("no_types_found_fashion")}</div>
        ) : (
          mtypes.map((typeObj, index) => (
            <div key={typeObj?._id || index} className="type-section">
              <div className="type-image-id">
                <img
                  src={typeObj?.image}
                  alt={typeObj?.type}
                  className="type-image-imgid"
                  onClick={() => handleCategoryClick(typeObj?.type)}
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
                  marginLeft: "20px",
                }}
              >
                {t(typeTranslationKeys[typeObj?.type] || typeObj?.type)}
              </h3>
            </div>
          ))
        )}
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
        {topicCards.map(({ type, genre, key }) => (
          <div
            key={key}
            onClick={() =>
              router.push(
                `/shoesTopTopic/${encodeURIComponent(type)}/${encodeURIComponent(
                  genre
                )}`
              )
            }
            style={{
              flex: "0 0 auto",
              width: "160px",
              height: "100px",
              backgroundImage:
                "url('https://cdn.malidag.com/themes/1760454867065-11f21540-298a-4a46-92ae-170e536f8e91.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: "10px",
              position: "relative",
              cursor: "pointer",
              color: "#fff",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textShadow: "0 2px 4px rgba(0,0,0,0.7)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                borderRadius: "10px",
              }}
            />
            <span style={{ position: "relative", zIndex: 1 }}>
              {t("top")} {t(type) || type}
            </span>
          </div>
        ))}
      </div>

      <div className="fashionkick-products-grid">
        {allItems.map(({ id, item, itemId }) => {
          const reviewData = reviews[itemId];
          const averageRating = reviewData?.averageRating;
          const reviewCount = reviewData?.count || 0;

          return (
            <div
              key={id}
              onClick={() => handleItemClick(id)}
              style={{
                background: "#fff",
                padding: "2px",
                width: "100%",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div className="fashionkick-product-fil">
             <img
  src={item?.images?.[0] || "/placeholder.png"}
  alt={item?.name || "Product"}
  className="fashionkick-product-image"
/>
</div>

              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "4px",
                  color: "#333",
                }}
              >
                ${item?.usdPrice || "0"}
              </div>

              {renderStars(averageRating || 0)}

              <div
                style={{
                  fontSize: "11px",
                  color: "#777",
                  marginBottom: "6px",
                  textAlign: "center",
                }}
              >
                {averageRating
                  ? `${averageRating.toFixed(1)}/5 (${reviewCount})`
                  : "No reviews yet"}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#555",
                  textAlign: "center",
                }}
              >
                {getTranslatedName(item, itemId)}
              </div>
            </div>
          );
        })}
      </div>

      <ShoeRecommended />
    </div>
  );
}

export default FashionKick;