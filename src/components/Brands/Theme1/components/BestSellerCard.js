"use client";

import { getColorOptions } from "../utils/productDisplayHelpers";

export default function BestSellerCard({
  bestSeller,
  shouldShowLargeBestSeller,
  reviews,
  bestSellerVideo,
  setHideBestSellerVideo,
  router,
  withCountry,
  t,
  getDisplayImage,
  formatPrice,
  convertUsd,
  getTranslatedName,
  selectedColorByItem,
  translateColor,
  getColorSwatch,
  handleColorSelect,
  renderStars,
  handleAddToBasket,
  getBasketQuantity,
}) {
  if (!bestSeller || !shouldShowLargeBestSeller) return null;

   const bestSellerReview = reviews[bestSeller?.itemId] || {
        rating: bestSeller?.rating || 0,
        count: 0,
      };
  
      return (
        <div className="th1-best-seller-section">
          <div className="th1-best-video-card">
            <div
              className="th1-video-container"
              onClick={() => router.push(withCountry(
                  `/product/${bestSeller.id}`
                ))}
            >
              <video
               src={bestSellerVideo}
                autoPlay
                muted
                loop
                playsInline
                controls
                onError={() => setHideBestSellerVideo(true)}
              >
                 {t("video_not_supported")}
              </video>
            </div>
          </div>
  
          <div className="th1-best-image-card">
            <div
              className="th1-best-image-wrap"
              onClick={() => router.push(withCountry(
                  `/product/${bestSeller.id}`
                ))}
            >
              <div className="th1-image-badge th1-image-badge-best"> {t("best_seller")}</div>
  
              <img
                src={getDisplayImage(bestSeller)}
                alt={bestSeller.name}
                className="th1-best-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/fallback.png";
                }}
              />
            </div>
  
            <div className="th1-item-info">
              <div className="th1-item-price-row">
              <span className="th1-item-price">
                {formatPrice(bestSeller?.usdPrice)}
              </span>
  
              {Number(bestSeller?.originalPrice || 0) > 0 &&
                convertUsd(bestSeller.originalPrice) !== null && (
                  <span className="th1-item-original-price">
                    {formatPrice(bestSeller.originalPrice)}
                  </span>
                )}
            </div>
  
              <div className="th1-item-name">
                {getTranslatedName(bestSeller, bestSeller.itemId)}
              </div>
  
              {getColorOptions(bestSeller).length > 1 && (
                <div className="th1-color-block" onClick={(e) => e.stopPropagation()}>
                  <div className="th1-color-label">
                    {t("color")}:{" "}
                    <span>
                     {translateColor(
                      getColorOptions(bestSeller).includes(
                        selectedColorByItem[bestSeller.id]
                      )
                        ? selectedColorByItem[bestSeller.id]
                        : getColorOptions(bestSeller)[0]
                    )}
                    </span>
                  </div>
  
                  <div className="th1-color-options">
                    {getColorOptions(bestSeller).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`th1-color-circle ${
                         (
                          selectedColorByItem[bestSeller.id] ||
                          getColorOptions(bestSeller)[0]
                        ) === color ? "active" : ""
                        }`}
                        title={translateColor(color)}
                        aria-label={t("select_color", {
                          color: translateColor(color),
                        })}
                        style={{ background: getColorSwatch(color) }}
                        onClick={(e) => handleColorSelect(bestSeller.id, color, e)}
                      />
                    ))}
                  </div>
                </div>
              )}
  
             {bestSellerReview.count > 0 && (
              <div className="th1-item-rating">
                {renderStars(bestSellerReview.rating, bestSeller)}
                <span className="th1-review-count">
                  ({bestSellerReview.count})
                </span>
              </div>
            )}
  
           <button
    type="button"
    className="th1-add-basket-btn"
    onClick={(e) => handleAddToBasket(bestSeller, e)}
  >
    {t("add_to_cart")}
  </button>
  
          {getBasketQuantity(bestSeller.itemId) > 0 && (
    <button
      type="button"
      className="th1-basket-count"
      onClick={(e) => {
        e.stopPropagation();
        router.push(withCountry("/basket"));
      }}
    >
      🛒 {getBasketQuantity(bestSeller.itemId)}
    </button>
  )}
            </div>
          </div>
        </div>
      );
}