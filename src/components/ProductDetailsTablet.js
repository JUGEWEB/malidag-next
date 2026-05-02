"use client";

import React from "react";
import Image from "next/image";
import { FaStar, FaChevronDown } from "react-icons/fa";
import AnalyseReview from "./analyseReview";
import FetchReviews from "./fetchReview";
import ItemIdPageDesktop from "./itemIdPageDesktop";
import "./productDetailsTablet.css";
import BrandIdPage from "./brandIdPage";
import SimilarItemId from "./similarItemId";
import BrandTypeItems from "./BrandTypeItems";
import MultiRecommendedItem from "./multiRecommendedItem";
import { FaShareAlt, FaSearchPlus } from "react-icons/fa";
import SimilarItemAds from "./SimilarItemAds";

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
optionLabel,
currentPrice,
selectedOptions,
setMobileZoomOpen,
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

const handleShareProduct = async () => {
  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const shareData = {
    title: translation?.name || product?.name || "Product",
    text: translation?.name || product?.name || "Check this product",
    url: shareUrl,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  }

  await navigator.clipboard.writeText(shareUrl);
  alert("Product link copied");
};

  return (
    <>

     <SimilarItemAds itemId={itemsd} />
      <div className="pdp-tablet-layout">
        <div className="pdp-tablet-left-column">
          <div className="left-thumbnails pdp-tablet-left-thumbnails">
           {sortVariantImages(product?.imagesVariants?.[selectedColor] || []).map((image, index) => {
            const imageUrl = getImageUrl(image);

            return (
              <Image
                key={index}
                src={encodeURI(imageUrl)}
                width={20}
                height={20}
                alt={`${selectedColor} variant ${index + 1}`}
                className={`thumbnail ${selectedImage === imageUrl ? "active" : ""}`}
                onClick={() => handleImageChange(image, index)}
              />
            );
          })}
          </div>
        </div>

        <div className="pdp-tablet-center-column">
         <div className="pdp-tablet-image-panel">
            <button
              type="button"
              onClick={handleShareProduct}
              className="pdp-tablet-share-button"
              aria-label="Share product"
            >
              <FaShareAlt />
            </button>

            <button
              type="button"
              onClick={() => setMobileZoomOpen(true)}
              className="pdp-tablet-view-zoom-button"
            >
              <FaSearchPlus />
              <span>View zoom</span>
            </button>

            {renderImageZoom()}
          </div>
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

                  {country && !canShipToSelectedCountry && (
                      <div
                        style={{
                          marginBottom: "12px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "500",
                          backgroundColor: "#fff2f0",
                          color: "#cf1322",
                          border: "1px solid #ffb3b3",
                        }}
                      >
                        {`This item is not available in ${country.name}. Please select another delivery location.`}
                      </div>
                    )}

                {canShipToSelectedCountry && (
                    <>
                      {loadingDeliveryInfo && (
                        <div className="pdp-tablet-delivery-card">
                          <p className="pdp-tablet-delivery-text">
                            Loading delivery information...
                          </p>
                        </div>
                      )}

                      {!loadingDeliveryInfo && selectedDeliveryInfo && (
                        <div className="pdp-tablet-delivery-card">
                          <p className="pdp-tablet-delivery-text">
                            Delivering to{" "}
                            <strong>{selectedDeliveryInfo.fullName}</strong>{" "}
                            at {selectedDeliveryInfo.streetName}, {selectedDeliveryInfo.town},{" "}
                            {selectedDeliveryInfo.postalCode && `${selectedDeliveryInfo.postalCode}, `}
                            {selectedDeliveryInfo.country}. Contact:{" "}
                            <a
                              href={`mailto:${selectedDeliveryInfo.email}`}
                              className="pdp-tablet-delivery-email"
                            >
                              {selectedDeliveryInfo.email}
                            </a>
                          </p>
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
                    <h2 className="pdp-tablet-usd-price">${(currentPrice * quantity).toFixed(2)}</h2>
                    <h4 className="pdp-tablet-price-separator">≈</h4>

                 <h3 className="pdp-tablet-crypto-price">
                  {convertToCrypto(currentPrice * quantity, tokenSymbol)}
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
                 {Object.keys(product.imagesVariants).map((color) => {
                    const colorPreview = getFirstVariantImageUrl(product.imagesVariants[color] || []);

                    return (
                      <Image
                        key={color}
                        src={encodeURI(colorPreview)}
                        alt={`${color} option`}
                        width={60}
                        height={60}
                        className={`color-thumbnail ${
                          color === selectedColor ? "selected" : ""
                        }`}
                        onClick={() => handleColorChange(color)}
                      />
                    );
                  })}
                </div>
              )}

              <h1 className="pdp-tablet-meta-title">
               {optionLabel}: {selectedSize}
              </h1>

             {selectedOptions?.length > 0 && (
                <div className="pdp-tablet-size-block">
                  <label htmlFor="size-select" className="pdp-tablet-label">
                   Select {optionLabel}
                  </label>
                  <select
                    id="size-select"
                    value={selectedSize}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="pdp-tablet-size-select"
                  >
                    {selectedOptions.map((option, index) => {
                      const priceText = option.price
                        ? ` (+$${Number(option.price).toFixed(2)})`
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
           <SimilarItemId itemId={itemsd} />
          <BrandIdPage brandName={product?.brand} />
           <BrandTypeItems brandType={product?.brandType} brandName={product?.brand} />
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

       <MultiRecommendedItem
                       category={details?.category}
                       title={`Recommended ${details?.category}`}
                     />
      </div>
    </>
  );
}