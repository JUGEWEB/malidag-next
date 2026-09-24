"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getCountryConfig,
} from "./countryUtils";

import Image from "next/image";
import { FaStar, FaChevronDown } from "react-icons/fa";
import FetchReviews from "./fetchReview";
import AnalyseReviewSmallWidth from "./analyseReviewSmallwidth";
import ItemIdPage from "./itemIdPage";
import "./productDetailsPhone.css";
import BrandIdPage from "./brandIdPage";
import SimilarItemId from "./similarItemId";
import BrandTypeItems from "./BrandTypeItems";
import MultiRecommendedItem from "./multiRecommendedItem";
import SimilarItemAds from "./SimilarItemAds";
import { FaShareAlt, FaSearchPlus } from "react-icons/fa";

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
setMobileZoomOpen,
}) {
  const rawShippingCountries = details?.country || "";
  const reviewsRef = useRef(null);

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

      setRates(
        data?.rates ||
        data ||
        null
      );
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

useEffect(() => {
  const rating = Number(selectedRating);

  if (
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5 ||
    reviewCount <= 0
  ) {
    return;
  }

  const timer = setTimeout(() => {
    reviewsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 400);

  return () => clearTimeout(timer);
}, [selectedRating, reviewCount]);

const getCurrencyRate = () => {
  if (!currencyConfig) {
    return null;
  }

  if (
    currencyConfig.currency === "USD"
  ) {
    return 1;
  }

  if (!rates) {
    return null;
  }

  const rate = Number(
    rates?.[currencyConfig.currency]
  );

  return Number.isFinite(rate) &&
    rate > 0
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

  const converted = amount * rate;

  return `${currencyConfig.symbol}${converted.toFixed(
    2
  )}`;
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

  return (
    <div className="pdp-phone-page">
       <SimilarItemAds itemId={itemsd} />
      <div className="pdp-phone-slider-shell">
  <div className="pdp-phone-image-overlay-top">
    <div className="pdp-phone-color-badge">
     {getTranslatedColor(selectedColor)}
    </div>

    <button
      type="button"
      onClick={handleShareProduct}
      className="pdp-phone-share-button"
     aria-label={t("share_product")}
    >
      <FaShareAlt />
    </button>
  </div>

  <button
    type="button"
    onClick={() => setMobileZoomOpen(true)}
    className="mobile-view-zoom-button"
  >
    <FaSearchPlus />
   <span>{t("view_zoom")}</span>
  </button>

  <div className="pdp-phone-slider-wrapper">
    <Slider
       key={selectedColor}
        dots={true}
        infinite={false}
        speed={500}
        slidesToShow={1}
        slidesToScroll={1}
        initialSlide={0}
      afterChange={(index) => {
        const images = sortVariantImages(product?.imagesVariants?.[selectedColor] || []);
        const image = images[index];

        if (image) {
          handleImageChange(image, index);
        }
      }}
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
            src={encodeURI(
              getFirstVariantImageUrl(product.imagesVariants[color] || [])
            )}
            alt={`${color} option`}
            className="pdp-phone-color-thumbnail-image"
          />
        </button>
      ))}
    </div>
  )}

      <div className="pdp-phone-content">
        <div className="pdp-phone-header-card">
          <div className="pdp-phone-title-wrap">
            <h1 className="pdp-phone-title">
              {translation?.name || product?.name}
            </h1>

            {(translation?.itemSubName || details?.itemSubName || product?.itemSubName) && (
              <p className="pdp-phone-subname">
                {translation?.itemSubName || details?.itemSubName || product?.itemSubName}
              </p>
            )}

            {product?.brand && product?.brand.trim() !== "" && (
              <button
                onClick={handleVisitBrand}
                className="pdp-phone-brand-button"
              >
                {t("visit_brand_button", { brand: product?.brand })}
              </button>
            )}
          </div>

         {reviewCount > 0 && (
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
              )}
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
      <div className="pdp-delivery-card">
       <p className="pdp-delivery-text">
        {t("loading_delivery_information")}
      </p>
      </div>
    )}

    {!loadingDeliveryInfo && selectedDeliveryInfo && (
      <div className="pdp-delivery-card">
       <p className="pdp-delivery-text">
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
          <button
            type="button"
            className="pdp-phone-return-policy-link"
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
              <label
              htmlFor="size-select"
              className="pdp-phone-label"
            >
              {t("select_option", {
                option: optionLabel,
              })}
            </label>
              <select
                id="size-select"
                value={selectedSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="pdp-phone-size-select"
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

         {selectedOptions.find(
          (o) => o.value === selectedSize
        )?.price && (
          <div className="pdp-phone-option-hint">
            {t("for_this_option", {
              price: formatPrice(
                selectedOptions.find(
                  (o) => o.value === selectedSize
                ).price
              ),
            })}
          </div>
        )}

         <div className="pdp-phone-price-card">
          <div className="pdp-phone-price-row">
            <h2 className="pdp-phone-price">
              {formatPrice(
                currentPrice * quantity
              )}
            </h2>
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
        </div>

        <div className="pdp-phone-itemid-wrapper pdp-phone-card">
          <ItemIdPage id={itemsd} />
          <SimilarItemId itemId={itemsd} />
          <BrandIdPage brandName={product?.brand} />
           <BrandTypeItems brandType={product?.brandType} brandName={product?.brand} />
        </div>

     {reviewCount > 0 && (
  <div
    ref={reviewsRef}
    className="pdp-phone-reviews-block"
  >
    <FetchReviews
      productId={itemsd}
      selectedRating={selectedRating}
    />

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
        className="pdp-phone-see-all-reviews"
      >
        {t("see_all_reviews")}
      </div>
    )}
  </div>
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
    </div>
  );
}