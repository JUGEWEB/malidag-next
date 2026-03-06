"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RecommendedItem from "./personalRecommend";
import { useTranslation } from "react-i18next";

function KidToy({ mtypes = {}, types = {}, cryptoPrices = {} }) {
  const router = useRouter();
  const { t } = useTranslation();

  const renderStars = (rating) => {
    const stars = Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={`star ${index < rating ? "filled" : "empty"}`}>
        ★
      </span>
    ));
    return <div className="stars-container">{stars}</div>;
  };

  const convertToCrypto = (usdPrice, cryptocurrency) => {
    if (!cryptoPrices[cryptocurrency]) return null;
    return (usdPrice / cryptoPrices[cryptocurrency]).toFixed(2);
  };

  const getCryptoIcon = (cryptocurrency) => {
    const cryptoIcons = {
      USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
      ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
      BNB: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
      SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
      BUSD: "https://cryptologos.cc/logos/binance-usd-busd-logo.png",
      USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    };
    return cryptoIcons[cryptocurrency] || "/crypto-icons/default.png";
  };

  const handleItemClick = (id) => {
    if (id) router.push(`/product/${id}`);
  };

  if (!mtypes || Object.keys(mtypes).length === 0) {
    return <div>{t("no_toy_types_found")}</div>;
  }

  return (
    <div className="personal-care-container">
      <h2 className="personal-care-title">{t("toy_for_kids")}</h2>

      {/* ✅ Show toy categories */}
      <div className="beauty-category">
        {Object.values(mtypes).map((typeObj, index) => (
          <div key={index} className="type-section">
            <div className="type-image-id">
              <img
                src={typeObj.image}
                alt={typeObj.type}
                className="type-image-imgid"
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
              {typeObj.type}
            </h3>
          </div>
        ))}
      </div>

      {/* ✅ Ensure items is always an array */}
      {Object.entries(types).map(([type, items = []]) => (
        <div className="type-secti" key={type}>
          <h3 className="type-tit" style={{ display: "flex" }}>
            {type} {t("top_topic")}
            <div
              style={{
                marginLeft: "10px",
                fontSize: "14px",
                fontWeight: "bold",
                color: "green",
                marginTop: "10px",
                cursor: "pointer",
              }}
            >
              {t("see_more")}
            </div>
          </h3>

          <div className="items-contain">
            {Array.isArray(items) && items.length > 0 ? (
              items.map(({ id, item }) => (
                <div className="c" key={id}>
                  <div className="ca">
                    <div className="item-ca">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        onClick={() => handleItemClick(id)}
                        className="item-ima"
                      />
                    </div>

                    <div onClick={() => handleItemClick(id)} className="item-">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div className="item-pri">${item.usdPrice}</div>
                        <div className="item-crypto-pri">
                          {convertToCrypto(item.usdPrice, item.cryptocurrency)
                            ? `${convertToCrypto(item.usdPrice, item.cryptocurrency)} ${item.cryptocurrency}`
                            : t("loading")}
                          <img
                            src={getCryptoIcon(item.cryptocurrency)}
                            alt={item.cryptocurrency}
                            className="crypto-icon"
                          />
                        </div>
                      </div>
                      {item.name.length > 150
                        ? `${item.name.substring(0, 150)}...`
                        : item.name}
                      <div className="item-rating">
                        {renderStars(item.rating || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div>{t("no_items_found")}</div>
            )}
          </div>
        </div>
      ))}

      <RecommendedItem />
    </div>
  );
}

export default KidToy;
