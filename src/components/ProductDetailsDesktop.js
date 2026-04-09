"use client";

import React from "react";
import Image from "next/image";
import { FaStar, FaChevronDown } from "react-icons/fa";
import AnalyseReview from "./analyseReview";
import FetchReviews from "./fetchReview";
import ItemIdPageDesktop from "./itemIdPageDesktop";
import "./productDetailsDesktop.css";

export default function ProductDetailsDesktop({
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
  isZoomVisible,
  zoomType,
  zoomedPosition,
  selectedImageForZoom,
   country,
   details,
}) {
  const panelWidth = 420;
  const panelHeight = 450;
  const zoomWidthScale = 1.6;
  const zoomHeightScale = 1.6;

  const zoomedImageWidth = panelWidth * zoomWidthScale;
  const zoomedImageHeight = panelHeight * zoomHeightScale;

  const maxOffsetX = Math.max(0, zoomedImageWidth - panelWidth);
  const maxOffsetY = Math.max(0, zoomedImageHeight - panelHeight);

  const offsetX = Math.max(
    0,
    Math.min(zoomedPosition.x * zoomedImageWidth - panelWidth / 2, maxOffsetX)
  );

  const offsetY = Math.max(
    0,
    Math.min(zoomedPosition.y * zoomedImageHeight - panelHeight / 2, maxOffsetY)
  );

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
      <div
        className={`pdp-desktop-layout ${
          isBasketVisible && basketItems?.length > 0 ? "with-basket" : ""
        }`}
      >
        <div className="pdp-desktop-left-column">
          <div className="left-thumbnails pdp-desktop-left-thumbnails">
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

        <div className="pdp-desktop-center-column">
          <div
            className={`pdp-desktop-image-panel ${
              isBasketVisible && basketItems?.length > 0 ? "with-basket" : ""
            }`}
          >
            {renderImageZoom()}
          </div>
        </div>

        <div className="pdp-desktop-right-column">
          <div className="details-section-container">
            <div
              className={`details-section pdp-desktop-details-section ${
                detailsSectionAtTop ? "at-top" : ""
              } ${detailsSectionAtBottom ? "at-bottom" : ""} ${
                isBasketVisible && basketItems?.length > 0 ? "with-basket" : ""
              }`}
              ref={detailsRef}
            >
              {isZoomVisible && zoomType === "zoom1" && (
                <div className="pdp-desktop-zoomed-view">
                  <img
                    src={selectedImageForZoom}
                    alt="Zoomed"
                    draggable={false}
                    className="pdp-desktop-zoomed-image"
                    style={{
                      left: `-${offsetX}px`,
                      top: `-${offsetY}px`,
                      width: `${zoomedImageWidth}px`,
                      height: `${zoomedImageHeight}px`,
                    }}
                  />
                </div>
              )}

              <h1 className="pdp-desktop-title">{translation?.name || product?.name}</h1>

              {product?.brand && product?.brand.trim() !== "" && (
                <button onClick={handleVisitBrand} className="pdp-desktop-brand-button">
                  {t("visit_brand_button", { brand: product?.brand })}
                </button>
              )}

              <div className="product-info">
                <div className="pdp-desktop-rating-text">
                  <div className="rating-dropdown pdp-desktop-rating-dropdown">
                    <span ref={buttonRef} className="pdp-desktop-rating-value">
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
                      className="pdp-desktop-chevron"
                    />
                  </div>
                </div>

                <div className="pdp-desktop-info-section">
                  {modalOpen && itemsd && (
                    <div className="pdp-desktop-modal" ref={modalRef}>
                      <span
                        className="close-btn pdp-desktop-modal-close"
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
                          : `This item cannot be shipped to ${country.name}.`}
                      </div>
                    )}

                  <div className="pdp-desktop-network-row">
                    <span role="img" aria-label="network">
                      🌐
                    </span>
                    <span className="pdp-desktop-network-text">
                      {getNetworkName(chainId)}
                    </span>
                  </div>

                  <div className="pdp-desktop-price-row">
                    <h2 className="pdp-desktop-usd-price">${product?.usdPrice * quantity}</h2>
                    <h4 className="pdp-desktop-price-separator">≈</h4>

                   <h3 className="pdp-desktop-crypto-price">
                    {convertToCrypto(product?.usdPrice * quantity, product?.cryptocurrency)}
                    {coinImages[product?.cryptocurrency] && (
                      <img
                        src={coinImages[product?.cryptocurrency]}
                        alt={product?.cryptocurrency}
                        className="pdp-desktop-coin-image"
                      />
                    )}
                    {product?.cryptocurrency || "USDT"}
                  </h3>
                  </div>

                  <div className="pdp-desktop-quantity-block">
                    <span className="pdp-desktop-quantity-label">{t("quantity")}</span>

                    <div className="pdp-desktop-quantity-control">
                      <div
                        onClick={() => handleQuantityChange(-1)}
                        className="pdp-desktop-quantity-btn"
                      >
                        -
                      </div>

                      <span className="pdp-desktop-quantity-value">{quantity}</span>

                      <div
                        onClick={() => handleQuantityChange(1)}
                        className="pdp-desktop-quantity-btn"
                      >
                        +
                      </div>
                    </div>
                  </div>

                  <div className="pdp-desktop-action-row">
                    <button className="buy-now-button" onClick={() => handleBuyNowClick(id)}>
                      {t("buy_now")}
                    </button>

                    <button
                      className="add-to-basket"
                      onClick={() => handleAddToBasket(product)}
                    >
                      {t("add_to_basket")}
                    </button>

                    <button className="like-botton" onClick={() => handleLikeItem(product)}>
                      {t("like")}
                    </button>
                  </div>

                  <p className="pdp-desktop-sold-text">
                    {t("items_already_sold", { count: product?.sold })}
                  </p>
                </div>

                <h1 className="pdp-desktop-meta-title">
                  {t("color_name", { color: selectedColor })}
                </h1>
              </div>

              {product?.imagesVariants && (
                <div className="right-colors desktop-color-thumbnails pdp-desktop-color-list">
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

              <h1 className="pdp-desktop-meta-title">
                {t("size_name", { size: selectedSize })}
              </h1>

              {product?.size?.[selectedColor] && (
                <div className="pdp-desktop-size-block">
                  <label htmlFor="size-select" className="pdp-desktop-label">
                    {t("select_size_label")}
                  </label>
                  <select
                    id="size-select"
                    value={selectedSize}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="pdp-desktop-size-select"
                  >
                    {product?.size[selectedColor][0].split(", ").map((size, index) => (
                      <option key={index} value={size.trim()}>
                        {size.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="pdp-desktop-detail-row">
                <strong className="pdp-desktop-detail-label">{t("product_detail")}</strong>
                {translation?.text || product?.text}
              </p>

              <p className="pdp-desktop-detail-row">
                <strong className="pdp-desktop-detail-label">{t("about_this_item")}</strong>
                {translation?.productDetail01 || product?.productDetail01}
              </p>

              <h1 className="pdp-desktop-product-id">
                {t("product_id", { id: itemsd })}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {validVideos?.length > 0 && (
        <div className="product-videos pdp-desktop-video-section">
          <h2 className="pdp-desktop-video-title">{t("product_videos")}</h2>

          {validVideos.length === 1 ? (
            <div>
              <video src={validVideos[0]} controls className="pdp-desktop-video" />
            </div>
          ) : (
            <Slider {...videoSliderSettings}>
              {validVideos.map((videoUrl, index) => (
                <div key={index}>
                  <video src={videoUrl} controls className="pdp-desktop-video" />
                </div>
              ))}
            </Slider>
          )}
        </div>
      )}

      <div>
        <div
          className={`pdp-desktop-itemid-wrapper ${
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
            className="pdp-desktop-see-all-reviews"
          >
            {t("see_all_reviews")}
          </div>
        )}
      </div>
    </>
  );
}