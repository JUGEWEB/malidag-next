"use client";

import React from "react";
import Image from "next/image";
import { FaStar, FaChevronDown } from "react-icons/fa";
import AnalyseReview from "./analyseReview";
import FetchReviews from "./fetchReview";
import ItemIdPageDesktop from "./itemIdPageDesktop";
import "./productDetailsTablet.css";

export default function ProductDetailsTablet({
  basketItems,
  isBasketVisible,
  selectedColor,
  selectedImage,
  product,
  translation,
  finalRating,
  itemsd,
  id,
  chainId,
  quantity,
  selectedSize,
  selectedRating,
  reviewCount,
  modalOpen,
  modalRef,
  buttonRef,
  toggleModal,
  closeModal,
  detailsRef,
  detailsSectionAtTop,
  detailsSectionAtBottom,
  validVideos,
  Slider,
  videoSliderSettings,
  convertToCrypto,
  coinImages,
  getNetworkName,
  renderImageZoom,
  handleImageChange,
  handleColorChange,
  handleSizeChange,
  handleQuantityChange,
  handleBuyNowClick,
  handleAddToBasket,
  handleLikeItem,
  handleVisitBrand,
  setItemData,
  setAuthState,
  setRatingFilter,
  router,
  t,
    country,
      details,
      selectedDeliveryInfo,
loadingDeliveryInfo,
}) {

  const tokenSymbol = product?.cryptocurrency?.toUpperCase?.() || "USDT";
  const rawShippingCountries = details?.country || "";

  const shippingCountries = rawShippingCountries
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

    const selectedCountryCode = country?.code?.toLowerCase();

const canShipToSelectedCountry =
  !!selectedCountryCode && shippingCountries.includes(selectedCountryCode);

  return (
    <>
      <div className="pdp-tablet-layout">
        <div className="pdp-tablet-left-column">
          <div className="left-thumbnails pdp-tablet-left-thumbnails">
            {product?.imagesVariants?.[selectedColor]?.map((image, index) => (
              <Image
                key={index}
                src={encodeURI(image)}
                width={20}
                height={20}
                alt={`${selectedColor} variant ${index + 1}`}
                className={`thumbnail ${selectedImage === image ? "active" : ""}`}
                onClick={() => handleImageChange(image, index)}
              />
            ))}
          </div>
        </div>

        <div className="pdp-tablet-center-column">
          <div className="pdp-tablet-image-panel">{renderImageZoom()}</div>
        </div>

        <div className="pdp-tablet-right-column">
          <div className="details-section-container">
            <div
              className={`details-section pdp-tablet-details-section ${
                detailsSectionAtTop ? "at-top" : ""
              } ${detailsSectionAtBottom ? "at-bottom" : ""}`}
              ref={detailsRef}
            >
              <h1 className="pdp-tablet-title">{translation?.name || product?.name}</h1>

              {product?.brand && product?.brand.trim() !== "" && (
                <button onClick={handleVisitBrand} className="pdp-tablet-brand-button">
                  {t("visit_brand_button", { brand: product?.brand })}
                </button>
              )}

              <div className="product-info">
                <div className="pdp-tablet-rating-text">
                  <div className="rating-dropdown pdp-tablet-rating-dropdown">
                    <span ref={buttonRef} className="pdp-tablet-rating-value">
                      {finalRating || 0}
                    </span>

                    {[...Array(5)].map((_, index) => {
                      const starValue = index + 1;
                      return (
                        <FaStar
                          key={index}
                          color={
                            starValue <= Math.floor(finalRating)
                              ? "gold"
                              : starValue - 0.5 <= finalRating
                              ? "goldenrod"
                              : "gray"
                          }
                        />
                      );
                    })}

                    <FaChevronDown
                      onClick={toggleModal}
                      className="pdp-tablet-chevron"
                    />
                  </div>
                </div>

                <div className="pdp-tablet-info-section">
                  {modalOpen && itemsd && (
                    <div className="pdp-tablet-modal" ref={modalRef}>
                      <span
                        className="close-btn pdp-tablet-modal-close"
                        onClick={closeModal}
                      >
                        &times;
                      </span>
                      <AnalyseReview productId={itemsd} id={id} />
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
                        : `This item is not available in  ${country.name}. Please select another delivery location.`}
                    </div>
                  )}

                 {canShipToSelectedCountry && (
                       <>
                        {loadingDeliveryInfo && (
                          <div
                            style={{
                              marginBottom: "12px",
                              padding: "12px",
                              borderRadius: "8px",
                              backgroundColor: "#f8f9fa",
                              border: "1px solid #d9d9d9",
                              color: "#222",
                            }}
                          >
                            <p style={{ margin: 0 }}>Loading delivery information...</p>
                          </div>
                        )}

                        {!loadingDeliveryInfo && selectedDeliveryInfo && (
                          <div
                            style={{
                              marginBottom: "12px",
                              padding: "12px",
                              borderRadius: "8px",
                              backgroundColor: "#f8f9fa",
                              border: "1px solid #d9d9d9",
                              color: "#222",
                            }}
                          >
                            <div>
                              <p style={{ margin: "0 0 4px 0" }}>
                                {selectedDeliveryInfo.fullName}
                              </p>
                              <p style={{ margin: "0 0 4px 0" }}>
                                {selectedDeliveryInfo.email}
                              </p>
                              <p style={{ margin: "0 0 4px 0" }}>
                                {selectedDeliveryInfo.streetName}
                              </p>
                              <p style={{ margin: "0 0 4px 0" }}>
                                {selectedDeliveryInfo.town}
                              </p>
                              <p style={{ margin: 0 }}>
                                {selectedDeliveryInfo.country}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  <div className="pdp-tablet-network-row">
                    <span role="img" aria-label="network">
                      🌐
                    </span>
                    <span className="pdp-tablet-network-text">
                      {getNetworkName(chainId)}
                    </span>
                  </div>

                  <div className="pdp-tablet-price-row">
                    <h2 className="pdp-tablet-usd-price">${product?.usdPrice * quantity}</h2>
                    <h4 className="pdp-tablet-price-separator">≈</h4>

                 <h3 className="pdp-tablet-crypto-price">
                  {convertToCrypto(product?.usdPrice * quantity, tokenSymbol)}
                  {coinImages[tokenSymbol] && (
                    <img
                      src={coinImages[tokenSymbol]}
                      alt={tokenSymbol}
                      className="pdp-tablet-coin-image"
                    />
                  )}
                  {tokenSymbol}
                </h3>
                  </div>

                  <div className="pdp-tablet-quantity-block">
                    <span className="pdp-tablet-quantity-label">{t("quantity")}</span>

                    <div className="pdp-tablet-quantity-control">
                      <div
                        onClick={() => handleQuantityChange(-1)}
                        className="pdp-tablet-quantity-btn"
                      >
                        -
                      </div>

                      <span className="pdp-tablet-quantity-value">{quantity}</span>

                      <div
                        onClick={() => handleQuantityChange(1)}
                        className="pdp-tablet-quantity-btn"
                      >
                        +
                      </div>
                    </div>
                  </div>

                 <div className="pdp-tablet-action-row">
                  <button
                    className="buy-now-button"
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
                    className="add-to-basket"
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
                    className="like-botton"
                    onClick={() => handleLikeItem(product)}
                  >
                    {t("like")}
                  </button>
                </div>

                  <p className="pdp-tablet-sold-text">
                    {t("items_already_sold", { count: product?.sold })}
                  </p>
                </div>

                <h1 className="pdp-tablet-meta-title">
                  {t("color_name", { color: selectedColor })}
                </h1>
              </div>

              {product?.imagesVariants && (
                <div className="right-colors desktop-color-thumbnails pdp-tablet-color-list">
                  {Object.keys(product.imagesVariants).map((color) => (
                    <Image
                      key={color}
                      src={encodeURI(product.imagesVariants[color][0])}
                      alt={`${color} option`}
                      width={60}
                      height={60}
                      className={`color-thumbnail ${
                        color === selectedColor ? "selected" : ""
                      }`}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
              )}

              <h1 className="pdp-tablet-meta-title">
                {t("size_name", { size: selectedSize })}
              </h1>

              {product?.size?.[selectedColor] && (
                <div className="pdp-tablet-size-block">
                  <label htmlFor="size-select" className="pdp-tablet-label">
                    {t("select_size_label")}
                  </label>
                  <select
                    id="size-select"
                    value={selectedSize}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="pdp-tablet-size-select"
                  >
                    {product?.size[selectedColor][0].split(", ").map((size, index) => (
                      <option key={index} value={size.trim()}>
                        {size.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="pdp-tablet-detail-row">
                <strong className="pdp-tablet-detail-label">{t("product_detail")}</strong>
                {translation?.text || product?.text}
              </p>

              <p className="pdp-tablet-detail-row">
                <strong className="pdp-tablet-detail-label">{t("about_this_item")}</strong>
                {translation?.productDetail01 || product?.productDetail01}
              </p>

              <h1 className="pdp-tablet-product-id">
                {t("product_id", { id: itemsd })}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {validVideos?.length > 0 && (
        <div className="product-videos pdp-tablet-video-section">
          <h2 className="pdp-tablet-video-title">{t("product_videos")}</h2>

          {validVideos.length === 1 ? (
            <div>
              <video src={validVideos[0]} controls className="pdp-tablet-video" />
            </div>
          ) : (
            <Slider {...videoSliderSettings}>
              {validVideos.map((videoUrl, index) => (
                <div key={index}>
                  <video src={videoUrl} controls className="pdp-tablet-video" />
                </div>
              ))}
            </Slider>
          )}
        </div>
      )}

      <div>
        <div
          className={`pdp-tablet-itemid-wrapper ${
            isBasketVisible && basketItems?.length > 0 ? "with-basket" : ""
          }`}
        >
          <ItemIdPageDesktop id={itemsd} />
        </div>

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
              router.push("/review");
            }}
            className="pdp-tablet-see-all-reviews"
          >
            {t("see_all_reviews")}
          </div>
        )}
      </div>
    </>
  );
}