"use client";

import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import {
  getCountryConfig,
} from "./countryUtils";
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

  const rawShippingCountries = details?.country || "";

  const [tapCount, setTapCount] = useState(0);
const [showId, setShowId] = useState(false);
const [hasMoreDetailsScroll, setHasMoreDetailsScroll] = useState(false);

const updateDetailsScrollHint = () => {
  const el = detailsRef?.current;
  if (!el) return;

  const isScrollable = el.scrollHeight > el.clientHeight;
  const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

  setHasMoreDetailsScroll(isScrollable && !isNearBottom);
};

useEffect(() => {
  updateDetailsScrollHint();

  const el = detailsRef?.current;
  if (!el) return;

  el.addEventListener("scroll", updateDetailsScrollHint);
  window.addEventListener("resize", updateDetailsScrollHint);

  return () => {
    el.removeEventListener("scroll", updateDetailsScrollHint);
    window.removeEventListener("resize", updateDetailsScrollHint);
  };
}, [detailsRef, product, selectedColor, selectedSize]);

const handleSecretTap = () => {
  setTapCount((prev) => {
    const next = prev + 1;

    if (next >= 3) {
      setShowId(true);
      return 0;
    }

    return next;
  });
};

  const shippingCountries = rawShippingCountries
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

    const selectedCountryCode = country?.code?.toLowerCase();

const canShipToSelectedCountry =
  !!selectedCountryCode && shippingCountries.includes(selectedCountryCode);

  const [rates, setRates] = useState(null);

const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

useEffect(() => {
  const fetchRates = async () => {
    try {
      const response = await fetch(
        "https://api.malidag.com/prices/rates"
      );

      const data = await response.json();

      setRates(data?.rates || data || null);
    } catch (error) {
      console.error(
        "Failed to fetch currency rates:",
        error
      );

      setRates(null);
    }
  };

  fetchRates();
}, []);

const getCurrencyRate = () => {
  if (!currencyConfig) return null;

  if (currencyConfig.currency === "USD") {
    return 1;
  }

  if (!rates) return null;

  const rate = Number(
    rates?.[currencyConfig.currency]
  );

  return Number.isFinite(rate) && rate > 0
    ? rate
    : null;
};

const formatPrice = (usdAmount) => {
  const amount = Number(usdAmount);

  if (!Number.isFinite(amount)) {
    return t("price_unavailable");
  }

  const rate = getCurrencyRate();

  if (rate === null) {
    return t("price_unavailable");
  }

  return `${currencyConfig.symbol}${(
    amount * rate
  ).toFixed(2)}`;
};

const getTranslatedColor = (color) => {
  if (!color) return "";

  const normalizedColor = color
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return t(`color_${normalizedColor}`, {
    defaultValue: color,
  });
};

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
 alert(t("product_link_copied"));
};

const handleTopSectionWheel = (e) => {
  const detailsEl = detailsRef?.current;
  if (!detailsEl) return;

  const canDetailsScroll = detailsEl.scrollHeight > detailsEl.clientHeight;
  if (!canDetailsScroll) return;

  const scrollingDown = e.deltaY > 0;
  const scrollingUp = e.deltaY < 0;

  const isAtTop = detailsEl.scrollTop <= 0;
  const isAtBottom =
    Math.ceil(detailsEl.scrollTop + detailsEl.clientHeight) >= detailsEl.scrollHeight;

  if (scrollingDown && !isAtBottom) {
    e.preventDefault();
    detailsEl.scrollTop += e.deltaY;
    return;
  }

  if (scrollingUp && !isAtTop) {
    e.preventDefault();
    detailsEl.scrollTop += e.deltaY;
  }
};

  return (
    <>

     <SimilarItemAds itemId={itemsd} />
      <div className="pdp-tablet-layout" onWheel={handleTopSectionWheel}>
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
             aria-label={t("share_product")}
            >
              <FaShareAlt />
            </button>

            <button
              type="button"
              onClick={() => setMobileZoomOpen(true)}
              className="pdp-tablet-view-zoom-button"
            >
              <FaSearchPlus />
             <span>{t("view_zoom")}</span>
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
              <h1  onClick={handleSecretTap} className="pdp-tablet-title">{translation?.name || product?.name}</h1>

              {(translation?.itemSubName || details?.itemSubName || product?.itemSubName) && (
                  <p className="pdp-tablet-subname">
                    {translation?.itemSubName || details?.itemSubName || product?.itemSubName}
                  </p>
                )}

              {product?.brand && product?.brand.trim() !== "" && (
                <button onClick={handleVisitBrand} className="pdp-tablet-brand-button">
                  {t("visit_brand_button", { brand: product?.brand })}
                </button>
              )}

              <div className="product-info">
               {reviewCount > 0 && (
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
                  )}

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
                       {t("item_not_available_country", {
                          country: country.name,
                        })}
                      </div>
                    )}

                {canShipToSelectedCountry && (
                    <>
                      {loadingDeliveryInfo && (
                        <div className="pdp-tablet-delivery-card">
                          <p className="pdp-tablet-delivery-text">
                           {t("loading_delivery_information")}
                          </p>
                        </div>
                      )}

                      {!loadingDeliveryInfo && selectedDeliveryInfo && (
                        <div className="pdp-tablet-delivery-card">
                          <p className="pdp-tablet-delivery-text">
                        {t("delivering_to", {
                          name: selectedDeliveryInfo.fullName,
                          address: [
                            selectedDeliveryInfo.streetName,
                            selectedDeliveryInfo.town,
                            selectedDeliveryInfo.postalCode,
                            selectedDeliveryInfo.country,
                          ]
                            .filter(Boolean)
                            .join(", "),
                        })}{" "}

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
                    <button
                      type="button"
                      className="pdp-tablet-return-policy-link"
                      onClick={() => {
                        if (!country?.code) return;

                        router.push(
                          `/${country.code.toLowerCase()}/refund-policy`
                        );
                      }}
                    >
                      {t("learn_return_policy")}
                    </button>
                  </div>

                 <div className="pdp-tablet-price-row">
                    <h2 className="pdp-tablet-price">
                      {formatPrice(
                        currentPrice * quantity
                      )}
                    </h2>
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
                 {t("color_name", {
                    color: getTranslatedColor(selectedColor),
                  })}
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
                  {t("select_option", {
                    option: optionLabel,
                  })}
                  </label>
                  <select
                    id="size-select"
                    value={selectedSize}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="pdp-tablet-size-select"
                  >
                    {selectedOptions.map((option, index) => {
                     const priceText = option.price
                      ? ` (${formatPrice(option.price)})`
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

              {showId && (
              <h1 className="pdp-tablet-product-id">
                {t("product_id", { id: itemsd })}
              </h1>
            )}

            {hasMoreDetailsScroll && (
            <div className="pdp-tablet-scroll-hint">
             <span>{t("scroll_for_more")}</span>
              <span className="pdp-tablet-scroll-arrow">↓</span>
            </div>
          )}
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
          className={`pdp-tablet-itemid-wrapper`}
        >
          <ItemIdPageDesktop id={itemsd} />
           <SimilarItemId itemId={itemsd} />
          <BrandIdPage brandName={product?.brand} />
           <BrandTypeItems brandType={product?.brandType} brandName={product?.brand} />
        </div>

       {reviewCount > 0 && (
            <>
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
                   if (!country?.code) return;

                  router.push(
                    `/${country.code.toLowerCase()}/product/${id}/review`
                  );
                  }}
                  className="pdp-tablet-see-all-reviews"
                >
                  {t("see_all_reviews")}
                </div>
              )}
            </>
          )}

       <MultiRecommendedItem
                         category={details?.category}
                         type={details?.type}
                         title={t("recommended_type", {
                              type: t(
                                details?.type?.toLowerCase(),
                                {
                                  defaultValue: details?.type,
                                }
                              ),
                            })}
                       />
      </div>
    </>
  );
}