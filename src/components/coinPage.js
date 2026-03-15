'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import useScreenSize from "./useIsMobile";
import Head from "next/head";
import "./coinPage.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

function CoinPage() {
  const params = useParams();
  const crypto = String(params?.symbol || "").toUpperCase();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [activeVideoId, setActiveVideoId] = useState(null);
  const router = useRouter();
  const [reviews, setReviews] = useState({});
  const { isMobile, isTablet, isVerySmall, isSmallMobile } = useScreenSize();
  const { t } = useTranslation();
  const [translations, setTranslations] = useState({});

  const isPhone = isVerySmall || isSmallMobile || isMobile;

  const coinImages = {
    USDC: "https://api.malidag.com/learn/videos/1769909942070-0xaf88d065e77c8cc2239327c5edb3a432268e5831.png",
    BUSD: "https://api.malidag.com/learn/videos/1773502639247-BUSD.png",
    USDT: "https://api.malidag.com/learn/videos/1764978237824-logo%20(1).png",
  };

  const fetchTranslation = async (productId, lang) => {
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
      console.error(`Error fetching translation for ${productId}`, error);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await axios.get(`https://api.malidag.com/get-reviews/${productId}`);

      if (response.data.success) {
        const reviewsArray = response.data.reviews || [];
        const totalRating = reviewsArray.reduce((acc, review) => {
          const rating = parseFloat(review.rating);
          return acc + (isNaN(rating) ? 4 : rating);
        }, 0);

        const averageRating = reviewsArray.length
          ? (totalRating / reviewsArray.length).toFixed(2)
          : null;

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
    const fetchItemsByCrypto = async () => {
      try {
        const response = await axios.get(`https://api.malidag.com/items/crypto/${crypto}`);
        const fetchedItems = response.data.items || [];
        setItems(fetchedItems);

        const lang = i18n.language || "en";

        fetchedItems.forEach((itemData) => {
          if (itemData?.itemId) fetchTranslation(itemData.itemId, lang);
        });

        const uniqueCategories = [...new Set(fetchedItems.map((item) => item.category))];
        setCategories(uniqueCategories);

        fetchedItems.forEach((itemData) => {
          if (itemData?.itemId) {
            fetchReviews(itemData.itemId);
          }
        });
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItemsByCrypto();
  }, [crypto]);

  const toggleDropdown = (category) => {
    const nextState = {};

    categories.forEach((cat) => {
      nextState[cat] = cat === category ? !dropdownOpen[category] : false;
    });

    setDropdownOpen((prev) => ({
      ...prev,
      mobileMenu: false,
      ...nextState,
    }));
  };

  const closeAllDropdowns = () => {
    const nextState = { mobileMenu: false };
    categories.forEach((cat) => {
      nextState[cat] = false;
    });

    setDropdownOpen((prev) => ({
      ...prev,
      ...nextState,
    }));
  };

  const handleMobileCategoryClick = (category) => {
    const nextState = { mobileMenu: false };

    categories.forEach((cat) => {
      nextState[cat] = cat === category ? !dropdownOpen[category] : false;
    });

    setDropdownOpen((prev) => ({
      ...prev,
      ...nextState,
    }));
  };

  const categorizedItems = categories.reduce((acc, category) => {
    acc[category] = items.filter((item) => item.category === category);
    return acc;
  }, {});

  const getHotItems = (categoryItems) => {
    return [...categoryItems]
      .sort((a, b) => (b.item?.sold || 0) - (a.item?.sold || 0))
      .slice(0, 8);
  };

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    const translated = translations[itemId]?.[lang]?.name;
    const fallback = item.name;
    const nameToShow = translated || fallback;

    return nameToShow.length > 20 ? nameToShow.slice(0, 20) + "..." : nameToShow;
  };

  const getHotTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    const translated = translations[itemId]?.[lang]?.name;
    const fallback = item.name;
    const nameToShow = translated || fallback;

    return nameToShow.length > 60 ? nameToShow.slice(0, 60) + "..." : nameToShow;
  };

  const handleVideoPlay = (id) => {
    setActiveVideoId(id);
  };

  const handleVideoStop = () => {
    setActiveVideoId(null);
  };

  const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  if (loading) {
    return (
      <div
        className="loading-message"
        style={{
          width: "100%",
          height: "500px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.2rem",
          color: "#555",
          backgroundColor: "white",
        }}
      ></div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div
        className="no-results-message"
        style={{
          width: "100%",
          height: "500px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.1rem",
          fontWeight: "500",
          color: "#777",
          backgroundColor: "#fff3f3",
          border: "1px solid #ffdddd",
          borderRadius: "8px",
        }}
      >
        {t("no_results_found", { crypto })}
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Buy with ${crypto.toUpperCase()} - Malidag`,
    url: `https://www.malidag.com/coin/${crypto}`,
    description: `Browse items and shop with ${crypto.toUpperCase()} on Malidag.`,
    publisher: {
      "@type": "Organization",
      name: "Malidag",
      url: "https://www.malidag.com",
    },
  };

  return (
    <>
      <Head>
        <title>Buy with {crypto.toUpperCase()} on Malidag</title>
        <meta
          name="description"
          content={`Shop products and pay with ${crypto.toUpperCase()} on Malidag.`}
        />
        <link rel="canonical" href={`https://www.malidag.com/coin/${crypto}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div style={{ position: "relative", width: "100%" }}>
        <div
          className="coin-top-header"
          style={{
            color: "#222",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
            padding: "10px",
            boxSizing: "border-box",
            gap: "10px",
            backgroundColor: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <img
              src={coinImages[crypto] || coinImages.BUSD}
              alt={crypto}
              className="coin-header-image"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = coinImages.BUSD;
              }}
            />
            <span>{t("malidag_crypto", { crypto })}</span>
          </div>

          {isPhone ? (
            <div className="coin-mobile-menu-wrapper">
              <button
                className="coin-mobile-menu-button"
                onClick={() =>
                  setDropdownOpen((prev) => ({
                    ...prev,
                    mobileMenu: !prev.mobileMenu,
                  }))
                }
              >
                {t("related_categories")} ☰
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginLeft: "20px", flexShrink: 0 }}>
                {t("related_categories")}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginLeft: "10px",
                  marginRight: "10px",
                  justifyContent: "start",
                  flexWrap: "nowrap",
                  whiteSpace: "nowrap",
                  overflowX: "auto",
                }}
              >
                {categories.map((category, index) => (
                  <div
                    key={index}
                    onClick={() => toggleDropdown(category)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "start",
                      padding: "10px",
                      cursor: "pointer",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div>{t(category)}</div>
                    <span
                      className={`dropdown-arrow ${
                        dropdownOpen[category] ? "arrow-open" : "arrow-closed"
                      }`}
                    >
                      ▼
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {isPhone && dropdownOpen.mobileMenu && (
          <div className="coin-mobile-dropdown">
            {categories.map((category, index) => (
              <div
                key={index}
                className="coin-mobile-dropdown-item"
                onClick={() => handleMobileCategoryClick(category)}
              >
                {t(category)}
              </div>
            ))}
          </div>
        )}

        <div
          className="dropdown-seitction"
          style={{
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            position: "absolute",
            zIndex: 1000,
            backgroundColor: "white",
            width: "100%",
          }}
        >
          {categories.map((category) =>
            dropdownOpen[category] ? (
              <div
                key={category}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  padding: "12px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingBottom: "10px",
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    type="button"
                    onClick={closeAllDropdowns}
                    className="coin-dropdown-close-button"
                  >
                    ✕
                  </button>
                </div>

                <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isPhone ? "1fr" : "1fr 1.3fr",
                  gap: isPhone ? "14px" : "20px",
                  alignItems: "start",
                }}
              >
                 <div
  style={{
    minWidth: 0,
    maxHeight: isPhone ? "unset" : "360px",
    overflowY: isPhone ? "visible" : "auto",
    borderRight: isPhone ? "none" : "1px solid #eee",
    paddingRight: isPhone ? "0" : "16px",
  }}
>
  <div style={{ color: "#222", marginBottom: "12px" }}>
    <strong>malidag {t(category)}</strong>
  </div>

  <div
    className="types-list"
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: isPhone ? "8px" : "0",
    }}
  >
    {categorizedItems[category]
      ?.map((item) => item.item.type)
      .filter((type, idx, arr) => arr.indexOf(type) === idx)
      .map((type, idx) => (
        <div
          key={idx}
          className="stale-ty-item"
          style={{
            color: "blue",
            padding: isPhone ? "8px 12px" : "10px 0",
            textDecoration: isPhone ? "none" : "underline",
            border: isPhone ? "1px solid #dcdcdc" : "none",
            borderRadius: isPhone ? "999px" : "0",
            background: isPhone ? "#f8f8f8" : "transparent",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {t(type)}
        </div>
      ))}
  </div>
</div>

                  <div
                    style={{
                      minWidth: 0,
                      maxHeight: "360px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    <strong
                      style={{
                        color: "#222",
                        display: "block",
                        marginBottom: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("hot_label")}
                    </strong>

                      <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: isPhone
                              ? "repeat(3, minmax(0, 1fr))"
                              : "repeat(auto-fill, minmax(170px, 1fr))",
                            gap: isPhone ? "8px" : "12px",
                      }}
                    >
                      {getHotItems(categorizedItems[category] || []).map((hotItem, idx) => (
                        <div
                          key={idx}
                          className="stable-hot-item"
                          style={{
                            border: "1px solid #eee",
                            borderRadius: "10px",
                            padding: "10px",
                            background: "#fff",
                          }}
                        >
                          <img
                            src={hotItem.item.images[0]}
                            alt={hotItem.item.name}
                            onClick={() => handleItemClick(hotItem.id)}
                            className="stable-hot-item-image"
                            style={{
                              width: "100%",
                              height: "120px",
                              objectFit: "contain",
                              cursor: "pointer",
                              marginBottom: "8px",
                            }}
                          />
                          <div
                            onClick={() => handleItemClick(hotItem.id)}
                            className="stable-hot-item-name"
                            style={{
                              cursor: "pointer",
                              fontWeight: "600",
                              marginBottom: "6px",
                              lineHeight: "1.3",
                            }}
                          >
                            {getHotTranslatedName(hotItem.item, hotItem.itemId)}
                          </div>
                          <div className="stable-hot-item-sold">
                            {hotItem.item.sold} {t("sold")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            margin: "20px",
            border: "1px solid black",
            padding: "12px 16px",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "black",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            Want to trade {crypto}?{" "}
            <a
              href="https://binege.malidag.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "green",
                textDecoration: "underline",
              }}
            >
              binege.malidag.com
            </a>
          </div>

          <div
            style={{
              color: "black",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            {t("learn_more_crypto", { crypto, link: "binege" })}
          </div>
        </div>
      </div>

      <div className="item-coin-container">
        <div
          className="search-results-coin-container"
          style={{
            display: "grid",
            gap: "5px",
            padding: "5px",
            gridTemplateColumns: isPhone
              ? "repeat(2, minmax(0, 1fr))"
              : isTablet
              ? "repeat(3, minmax(0, 1fr))"
              : "repeat(5, minmax(0, 1fr))",
          }}
        >
          {items.map((itemData) => {
            const { id, itemId, item } = itemData;
            const { name, usdPrice, originalPrice, cryptocurrency, sold, videos } = item;

            const reviewsData = reviews[itemId] || {};
            const finalRating = reviewsData ? reviewsData.averageRating : t("no_rating");
            const normalizedVideos = Array.isArray(videos) ? videos : [videos];
            const firstVideoUrl = normalizedVideos.find(
              (video) => typeof video === "string" && video.endsWith(".mp4")
            );

            return (
              <div
                key={id}
                className="item-coin-card"
                style={{ width: "100%", maxWidth: "100%" }}
              >
                <div
                  style={{
                    background: "white",
                    zIndex: "1",
                    filter: "brightness(0.880000000) contrast(1.2)",
                    width: "100%",
                    height: isVerySmall ? "200px" : isPhone ? "220px" : "250px",
                    marginBottom: "10px",
                    marginTop: "10px",
                    position: "relative",
                  }}
                >
                  {activeVideoId === id && firstVideoUrl ? (
                    <video
                      src={firstVideoUrl}
                      controls
                      autoPlay
                      onEnded={handleVideoStop}
                      style={{
                        width: "100%",
                        height: isVerySmall ? "200px" : isPhone ? "220px" : "250px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <>
                      <img
                        src={item.images[0]}
                        onClick={() => handleItemClick(id)}
                        alt={name}
                        style={{
                          width: "100%",
                          height: isVerySmall ? "200px" : isPhone ? "220px" : "250px",
                          objectFit: "contain",
                        }}
                      />

                      {firstVideoUrl && (
                        <div
                          className="play-button"
                          onClick={() => handleVideoPlay(id)}
                          style={{
                            position: "absolute",
                            left: "20px",
                            bottom: "0px",
                            zIndex: "2",
                            transform: "translate(-50%, -50%)",
                            fontSize: "1.5rem",
                            color: "white",
                            textShadow: "0 0 5px rgba(0,0,0,0.5)",
                            cursor: "pointer",
                          }}
                        >
                          ▶️
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="item-details">
                  <div className="item-name" title={getTranslatedName(item, itemId)}>
                    {getTranslatedName(item, itemId)}
                  </div>

                  <div className="item-prices">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "start",
                        flexWrap: "wrap",
                        gap: "4px",
                      }}
                    >
                      <span className="item-price">${usdPrice}</span>

                      {originalPrice > 0 && (
                        <span
                          className="item-original-price"
                          style={{ color: "black" }}
                        >
                          ${originalPrice}
                        </span>
                      )}

                      <span
                        className="item-sold"
                        style={{
                          display: "flex",
                          marginLeft: "10px",
                          fontSize: "0.8rem",
                        }}
                      >
                        {sold}{" "}
                        <div
                          style={{
                            marginLeft: "5px",
                            fontWeight: "bold",
                            color: "red",
                          }}
                        >
                          {t("sold")}
                        </div>
                      </span>
                    </div>

                    <div
                      className="item-crypto"
                      style={{
                        display: "flex",
                        justifyContent: "start",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={coinImages[cryptocurrency] || coinImages.BUSD}
                        alt={cryptocurrency}
                        className="crypto-icon manual-coin-icon"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = coinImages.BUSD;
                        }}
                      />

                      <span className="item-crypto-price">{cryptocurrency}</span>
                    </div>
                  </div>

                  <div
                    className="item-stars"
                    onClick={() =>
                      router.push("/reviewPage", {
                        state: { itemData: itemData },
                      })
                    }
                    title={t("view_reviews")}
                  >
                    {finalRating
                      ? "★".repeat(Math.round(finalRating)) +
                        "☆".repeat(5 - Math.round(finalRating))
                      : t("no_rating")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default CoinPage;