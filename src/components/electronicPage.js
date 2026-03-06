'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "./checkoutStore";
import axios from "axios";
import "./itemPage.css";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

function ElectronicPage() {
  const [brandGroups, setBrandGroups] = useState([]);
  const [topItemsPerBrand, setTopItemsPerBrand] = useState({});
  const [bestSellersByBrand, setBestSellersByBrand] = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall } = useScreenSize();
   const [reviews, setReviews] = useState({}); // Store reviews data
   const router = useRouter();
  const [brandThemes, setBrandThemes] = useState([]);
  const { t } = useTranslation();
  const [translations, setTranslations] = useState({});
  const setItemData = useCheckoutStore((state) => state.setItemData);


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

                useEffect(() => {
  const fetchBrandThemes = async () => {
    try {
      const res = await fetch("https://api.malidag.com/api/brands/themes");
      const data = await res.json();
      setBrandThemes(data || []);
    } catch (err) {
      console.error("Failed to fetch brand themes", err);
    }
  };
  fetchBrandThemes();
}, []);

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


  // Fetch brands from clothing, shoes, and bags
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const categories = ["Electronic"];
        const brandSets = await Promise.all(
          categories.map((cat) =>
            axios
              .get(`https://api.malidag.com/api/categories/${cat}/brands`)
              .then((res) => res.data?.brands || [])
              .catch(() => [])
          )
        );

        // Merge all brands and remove duplicates by name
        const mergedBrands = Array.from(
          new Map(
            brandSets.flat().map((brand) => [brand.brand, brand])
          ).values()
        );

        setBrandGroups(mergedBrands);
      } catch (error) {
        console.error("Error fetching fashion brands:", error);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchTopItemsAndBestSellers = async () => {
      const itemsMap = {};
      const bestSellerMap = {};
      const allSymbols = new Set();

      await Promise.all(
        brandGroups.map(async (group) => {
          const brandName = group.brand;
          try {
            const topItemsRes = await axios.get(
              `https://api.malidag.com/api/brands/${encodeURIComponent(brandName)}/top-items`
            );
            const bestSellerRes = await axios.get(
              `https://api.malidag.com/api/brands/${encodeURIComponent(brandName)}/best-seller`
            );

            const topItems = topItemsRes.data || [];
            itemsMap[brandName] = topItems;

            const bestSellerId = bestSellerRes.data?.id;
            if (bestSellerId) {
              bestSellerMap[brandName] = bestSellerId;
            }

            topItems.forEach((item) => {
              if (item.cryptocurrency) {
                allSymbols.add(item.cryptocurrency);
              }
            });

             // Fetch reviews for each item
       topItems.forEach((item) => {
        fetchReviews(item.itemId); // Fetch reviews for each product
      });
          } catch (error) {
            console.warn(`Error fetching items for ${brandName}`, error);
          }
        })
      );

      setTopItemsPerBrand(itemsMap);
      setBestSellersByBrand(bestSellerMap);
      fetchCryptoPrices([...allSymbols]);
      setLoading(false);
    };

    if (brandGroups.length > 0) {
      fetchTopItemsAndBestSellers();
    }
  }, [brandGroups]);

  useEffect(() => {
  const lang = i18n.language || "en";
  Object.values(topItemsPerBrand).flatMap(items =>
    items.forEach(item => fetchTranslation(item.itemId, lang))
  );
}, [i18n.language, topItemsPerBrand]);


  const fetchCryptoPrices = async (symbols) => {
    try {
      const response = await axios.get("https://api.malidag.com/crypto-prices");
      const prices = symbols.reduce((acc, symbol) => {
        if (response.data[symbol]) {
          acc[symbol] = parseFloat(response.data[symbol]);
        }
        return acc;
      }, {});
      setCryptoPrices(prices);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
    }
  };

  const getTranslatedName = (item, itemId) => {
  const lang = i18n.language || "en";
  const translated = translations[itemId]?.[lang]?.name;
  const fallback = item.name;
  const nameToShow = translated || fallback;
  return nameToShow.length > 20 ? nameToShow.slice(0, 20) + "..." : nameToShow;
};


  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  if (loading) return <div className="loading-message">{t("loading")}</div>;

  return (
    <div style={{ width: "100%" }}>
     <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", margin: "20px" }}>
  {brandThemes
    .filter((b) =>
      Object.keys(topItemsPerBrand).some(
        (brandName) => brandName.trim().toLowerCase() === b.brandName.trim().toLowerCase()
      )
    )
    .map((brand) => (
      <img
        key={brand.brandName}
        src={brand.logo}
        alt={`${brand.brandName} logo`}
        style={{
          width: "150px",
          height: "80px",
          objectFit: "contain",
          cursor: "pointer",
        }}
       onClick={() => {
  setSelectedBrandName(brand.brandName);
  router.push(`/${brand.theme.toLowerCase()}`);
}}

      />
    ))}
</div>
      <div style={{maxWidth: "100%", maxWidth: "100%", overflow: "hidden"}}>
      {Object.entries(topItemsPerBrand).map(([brand, items]) => (
        <div style={{maxWidth: "100%", maxWidth: "100%", overflow: "hidden"}}>
        <div
          key={brand}
          style={{
            display: "grid",
            width: "100%",
            gap: "5px",
            padding: "5px",
            gridTemplateColumns:
              isVeryVerySmall
                ? "repeat(1, 1fr)"
                : isVerySmall
                ? "repeat(2, 1fr)"
                : isSmallMobile
                ? "repeat(2, 1fr)"
                : isMobile
                ? "repeat(3, 1fr)"
                : isTablet
                ? "repeat(3, 1fr)"
                : "repeat(4, 1fr)",
          }}
        >
        {items.map((rawItem) => {
  // Wrap it into a standard format
  const itemData = {
    id: rawItem.id,
    itemId: rawItem.itemId,
    item: {
      name: rawItem.name,
      images: rawItem.images,
      imagesVariants: rawItem.imagesVariants,
      usdPrice: rawItem.usdPrice,
      cryptocurrency: rawItem.cryptocurrency,
      sold: rawItem.sold,
      // Add any other properties you want here
    }
  };

  const { id, itemId, item } = itemData;
  const { name, images, usdPrice, cryptocurrency, sold } = item;

  const crypto = cryptocurrency || "";
  const cryptoPrice = cryptoPrices[crypto] || 0;
  const priceInCrypto = cryptoPrice > 0 ? (usdPrice / cryptoPrice).toFixed(6) : "N/A";
  const reviewsData = reviews[itemId] || {};
  const finalRating = reviewsData?.averageRating || null;
  const isBestSeller = id === bestSellersByBrand[brand];

  const handleReviewClick = () => {
  setItemData(itemData);
  router.push("/reviewPage");
};

  return (
    <div key={id} onClick={() => handleItemClick(id)} style={{ maxWidth: "100%", overflow: "hidden" }}>
      <div
        style={{
          background: "white",
          zIndex: "1",
          paddingTop: "20px",
          filter: "brightness(0.88) contrast(1.2)",
          width: "100%",
          height: isVerySmall ? "230px" : "300px",
          marginBottom: "10px",
          marginTop: "10px",
          position: "relative",
        }}
      >
        <img
          src={images[0]}
          alt={name}
          style={{
            width: "100%",
            height: isVerySmall ? "230px" : "300px",
            objectFit: "contain",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: isBestSeller ? "orange" : "black",
            color: "#fff",
            padding: "8px 8px",
            fontSize: "12px",
            fontWeight: "bold",
            borderRadius: "5px",
            zIndex: 2,
          }}
        >
          {isBestSeller ? t("best_seller") : t("topIt")}
        </div>
      </div>
      <div className="item-name">{getTranslatedName(item, itemId)}</div>
      <div className="item-price">${usdPrice}</div>
      <div className="item-crypto">
        <img
          src={`https://raw.githubusercontent.com/atomiclabs/cryptocurrency-icons/master/svg/color/${crypto.toLowerCase()}.svg`}
          alt={crypto}
          className="crypto-icon"
          onError={(e) => (e.target.src = "https://cryptologos.cc/logos/binance-usd-busd-logo.png")}
        />
        <span className="item-crypto-price">
          {priceInCrypto !== "N/A" ? `${priceInCrypto} ${crypto}` : t("price_unavailable")}
        </span>
      </div>
      <div className="item-sold">{sold} {t("sold")}</div>
      <div
        className="item-type-stars"
        onClick={handleReviewClick}
        title={t("view_reviews")}
      >
        {finalRating
          ? "★".repeat(Math.round(finalRating)) + "☆".repeat(5 - Math.round(finalRating))
          : t("no_rating")}
      </div>
    </div>
  );
})}


        </div>
        </div>
      ))}
      </div>
    </div>
  );
}

export default ElectronicPage;
