"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useRef,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import useScreenSize from "../../useIsMobile";
import "./Baasploa.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useCheckoutStore } from "@/components/checkoutStore";
import { AppContext } from "@/components/appContext";
import colors from "../../../../lib/colors.json";
import axios from "axios";
import { auth } from "@/components/firebaseConfig";
import { message } from "antd";
import {
  isSupportedLanguage,
} from "@/components/countryUtils";
import {
  getImageUrl,
  getColorOptions,
  getFirstVideoUrl,
   getProductDisplayImage,
} from "./utils/productDisplayHelpers";
import { getSizesForColor } from "./utils/productSizeHelpers";
import DepartmentSidebar from "./components/DepartmentSidebar";
import MobileNavigation from "./components/MobileNavigation";
import ProductCard from "./components/ProductCard";
import BestSellerCard from "./components/BestSellerCard";
import DepartmentItems from "./components/DepartmentItems";
import useBasket from "./hooks/useBasket";
import useProductReviews from "./hooks/useProductReviews";
import useProductTranslations from "./hooks/useProductTranslations";
import useTopItems from "./hooks/useTopItems";
import useBestSeller from "./hooks/useBestSeller";
import useDepartmentItems from "./hooks/useDepartmentItems";
import useBrandDepartments from "./hooks/useBrandDepartments";
import useBrandTheme from "./hooks/useBrandTheme";
import useProductPricing from "./hooks/useProductPricing";
import "./theme.css";
import "./theme1.css";
import "./themeA.css";
import "./themeB.css";
import "./themeC.css";

const BASKET_API =
  "https://api.malidag.com/add-to-basket";

function Theme1({ brandName }) {
  const router = useRouter();
const searchParams = useSearchParams();
const requestedBrandType =
  searchParams.get("brandType");
  const { isDesktop } = useScreenSize();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const setItemData = useCheckoutStore((state) => state.setItemData);
  const [hideBestSellerVideo, setHideBestSellerVideo] = useState(false);
 const brandDetails = useBrandTheme(brandName);
  const { country } = useContext(AppContext);
  const countryCode =
  country?.code?.toLowerCase() || null;
  const departments = useBrandDepartments({
  brandName,
  countryCode,
});

const withCountry = (path) => {
  if (!countryCode) return "/";

  if (!path) {
    return `/${countryCode}`;
  }

  return `/${countryCode}${
    path.startsWith("/") ? path : `/${path}`
  }`;
};

  const [selectedColorByItem, setSelectedColorByItem] = useState({});

 const topItems = useTopItems({
  brandName,
  countryCode,
  setSelectedColorByItem,
});

const bestSeller = useBestSeller({
  brandName,
  countryCode,
  setSelectedColorByItem,
});

const {
  setBasketItems,
  fetchUserBasket,
  getBasketQuantity,
} = useBasket();

const currentLanguage =
  isSupportedLanguage(i18n.language)
    ? i18n.language
    : "en";

     const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedBrandType, setSelectedBrandType] = useState(null);
  const {
  brandItems,
  departmentItemsLoading,
  departmentItemsError,
} = useDepartmentItems({
  brandName,
  countryCode,
  selectedDepartment,
  selectedBrandType,
  setSelectedColorByItem,
});

const translations = useProductTranslations({
  topItems,
  brandItems,
  bestSeller,
  currentLanguage,
});

const reviews = useProductReviews(
  topItems,
  brandItems,
  bestSeller
);

const { convertUsd, formatPrice } = useProductPricing({
  country,
  t,
});

  const [expandedDeptIndex, setExpandedDeptIndex] = useState(null);
  const [departmentDropdownPosition, setDepartmentDropdownPosition] =
  useState(null);

const departmentScrollRef = useRef(null);

useEffect(() => {
  if (expandedDeptIndex === null) {
    setDepartmentDropdownPosition(null);
    return;
  }

  const updatePosition = () => {
    const scroll = departmentScrollRef.current;
    const trigger = scroll?.querySelector(
      `[data-department-index="${expandedDeptIndex}"]`
    );

    if (!scroll || !trigger) return;

    const rect = trigger.getBoundingClientRect();
    const scrollRect = scroll.getBoundingClientRect();

    if (rect.right < scrollRect.left || rect.left > scrollRect.right) {
      setExpandedDeptIndex(null);
      return;
    }

    const dropdownMaxHeight = 280;
const spaceBelow = window.innerHeight - rect.bottom - 12;
const spaceAbove = rect.top - 12;

const openAbove =
  spaceBelow < dropdownMaxHeight &&
  spaceAbove > spaceBelow;

const availableHeight = Math.max(
  80,
  openAbove ? spaceAbove : spaceBelow
);

const dropdownHeight = Math.min(
  dropdownMaxHeight,
  availableHeight
);

setDepartmentDropdownPosition({
  top: openAbove
    ? Math.max(8, rect.top - dropdownHeight - 6)
    : rect.bottom + 6,

  left: Math.max(
    8,
    Math.min(rect.left, window.innerWidth - 208)
  ),

  maxHeight: dropdownHeight,
});
  };

  updatePosition();

  const scroll = departmentScrollRef.current;

  scroll?.addEventListener("scroll", updatePosition);
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);

  return () => {
    scroll?.removeEventListener("scroll", updatePosition);
    window.removeEventListener("resize", updatePosition);
    window.removeEventListener("scroll", updatePosition, true);
  };
}, [expandedDeptIndex]);
const [pendingBasketItem, setPendingBasketItem] = useState(null);
const [selectedModalSize, setSelectedModalSize] = useState(null);
const [selectedModalLength, setSelectedModalLength] = useState(null);
const [addingToBasket, setAddingToBasket] = useState(false);

  useEffect(() => {
  if (
    !requestedBrandType ||
   !departments.length
  ) {
    return;
  }

  const targetBrandType =
    requestedBrandType
      .trim()
      .toLowerCase();

  const matchingDepartment =
   departments.find((department) =>
      (department?.brandTypes || []).some(
        (brandType) =>
          String(brandType || "")
            .trim()
            .toLowerCase() ===
          targetBrandType
      )
    );

  if (!matchingDepartment) {
    return;
  }

  const actualBrandType =
    matchingDepartment.brandTypes.find(
      (brandType) =>
        String(brandType || "")
          .trim()
          .toLowerCase() ===
        targetBrandType
    );

  if (!actualBrandType) return;

  setSelectedDepartment(
    matchingDepartment.name
  );

  setSelectedBrandType(
    actualBrandType
  );
}, [
  requestedBrandType,
  departments,
]);

  useEffect(() => {
    setHideBestSellerVideo(false);
  }, [bestSeller?.id]);

 const handleBrandTypeClick = (
  department,
  brandType
) => {
  setExpandedDeptIndex(null);

  setSelectedDepartment(
    department
  );

  setSelectedBrandType(
    brandType
  );

 router.push(
  withCountry(
    `/brand/theme1/${encodeURIComponent(
      brandName
    )}?brandType=${encodeURIComponent(brandType)}`
  )
);
};

 const handleBackToHome = () => {
  setSelectedDepartment(null);
  setSelectedBrandType(null);
  setExpandedDeptIndex(null);

 router.push(
  withCountry(
    `/brand/theme1/${encodeURIComponent(brandName)}`
  )
);
};

  const getTranslatedName = (item, itemId) => {
  if (currentLanguage === "en") {
    return item?.name || t("unnamed_item");
  }

  return (
    translations?.[itemId]?.[currentLanguage]?.name ||
    item?.name ||
    t("unnamed_item")
  );
};

  const isSameProduct = (a, b) => {
    if (!a || !b) return false;

    const aIds = [a?.id, a?.itemId].filter(Boolean).map(String);
    const bIds = [b?.id, b?.itemId].filter(Boolean).map(String);

    return aIds.some((id) => bIds.includes(id));
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();
    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  };

const getDisplayImage = (product) =>
  getProductDisplayImage(product, selectedColorByItem);

  const bestSellerVideo = useMemo(() => {
  return bestSeller ? getFirstVideoUrl(bestSeller) : null;
}, [bestSeller]);

  const shouldShowLargeBestSeller = !!bestSellerVideo && !hideBestSellerVideo;

const previewTopItems = topItems;

  const filteredTopItems = useMemo(() => {
    const withoutBestSeller = previewTopItems.filter(
      (item) => !isSameProduct(item, bestSeller)
    );

    return withoutBestSeller.filter((item, index, arr) => {
      return index === arr.findIndex((x) => isSameProduct(x, item));
    });
  }, [previewTopItems, bestSeller]);

  const shoeItems = useMemo(() => {
    return filteredTopItems.filter((item) => {
      const dept = item?.department?.trim()?.toLowerCase() || "";
      return (
        dept === "men-shoes" ||
        dept === "women-shoes" ||
        dept === "mwomen-shoes"
      );
    });
  }, [filteredTopItems]);

  const otherItems = useMemo(() => {
    return filteredTopItems.filter((item) => {
      const dept = item?.department?.trim()?.toLowerCase() || "";
      return (
        dept !== "men-shoes" &&
        dept !== "women-shoes" &&
        dept !== "mwomen-shoes"
      );
    });
  }, [filteredTopItems]);

 const getColorSwatch = (colorName = "") => {
  const key = String(colorName || "")
    .trim()
    .toLowerCase();

  return colors[key] || "#d1d5db";
};

const translateColor = (color) => {
  if (!color) return "";

  const raw = String(color).trim();

  const key = `color_${raw
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[-\s]+/g, "_")
    .replace(/_+/g, "_")}`;

  const namespace =
    i18n.options?.defaultNS || "translation";

  const translated = i18n.getResource(
    currentLanguage,
    namespace,
    key
  );

  return typeof translated === "string" &&
    translated.trim()
    ? translated
    : raw;
};

  const renderStars = (rating, item) => {
    const safeRating = Math.round(Number(rating) || 0);

    return (
      <div
        className="th1-stars-container"
        onClick={(e) => {
          e.stopPropagation();
          setItemData(item);
         router.push(withCountry(`product/${item.id}/review`));
        }}
        style={{ cursor: "pointer" }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < safeRating ? "th1-star filled" : "th1-star empty"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

const handleAddToBasket = async (
  product,
  e,
  explicitSize = null,
  explicitLength = null
) => {
  e?.stopPropagation();

  // Never allow demonstration products into the real basket.
if (product?.isMwsSample === true) {
  return;
}

  const currentUser = auth?.currentUser;

  if (!currentUser) {
    const currentPath = window.location.pathname;

    router.push(
      withCountry(
        `/auth?redirect=${encodeURIComponent(currentPath)}`
      )
    );
    return;
  }

  const colorOptions = getColorOptions(product);

  const color =
    selectedColorByItem[product.id] ||
    colorOptions[0] ||
    null;

  const sizes = getSizesForColor(product, color);

  // Open the modal when the product has sizes.
  if (sizes.length > 0 && !explicitSize) {
    setSelectedModalSize(null);
    setSelectedModalLength(null);
    setPendingBasketItem({ product, color, sizes });
    return;
  }

  if (addingToBasket) return;

  const selectedOption = sizes.find(
    (option) => option.value === explicitSize
  );

  if (sizes.length > 0 && !selectedOption) {
    messageApi.error(t("select_size"));
    return;
  }

  const availableLengths = selectedOption?.lengths || [];

  if (
    availableLengths.length > 0 &&
    !availableLengths.includes(explicitLength)
  ) {
    messageApi.error(t("select_length", "Select a length"));
    return;
  }

  const basePrice = Number(product.usdPrice || 0);
  const price = selectedOption?.price ?? basePrice;
  const image = getDisplayImage(product);

  try {
    setAddingToBasket(true);

    const response = await axios.post(BASKET_API, {
      userId: currentUser.uid,
      item: {
        id: product.id,
        itemId: product.itemId,
        name: product.name,
        price,
        color,
        size: explicitSize,
        length: explicitLength || null,
        image,
        brand: product.rawItem?.item?.brand || brandName,
        quantity: 1,
      },
    });

    if (response.status === 200 || response.status === 201) {
      if (Array.isArray(response.data?.basket)) {
        setBasketItems(response.data.basket);
      } else {
        await fetchUserBasket();
      }

      setPendingBasketItem(null);
      setSelectedModalSize(null);
      setSelectedModalLength(null);

      messageApi.success(
        t("basket_add_success", {
          product: getTranslatedName(product, product.itemId),
        })
      );
    }
  } catch (error) {
    console.error("Theme1 basket error:", error);
    messageApi.error(t("basket_add_error"));
  } finally {
    setAddingToBasket(false);
  }
};

 
const renderProductCard = (item, options = {}) => (
  <ProductCard
    key={item.id}
    item={item}
    options={options}
    selectedColorByItem={selectedColorByItem}
    getDisplayImage={getDisplayImage}
    reviews={reviews}
    pendingBasketItem={pendingBasketItem}
    addingToBasket={addingToBasket}
    setPendingBasketItem={setPendingBasketItem}
    setSelectedModalSize={setSelectedModalSize}
    setSelectedModalLength={setSelectedModalLength}
    selectedModalSize={selectedModalSize}
    selectedModalLength={selectedModalLength}
    handleAddToBasket={handleAddToBasket}
    formatPrice={formatPrice}
    convertUsd={convertUsd}
    getTranslatedName={getTranslatedName}
    translateColor={translateColor}
    getColorSwatch={getColorSwatch}
    handleColorSelect={handleColorSelect}
    renderStars={renderStars}
    getBasketQuantity={getBasketQuantity}
    router={router}
    withCountry={withCountry}
    t={t}
  />
);

const renderBestSellerCard = () => (
  <BestSellerCard
    bestSeller={bestSeller}
    shouldShowLargeBestSeller={shouldShowLargeBestSeller}
    reviews={reviews}
    bestSellerVideo={bestSellerVideo}
    setHideBestSellerVideo={setHideBestSellerVideo}
    router={router}
    withCountry={withCountry}
    t={t}
    getDisplayImage={getDisplayImage}
    formatPrice={formatPrice}
    convertUsd={convertUsd}
    getTranslatedName={getTranslatedName}
    selectedColorByItem={selectedColorByItem}
    translateColor={translateColor}
    getColorSwatch={getColorSwatch}
    handleColorSelect={handleColorSelect}
    renderStars={renderStars}
    handleAddToBasket={handleAddToBasket}
    getBasketQuantity={getBasketQuantity}
  />
);

const renderBestSellerSmallCard = () => {
  const hasValidBestSeller =
    bestSeller &&
    (bestSeller.id || bestSeller.itemId) &&
    bestSeller.name &&
    String(bestSeller.name).trim() !== "";

  if (!hasValidBestSeller) {
    return null;
  }

  return renderProductCard(bestSeller, {
    badgeText: t("best_seller"),
  });
};

const renderDepartmentItems = () => (
  <DepartmentItems
    selectedDepartment={selectedDepartment}
    selectedBrandType={selectedBrandType}
    departmentItemsLoading={departmentItemsLoading}
    departmentItemsError={departmentItemsError}
    brandItems={brandItems}
    isDesktop={isDesktop}
    handleBackToHome={handleBackToHome}
    renderProductCard={renderProductCard}
    t={t}
  />
);

  return (
    <div className="th1-wrapper">
        {contextHolder}
    {isDesktop ? (
        <div className="th1-container">
          <aside className="th1-sidebar">
            <div className="th1-sidebar-inner">
           {brandDetails?.logo && (
  <img
    src={brandDetails.logo}
    alt={`${brandName} Logo`}
    className="th1-logo"
  />
)}

              <div className="th1-sidebar-title">
               {t("departments_label")}
              </div>             
<DepartmentSidebar
  departments={departments}
  selectedDepartment={selectedDepartment}
  selectedBrandType={selectedBrandType}
  onBrandTypeClick={handleBrandTypeClick}
  t={t}
/>
            </div>
          </aside>

          <main className="th1-main">
           {brandDetails?.headerImage && (
  <img
    src={brandDetails.headerImage}
    alt={`${brandName} Header`}
    className="th1-header-image"
  />
)}

            {selectedDepartment && selectedBrandType ? (
              renderDepartmentItems()
            ) : (
             <>
  {shouldShowLargeBestSeller ? (
    <>
      {shoeItems.length > 0 && (
        <div className="th1-item-grid">
          {shoeItems.map((item) =>
            renderProductCard(item, { isTop: true })
          )}
        </div>
      )}

      {renderBestSellerCard()}

      {otherItems.length > 0 && (
        <div className="th1-item-grid">
          {otherItems.map((item) =>
            renderProductCard(item, { isTop: true })
          )}
        </div>
      )}
    </>
  ) : (
    /* No video: best seller and top products share one grid */
    <div className="th1-item-grid">
      {renderBestSellerSmallCard()}

      {shoeItems.map((item) =>
        renderProductCard(item, { isTop: true })
      )}

      {otherItems.map((item) =>
        renderProductCard(item, { isTop: true })
      )}
    </div>
  )}
</>
            )}
          </main>
        </div>
      ) : (
        <div className="th1-mobile">
        
<div className="th1-mobile-brand">
  {brandDetails?.logo && (
    <img
      src={brandDetails.logo}
      alt={`${brandName} Logo`}
      className="th1-mobile-logo"
    />
  )}

  <div className="th1-mobile-brand-info">
    <h1>{brandName}</h1>
    <span>Official Brand Store</span>
  </div>
</div>

{brandDetails?.headerImage && (
  <div className="th1-mobile-hero">
    <img
      src={brandDetails.headerImage}
      alt={`${brandName} Header`}
      className="th1-mobile-hero-image"
    />
  </div>
)}

<MobileNavigation
  departments={departments}
  expandedDeptIndex={expandedDeptIndex}
  setExpandedDeptIndex={setExpandedDeptIndex}
  selectedDepartment={selectedDepartment}
  selectedBrandType={selectedBrandType}
  handleBrandTypeClick={handleBrandTypeClick}
  t={t}
/>

{selectedDepartment && selectedBrandType ? (
  renderDepartmentItems()
) : (
  <>
    {shouldShowLargeBestSeller ? (
      <>
        {shoeItems.length > 0 && (
          <div className="th1-item-grid mobile">
            {shoeItems.map((item) =>
              renderProductCard(item, { isTop: true })
            )}
          </div>
        )}

        {renderBestSellerCard()}

        {otherItems.length > 0 && (
          <div className="th1-item-grid mobile">
            {otherItems.map((item) =>
              renderProductCard(item, { isTop: true })
            )}
          </div>
        )}
      </>
    ) : (
      <div className="th1-item-grid mobile">
        {renderBestSellerSmallCard()}

        {shoeItems.map((item) =>
          renderProductCard(item, { isTop: true })
        )}

        {otherItems.map((item) =>
          renderProductCard(item, { isTop: true })
        )}
      </div>
    )}
  </>
)}
        </div>
      )}
    </div>
  );
}

export default Theme1;