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
import { fetchMwsSampleProducts } from "./mwsSampleProducts";
import {
  getCountryConfig,
  isSupportedLanguage,
} from "@/components/countryUtils";

const BASE_URL = "https://api.malidag.com";
const BASKET_API =
  "https://api.malidag.com/add-to-basket";

 const MWS_SAMPLE_PRODUCTS = [
  {
    id: "mws-sample-1",
    itemId: "mws-sample-1",
    name: "Classic Cotton T-Shirt",
    usdPrice: 29.99,
    originalPrice: 39.99,
    department: "men",
    brandType: "Clothing",
    image: "/fallback.png",
    isMwsSample: true,
  },
  {
    id: "mws-sample-2",
    itemId: "mws-sample-2",
    name: "Everyday Sneakers",
    usdPrice: 79.99,
    originalPrice: 0,
    department: "men",
    brandType: "Shoes",
    image: "/fallback.png",
    isMwsSample: true,
  },
  {
    id: "mws-sample-3",
    itemId: "mws-sample-3",
    name: "Elegant Summer Dress",
    usdPrice: 59.99,
    originalPrice: 0,
    department: "women",
    brandType: "Clothing",
    image: "/fallback.png",
    isMwsSample: true,
  },
  {
    id: "mws-sample-4",
    itemId: "mws-sample-4",
    name: "Classic Shoulder Bag",
    usdPrice: 89.99,
    originalPrice: 109.99,
    department: "women",
    brandType: "Bags",
    image: "/fallback.png",
    isMwsSample: true,
  },
  {
    id: "mws-sample-5",
    itemId: "mws-sample-5",
    name: "Kids Casual Jacket",
    usdPrice: 39.99,
    originalPrice: 0,
    department: "kids",
    brandType: "Clothing",
    image: "/fallback.png",
    isMwsSample: true,
  },
  {
    id: "mws-sample-6",
    itemId: "mws-sample-6",
    name: "Minimalist Watch",
    usdPrice: 119.99,
    originalPrice: 0,
    department: "men",
    brandType: "Accessories",
    image: "/fallback.png",
    isMwsSample: true,
  },
];

const uniqueMwsProducts = (products) => {
  const seen = new Set();

  return products.filter((product) => {
    if (!product) return false;

    const key = String(
      product.folderId ||
      product.itemId ||
      product.id ||
      ""
    );

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

function Theme1({ brandName }) {
  const router = useRouter();
const searchParams = useSearchParams();

const requestedBrandType =
  searchParams.get("brandType");
  const isMwsPreview =
  searchParams.get("mwsPreview") === "1";
  const isMwsEditMode =
  isMwsPreview &&
  searchParams.get("mwsEdit") === "1";
  const { isDesktop } = useScreenSize();
  const { t } = useTranslation();
  const setItemData = useCheckoutStore((state) => state.setItemData);

  const [departments, setDepartments] = useState([]);
  const [mwsCustomDepartments, setMwsCustomDepartments] = useState([]);
const [mwsDepartmentsLoaded, setMwsDepartmentsLoaded] = useState(false);

const mwsDepartmentStorageKey = `mws:departments:${encodeURIComponent(
  String(brandName || "").trim().toLowerCase()
)}`;

useEffect(() => {
  if (!isMwsEditMode || !brandName) {
    setMwsCustomDepartments([]);
    setMwsDepartmentsLoaded(false);
    return;
  }

  try {
    const saved = JSON.parse(
      localStorage.getItem(mwsDepartmentStorageKey) || "[]"
    );

    setMwsCustomDepartments(
      Array.isArray(saved)
        ? saved.filter(
            (department) =>
              typeof department?.name === "string" &&
              Array.isArray(department?.brandTypes)
          )
        : []
    );
  } catch (error) {
    console.error("Failed to load MWS departments:", error);
    setMwsCustomDepartments([]);
  }

  setMwsDepartmentsLoaded(true);
}, [isMwsEditMode, brandName, mwsDepartmentStorageKey]);

useEffect(() => {
  if (!isMwsEditMode || !mwsDepartmentsLoaded) return;

  try {
    localStorage.setItem(
      mwsDepartmentStorageKey,
      JSON.stringify(mwsCustomDepartments)
    );
  } catch (error) {
    console.error("Failed to save MWS departments:", error);
  }
}, [
  isMwsEditMode,
  mwsDepartmentsLoaded,
  mwsDepartmentStorageKey,
  mwsCustomDepartments,
]);

const displayedDepartments = useMemo(() => {
  if (!isMwsEditMode) return departments;

  const merged = departments.map((department) => ({
    ...department,
    brandTypes: [...(department.brandTypes || [])],
  }));

  const normalize = (value) =>
    String(value || "").trim().toLowerCase();

  mwsCustomDepartments.forEach((custom) => {
    const existing = merged.find(
      (department) =>
        normalize(department.name) === normalize(custom.name)
    );

    if (!existing) {
      merged.push({
        name: custom.name,
        brandTypes: [...custom.brandTypes],
      });
      return;
    }

    custom.brandTypes.forEach((brandType) => {
      if (
        !existing.brandTypes.some(
          (value) => normalize(value) === normalize(brandType)
        )
      ) {
        existing.brandTypes.push(brandType);
      }
    });
  });

  return merged;
}, [departments, mwsCustomDepartments, isMwsEditMode]);
  const MWS_SAMPLE_DEPARTMENTS = [
  {
    name: "men",
    brandTypes: [
      "Clothing",
      "Shoes",
      "Accessories",
    ],
  },
  {
    name: "women",
    brandTypes: [
      "Clothing",
      "Shoes",
      "Bags",
      "Accessories",
    ],
  },
  {
    name: "kids",
    brandTypes: [
      "Clothing",
      "Shoes",
    ],
  },
];
  const [topItems, setTopItems] = useState([]);
  const [mwsApiProducts, setMwsApiProducts] = useState([]);
  const [showMwsSamples, setShowMwsSamples] = useState(true);
  const [mwsCustomSamples, setMwsCustomSamples] = useState([]);
  const [mwsProductsLoaded, setMwsProductsLoaded] = useState(false);
  const mwsImagePreviewUrlsRef = useRef(new Set());

useEffect(() => {
  const previewUrls = mwsImagePreviewUrlsRef.current;

  return () => {
    previewUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    previewUrls.clear();
  };
}, []);
  const [editingMwsSampleId, setEditingMwsSampleId] = useState(null);
  const [isMwsEditorPanelOpen, setIsMwsEditorPanelOpen] = useState(false);
  const [isMwsProductSaving, setIsMwsProductSaving] = useState(false);
  const mwsPendingSaveRequestRef = useRef(null);
  const [messageApi, contextHolder] =
  message.useMessage();
  useEffect(() => {
  if (!isMwsEditMode) return;

  const handleMwsSaveResponse = (event) => {
    if (event.origin !== "https://mws.malidag.com") return;
    if (event.source !== window.parent) return;

    const data = event.data;

    if (!data || data.type !== "MWS_SAVE_PRODUCT_RESULT") return;

    const pending = mwsPendingSaveRequestRef.current;

    if (!pending || data.requestId !== pending.requestId) return;

    mwsPendingSaveRequestRef.current = null;
    setIsMwsProductSaving(false);

    if (!data.success) {
      messageApi.error(data.error || "Failed to save product.");
      return;
    }

    const folderId = data.product?.folderId;

    if (!folderId) {
      messageApi.error("Save response is missing the product ID.");
      return;
    }

   
const savedProduct = data.product || {};

const returnedImage =
  savedProduct.imageUrl ||
  savedProduct.images?.[0] ||
  null;

const serverImageUrl =
  typeof returnedImage === "string"
    ? returnedImage
    : returnedImage?.url || null;

setMwsCustomSamples((previous) =>
  previous.map((sample) => {
    if (sample.id !== pending.sampleId) {
      return sample;
    }

    // Keep the local image preview if the server
    // has not returned a usable image URL.
    const nextImages = serverImageUrl
      ? [
          serverImageUrl,
          ...(sample.images || []).slice(1),
        ]
      : sample.images || [];

    return {
      ...sample,

      folderId,
      itemId: folderId,
      isMwsSavedProduct: true,
      status: savedProduct.status || sample.status || "draft",

      // The editor already contains the latest text.
      name: sample.name,
      itemSubName: sample.itemSubName,
      itemDetailText: sample.itemDetailText,
      productDetail01: sample.productDetail01,
      productDetail02: sample.productDetail02,

      // Do not remove the local image prematurely.
      images: nextImages,

      imagePreviewUrl: serverImageUrl
        ? null
        : sample.imagePreviewUrl,

      imageFile: serverImageUrl
        ? null
        : sample.imageFile,
    };
  })
);


    messageApi.success("Product saved as draft.");
  };

  window.addEventListener("message", handleMwsSaveResponse);

  return () => {
    window.removeEventListener("message", handleMwsSaveResponse);
  };
}, [isMwsEditMode, messageApi]);
  const [bestSeller, setBestSeller] = useState(null);
  const [brandItems, setBrandItems] = useState([]);
  const [mwsStorefrontItems, setMwsStorefrontItems] = useState([]);
  const [departmentItemsLoading, setDepartmentItemsLoading] = useState(false);
  const [departmentItemsError, setDepartmentItemsError] = useState(null);
  const [hideBestSellerVideo, setHideBestSellerVideo] = useState(false);
  const [reviews, setReviews] = useState({});

  const [brandDetails, setBrandDetails] = useState({
    headerImage: null,
    logo: null,
  });

  const { country } = useContext(AppContext);

  const countryCode =
  country?.code?.toLowerCase() || null;

const withCountry = (path) => {
  if (!countryCode) return "/";

  if (!path) {
    return `/${countryCode}`;
  }

  return `/${countryCode}${
    path.startsWith("/") ? path : `/${path}`
  }`;
};

const [basketItems, setBasketItems] = useState([]);

const [rates, setRates] = useState(null);

const currentLanguage =
  isSupportedLanguage(i18n.language)
    ? i18n.language
    : "en";

const currencyConfig = useMemo(
  () => getCountryConfig(country?.name || ""),
  [country?.name]
);

  const [expandedDeptIndex, setExpandedDeptIndex] = useState(null);
  const [translations, setTranslations] = useState({});
  const [selectedColorByItem, setSelectedColorByItem] = useState({});
const [pendingBasketItem, setPendingBasketItem] = useState(null);
const [selectedModalSize, setSelectedModalSize] = useState(null);
const [selectedModalLength, setSelectedModalLength] = useState(null);
const [addingToBasket, setAddingToBasket] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedBrandType, setSelectedBrandType] = useState(null);

  useEffect(() => {
  if (!isMwsPreview) {
    setMwsApiProducts([]);
    return;
  }

  let cancelled = false;

  fetchMwsSampleProducts()
    .then((products) => {
      if (!cancelled) {
        setMwsApiProducts(products);
      }
    })
    .catch((error) => {
      console.error("MWS sample products error:", error);

      if (!cancelled) {
        setMwsApiProducts([]);
      }
    });

  return () => {
    cancelled = true;
  };
}, [isMwsPreview]);


useEffect(() => {
  if (!isMwsEditMode) return;

  const handleProductUpdated = (event) => {
    if (event.origin !== "https://mws.malidag.com") return;
    if (event.source !== window.parent) return;

    const data = event.data;

    if (data?.type !== "MWS_PRODUCT_UPDATED") return;

    const product = data.product;
    if (!product?.folderId) return;

    const fields = product.textFields || {};

    setMwsCustomSamples((previous) =>
      previous.map((sample) => {
        if (
          String(sample.folderId || "") !==
          String(product.folderId)
        ) {
          return sample;
        }

        const serverImage =
          product.imageUrl ||
          product.images?.[0] ||
          null;

        const imageUrl =
          typeof serverImage === "string"
            ? serverImage
            : serverImage?.url || null;

        return {
          ...sample,

          name: fields.itemName ?? sample.name,
          itemSubName:
            fields.itemSubName ?? sample.itemSubName,
          category: fields.category ?? sample.category,
          department:
            fields.department ?? sample.department,
          brandType:
            fields.brandType ?? sample.brandType,

          usdPrice:
            fields.usdText != null
              ? Number(fields.usdText)
              : sample.usdPrice,

          originalPrice:
            fields.originalPrice != null
              ? Number(fields.originalPrice)
              : sample.originalPrice,

          itemDetailText:
            fields.itemDetailText ?? sample.itemDetailText,

          productDetail01:
            fields.productDetail01 ?? sample.productDetail01,

          productDetail02:
            fields.productDetail02 ?? sample.productDetail02,

          images: imageUrl
            ? [imageUrl, ...(sample.images || []).slice(1)]
            : sample.images,

          status: product.status ?? sample.status,
        };
      })
    );
  };

  window.addEventListener("message", handleProductUpdated);

  return () => {
    window.removeEventListener(
      "message",
      handleProductUpdated
    );
  };
}, [isMwsEditMode]);


useEffect(() => {
  if (!isMwsEditMode) return;

  const handleSavedProducts = (event) => {
    if (event.origin !== "https://mws.malidag.com") return;
    if (event.source !== window.parent) return;

    const data = event.data;

    if (data?.type !== "MWS_SAVED_PRODUCTS") return;
    if (!Array.isArray(data.products)) return;

    console.log(
  "Theme1 received MWS products:",
  event.data.products.length
);

    const restoredProducts = data.products
      .filter((product) => product?.folderId)
      .map((product) => {
        const fields = product.textFields || {};

        return {
          id: `mws-saved-${product.folderId}`,
          itemId: product.folderId,
          folderId: product.folderId,
          status: product.status,

          name: fields.itemName || "Unnamed Product",
          itemSubName: fields.itemSubName || "",
          category: fields.category || "",
          department: fields.department || "men",
          brandType: fields.brandType || "Clothing",
          genre: fields.genre || "",
          type: fields.type || "",

          usdPrice: Number(fields.usdText) || 0,
          originalPrice: Number(fields.originalPrice) || 0,

          numberItemText: fields.numberItemText || "",
          itemDetailText: fields.itemDetailText || "",
          productDetail01: fields.productDetail01 || "",
          productDetail02: fields.productDetail02 || "",

          images: product.images || [],
          imagesVariants: {},
          videos: [],
          size: {},
          rating: 0,

          isMwsSample: true,
          isMwsCustomSample: true,
          isMwsSavedProduct: true,
        };
      });

   setMwsCustomSamples((previous) => {

    console.table(
  restoredProducts.map((product) => ({
    folderId: product.folderId,
    name: product.name,
    price: product.usdPrice,
    placement: product.placement,
    source: "MWS_SAVED_PRODUCTS",
  }))
);

  const previousByFolderId = new Map(
    previous
      .filter((product) => product.folderId)
      .map((product) => [
        String(product.folderId),
        product,
      ])
  );

  const synchronizedProducts = restoredProducts.map(
    (serverProduct) => {
      const existing = previousByFolderId.get(
        String(serverProduct.folderId)
      );

      if (!existing) {
        return serverProduct;
      }

      if (
  mwsPendingSaveRequestRef.current?.sampleId ===
  existing.id
) {
  return existing;
}

      // Preserve the product's React identity.
      // Keep its placement and temporary image preview.
      return {
        ...serverProduct,
        id: existing.id,
        placement:
          existing.placement ??
          serverProduct.placement,

        ...(existing.imageFile
          ? {
              images: existing.images,
              imageFile: existing.imageFile,
              imagePreviewUrl: existing.imagePreviewUrl,
            }
          : {}),
      };
    }
  );

  const unsavedProducts = previous.filter(
    (product) => !product.folderId
  );

  return [
    ...synchronizedProducts,
    ...unsavedProducts,
  ];
});

    setMwsProductsLoaded(true);
  };

  window.addEventListener("message", handleSavedProducts);

  window.parent.postMessage(
    { type: "MWS_REQUEST_SAVED_PRODUCTS" },
    "https://mws.malidag.com"
  );

  return () => {
    window.removeEventListener("message", handleSavedProducts);
  };
}, [isMwsEditMode]);


useEffect(() => {
  if (!isMwsPreview) return;

  const handleStorefrontData = (event) => {
    if (event.origin !== "https://mws.malidag.com") return;
    if (event.source !== window.parent) return;

    const data = event.data;

    if (data?.type !== "MWS_STOREFRONT_DATA") return;

    if (
      String(data.brandName || "").trim().toLowerCase() !==
      String(brandName || "").trim().toLowerCase()
    ) {
      return;
    }

    if (
      !Array.isArray(data.topItems) ||
      !Array.isArray(data.departments)
    ) {
      return;
    }

    const normalizeMwsProduct = (product) => {
      const item = product?.item || {};
      const details = product?.details || {};

      return {
       id: product?.id || product?.itemId || product?.folderId || "",
itemId: product?.itemId || product?.id || product?.folderId || "",
        name: item.name || details.itemName || "",
        images: Array.isArray(item.images) ? item.images : [],
        videos: Array.isArray(item.videos) ? item.videos : [],
        department: item.department || details.department || "",
        brandType: item.brandType || details.brandType || "",
        usdPrice: Number(item.usdPrice ?? details.usdText ?? 0),
        originalPrice: Number(
          item.originalPrice ?? details.originalPrice ?? 0
        ),
        size: item.size || {},
        rating: Number(item.rating || 0),
        imagesVariants: item.imagesVariants || {},
        rawItem: product,
      };
    };

    const normalizedTopItems =
      data.topItems.map(normalizeMwsProduct);

    const normalizedBestSeller =
      data.bestSeller
        ? normalizeMwsProduct(data.bestSeller)
        : null;

   const normalizedProducts = Array.isArray(data.products)
  ? data.products.map(normalizeMwsProduct)
  : [];

setTopItems(normalizedTopItems);
setBestSeller(normalizedBestSeller);
setDepartments(data.departments);
setMwsStorefrontItems(normalizedProducts);

    console.log("Theme1 received MWS storefront data:", {
      topItems: normalizedTopItems.length,
      bestSeller: normalizedBestSeller?.itemId || null,
      departments: data.departments.length,
    });
  };

  window.addEventListener("message", handleStorefrontData);

  window.parent.postMessage(
    { type: "MWS_REQUEST_STOREFRONT_DATA" },
    "https://mws.malidag.com"
  );

  return () => {
    window.removeEventListener("message", handleStorefrontData);
  };
}, [isMwsPreview, brandName]);


  const normalizeTopItem = (product) => ({
    id: product?.id || "",
    itemId: product?.itemId || "",
    name: product?.name || "",
    images: Array.isArray(product?.images) ? product.images : [],
    videos: Array.isArray(product?.videos) ? product.videos : [],
    department: product?.department || "",
    brandType: product?.brandType || "",
    size: product?.size || {},
    usdPrice: product?.usdPrice || product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    rating: product?.rating || 0,
    imagesVariants: product?.imagesVariants || {},
  });

  const normalizeBestSeller = (product) => {
    const source = product?.item || {};

    return {
      id: product?.id || "",
      itemId: product?.itemId || "",
      name: source?.name || "",
      images: Array.isArray(source?.images) ? source.images : [],
      videos: Array.isArray(source?.videos) ? source.videos : [],
      department: source?.department || product?.details?.department || "",
      brandType: source?.brandType || product?.details?.brandType || "",
      usdPrice: source?.usdPrice || product?.usdPrice || 0,
      originalPrice: source?.originalPrice || product?.originalPrice || 0,
      size: source?.size || {},
      rating: source?.rating || product?.rating || 0,
      imagesVariants: source?.imagesVariants || {},
      rawItem: product,
    };
  };

  const normalizeBrandItem = (product) => {
    const source = product?.item || {};

    return {
      id: product?.id || "",
      itemId: product?.itemId || source?.id || "",
      name: source?.name || "",
      images: Array.isArray(source?.images) ? source.images : [],
      videos: Array.isArray(source?.videos) ? source.videos : [],
      department: source?.department || "",
      brandType: source?.brandType || "",
      size: source?.size || {},
      usdPrice: source?.usdPrice || product?.usdPrice || 0,
      originalPrice: source?.originalPrice || product?.originalPrice || 0,
      rating: source?.rating || product?.rating || 0,
      imagesVariants: source?.imagesVariants || {},
      rawItem: product,
    };
  };

 const getSizesForColor = (product, color) => {
  const sizeMap = product?.size || product?.rawItem?.item?.size || {};

  const keys = Object.keys(sizeMap);

  const key = keys.find(
    (key) =>
      key.trim().toLowerCase() ===
      String(color || "").trim().toLowerCase()
  );

  const selectedKey = key || (!color && keys.length === 1 ? keys[0] : null);

  if (!selectedKey) return [];

  const entries = Array.isArray(sizeMap[selectedKey])
    ? sizeMap[selectedKey]
    : [sizeMap[selectedKey]];

  const options = new Map();

  const splitValues = (value) =>
    (Array.isArray(value) ? value : String(value ?? "").split(/[,;]|\.(?=\s*\d)/))
      .map((part) => String(part).trim())
      .filter(Boolean);

  entries.forEach((entry) => {
    const rawSizes =
      typeof entry === "object" && entry !== null
        ? entry.value
        : entry;

    const rawLengths =
      typeof entry === "object" && entry !== null
        ? entry.length
        : null;

    const price =
      typeof entry === "object" &&
      entry !== null &&
      entry.price != null &&
      entry.price !== ""
        ? Number(entry.price)
        : null;

    const lengths = splitValues(rawLengths);

    splitValues(rawSizes).forEach((value) => {
      if (!options.has(value)) {
        options.set(value, {
          value,
          price: Number.isFinite(price) && price > 0 ? price : null,
          lengths: [...lengths],
        });
      } else {
        const existing = options.get(value);

        existing.lengths = [
          ...new Set([...existing.lengths, ...lengths]),
        ];
      }
    });
  });

  return [...options.values()];
};

  const fetchUserBasket = async () => {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    setBasketItems([]);
    return;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/basket/${currentUser.uid}`
    );

    setBasketItems(
      response.data?.basket || []
    );
  } catch (error) {
    console.error(
      "Error fetching basket:",
      error
    );

    setBasketItems([]);
  }
};

useEffect(() => {
  const unsubscribe =
    auth.onAuthStateChanged(() => {
      fetchUserBasket();
    });

  return () => unsubscribe();
}, []);

const getBasketQuantity = (itemId) =>
  basketItems
    .filter(
      (entry) =>
        String(entry?.itemId ?? entry?.item?.itemId) === String(itemId)
    )
    .reduce(
      (total, entry) =>
        total + Number(entry?.quantity ?? entry?.item?.quantity ?? 0),
      0
    );

const isItemInBasket = (itemId) =>
  getBasketQuantity(itemId) > 0;

  const fetchTranslation = async (productId, lang) => {
    if (!productId || translations?.[productId]?.[lang]) return;

    try {
      const response = await fetch(
        `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
      );
      const data = await response.json();

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: data?.translation || {},
        },
      }));
    } catch (error) {
      console.error(`Error fetching translation for product ${productId}`, error);
    }
  };

  const fetchReviews = async (productId) => {
    if (!productId || reviews[productId]) return;

    try {
      const response = await fetch(
        `https://api.malidag.com/get-reviews/${productId}`
      );
      const data = await response.json();

      const reviewList = Array.isArray(data?.reviews) ? data.reviews : [];
      const total = reviewList.reduce(
        (sum, review) => sum + Number(review?.rating || 0),
        0
      );
      const finalRating = reviewList.length > 0 ? total / reviewList.length : 0;

      setReviews((prev) => ({
        ...prev,
        [productId]: {
          rating: finalRating,
          count: reviewList.length,
          reviews: reviewList,
        },
      }));
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}`, error);
      setReviews((prev) => ({
        ...prev,
        [productId]: {
          rating: 0,
          count: 0,
          reviews: [],
        },
      }));
    }
  };

 useEffect(() => {
  if (currentLanguage === "en") {
    return;
  }

  topItems.forEach((item) => {
    if (item?.itemId) {
      fetchTranslation(
        item.itemId,
        currentLanguage
      );
    }
  });

  if (bestSeller?.itemId) {
    fetchTranslation(
      bestSeller.itemId,
      currentLanguage
    );
  }

  brandItems.forEach((item) => {
    if (item?.itemId) {
      fetchTranslation(
        item.itemId,
        currentLanguage
      );
    }
  });
}, [
  topItems,
  bestSeller,
  brandItems,
  currentLanguage,
]);

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
    topItems.forEach((item) => {
      if (item?.itemId) fetchReviews(item.itemId);
    });
  }, [topItems]);

  useEffect(() => {
    brandItems.forEach((item) => {
      if (item?.itemId) fetchReviews(item.itemId);
    });
  }, [brandItems]);

  useEffect(() => {
    if (bestSeller?.itemId) {
      fetchReviews(bestSeller.itemId);
    }
  }, [bestSeller]);

  useEffect(() => {
    const fetchBrandDetails = async () => {
      try {
        const res = await fetch("https://api.malidag.com/api/brands/themes");
        const data = await res.json();

        const brand = Array.isArray(data)
          ? data.find(
              (b) =>
                b?.brandName?.trim()?.toLowerCase() ===
                brandName?.trim()?.toLowerCase()
            )
          : null;

        if (brand) {
          setBrandDetails({
            headerImage: brand?.headerImage || null,
            logo: brand?.logo || null,
          });
        }
      } catch (err) {
        console.error("Error fetching brand theme:", err);
      }
    };

    fetchBrandDetails();
  }, [brandName]);

 useEffect(() => {
  if (isMwsPreview) {
  setDepartments([]);
  return;
}
  if (!brandName || !countryCode) {
    setDepartments([]);
    return;
  }

  fetch(
    `${BASE_URL}/api/brands/${encodeURIComponent(
      brandName
    )}?country=${encodeURIComponent(
      countryCode
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
     const actualDepartments = Array.isArray(data?.departments)
  ? data.departments
  : [];

setDepartments(
  isMwsPreview && actualDepartments.length === 0
    ? MWS_SAMPLE_DEPARTMENTS
    : actualDepartments
);
    })
    .catch((error) => {
      console.error(
        "Error fetching departments:",
        error
      );

      setDepartments([]);
    });
}, [brandName, countryCode, isMwsPreview]);

  useEffect(() => {
  if (
    !requestedBrandType ||
   !displayedDepartments.length
  ) {
    return;
  }

  const targetBrandType =
    requestedBrandType
      .trim()
      .toLowerCase();

  const matchingDepartment =
   displayedDepartments.find((department) =>
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
  displayedDepartments,
]);

 useEffect(() => {
  if (isMwsPreview) {
  setTopItems([]);
  return;
}
  if (!brandName || !countryCode) return;

  fetch(
    `${BASE_URL}/api/brands/${encodeURIComponent(
      brandName
    )}/top-items?country=${encodeURIComponent(
      countryCode
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      const normalized = Array.isArray(data)
        ? data.map(normalizeTopItem)
        : [];

      const initialColors = {};

      normalized.forEach((product) => {
        const colorKeys = Object.keys(
          product?.imagesVariants || {}
        );

        if (colorKeys.length > 0) {
          initialColors[product.id] =
            colorKeys[0];
        }
      });

      setSelectedColorByItem((prev) => ({
        ...initialColors,
        ...prev,
      }));

      setTopItems(normalized);
    })
    .catch((error) => {
      console.error(
        "Error fetching top items:",
        error
      );

      setTopItems([]);
    });
}, [brandName, countryCode, isMwsPreview]);

  useEffect(() => {

    if (isMwsPreview) {
  setBestSeller(null);
  return;
}

  if (!brandName || !countryCode) return;

  fetch(
    `${BASE_URL}/api/brands/${encodeURIComponent(
      brandName
    )}/best-seller?country=${encodeURIComponent(
      countryCode
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      const normalized = data
        ? normalizeBestSeller(data)
        : null;

      if (normalized) {
        const colorKeys = Object.keys(
          normalized?.imagesVariants || {}
        );

        if (colorKeys.length > 0) {
          setSelectedColorByItem((prev) => ({
            ...prev,
            [normalized.id]:
              prev[normalized.id] ||
              colorKeys[0],
          }));
        }
      }

      setBestSeller(normalized);
    })
    .catch((error) => {
      console.error(
        "Error fetching best seller:",
        error
      );

      setBestSeller(null);
    });
}, [brandName, countryCode, isMwsPreview]);

 
useEffect(() => {
  if (isMwsPreview) {
    if (!selectedDepartment || !selectedBrandType) {
      setBrandItems([]);
      setDepartmentItemsError(null);
      setDepartmentItemsLoading(false);
      return;
    }

    const normalizeText = (value) =>
      String(value || "").trim().toLowerCase();

    const filteredProducts = mwsStorefrontItems.filter(
      (product) =>
        normalizeText(product.department) ===
          normalizeText(selectedDepartment) &&
        normalizeText(product.brandType) ===
          normalizeText(selectedBrandType)
    );

    setBrandItems(filteredProducts);
    setDepartmentItemsError(null);
    setDepartmentItemsLoading(false);
    return;
  }

  if (
    !selectedDepartment ||
    !selectedBrandType ||
    !brandName ||
    !countryCode
  ) {
    setBrandItems([]);
    setDepartmentItemsError(null);
    setDepartmentItemsLoading(false);
    return;
  }

  let cancelled = false;

  setDepartmentItemsLoading(true);
  setDepartmentItemsError(null);

  fetch(
    `${BASE_URL}/api/brands/${encodeURIComponent(
      brandName
    )}/items?country=${encodeURIComponent(countryCode)}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load items");
      }

      return response.json();
    })
    .then((data) => {
      if (cancelled) return;

      const list = Array.isArray(data) ? data : [];

      const normalizeText = (value) =>
        String(value || "").trim().toLowerCase();

      const normalized = list
        .map(normalizeBrandItem)
        .filter(
          (item) =>
            normalizeText(item.department) ===
              normalizeText(selectedDepartment) &&
            normalizeText(item.brandType) ===
              normalizeText(selectedBrandType)
        );

      const initialColors = {};

      normalized.forEach((product) => {
        const colorKeys = Object.keys(
          product?.imagesVariants || {}
        );

        if (colorKeys.length > 0) {
          initialColors[product.id] = colorKeys[0];
        }
      });

      setSelectedColorByItem((previous) => ({
        ...initialColors,
        ...previous,
      }));

      setBrandItems(normalized);
      setDepartmentItemsLoading(false);
    })
    .catch((error) => {
      if (cancelled) return;

      console.error(
        "Error fetching department items:",
        error
      );

      setBrandItems([]);
      setDepartmentItemsError(
        error?.message || "Failed to load items"
      );
      setDepartmentItemsLoading(false);
    });

  return () => {
    cancelled = true;
  };
}, [
  isMwsPreview,
  mwsStorefrontItems,
  selectedDepartment,
  selectedBrandType,
  brandName,
  countryCode,
]);


  useEffect(() => {
    setHideBestSellerVideo(false);
  }, [bestSeller?.id]);

  const getCurrencyRate = () => {
  if (!currencyConfig || !rates) {
    return null;
  }

  if (currencyConfig.currency === "USD") {
    return 1;
  }

  const rate = Number(
    rates?.[currencyConfig.currency]
  );

  return Number.isFinite(rate) && rate > 0
    ? rate
    : null;
};

const convertUsd = (usdAmount) => {
  const amount = Number(usdAmount);

  if (!Number.isFinite(amount)) {
    return null;
  }

  const rate = getCurrencyRate();

  if (rate === null) {
    return null;
  }

  return amount * rate;
};

const formatPrice = (usdAmount) => {
  const converted = convertUsd(usdAmount);

  if (
    converted === null ||
    !currencyConfig
  ) {
    return t("price_unavailable");
  }

  return `${currencyConfig.symbol}${converted.toFixed(2)}`;
};

const handleAddMwsDepartment = () => {
  if (!isMwsEditMode) return;

  const name = window.prompt("Enter department name:");
  if (name === null) return;

  const trimmed = name.trim();

  if (!trimmed) {
    messageApi.warning("Department name is required.");
    return;
  }

  const exists = displayedDepartments.some(
    (department) =>
      department.name.trim().toLowerCase() ===
      trimmed.toLowerCase()
  );

  if (exists) {
    messageApi.warning("This department already exists.");
    return;
  }

  setMwsCustomDepartments((previous) => [
    ...previous,
    { name: trimmed, brandTypes: [] },
  ]);

  messageApi.success(`Department "${trimmed}" created.`);
};

const handleAddMwsBrandType = (departmentName) => {
  if (!isMwsEditMode) return;

  const name = window.prompt(
    `Enter a brand type for "${departmentName}":`
  );

  if (name === null) return;

  const trimmed = name.trim();

  if (!trimmed) {
    messageApi.warning("Brand type name is required.");
    return;
  }

  const department = displayedDepartments.find(
    (entry) =>
      entry.name.toLowerCase() === departmentName.toLowerCase()
  );

  if (
    department?.brandTypes.some(
      (type) => type.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    messageApi.warning("This brand type already exists.");
    return;
  }

  setMwsCustomDepartments((previous) => {
    const exists = previous.some(
      (entry) =>
        entry.name.toLowerCase() === departmentName.toLowerCase()
    );

    if (!exists) {
      return [
        ...previous,
        { name: departmentName, brandTypes: [trimmed] },
      ];
    }

    return previous.map((entry) =>
      entry.name.toLowerCase() === departmentName.toLowerCase()
        ? {
            ...entry,
            brandTypes: [...entry.brandTypes, trimmed],
          }
        : entry
    );
  });

  messageApi.success(`Brand type "${trimmed}" created.`);
};

const handleRemoveMwsDepartment = (departmentName) => {
  if (!isMwsEditMode) return;

  const custom = mwsCustomDepartments.find(
    (department) => department.name === departmentName
  );

  if (!custom) return;

  const hasProducts = mwsStorefrontItems.some(
    (product) =>
      String(product.department || "").toLowerCase() ===
      departmentName.toLowerCase()
  );

  if (hasProducts) {
    messageApi.warning(
      "This department contains saved products. Move or remove those products first."
    );
    return;
  }

  if (
    !window.confirm(
      `Remove "${departmentName}" from your custom departments?`
    )
  ) {
    return;
  }

  setMwsCustomDepartments((previous) =>
    previous.filter(
      (department) => department.name !== departmentName
    )
  );
};

const handleRemoveMwsBrandType = (departmentName, brandType) => {
  if (!isMwsEditMode) return;

  const hasProducts = mwsStorefrontItems.some(
    (product) =>
      String(product.department || "").toLowerCase() ===
        departmentName.toLowerCase() &&
      String(product.brandType || "").toLowerCase() ===
        brandType.toLowerCase()
  );

  if (hasProducts) {
    messageApi.warning(
      "This brand type contains saved products. Move or remove those products first."
    );
    return;
  }

  if (!window.confirm(`Remove brand type "${brandType}"?`)) {
    return;
  }

  setMwsCustomDepartments((previous) =>
    previous.map((department) =>
      department.name === departmentName
        ? {
            ...department,
            brandTypes: department.brandTypes.filter(
              (type) => type !== brandType
            ),
          }
        : department
    )
  );
};

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
    )}?brandType=${encodeURIComponent(
      brandType
    )}${isMwsPreview ? "&mwsPreview=1" : ""}${
      isMwsEditMode ? "&mwsEdit=1" : ""
    }`
  )
);
};

 const handleBackToHome = () => {
  setSelectedDepartment(null);
  setSelectedBrandType(null);
  setDepartmentItemsError(null);
  setExpandedDeptIndex(null);

 router.push(
  withCountry(
    `/brand/theme1/${encodeURIComponent(
      brandName
    )}${isMwsPreview ? "?mwsPreview=1" : ""}${
      isMwsEditMode ? "&mwsEdit=1" : ""
    }`
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

  const getColorOptions = (product) => {
    return Object.keys(product?.imagesVariants || {});
  };

  const handleColorSelect = (itemId, color, e) => {
    e.stopPropagation();
    setSelectedColorByItem((prev) => ({
      ...prev,
      [itemId]: color,
    }));
  };

 const getImageUrl = (imageEntry) => {
  if (!imageEntry) return "";
  if (typeof imageEntry === "string") return imageEntry;
  if (typeof imageEntry === "object" && imageEntry.url) return imageEntry.url;
  return "";
};

const getDisplayImage = (product) => {
  const selectedColor = selectedColorByItem[product.id];
  const variants = product?.imagesVariants || {};

  if (selectedColor && variants[selectedColor]?.length > 0) {
    const sortedImages = [...variants[selectedColor]].sort((a, b) => {
      const posA =
        typeof a === "object" && typeof a?.position === "number"
          ? a.position
          : 999999;

      const posB =
        typeof b === "object" && typeof b?.position === "number"
          ? b.position
          : 999999;

      if (posA !== posB) return posA - posB;

      const nameA =
        typeof a === "object"
          ? a?.filename || ""
          : String(a || "").split("/").pop() || "";

      const nameB =
        typeof b === "object"
          ? b?.filename || ""
          : String(b || "").split("/").pop() || "";

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return getImageUrl(sortedImages[0]) || "/fallback.png";
  }

  return getImageUrl(product?.images?.[0]) || "/fallback.png";
};

  const getFirstVideoUrl = (product) => {
  if (!Array.isArray(product?.videos)) {
    return null;
  }

  for (const video of product.videos) {
    let url = "";

    // Current format: videos: ["https://..."]
    if (typeof video === "string") {
      url = video.trim();
    }

    // Also support future/object format:
    // videos: [{ url: "https://..." }]
    if (
      typeof video === "object" &&
      video !== null &&
      typeof video.url === "string"
    ) {
      url = video.url.trim();
    }

    if (!url) continue;

    const normalized = url.toLowerCase();

    if (
      normalized === "null" ||
      normalized === "undefined" ||
      normalized === "false" ||
      normalized === "n/a"
    ) {
      continue;
    }

    return url;
  }

  return null;
};

  const bestSellerVideo = useMemo(() => {
  return bestSeller ? getFirstVideoUrl(bestSeller) : null;
}, [bestSeller]);

  const shouldShowLargeBestSeller = !!bestSellerVideo && !hideBestSellerVideo;

  const handleAddMwsSample = () => {
  if (!isMwsEditMode) return;

  const newSample = {
    id: `mws-custom-${crypto.randomUUID()}`,
    itemId: "",
    name: "New Product",
    usdPrice: 0,
    originalPrice: 0,
    department: selectedDepartment || "men",
    brandType: selectedBrandType || "Clothing",
    placement:
  selectedDepartment && selectedBrandType
    ? "category"
    : "homepage",
    images: ["https://api.malidag.com/learn/videos/1794018211184-malidag_sample_image.jpg"],
    imagesVariants: {},
    size: {},
    videos: [],
    rating: 0,
    isMwsSample: true,
    isMwsCustomSample: true,
  };

  setMwsCustomSamples((previous) => [...previous, newSample]);
};

const handleCustomizeMwsDefaultSample = (item) => {
  if (!isMwsEditMode || !item?.id) return;

  const customId = `mws-custom-${crypto.randomUUID()}`;

  const customSample = {
    ...item,
    id: customId,
    isMwsSample: true,
    isMwsCustomSample: true,
    placement:
  item.placement ||
  (selectedDepartment && selectedBrandType
    ? "category"
    : "homepage"),
    mwsOriginalSampleId: String(item.id),
  };

  setMwsCustomSamples((previous) => [
    ...previous,
    customSample,
  ]);

  setEditingMwsSampleId(customId);

  return customId;
};

const handleRemoveMwsSample = (sampleId) => {
  if (!isMwsEditMode) return;

  const savedProduct = mwsCustomSamples.find(
  (sample) => sample.id === sampleId
);

if (savedProduct?.folderId) {
  messageApi.warning(
    "This product is saved. Remove it through product management."
  );
  return;
}

  const sampleToRemove = mwsCustomSamples.find(
    (sample) => sample.id === sampleId
  );

 if (sampleToRemove?.imagePreviewUrl) {
  URL.revokeObjectURL(sampleToRemove.imagePreviewUrl);

  mwsImagePreviewUrlsRef.current.delete(
    sampleToRemove.imagePreviewUrl
  );
}

  setMwsCustomSamples((previous) =>
    previous.filter((sample) => sample.id !== sampleId)
  );

  setEditingMwsSampleId((previous) =>
    previous === sampleId ? null : previous
  );
};

const handleUpdateMwsSample = (sampleId, field, value) => {
  if (!isMwsEditMode) return;

 const allowedFields = [
  "name",
  "itemSubName",
  "category",
  "department",
  "brandType",
  "genre",
  "type",
  "usdPrice",
  "originalPrice",
  "numberItemText",
  "itemDetailText",
  "productDetail01",
  "productDetail02",
  "images",
];

  if (!allowedFields.includes(field)) return;

  setMwsCustomSamples((previous) =>
    previous.map((sample) => {
      if (sample.id !== sampleId) {
        return sample;
      }

      if (field === "usdPrice") {
        return {
          ...sample,
          usdPrice: Math.max(0, Number(value) || 0),
        };
      }

      if (field === "images") {
        return {
          ...sample,
          images: [String(value || "/fallback.png")],
        };
      }

     return {
  ...sample,
  [field]: String(value ?? ""),
};
    })
  );
};

const handleSaveMwsProduct = () => {
  if (!isMwsEditMode || isMwsProductSaving) return;

  if (!activeMwsEditorSample) {
    messageApi.error("No product selected.");
    return;
  }

  const product = activeMwsEditorSample;

  if (!String(product.name || "").trim()) {
    messageApi.error("Product name is required.");
    return;
  }

  if (window.parent === window) {
    messageApi.error("Open the editor through MWS to save.");
    return;
  }

 const requestId = crypto.randomUUID();

const productData = {
  folderId: product.folderId || null,
  itemName: product.name,
  itemSubName: product.itemSubName || "",
  category: product.category || "",
  department: product.department || "",
  brandType: product.brandType || "",
  genre: product.genre || "",
  type: product.type || "",
  usdText: String(product.usdPrice ?? 0),
  originalPrice: String(product.originalPrice ?? 0),
  numberItemText: product.numberItemText || "",
  itemDetailText: product.itemDetailText || "",
  productDetail01: product.productDetail01 || "",
  productDetail02: product.productDetail02 || "",
  imageFile: product.imageFile || null,
};

mwsPendingSaveRequestRef.current = {
  requestId,
  sampleId: product.id,
};

setIsMwsProductSaving(true);

window.parent.postMessage(
  {
    type: "MWS_SAVE_PRODUCT",
    requestId,
    product: productData,
  },
  "https://mws.malidag.com"
);
};

const handleMwsSampleImageUpload = (sampleId, file) => {
  if (!isMwsEditMode || !file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    messageApi.error("Please upload a JPG, PNG, or WebP image.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    messageApi.error("Product image must be 5 MB or smaller.");
    return;
  }

  const existingSample = mwsCustomSamples.find(
  (sample) => sample.id === sampleId
);

if (!existingSample) return;

if (existingSample.imagePreviewUrl) {
  URL.revokeObjectURL(existingSample.imagePreviewUrl);

  mwsImagePreviewUrlsRef.current.delete(
    existingSample.imagePreviewUrl
  );
}

const previewUrl = URL.createObjectURL(file);

mwsImagePreviewUrlsRef.current.add(previewUrl);

  setMwsCustomSamples((previous) =>
    previous.map((sample) => {
      if (sample.id !== sampleId) return sample;

      return {
        ...sample,
        imageFile: file,
        imagePreviewUrl: previewUrl,
        images: [previewUrl],
        imagesVariants: {},
      };
    })
  );
};

 
const previewTopItems = useMemo(() => {
  if (!isMwsPreview) {
    return topItems;
  }

  const realItems = topItems.filter(
    (item) => item?.id && item?.name
  );

  const unsavedHomepageSamples = isMwsEditMode
    ? mwsCustomSamples.filter(
        (item) =>
          !item.folderId &&
          item.placement === "homepage"
      )
    : [];

  return uniqueMwsProducts([
    ...realItems,
    ...unsavedHomepageSamples,
  ]);
}, [
  isMwsPreview,
  isMwsEditMode,
  topItems,
  mwsCustomSamples,
]);


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

  const getDiscountPercentage = (usdPrice, originalPrice) => {
    const current = Number(usdPrice || 0);
    const original = Number(originalPrice || 0);

    if (!original || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
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

  const renderProductCard = (item, options = {}) => {
    const { isTop = false, badgeText = "" } = options;
    const isSample = isMwsPreview && item?.isMwsSample === true;
    const selectedColor = selectedColorByItem[item.id];
    const colorOptions = getColorOptions(item);
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
      <div key={item.id} className="th1-item-card">

      {isMwsEditMode && item?.isMwsSample === true && (
  <div
    style={{
      display: "flex",
      gap: "8px",
      padding: "8px",
    }}
  >
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
      if (item.isMwsCustomSample) {
  setEditingMwsSampleId(item.id);
} else {
  handleCustomizeMwsDefaultSample(item);
}

setIsMwsEditorPanelOpen(true);
      }}
      style={{
        flex: 1,
        padding: "9px 6px",
        background:
          editingMwsSampleId === item.id ? "#16a34a" : "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
   Edit Sample
    </button>

   {item?.isMwsCustomSample === true && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      handleRemoveMwsSample(item.id);
    }}
    style={{
      flex: 1,
      padding: "9px 6px",
      background: "#dc2626",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    Remove Sample
  </button>
)}
  </div>
)}

         {contextHolder}

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
  if (!isSample) {
    router.push(withCountry(`/product/${item.id}`));
  }
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
  if (!isSample) {
    router.push(withCountry(`/product/${item.id}`));
  }
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

          
{isMwsEditMode && item?.isMwsSample !== true && (
  <button
      type="button"
     onClick={(e) => {
  e.stopPropagation();

  if (!isMwsEditMode) {
    messageApi.info("Open MWS editor to modify this product.");
    return;
  }

  const editableProduct = mwsCustomSamples.find(
    (product) =>
      product.folderId &&
      String(product.folderId) ===
        String(item.folderId || item.itemId)
  );

  if (!editableProduct) {
    messageApi.warning(
      "This product is not connected to an editable MWS record."
    );
    return;
  }

  setEditingMwsSampleId(editableProduct.id);
  setIsMwsEditorPanelOpen(true);
}}
      style={{
        display: "block",
        width: "100%",
        marginTop: "10px",
        marginBottom: "12px",
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #2563eb",
        background: "#eff6ff",
        color: "#1d4ed8",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      ✎ Edit Item
    </button>
  )}


         {colorOptions.length > 0 && (
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

      {isSample ? (
  <button
    type="button"
    className="th1-add-basket-btn"
    disabled
    title="Demonstration product — not available for purchase"
    style={{ opacity: 0.55, cursor: "not-allowed" }}
  >
    Preview only
  </button>
) : (
  <button
    type="button"
    className="th1-add-basket-btn"
    onClick={(e) => handleAddToBasket(item, e)}
  >
    {t("add_to_cart")}
  </button>
)}

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
  };

  const renderBestSellerCard = () => {
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

            {getColorOptions(bestSeller).length > 0 && (
              <div className="th1-color-block" onClick={(e) => e.stopPropagation()}>
                <div className="th1-color-label">
                  {t("color")}:{" "}
                  <span>
                    {translateColor(
                      selectedColorByItem[bestSeller.id]
                    )}
                  </span>
                </div>

                <div className="th1-color-options">
                  {getColorOptions(bestSeller).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`th1-color-circle ${
                        selectedColorByItem[bestSeller.id] === color ? "active" : ""
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
  };

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

const previewBrandItems = useMemo(() => {
  if (!isMwsPreview) {
    return brandItems;
  }

  const normalize = (value) =>
    String(value || "").trim().toLowerCase();

  const matchesSelectedCategory = (item) =>
    normalize(item.department) ===
      normalize(selectedDepartment) &&
    normalize(item.brandType) ===
      normalize(selectedBrandType);

  const realItems = brandItems.filter(
    (item) => item?.id && item?.name
  );

  const customItems = isMwsEditMode
    ? mwsCustomSamples.filter(matchesSelectedCategory)
    : [];

  if (!showMwsSamples) {
    return uniqueMwsProducts([
      ...realItems,
      ...customItems,
    ]);
  }

  const customizedIds = new Set(
    customItems
      .map((item) => item.mwsOriginalSampleId)
      .filter(Boolean)
      .map(String)
  );

  const categorySamples = mwsApiProducts.filter(
    (item) =>
      matchesSelectedCategory(item) &&
      !customizedIds.has(String(item.id))
  );

  return uniqueMwsProducts([
    ...realItems,
    ...customItems,
    ...categorySamples,
  ]);
}, [
  isMwsPreview,
  isMwsEditMode,
  showMwsSamples,
  brandItems,
  mwsApiProducts,
  mwsCustomSamples,
  selectedDepartment,
  selectedBrandType,
]);

  const renderDepartmentItems = () => {
    return (
      <div className="th1-department-view">
        <div className="th1-department-toolbar">
          <button
            type="button"
            className="th1-back-btn"
            onClick={handleBackToHome}
          >
            ← {t("back")}
          </button>

          <div className="th1-department-current">
            <span>{t(selectedDepartment) || selectedDepartment}</span>
            <span className="th1-department-separator"> / </span>
            <span>{t(selectedBrandType) || selectedBrandType}</span>
          </div>
        </div>

        {departmentItemsLoading && (
          <p className="th1-message">{t("loading") || "Loading..."}</p>
        )}

        {departmentItemsError && (
          <p className="th1-message th1-error">
            {t("error_label") || "Error"}: {departmentItemsError}
          </p>
        )}

        {!departmentItemsLoading && !departmentItemsError && previewBrandItems.length === 0 && (
          <p className="th1-message">{t("no_items_found") || "No items found"}</p>
        )}

        {!departmentItemsLoading && !departmentItemsError && previewBrandItems.length > 0 && (
          <div className={`th1-item-grid ${!isDesktop ? "mobile" : ""}`}>
            {previewBrandItems.map((item) => renderProductCard(item))}
          </div>
        )}
      </div>
    );
  };

  const activeMwsEditorSample = mwsCustomSamples.find(
  (sample) => sample.id === editingMwsSampleId
);

  return (
    <div className="th1-wrapper">

      {isMwsEditMode &&
  isMwsEditorPanelOpen &&
  activeMwsEditorSample && (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Edit sample product"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "min(420px, 100vw)",
        height: "100dvh",
        background: "#ffffff",
        boxShadow: "-8px 0 30px rgba(0,0,0,0.18)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "18px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <strong
            style={{
              fontSize: "18px",
              color: "#111827",
            }}
          >
            Edit Product
          </strong>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            Changes appear instantly in your storefront.
          </div>
        </div>

        <button
          type="button"
          aria-label="Close product editor"
          onClick={() => {
            setIsMwsEditorPanelOpen(false);
            setEditingMwsSampleId(null);
          }}
          style={{
            padding: "8px 12px",
            background: "#f1f5f9",
            color: "#111827",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "20px",
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
        }}
      >
        <p style={{ color: "#475569" }}>
          Editing: <strong>{activeMwsEditorSample.name}</strong>
        </p>

       <label
  style={{
    display: "block",
    marginTop: "20px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
  }}
>
  Product Name
  <input
    type="text"
    value={activeMwsEditorSample.name ?? ""}
    onChange={(e) =>
      handleUpdateMwsSample(
        activeMwsEditorSample.id,
        "name",
        e.target.value
      )
    }
    style={{
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      padding: "12px",
      marginTop: "8px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      background: "#ffffff",
      color: "#111827",
    }}
  />
</label>

{[
  ["itemSubName", "Product Subtitle"],
  ["category", "Category"],
  ["department", "Department"],
  ["brandType", "Brand Type"],
  ["genre", "Genre"],
  ["type", "Type"],
].map(([field, label]) => (
  <label
    key={field}
    style={{
      display: "block",
      marginTop: "16px",
      fontSize: "13px",
      fontWeight: 600,
      color: "#111827",
    }}
  >
    {label}
    <input
      type="text"
      value={activeMwsEditorSample[field] ?? ""}
      onChange={(e) =>
        handleUpdateMwsSample(
          activeMwsEditorSample.id,
          field,
          e.target.value
        )
      }
      style={{
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        marginTop: "8px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        background: "#ffffff",
        color: "#111827",
      }}
    />
  </label>
))}

{[
  ["usdPrice", "Price (USD)", "0.01"],
  ["originalPrice", "Original Price (USD)", "0.01"],
  ["numberItemText", "Quantity Available", "1"],
].map(([field, label, step]) => (
  <label
    key={field}
    style={{
      display: "block",
      marginTop: "16px",
      fontSize: "13px",
      fontWeight: 600,
      color: "#111827",
    }}
  >
    {label}
    <input
      type="number"
      min="0"
      step={step}
      value={activeMwsEditorSample[field] ?? ""}
      onChange={(e) =>
        handleUpdateMwsSample(
          activeMwsEditorSample.id,
          field,
          e.target.value
        )
      }
      style={{
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        marginTop: "8px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        background: "#ffffff",
        color: "#111827",
      }}
    />
  </label>
))}

{[
  ["itemDetailText", "Item Details"],
  ["productDetail01", "Product Description 1"],
  ["productDetail02", "Product Description 2"],
].map(([field, label]) => (
  <label
    key={field}
    style={{
      display: "block",
      marginTop: "18px",
      fontSize: "13px",
      fontWeight: 600,
      color: "#111827",
    }}
  >
    {label}

    <textarea
      rows={4}
      value={activeMwsEditorSample[field] ?? ""}
      onChange={(e) =>
        handleUpdateMwsSample(
          activeMwsEditorSample.id,
          field,
          e.target.value
        )
      }
      placeholder={`Enter ${label.toLowerCase()}...`}
      style={{
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        marginTop: "8px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        background: "#ffffff",
        color: "#111827",
        resize: "vertical",
        fontFamily: "inherit",
        lineHeight: "1.5",
      }}
    />
  </label>
))}

<label
  style={{
    display: "block",
    marginTop: "20px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
  }}
>
  Upload Product Image

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(e) => {
      const file = e.target.files?.[0];

      if (file) {
        handleMwsSampleImageUpload(
          activeMwsEditorSample.id,
          file
        );
      }

      e.target.value = "";
    }}
    style={{
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      marginTop: "8px",
      padding: "12px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      background: "#ffffff",
      color: "#111827",
    }}
  />

  <span
    style={{
      display: "block",
      marginTop: "6px",
      fontSize: "12px",
      color: "#64748b",
    }}
  >
    JPG, PNG, or WebP — maximum 5 MB
  </span>

  {activeMwsEditorSample.imageFile && (
    <span
      style={{
        display: "block",
        marginTop: "8px",
        fontSize: "12px",
        color: "#16a34a",
      }}
    >
      Selected: {activeMwsEditorSample.imageFile.name}
    </span>
  )}
</label>

<button
  type="button"
 onClick={handleSaveMwsProduct}
disabled={isMwsProductSaving}
  style={{
    width: "100%",
    marginTop: "24px",
    padding: "14px",
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "15px",
  }}
>
 {isMwsProductSaving ? "Saving..." : "Save Changes"}
</button>

      </div>
    </div>
  )}

      {isMwsEditMode && (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      margin: "12px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
    }}
  >
   <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
  <button
    type="button"
    onClick={handleAddMwsSample}
    style={{
      padding: "9px 14px",
      background: "#2563eb",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    + Add Sample
  </button>

  <button
    type="button"
    onClick={() => setShowMwsSamples((previous) => !previous)}
    style={{
      padding: "9px 14px",
      background: "#111827",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
   {showMwsSamples
  ? "Hide Default Samples"
  : "Show Default Samples"}
  </button>
</div>

  </div>
)}
      {isDesktop ? (
        <div className="th1-container">
          <aside className="th1-sidebar">
            <div className="th1-sidebar-inner">
              {brandDetails?.logo ? (
                <img
                  src={brandDetails.logo}
                  alt={`${brandName} Logo`}
                  className="th1-logo"
                />
              ) : null}

              <div className="th1-sidebar-title">
               {t("departments_label")}
              </div>

              
<div className="th1-type-list">
  {displayedDepartments.map((department, index) => {
    const isCustomDepartment = mwsCustomDepartments.some(
      (entry) =>
        entry.name.toLowerCase() ===
        department.name.toLowerCase()
    );

    return (
      <div key={department.name} className="th1-department-block">
        <div
          className="th1-department-name"
          onClick={() => {
            if (
              isMwsEditMode &&
              (!department.brandTypes ||
                department.brandTypes.length === 0)
            ) {
              handleAddMwsBrandType(department.name);
            }
          }}
        >
          <span>{t(department.name)}</span>

          {isMwsEditMode && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleAddMwsBrandType(department.name);
              }}
              style={{
                marginLeft: 10,
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              + Brand Type
            </button>
          )}

          {isMwsEditMode && isCustomDepartment && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleRemoveMwsDepartment(department.name);
              }}
              style={{
                marginLeft: 6,
                color: "#dc2626",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          )}
        </div>

        <div className="th1-brandtype-list">
          {(department.brandTypes || []).map((brandType) => {
            const isActive =
              selectedDepartment === department.name &&
              selectedBrandType === brandType;

            const isCustomBrandType =
              mwsCustomDepartments.some(
                (entry) =>
                  entry.name.toLowerCase() ===
                    department.name.toLowerCase() &&
                  entry.brandTypes.some(
                    (type) =>
                      type.toLowerCase() ===
                      brandType.toLowerCase()
                  )
              );

            return (
              <div
                key={`${department.name}-${brandType}`}
                className={`th1-type-item ${
                  isActive ? "active" : ""
                }`}
                onClick={() =>
                  handleBrandTypeClick(
                    department.name,
                    brandType
                  )
                }
              >
                <span>{t(brandType)}</span>

                {isMwsEditMode && isCustomBrandType && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveMwsBrandType(
                        department.name,
                        brandType
                      );
                    }}
                    style={{
                      marginLeft: 8,
                      color: "#dc2626",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  })}

  {isMwsEditMode && (
    <button
      type="button"
      onClick={handleAddMwsDepartment}
      style={{
        width: "100%",
        marginTop: 14,
        padding: "12px",
        background: "#111827",
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      + Add Department
    </button>
  )}
</div>

            </div>
          </aside>

          <main className="th1-main">
            <div className="th1-header">
              {brandDetails?.headerImage ? (
                <img
                  src={brandDetails.headerImage}
                  alt={`${brandName} Header`}
                  className="th1-header-image"
                />
              ) : null}
              <div className="th1-header-title">{brandName}</div>
            </div>

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
          <div className="th1-header">
            {brandDetails?.headerImage ? (
              <img
                src={brandDetails.headerImage}
                alt={`${brandName} Header`}
                className="th1-header-image"
              />
            ) : null}
            <div className="th1-header-title">{brandName}</div>
          </div>

          <div className="th1-mobile-nav">
            {brandDetails?.logo ? (
              <img
                src={brandDetails.logo}
                alt={`${brandName} Logo`}
                className="th1-mobile-logo"
              />
            ) : null}

            <div className="th1-mobile-type-list">
              {departments.map((department, index) => (
                <div key={index} className="th1-mobile-department">
                  <button
                    type="button"
                    className={`th1-mobile-department-title ${
                      expandedDeptIndex === index ? "active" : ""
                    }`}
                    onClick={() =>
                      setExpandedDeptIndex(index === expandedDeptIndex ? null : index)
                    }
                  >
                    {t(department?.name)}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {expandedDeptIndex !== null && (
            <>
              <div
                className="th1-mobile-dropdown-backdrop"
                onClick={() => setExpandedDeptIndex(null)}
              />

              <div className="th1-mobile-dropdown-panel">
                <div className="th1-mobile-dropdown-header">
                  <span className="th1-mobile-dropdown-title">
                    {t(departments?.[expandedDeptIndex]?.name)}
                  </span>

                  <button
                    type="button"
                    className="th1-mobile-dropdown-close"
                    onClick={() => setExpandedDeptIndex(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="th1-mobile-dropdown">
                  {(departments?.[expandedDeptIndex]?.brandTypes || []).map(
                    (brandType, bIndex) => {
                      const isActive =
                        selectedDepartment === departments?.[expandedDeptIndex]?.name &&
                        selectedBrandType === brandType;

                      return (
                        <button
                          key={bIndex}
                          type="button"
                          className={`th1-mobile-dropdown-item ${
                            isActive ? "active" : ""
                          }`}
                          onClick={() =>
                            handleBrandTypeClick(
                              departments?.[expandedDeptIndex]?.name,
                              brandType
                            )
                          }
                        >
                          {t(brandType)}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          )}

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