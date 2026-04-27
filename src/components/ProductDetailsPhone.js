"use client";

import React from "react";
import Image from "next/image";
import { FaStar, FaChevronDown } from "react-icons/fa";
import FetchReviews from "./fetchReview";
import AnalyseReviewSmallWidth from "./analyseReviewSmallwidth";
import ItemIdPage from "./itemIdPage";
import "./productDetailsPhone.css";

export default function ProductDetailsPhone({
  product,
  translation,
  selectedColor,
  selectedSize,
  selectedRating,
  quantity,
  finalRating,
  itemsd,
  id,
  chainId,
  reviewCount,
  openModalSmall,
  setOpenModalSmall,
  setRatingToPass,
  setNavigateToReview,
  setItemData,
  setAuthState,
  setRatingFilter,
  router,
  t,
  buttonRef,
  validVideos,
  Slider,
  videoSliderSettings,
  convertToCrypto,
  coinImages,
  getNetworkName,
  handleVisitBrand,
  handleColorChange,
  handleImageChange,
  handleSizeChange,
  handleQuantityChange,
  handleBuyNowClick,
  handleAddToBasket,
  handleLikeItem,
  details,
  country,
  selectedDeliveryInfo,
  loadingDeliveryInfo,
  optionLabel,
currentPrice,
selectedOptions,
}) {
  const rawShippingCountries = details?.country || "";

  const shippingCountries = rawShippingCountries
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const selectedCountryCode = country?.code?.toLowerCase();

  const canShipToSelectedCountry =
    !!selectedCountryCode && shippingCountries.includes(selectedCountryCode);

  const tokenSymbol = product?.cryptocurrency?.toUpperCase?.() || "USDT";

  const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

const getImageFilename = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") {
    return imageEntry.split("/").pop() || "";
  }
  if (typeof imageEntry === "object") {
    return imageEntry.filename || imageEntry.url?.split("/").pop() || "";
  }
  return "";
};

const sortVariantImages = (images = []) => {
  return [...images].sort((a, b) => {
    const posA =
      typeof a === "object" && typeof a?.position === "number" ? a.position : 999999;
    const posB =
      typeof b === "object" && typeof b?.position === "number" ? b.position : 999999;

    if (posA !== posB) return posA - posB;

    const nameA = getImageFilename(a);
    const nameB = getImageFilename(b);

    return nameA.localeCompare(nameB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
};

const getFirstVariantImageUrl = (images = []) => {
  return getImageUrl(sortVariantImages(images)[0]) || "/fallback.png";
};

  return (
    <div className="pdp-phone-page">
      <div className="pdp-phone-slider-shell">
        <div className="pdp-phone-slider-wrapper">
          <Slider
            dots={true}
            infinite={false}
            speed={500}
            slidesToShow={1}
            slidesToScroll={1}
          >
           {sortVariantImages(product?.imagesVariants?.[selectedColor] || []).map((image, index) => {
              const imageUrl = getImageUrl(image);

              return (
                <div key={index}>
                  <img
                    src={encodeURI(imageUrl)}
                    alt={`Slide ${index}`}
                    className="pdp-phone-slider-image"
                    onClick={() => handleImageChange(image, index)}
                  />
                </div>
              );
            })}
          </Slider>
        </div>

        {product?.imagesVariants &&
          Object.keys(product.imagesVariants).length > 0 && (
            <div className="pdp-phone-color-thumbnails">
              {Object.keys(product.imagesVariants).map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`pdp-phone-color-thumbnail ${
                    color === selectedColor ? "selected" : ""
                  }`}
                  onClick={() => handleColorChange(color)}
                  aria-label={`Select color ${color}`}
                >
                  <img
                    src={encodeURI(getFirstVariantImageUrl(product.imagesVariants[color] || []))}
                    alt={`${color} option`}
                    className="pdp-phone-color-thumbnail-image"
                  />
                </button>
              ))}
            </div>
          )}
      </div>

      <div className="pdp-phone-content">
        <div className="pdp-phone-header-card">
          <div className="pdp-phone-title-wrap">
            <h1 className="pdp-phone-title">
              {translation?.name || product?.name}
            </h1>

            {product?.brand && product?.brand.trim() !== "" && (
              <button
                onClick={handleVisitBrand}
                className="pdp-phone-brand-button"
              >
                {t("visit_brand_button", { brand: product?.brand })}
              </button>
            )}
          </div>

          <div className="pdp-phone-rating-block">
            <div className="rating-dropdown pdp-phone-rating-dropdown">
              <span ref={buttonRef} className="pdp-phone-rating-value">
                {finalRating || 0}
              </span>

              <div className="pdp-phone-stars">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <FaStar
                      key={index}
                      color={
                        starValue <= Math.floor(finalRating)
                          ? "#f5b301"
                          : starValue - 0.5 <= finalRating
                          ? "#d4a017"
                          : "#cbd5e1"
                      }
                    />
                  );
                })}
              </div>

              <FaChevronDown
                onClick={() => setOpenModalSmall(true)}
                className="pdp-phone-chevron"
              />
            </div>
          </div>
        </div>

        <div className="pdp-phone-section pdp-phone-purchase-card">
          {openModalSmall && itemsd && (
            <div className="pdp-phone-modal-overlay" onClick={() => setOpenModalSmall(false)}>
              <div
                className="pdp-phone-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className="close-btn pdp-phone-modal-close"
                  onClick={() => setOpenModalSmall(false)}
                >
                  &times;
                </span>

                <AnalyseReviewSmallWidth
                  productId={itemsd}
                  id={id}
                  item={product}
                  onTriggerReviewNavigation={(rating) => {
                    setOpenModalSmall(false);
                    setRatingToPass(rating);
                    setNavigateToReview(true);
                  }}
                />
              </div>
            </div>
          )}

          {country && (
            <div
              style={{
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                backgroundColor: canShipToSelectedCountry ? "#f6ffed" : "#fff2f0",
                color: canShipToSelectedCountry ? "#237804" : "#cf1322",
                border: canShipToSelectedCountry
                  ? "1px solid #b7eb8f"
                  : "1px solid #ffb3b3",
              }}
            >
              {canShipToSelectedCountry
                ? `This item can be shipped to ${country.name}.`
                : `This item cannot be shipped to ${country.name}.`}
            </div>
          )}

         {canShipToSelectedCountry && (
  <>
    {loadingDeliveryInfo && (
      <div className="pdp-delivery-card">
        <p className="pdp-delivery-text">
          Loading delivery information...
        </p>
      </div>
    )}

    {!loadingDeliveryInfo && selectedDeliveryInfo && (
      <div className="pdp-delivery-card">
        <p className="pdp-delivery-text">
          Delivering to{" "}
          <strong>{selectedDeliveryInfo.fullName}</strong>{" "}
          at {selectedDeliveryInfo.streetName}, {selectedDeliveryInfo.town},{" "}
          {selectedDeliveryInfo.postalCode && `${selectedDeliveryInfo.postalCode}, `}
          {selectedDeliveryInfo.country}. Contact:{" "}
          <a
            href={`mailto:${selectedDeliveryInfo.email}`}
            className="pdp-delivery-email"
          >
            {selectedDeliveryInfo.email}
          </a>
        </p>
      </div>
    )}
  </>
)}

          <div className="pdp-phone-network-row">
            <span className="pdp-phone-network-icon" role="img" aria-label="network">
              🌐
            </span>
            <span className="pdp-phone-network-text">{getNetworkName(chainId)}</span>
          </div>

          <div className="pdp-phone-size-summary">
  <span className="pdp-phone-size-summary-label">
    {optionLabel}
  </span>
  <span className="pdp-phone-size-summary-value">
    {selectedSize}
  </span>
</div>

         {selectedOptions?.length > 0 && (
            <div className="pdp-phone-size-block">
              <label htmlFor="size-select" className="pdp-phone-label">
               Select {optionLabel}
              </label>
              <select
                id="size-select"
                value={selectedSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="pdp-phone-size-select"
              >
                {selectedOptions.map((option, index) => {
                const priceText = option.price
                  ? ` ($${Number(option.price).toFixed(2)})`
                  : "";

                return (
                  <option key={`${option.value}-${index}`} value={option.value}>
                    {option.value}{priceText}
                  </option>
                );
              })}
              </select>
            </div>
          )}

          {selectedOptions.find(o => o.value === selectedSize)?.price && (
          <div className="pdp-phone-option-hint">
            ${Number(
              selectedOptions.find(o => o.value === selectedSize).price
            ).toFixed(2)} for this option
          </div>
        )}

          <div className="pdp-phone-price-card">
            <div className="pdp-phone-price-row">
              <h2 className="pdp-phone-usd-price">
               ${(currentPrice * quantity).toFixed(2)}
              </h2>

              <span className="pdp-phone-price-separator">≈</span>

              <h3 className="pdp-phone-crypto-price">
                {convertToCrypto(currentPrice * quantity, tokenSymbol)}
                {coinImages[tokenSymbol] && (
                  <Image
                    src={encodeURI(coinImages[tokenSymbol])}
                    alt={tokenSymbol}
                    width={22}
                    height={22}
                    className="pdp-phone-coin-image"
                  />
                )}
                <span>{tokenSymbol}</span>
              </h3>
            </div>
          </div>

          <div className="pdp-phone-quantity-block">
            <span className="pdp-phone-quantity-label">{t("quantity")}</span>

            <div className="pdp-phone-quantity-control">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                className="pdp-phone-quantity-btn"
              >
                -
              </button>
              <span className="pdp-phone-quantity-value">{quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                className="pdp-phone-quantity-btn"
              >
                +
              </button>
            </div>
          </div>

          <div className="pdp-phone-action-row">
            <button
              className="pdp-phone-btn pdp-phone-btn-primary"
              onClick={() => handleBuyNowClick(id)}
              disabled={!canShipToSelectedCountry}
              style={{
                opacity: canShipToSelectedCountry ? 1 : 0.5,
                cursor: canShipToSelectedCountry ? "pointer" : "not-allowed",
              }}
            >
              {t("buy_now")}
            </button>

            <button
              className="pdp-phone-btn pdp-phone-btn-secondary"
              onClick={() => handleAddToBasket(product)}
              disabled={!canShipToSelectedCountry}
              style={{
                opacity: canShipToSelectedCountry ? 1 : 0.5,
                cursor: canShipToSelectedCountry ? "pointer" : "not-allowed",
              }}
            >
              {t("add_to_basket")}
            </button>

            <button
              className="pdp-phone-btn pdp-phone-btn-ghost"
              onClick={() => handleLikeItem(product)}
            >
              {t("like")}
            </button>
          </div>

          <p className="pdp-phone-sold-text">
            {t("items_already_sold", { count: product?.sold })}
          </p>
        </div>

        <div className="pdp-phone-video-section pdp-phone-card">
          {validVideos?.length > 0 && (
            <div className="product-videos">
              <h2 className="pdp-phone-section-title">{t("product_videos")}</h2>

              {validVideos.length === 1 ? (
                <div>
                  <video
                    src={validVideos[0]}
                    controls
                    className="pdp-phone-video"
                  />
                </div>
              ) : (
                <Slider {...videoSliderSettings}>
                  {validVideos.map((videoUrl, index) => (
                    <div key={index}>
                      <video
                        src={videoUrl}
                        controls
                        className="pdp-phone-video"
                      />
                    </div>
                  ))}
                </Slider>
              )}
            </div>
          )}
        </div>

        <div className="pdp-phone-details-text pdp-phone-card">
          <h2 className="pdp-phone-section-title">{t("product_detail")}</h2>

          <div className="pdp-phone-detail-group">
            <p className="pdp-phone-detail-row">
              <strong className="pdp-phone-detail-label">
                {t("product_detail")}
              </strong>
              <span>{translation?.text || product?.text}</span>
            </p>

            <p className="pdp-phone-detail-row">
              <strong className="pdp-phone-detail-label">
                {t("about_this_item")}
              </strong>
              <span>
                {translation?.productDetail01 || product?.productDetail01}
              </span>
            </p>
          </div>

          <h3 className="pdp-phone-product-id">
            {t("product_id", { id: itemsd })}
          </h3>
        </div>

        <div className="pdp-phone-itemid-wrapper pdp-phone-card">
          <ItemIdPage id={itemsd} />
        </div>

        <div className="pdp-phone-reviews-block">
          <FetchReviews productId={itemsd} selectedRating={selectedRating} />

          {reviewCount > 11 && (
            <div
              onClick={() => {
                setItemData({
                  id,
                  itemId: itemsd,
                  item: product,
                });
                setAuthState(true);
                setRatingFilter(selectedRating);
                router.push("/reviewPage");
              }}
              className="pdp-phone-see-all-reviews"
            >
              {t("see_all_reviews")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}