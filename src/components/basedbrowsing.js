'use client';


import React, { useState, useEffect } from "react";
import "./recomendedItem.css";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const BASE_URL = "https://api.malidag.com";

function Browsing({ user }) {
  const [userSearchHistory, setUserSearchHistory] = useState([]);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const stars = Math.floor(Math.random() * 5) + 1;
  const router = useRouter();
  const { t } = useTranslation();
  const [translations, setTranslations] = useState({});
  const [reviews, setReviews] = useState({});

  const fetchTranslation = async (productId, lang) => {
  if (translations[productId]?.[lang]) return;
  try {
    const response = await fetch(`https://api.malidag.com/translate/product/translate/${productId}/${lang}`);
    const data = await response.json();
    setTranslations(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [lang]: data.translation,
      }
    }));
  } catch (error) {
    console.error(`Error fetching translation for product ${productId}`, error);
  }
};

const fetchReviews = async (productId) => {
  try {
    const response = await fetch(`${BASE_URL}/get-reviews/${productId}`);
    const data = await response.json();
    if (data.success) {
      const reviewsArray = data.reviews || [];
      const totalRating = reviewsArray.reduce((acc, review) => acc + (parseFloat(review.rating) || 4), 0);
      const averageRating = reviewsArray.length ? (totalRating / reviewsArray.length).toFixed(2) : null;
      setReviews(prev => ({ ...prev, [productId]: { averageRating, reviewsArray } }));
    }
  } catch (error) {
    console.error(`Error fetching reviews for product ${productId}:`, error);
  }
};

  // Fetch user search history
  useEffect(() => {
    const fetchUserSearchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/search-items?userId=${user?.uid}`);
        const data = await response.json();
        setUserSearchHistory(data?.userSearches || []);
      } catch (error) {
        console.error("Error fetching user search history:", error);
      }
    };

    if (user?.uid) {
      fetchUserSearchHistory();
    }
  }, [user?.uid]);

  // Fetch suggested items and crypto prices after history is available
  useEffect(() => {
    const fetchSuggestedItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/items`);
        const data = await response.json();

        const terms = userSearchHistory.map(s => s.search.toLowerCase());

        const matchedItems = data.items.filter(item =>
          terms.some(term =>
            item.item.name?.toLowerCase().includes(term) ||
            item.item.type?.toLowerCase().includes(term) ||
            item.category?.toLowerCase().includes(term) ||
            item.item.theme?.toLowerCase().includes(term)
          )
        );

        setSuggestedItems(matchedItems);

        const symbols = [
          ...new Set(
            matchedItems
              .map((item) => item.item.cryptocurrency && `${item.item.cryptocurrency}`)
              .filter(Boolean)
          ),
        ];

        await fetchCryptoPrices(symbols);
      } catch (error) {
        console.error("Error fetching suggested items:", error);
      } finally {
        setLoading(false);
      }
    };


    const fetchCryptoPrices = async () => {
      try {
        const response = await fetch(`${BASE_URL}/crypto-prices`);
        const prices = await response.json();
        setCryptoPrices(prices);
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
      }
    };

    if (userSearchHistory.length > 0) {
      fetchSuggestedItems();
    } else {
      setLoading(false);
    }
  }, [userSearchHistory]);

   useEffect(() => {
  const lang = i18n.language || "en";
  suggestedItems.forEach(item => {
    if (item?.itemId) fetchTranslation(item.itemId, lang);
  });
}, [suggestedItems, i18n.language]);

useEffect(() => {
  suggestedItems.forEach(item => {
    if (item?.itemId) fetchReviews(item.itemId);
  });
}, [suggestedItems]);

const getStarRating = (itemId) => {
  const avgRating = reviews[itemId]?.averageRating;
  if (!avgRating) return t("no_rating");
  const rounded = Math.round(avgRating);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
};


  const getTranslatedName = (item, itemId) => {
  const lang = i18n.language || "en";
  return translations[itemId]?.[lang]?.name || item.name;
};


  const convertToCrypto = (usdPrice, crypto) => {
    if (!cryptoPrices[crypto]) return null;
    return (usdPrice / parseFloat(cryptoPrices[crypto])).toFixed(2);
  };

  const toggleDetails = (itemId) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  return (
    <div className="recommended-items-container">
      <h2 className="recommended-title">{t("based_on_browsing_history")}</h2>
      {loading ? (
        <div className="loading-indicator">{t("loading")}</div>
      ) : suggestedItems.length > 0 ? (
        <div className="recommended-grid">
          {suggestedItems.map((item) => (
            <div className="recommended-item" key={item.id}>
              <div className="rec-img">
                <img
                  src={item.item.images[0]}
                  alt={item.item.name}
                  onClick={() => handleItemClick(item.id)}
                  className="recommended-image"
                />
              </div>
              <div className="recommended-info">
                <p className="recommended-name" onClick={() => handleItemClick(item.id)}>
                 {getTranslatedName(item.item, item.itemId)}
                </p>
                <div className="item-sta">
                 {getStarRating(item.itemId)}
                </div>
                <div className="recommended-price">${item.item.usdPrice}</div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className="recommended-price">
                    {item.item.usdPrice && item.item.cryptocurrency
                      ? `${convertToCrypto(item.item.usdPrice, item.item.cryptocurrency)} ${item.item.cryptocurrency}`
                      : t("price_unavailable")}
                  </div>
                  <div
                    style={{
                      color: "#cf7704",
                      fontSize: "14px",
                      marginLeft: "10px",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleDetails(item.id)}
                  >
                   {t("view-price")}
                  </div>
                </div>
                {expandedItemId === item.id && (
                  <div className="recommended-pi">
                    {cryptoPrices[item.item.cryptocurrency]
                      ? `1 ${item.item.cryptocurrency} = $${cryptoPrices[item.item.cryptocurrency].toFixed(5)}`
                      : t("na")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-items">{t("no_browsing_recommendations")}</div>
      )}
    </div>
  );
}

export default Browsing;
