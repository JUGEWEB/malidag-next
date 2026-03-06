"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./woFashion.css";
import { useRouter } from "next/navigation";
import RecommendedItem from "./recomendeItem";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const BASE_URLs = "https://api.malidag.com";
const BASE_URL = "https://api.malidag.com";
const CRYPTO_URL = "https://api.malidag.com/crypto-prices";

function FashionKick({ initialMTypes = [], initialTypes = {} }) {
  const [types, setTypes] =useState(initialTypes);
  const [mtypes, setMTypes] = useState(initialMTypes);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
 const router = useRouter();
  const [translations, setTranslations] = useState({});
  const { t } = useTranslation();

  const typeTranslationKeys = {
  "Men sneakers": "men_sneakers",
  "Girls boots": "girls_boots",
  "Women boots": "women_boots",
  "Women sneakers": "women_sneakers",
  "Men boots": "men_boots"
};



  useEffect(() => {
    const fetchBeautyItems = async () => {
      try {
        const response = await axios.get(`${BASE_URLs}/categories/FashionKick`);
        const data = response.data;
        setMTypes(data);
      } catch (error) {
        console.error("Error fetching FashionKick categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBeautyItems();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const data = response.data.items;

        const filteredData = data.filter(
          (item) => item.category === "Shoes" && item.item.sold >= 100
        );

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item.item.type || "Other";
          const genre = item.item.genre || "General";

          if (!acc[type]) acc[type] = {};
          if (!acc[type][genre]) acc[type][genre] = { genre, items: [] };

          acc[type][genre].items.push({
  id: item.id,
  itemId: item.itemId, // ✅ include itemId
  item: item.item
});

          return acc;
        }, {});

        setTypes(groupedData);
        const lang = i18n.language || "en";
filteredData.forEach(product => {
  fetchTranslation(product.itemId, lang);
});

      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();

    const fetchCryptoPrices = async () => {
      try {
        const response = await axios.get(CRYPTO_URL);
        setCryptoPrices(response.data);
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
      }
    };

    fetchCryptoPrices();
    const intervalId = setInterval(fetchCryptoPrices, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchTranslation = async (productId, lang) => {
  // Avoid re-fetching if already present
  if (translations[productId]?.[lang]) return;

  try {
    const response = await axios.get(
      `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
    );

    setTranslations((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [lang]: response.data.translation,
      },
    }));
  } catch (error) {
    console.error(`Translation fetch error for ${productId}:`, error.message);
  }
};

useEffect(() => {
  if (!Object.keys(types).length) return;
  const lang = i18n.language || "en";
  Object.values(types).flatMap(genreMap => 
    Object.values(genreMap).flatMap(genreObj => 
      genreObj.items.map(({ id, item , itemId}) => 
        fetchTranslation(itemId, lang)
      )
    )
  );
}, [i18n.language, types]);

useEffect(() => {
  if (!Object.keys(types).length) return;
  const lang = i18n.language || "en";

  // Refetch translations on language change
  Object.values(types).flatMap(genreMap =>
    Object.values(genreMap).flatMap(genreObj =>
      genreObj.items.forEach(({ itemId }) => {
        fetchTranslation(itemId, lang);
      })
    )
  );
}, [i18n.language]);


const getTranslatedName = (item, itemId) => {
  const lang = i18n.language || "en";
  const productId = itemId;
  const translated = translations[productId]?.[lang]?.name;
  const fallback = item.name;
  const nameToShow = translated || fallback;
  return nameToShow.length > 60 ? `${nameToShow.substring(0, 60)}...` : nameToShow;
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

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  return (
    <div>

      <div className="beauty-fackik">
        {Object.values(mtypes).length === 0 ? (
          <div>{t("no_types_found_fashion")}</div>
        ) : (
          Object.values(mtypes).map((typeObj, index) => (
            <div key={index} className="type-section">
              <div className="type-image-id">
                <img
                  src={typeObj.image}
                  alt={typeObj.type}
                  className="type-image-imgid"
                  onClick={() => handleCategoryClick(typeObj.type)}
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
                  marginLeft: "20px"
                }}
              >
               {t(typeTranslationKeys[typeObj.type] || typeObj.type)}
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
    scrollbarWidth: "none"
  }}
>
  {Object.entries(types).flatMap(([type, genres]) =>
    Object.keys(genres).map((genre) => (
      <div
        key={`${type}-${genre}`}
        onClick={() =>
          router.push(
            `/shoesTopTopic/${encodeURIComponent(type)}/${encodeURIComponent(genre)}`
          )
        }
        style={{
          flex: "0 0 auto",
          width: "160px",
          height: "100px",
          backgroundImage: `url('https://api.malidag.com/images/1752763495656-steptodown.com390802.webp')`, // ✅ your image link
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
          textShadow: "0 2px 4px rgba(0,0,0,0.7)"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            borderRadius: "10px"
          }}
        />
        <span style={{ position: "relative", zIndex: 1 }}>
          {t("top")} {t(type) || type}
        </span>
      </div>
    ))
  )}
</div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
          padding: "10px 15px"
        }}
      >
        {Object.values(types)
          .flatMap((genreMap) => Object.values(genreMap))
          .flatMap((genreObj) => genreObj.items)
          .map(({ id, item, itemId }) => (
            <div
              key={id}
              onClick={() => handleItemClick(id)}
              style={{
                background: "#fff",
                padding: "10px",
                border: "1px solid #eee",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <img
                src={item?.images?.[0]}
                alt={item?.name}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "contain",
                  marginBottom: "8px"
                }}
              />
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "4px",
                  color: "#333"
                }}
              >
                ${item?.usdPrice}
              </div>

            <div style={{ fontSize: "12px", color: "#555", textAlign: "center" }}>
  {getTranslatedName(item, itemId)}
</div>


            </div>
          ))}
      </div>

     
       
  <RecommendedItem />
    
    </div>
  );
}

export default FashionKick;
