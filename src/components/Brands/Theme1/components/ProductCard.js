"use client";

import {
  getColorOptions,
  getDiscountPercentage,
} from "../utils/productDisplayHelpers";

export default function ProductCard({
  item,
  options = {},
  selectedColorByItem,
  getDisplayImage,
  reviews,
  pendingBasketItem,
  addingToBasket,
  setPendingBasketItem,
  setSelectedModalSize,
  setSelectedModalLength,
  selectedModalSize,
  selectedModalLength,
  handleAddToBasket,
  formatPrice,
  convertUsd,
  getTranslatedName,
  translateColor,
  getColorSwatch,
  handleColorSelect,
  renderStars,
  getBasketQuantity,
  router,
  withCountry,
  t,
}) { 
     const { isTop = false, badgeText = "" } = options;
        const colorOptions = getColorOptions(item);
    
    const selectedColor =
      colorOptions.includes(selectedColorByItem[item.id])
        ? selectedColorByItem[item.id]
        : colorOptions[0] || "";
    
    const displayImage = getDisplayImage(item);
    
        const discountPercentage = getDiscountPercentage(
          item?.usdPrice,
          item?.originalPrice
        );
    
        const productReview = reviews[item?.itemId] || {
          rating: item?.rating || 0,
          count: 0,
        };
    
        return (
          <div className="th1-item-card">
    
            {pendingBasketItem?.product?.id === item.id && (
      <div
        className="th1-size-overlay"
        onClick={() => {
          if (!addingToBasket) {
            setPendingBasketItem(null);
            setSelectedModalSize(null);
            setSelectedModalLength(null);
          }
        }}
      >
        <div
          className="th1-size-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t("select_size")}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setPendingBasketItem(null);
              setSelectedModalSize(null);
              setSelectedModalLength(null);
            }}
            disabled={addingToBasket}
          >
            ×
          </button>
    
          <h3>{t("select_size")}</h3>
    
          <div className="th1-size-options">
            {pendingBasketItem.sizes.map((option) => (
              <button
                type="button"
                key={option.value}
                disabled={addingToBasket}
                className={
                  selectedModalSize === option.value ? "active" : ""
                }
                onClick={(e) => {
                  e.stopPropagation();
    
                  setSelectedModalSize(option.value);
                  setSelectedModalLength(null);
    
                  // No lengths: add immediately, like before.
                  if (!option.lengths?.length) {
                    handleAddToBasket(
                      pendingBasketItem.product,
                      e,
                      option.value,
                      null
                    );
                  }
                }}
              >
                <span>{option.value}</span>
    
                <small>
                  {formatPrice(
                    option.price ??
                      Number(pendingBasketItem.product.usdPrice || 0)
                  )}
                </small>
              </button>
            ))}
          </div>
    
          {(() => {
            const selectedOption = pendingBasketItem.sizes.find(
              (option) => option.value === selectedModalSize
            );
    
            const lengths = selectedOption?.lengths || [];
    
            if (!lengths.length) return null;
    
            return (
              <>
                <h3>{t("select_length", "Select length")}</h3>
    
                <div className="th1-size-options">
                  {lengths.map((length) => (
                    <button
                      key={length}
                      type="button"
                      disabled={addingToBasket}
                      className={
                        selectedModalLength === length ? "active" : ""
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModalLength(length);
                      }}
                    >
                      <span>{length}</span>
                    </button>
                  ))}
                </div>
    
                <button
                  type="button"
                  className="th1-add-basket-btn"
                  disabled={!selectedModalLength || addingToBasket}
                  onClick={(e) =>
                    handleAddToBasket(
                      pendingBasketItem.product,
                      e,
                      selectedModalSize,
                      selectedModalLength
                    )
                  }
                >
                  {addingToBasket
                    ? t("loading", "Loading...")
                    : t("add_to_cart")}
                </button>
              </>
            );
          })()}
        </div>
      </div>
    )}
    
            <div
              className="th1-item-media"
            onClick={() => {
      router.push(withCountry(`/product/${item.id}`));
    }}
            >
              {badgeText ? (
              <div className="th1-image-badge th1-image-badge-best">
                {badgeText}
              </div>
            ) : isTop ? (
              <div className="th1-image-badge th1-image-badge-top">
                {t("top")}
              </div>
            ) : null}
    
              {discountPercentage > 0 && (
                <div className="th1-image-badge th1-image-badge-discount">
                  -{discountPercentage}%
                </div>
              )}
    
              <img
                src={displayImage}
                alt={item?.name || "Product"}
                className="th1-item-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/fallback.png";
                }}
              />
            </div>
    
            <div
              className="th1-item-info"
             onClick={() => {
      router.push(withCountry(`/product/${item.id}`));
    }}
            >
            <div className="th1-item-price-row">
              <span className="th1-item-price">
                {formatPrice(item?.usdPrice)}
              </span>
    
              {Number(item?.originalPrice || 0) > 0 &&
                convertUsd(item.originalPrice) !== null && (
                  <span className="th1-item-original-price">
                    {formatPrice(item.originalPrice)}
                  </span>
                )}
            </div>
    
              <div className="th1-item-name">
                {getTranslatedName(item, item.itemId)?.length > 70
                  ? `${getTranslatedName(item, item.itemId).slice(0, 70)}...`
                  : getTranslatedName(item, item.itemId)}
              </div>
    
      {colorOptions.length > 1 && (
      <div
        className="th1-color-block"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="th1-color-label">
          {t("color")}:{" "}
          <span>{translateColor(selectedColor)}</span>
        </div>
    
        <div className="th1-color-options">
          {colorOptions.slice(0, 3).map((color) => (
            <button
              key={color}
              type="button"
              className={`th1-color-circle ${
                selectedColor === color ? "active" : ""
              }`}
              title={translateColor(color)}
              aria-label={t("select_color", {
                color: translateColor(color),
              })}
              style={{
                background: getColorSwatch(color),
              }}
              onClick={(e) =>
                handleColorSelect(item.id, color, e)
              }
            />
          ))}
    
          {colorOptions.length > 3 && (
            <button
              type="button"
              className="th1-more-colors"
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  withCountry(`/product/${item.id}`)
                );
              }}
              aria-label={`${colorOptions.length - 3} more colors`}
            >
              +{colorOptions.length - 3}
            </button>
          )}
        </div>
      </div>
    )}
    
              {productReview.count > 0 && (
      <div className="th1-item-rating">
        {renderStars(productReview.rating, item)}
        <span className="th1-review-count">
          ({productReview.count})
        </span>
      </div>
    )}
    
        <button
      type="button"
      className="th1-add-basket-btn"
      onClick={(e) => handleAddToBasket(item, e)}
    >
      {t("add_to_cart")}
    </button>
    
           {getBasketQuantity(item.itemId) > 0 && (
      <button
        type="button"
        className="th1-basket-count"
        onClick={(e) => {
          e.stopPropagation();
          router.push(withCountry("/basket"));
        }}
      >
        🛒 {getBasketQuantity(item.itemId)}
      </button>
    )}
            </div>
          </div>
        );

    }