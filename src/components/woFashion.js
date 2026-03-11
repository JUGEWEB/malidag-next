"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./woFashion.css";
import RecommendedItem from "./personalRecommend";
import { useRouter } from "next/navigation";
import Slider from "react-slick";

const BASE_URLs = "https://api.malidag.com";
const BASE_URL = "https://api.malidag.com";
const CRYPTO_URL = "https://api.malidag.com/crypto-prices";

function WoFashion() {
  const router = useRouter();
  const [types, setTypes] = useState({});
  const [mtypes, setMTypes] = useState({});
  const [loadingMTypes, setLoadingMTypes] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    const fetchWomenTypes = async () => {
      try {
        const response = await axios.get(`${BASE_URLs}/categories/WomenFashion`);
        const data = response.data;
        setMTypes(data);
        setLoadingMTypes(false);
      } catch (error) {
        console.error("Error fetching WomenFashion category items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWomenTypes();
  }, []);

  useEffect(() => {
    const fetchWomenItems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/items`);
        const raw = response.data;
        const data = Array.isArray(raw) ? raw : raw?.items || [];

        const filteredData = data.filter(
          (item) =>
            (item?.item?.genre || "").toLowerCase().includes("women") &&
            (item?.category || "").toLowerCase() !== "beauty"
        );

        const groupedData = filteredData.reduce((acc, item) => {
          const type = item?.item?.type || "Other";
          if (!acc[type]) acc[type] = [];
          acc[type].push(item);
          return acc;
        }, {});

        setTypes(groupedData);
        setLoadingTypes(false);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWomenItems();

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

  const handleItemClick = (id) => {
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  const handleCategoryClick = (category) => {
    if (category) {
      let formattedCategory = category.toLowerCase().trim();

      if (formattedCategory.includes("shirt and")) {
        formattedCategory = "shirt";
      }

      router.push(`/item-of-women/${encodeURIComponent(formattedCategory)}`);
    }
  };

  const allItems = Object.values(types || {}).flat();

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <div className="women-fashion-page">
      <section className="women-fashion-header">
        <div className="women-fashion-header-content">
          <span className="women-fashion-badge">Women’s Fashion</span>
          <h1>Elegant Looks, Everyday Confidence</h1>
          <p>
            Discover fashion-forward styles, trending pieces, and beautiful essentials.
          </p>
        </div>
      </section>

      <section className="women-slider-section">
        <div className="section-header">
          <h2>Featured Categories</h2>
        </div>

        {loadingMTypes ? (
          <div className="section-spinner-wrapper">
            <div className="section-spinner"></div>
          </div>
        ) : Object.values(mtypes).length === 0 ? (
          <div className="empty-state">No types found for Women Fashion</div>
        ) : (
          <Slider {...sliderSettings}>
            {Object.values(mtypes).map((typeObj, index) => (
              <div key={index} className="slider-card-shell">
                <div className="slider-card">
                  <img
                    src={typeObj.image}
                    alt={typeObj.type}
                    className="slider-card-image"
                    onClick={() => handleCategoryClick(typeObj.type)}
                  />
                  <div className="slider-card-overlay">
                    <div className="slider-card-content">
                      <h3>{typeObj.type}</h3>
                      <button
                        className="slider-card-button"
                        onClick={() => handleCategoryClick(typeObj.type)}
                      >
                        View more
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        )}
      </section>

   <section className="women-topics-section">
  <div className="section-header">
    <h2>Top Topics</h2>
  </div>

  <div className="topics-center-hero">
    <img
      src="https://cdn.malidag.com/themes/1760454830463-0a9bff23-526a-40ba-a2b9-be41271c845f.webp"
      alt="Women fashion topics"
      className="topics-center-image"
    />

    <div className="topics-center-overlay"></div>

    <div className="topics-center-content">
      <span className="topics-center-badge">Women’s Fashion</span>
      <h3>Explore Top Styles</h3>
      <p>Scroll and choose your favorite fashion category</p>

      <div className="topics-center-scroll">
        {loadingTypes ? (
          <div className="section-spinner-wrapper">
            <div className="section-spinner"></div>
          </div>
        ) : (
          Object.keys(types).map((type, index) => (
            <button
              key={index}
              className="topics-center-item"
              onClick={() => router.push(`/women-toptopic/${type.toLowerCase()}`)}
            >
              Top {type}
            </button>
          ))
        )}
      </div>
    </div>
  </div>
</section>

      <section className="women-products-section">
        <div className="section-header">
          <h2>Trending Products</h2>
          <span>{allItems.length} items</span>
        </div>

        {loadingTypes ? (
          <div className="women-products-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-image" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </div>
            ))}
          </div>
        ) : (
          <div className="women-products-grid">
            {allItems.map(({ id, item }) => (
              <div
                key={id}
                className="women-product-card"
                onClick={() => handleItemClick(id)}
              >
                <div className="women-product-image-wrap">
                  <img
                    src={item?.images?.[0]}
                    alt={item?.name}
                    className="women-product-image"
                  />
                </div>

                <div className="women-product-info">
                  <div className="women-product-price-row">
                    <span className="women-product-price">${item?.usdPrice}</span>
                    {item?.originalPrice && (
                      <span className="women-product-old-price">
                        ${item.originalPrice}
                      </span>
                    )}
                  </div>

                  <div className="women-product-title">
                    {item?.name?.length > 50
                      ? `${item.name.substring(0, 50)}...`
                      : item?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="women-recommended-section">
        <RecommendedItem />
      </section>
    </div>
  );
}

export default WoFashion;