"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RecommendedItem from "./personalRecommend";
import { useTranslation } from "react-i18next";
import "./woFashion.css";

function KidFashion({ mtypes, types, cryptoPrices }) {
  const router = useRouter();
  const { t } = useTranslation();

  const renderStars = (rating) => (
    <div className="stars-container">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`star ${i < rating ? "filled" : "empty"}`}>
          ★
        </span>
      ))}
    </div>
  );

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
    if (id) {
      router.push(`/product/${id}`);
    }
  };

  return (
    <div className="personal-care-container">
      <h2 className="personal-care-title">{t("kid_fashion")}</h2>

      <div className="beauty-category">
        {Object.values(mtypes).length === 0 ? (
          <div>{t("no_kid_fashion_types")}</div>
        ) : (
          Object.values(mtypes).map((typeObj, idx) => (
            <div key={idx} className="type-section">
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
          ))
        )}
      </div>

      {Object.entries(types).map(([key, { type, genre, items }]) => (
        <div className="type-secti" key={type}>
          <h3 className="type-tit" style={{ display: "flex" }}>
            {genre} {type} {t("top_topic")}
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
            {items.map(({ id, item }) => {
              const cryptoPrice = convertToCrypto(item.usdPrice, item.cryptocurrency);
              return (
                <div className="c" key={id}>
                  <div className="ca">
                    <div className="item-ca">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="item-ima"
                        onClick={() => handleItemClick(id)}
                      />
                    </div>

                    <div onClick={() => handleItemClick(id)} className="item-">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div className="item-pri">${item.usdPrice}</div>
                        <div className="item-crypto-pri">
                          {cryptoPrice
                            ? `${cryptoPrice} ${item.cryptocurrency}`
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
                      <div className="item-rating">{renderStars(item.rating || 0)}</div>
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

export default KidFashion;
