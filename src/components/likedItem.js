"use client";

import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
} from "react";
import {
  useRouter,
  usePathname,
} from "next/navigation";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { message } from "antd";

import "./LikedItems.css";

import { auth } from "@/components/firebaseConfig";
import { AppContext } from "@/components/appContext";
import { getCountryConfig } from "./countryUtils";

const BASE_URL = "https://api.malidag.com";
const BASKET_API =
  "https://api.malidag.com/add-to-basket";

const LikedItems = () => {
  const router = useRouter();
  const pathname = usePathname();

  const { t, i18n } = useTranslation();
  const { country } = useContext(AppContext);

  const [likedItems, setLikedItems] =
    useState([]);

  const [basketItems, setBasketItems] =
    useState([]);

  const [rates, setRates] =
    useState(null);

  const [
    itemTranslations,
    setItemTranslations,
  ] = useState({});

  const [
    addingToBasket,
    setAddingToBasket,
  ] = useState(null);

  const [
    removingItem,
    setRemovingItem,
  ] = useState(null);

  const [
    messageApi,
    contextHolder,
  ] = message.useMessage();

  /* ======================================================
     COUNTRY
     ====================================================== */

  const countryCode =
    country?.code?.toLowerCase() ||
    "fr";

  const withCountry = (path) => {
    if (!path) {
      return `/${countryCode}`;
    }

    /*
     * Remove an existing country prefix
     * before adding the current country.
     */
    const cleanPath = path.replace(
      /^\/(fr|gb|br|us|de|ie|au|be)(\/|$)/,
      "/"
    );

    return `/${countryCode}${
      cleanPath.startsWith("/")
        ? cleanPath
        : `/${cleanPath}`
    }`;
  };

  /*
   * Works with:
   *
   * /likeditem
   * /fr/likeditem
   * /gb/likeditem
   * etc.
   */
  const isLikedPage =
    pathname === "/likeditem" ||
    pathname?.endsWith("/likeditem");

  /* ======================================================
     COUNTRY CURRENCY CONFIG
     ====================================================== */

  const countryCurrencyConfig =
    useMemo(
      () =>
        getCountryConfig(
          country?.name || ""
        ),
      [country?.name]
    );

  /* ======================================================
     FETCH EXCHANGE RATES
     ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const fetchRates = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/prices/rates`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch rates: ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!cancelled) {
          setRates(
            data?.rates || {}
          );
        }
      } catch (error) {
        console.error(
          "Error fetching exchange rates:",
          error
        );
      }
    };

    fetchRates();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ======================================================
     USD -> LOCAL CURRENCY
     ====================================================== */

  const convertUsdToLocal = (
    usdValue
  ) => {
    const usdPrice = Number(
      usdValue || 0
    );

    const currency =
      countryCurrencyConfig?.currency ||
      "USD";

    if (!usdPrice) {
      return 0;
    }

    if (currency === "USD") {
      return usdPrice;
    }

    const rate = Number(
      rates?.[currency]
    );

    if (!rate) {
      return null;
    }

    return usdPrice * rate;
  };

  const formatPrice = (
    usdValue
  ) => {
    const localizedValue =
      convertUsdToLocal(usdValue);

    /*
     * Don't show an incorrect USD-looking
     * price while exchange rates load.
     */
    if (localizedValue === null) {
      return "...";
    }

    const symbol =
      countryCurrencyConfig?.symbol ||
      "$";

    return `${symbol}${localizedValue.toFixed(
      2
    )}`;
  };

  /* ======================================================
     FETCH LIKED ITEMS
     ====================================================== */

  const fetchLikedItems =
    async () => {
      /*
       * Preserve the same behavior as
       * your existing liked-items API.
       */
      const currentUser =
        auth?.currentUser;

      const userId =
        currentUser?.uid ||
        "guest";

      try {
        const response =
          await axios.get(
            `${BASE_URL}/liked-items/${userId}`
          );

        const items =
          response.data
            ?.likedItems || [];

        setLikedItems(items);

        if (
          typeof window !==
          "undefined"
        ) {
          localStorage.setItem(
            "likedCount",
            String(items.length)
          );
        }
      } catch (error) {
        console.error(
          "Error fetching liked items:",
          error
        );

        setLikedItems([]);
      }
    };

  /* ======================================================
     AUTH STATE
     ====================================================== */

  useEffect(() => {
    const unsubscribe =
      auth.onAuthStateChanged(
        () => {
          fetchLikedItems();
          fetchUserBasket();
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* ======================================================
     PRODUCT TRANSLATIONS
     ====================================================== */

  useEffect(() => {
    if (
      !likedItems.length ||
      !i18n.language
    ) {
      return;
    }

    let cancelled = false;

    const fetchTranslations =
      async () => {
        const rawLanguage =
          i18n.resolvedLanguage ||
          i18n.language ||
          "en";

        const shortLanguage =
          rawLanguage
            .split("-")[0]
            .toLowerCase();

        /*
         * Keep the same supported
         * languages as FashionForAll.
         */
        const lang = [
          "en",
          "fr",
          "br",
        ].includes(
          shortLanguage
        )
          ? shortLanguage
          : "en";

        /*
         * English is the original
         * product language.
         */
        if (lang === "en") {
          if (!cancelled) {
            setItemTranslations(
              {}
            );
          }

          return;
        }

        try {
          const results =
            await Promise.all(
              likedItems.map(
                async (item) => {
                  const productId =
                    item?.itemId ||
                    item?.item
                      ?.itemId;

                  if (
                    !productId
                  ) {
                    return null;
                  }

                  try {
                    const response =
                      await fetch(
                        `${BASE_URL}/translate/product/translate/${encodeURIComponent(
                          productId
                        )}/${encodeURIComponent(
                          lang
                        )}`
                      );

                    if (
                      !response.ok
                    ) {
                      return null;
                    }

                    const data =
                      await response.json();

                    return [
                      productId,
                      data?.translation ||
                        null,
                    ];
                  } catch (
                    error
                  ) {
                    console.error(
                      `Translation fetch failed for ${productId}:`,
                      error
                    );

                    return null;
                  }
                }
              )
            );

          if (cancelled) {
            return;
          }

          const translationMap =
            {};

          results.forEach(
            (result) => {
              if (!result) {
                return;
              }

              const [
                productId,
                translation,
              ] = result;

              if (translation) {
                translationMap[
                  productId
                ] =
                  translation;
              }
            }
          );

          setItemTranslations(
            translationMap
          );
        } catch (error) {
          console.error(
            "Error fetching product translations:",
            error
          );
        }
      };

    fetchTranslations();

    return () => {
      cancelled = true;
    };
  }, [
    likedItems,
    i18n.language,
    i18n.resolvedLanguage,
  ]);

  /* ======================================================
     PRODUCT HELPERS
     ====================================================== */

  const getProductId = (
    product
  ) => {
    return (
      product?.itemId ||
      product?.item?.itemId ||
      null
    );
  };

  const getProductName = (
    product
  ) => {
    const rawItem =
      product?.item || {};

    const details =
      product?.details || {};

    const originalName =
      rawItem?.name ||
      details?.itemName ||
      product?.name ||
      t("product");

    const productId =
      getProductId(product);

    const translatedProduct =
      itemTranslations[
        productId
      ];

    return (
      translatedProduct?.name ||
      translatedProduct
        ?.itemName ||
      originalName
    );
  };

  const getUsdPrice = (
    product
  ) => {
    const rawItem =
      product?.item || {};

    const details =
      product?.details || {};

    return Number(
      rawItem?.usdPrice ??
        product?.usdPrice ??
        product?.price ??
        details?.usdText ??
        0
    );
  };

  const getProductImage = (
    product
  ) => {
    const rawItem =
      product?.item || {};

    const firstImage =
      rawItem?.images?.[0];

    /*
     * images[0] can either be a
     * string or { url: "..." }.
     */
    if (
      typeof firstImage ===
      "string"
    ) {
      return firstImage;
    }

    if (
      firstImage &&
      typeof firstImage ===
        "object"
    ) {
      return (
        firstImage.url ||
        product?.image ||
        "/fallback.png"
      );
    }

    return (
      product?.image ||
      product?.image_url ||
      "/fallback.png"
    );
  };

  /* ======================================================
     PRODUCT NAVIGATION
     ====================================================== */

  const handleNavigate = (
    itemId
  ) => {
    if (!itemId) return;

    router.push(
      withCountry(
        `/product/${itemId}`
      )
    );
  };

  /* ======================================================
     REMOVE FROM WISHLIST
     ====================================================== */

  const handleRemoveLike =
    async (itemId) => {
      if (!itemId) return;

      const currentUser =
        auth?.currentUser;

      const userId =
        currentUser?.uid ||
        "guest";

      try {
        setRemovingItem(
          itemId
        );

        await axios.delete(
          `${BASE_URL}/remove-from-liked/${userId}/${itemId}`
        );

        setLikedItems(
          (currentItems) => {
            const updatedItems =
              currentItems.filter(
                (item) =>
                  item.id !==
                  itemId
              );

            if (
              typeof window !==
              "undefined"
            ) {
              localStorage.setItem(
                "likedCount",
                String(
                  updatedItems.length
                )
              );
            }

            return updatedItems;
          }
        );

        messageApi.success(
          t(
            "removed_from_wishlist"
          )
        );
      } catch (error) {
        console.error(
          "Error removing liked item:",
          error
        );

        messageApi.error(
          t(
            "remove_from_wishlist_failed"
          )
        );
      } finally {
        setRemovingItem(
          null
        );
      }
    };

  /* ======================================================
     FETCH USER BASKET
     ====================================================== */

  const fetchUserBasket =
    async () => {
      const currentUser =
        auth?.currentUser;

      if (!currentUser) {
        setBasketItems([]);
        return;
      }

      try {
        const response =
          await axios.get(
            `${BASE_URL}/basket/${currentUser.uid}`
          );

        setBasketItems(
          response.data?.basket ||
            []
        );
      } catch (error) {
        console.error(
          "Error fetching basket:",
          error
        );

        setBasketItems([]);
      }
    };

  /* ======================================================
     BASKET HELPERS
     ====================================================== */

  const getBasketQuantity = (
    itemId
  ) => {
    if (!itemId) return 0;

    const basketItem =
      basketItems.find(
        (item) =>
          String(item.itemId) ===
          String(itemId)
      );

    return Number(
      basketItem?.quantity ||
        0
    );
  };

  const isItemInBasket = (
    itemId
  ) => {
    return (
      getBasketQuantity(
        itemId
      ) > 0
    );
  };

  /* ======================================================
     ADD TO BASKET
     ====================================================== */

  const handleAddToBasket =
    async (
      product,
      event
    ) => {
      event?.preventDefault();
      event?.stopPropagation();

      const currentUser =
        auth?.currentUser;

      /*
       * User must sign in before
       * adding to basket.
       */
      if (!currentUser) {
        const currentPath =
          typeof window !==
          "undefined"
            ? window.location
                .pathname
            : "/likeditem";

        router.push(
          withCountry(
            `/auth?redirect=${encodeURIComponent(
              currentPath
            )}`
          )
        );

        return;
      }

      const productId =
        getProductId(
          product
        );

      if (!productId) {
        console.error(
          "Cannot add product to basket: itemId is missing",
          product
        );

        messageApi.error(
          t(
            "add_to_basket_failed"
          )
        );

        return;
      }

      try {
        setAddingToBasket(
          product.id
        );

        const rawItem =
          product?.item ||
          product;

        const details =
          product?.details ||
          {};

        const usdPrice =
          getUsdPrice(product);

        const image =
          getProductImage(
            product
          );

        /*
         * IMPORTANT:
         *
         * Basket stores the canonical
         * USD price.
         *
         * We do NOT store eurText,
         * poundText, brlText, etc.
         *
         * Currency conversion should
         * happen when displaying the
         * basket using /prices/rates.
         */
        const basketItem = {
          userId:
            currentUser.uid,

          item: {
            id: product.id,

            itemId:
              productId,

            name:
              rawItem?.name ||
              product?.name ||
              "",

            price: usdPrice,

            color:
              rawItem?.color ||
              null,

            size: null,

            image,

            brand:
              rawItem?.brand ||
              details?.brand ||
              "",

            brandPrice:
              rawItem?.brandPrice,

            quantity: 1,

            shippingCountry:
              details?.country ||
              "",

            selectedCountry:
              "",
          },
        };

        const response =
          await axios.post(
            BASKET_API,
            basketItem
          );

        if (
          response.status ===
            200 ||
          response.status ===
            201
        ) {
          await fetchUserBasket();

          messageApi.success(
            `${getProductName(
              product
            )} ${t(
              "added_to_basket"
            )}`
          );
        } else {
          messageApi.error(
            t(
              "add_to_basket_failed"
            )
          );
        }
      } catch (error) {
        console.error(
          "Error adding item to basket:",
          error
        );

        messageApi.error(
          t(
            "add_to_basket_failed"
          )
        );
      } finally {
        setAddingToBasket(
          null
        );
      }
    };

  /* ======================================================
     RENDER
     ====================================================== */

  return (
    <section
      className={`liked-container ${
        isLikedPage
          ? "liked-page"
          : "liked-preview"
      }`}
    >
      {contextHolder}

      {/* ======================
          HEADER
          ====================== */}

      <div className="liked-header">
        <div>
          <span className="liked-eyebrow">
            {t("wishlist")}
          </span>

          <h2>
            {t("liked_title")}
          </h2>
        </div>

        {!isLikedPage &&
          likedItems.length >
            0 && (
            <button
              type="button"
              className="view-liked-button"
              onClick={() =>
                router.push(
                  withCountry(
                    "/likeditem"
                  )
                )
              }
            >
              {t("view_all")}

              <span
                aria-hidden="true"
              >
                →
              </span>
            </button>
          )}
      </div>

      {/* ======================
          EMPTY
          ====================== */}

      {likedItems.length ===
      0 ? (
        <div className="liked-empty">
          <div
            className="liked-empty-icon"
            aria-hidden="true"
          >
            ♡
          </div>

          <h3>
            {t(
              "no_liked_items"
            )}
          </h3>

          <p>
            {t(
              "no_liked_items_description"
            )}
          </p>
        </div>
      ) : (
        /* ======================
           PRODUCTS
           ====================== */

        <div className="liked-grid">
          {(isLikedPage
            ? likedItems
            : likedItems.slice(
                0,
                5
              )
          ).map((product) => {
            const productId =
              getProductId(
                product
              );

            const productName =
              getProductName(
                product
              );

            const productImage =
              getProductImage(
                product
              );

            const usdPrice =
              getUsdPrice(
                product
              );

            const basketQuantity =
              getBasketQuantity(
                productId
              );

            const inBasket =
              isItemInBasket(
                productId
              );

            const isAdding =
              addingToBasket ===
              product.id;

            const isRemoving =
              removingItem ===
              product.id;

            return (
              <article
                key={
                  product.id ||
                  productId
                }
                className="liked-card"
              >
                {/* ==================
                    IMAGE
                    ================== */}

                <div className="liked-image-wrapper">
                  <img
                    src={
                      productImage
                    }
                    alt={
                      productName
                    }
                    className="liked-item-image"
                    loading="lazy"
                    onClick={() =>
                      handleNavigate(
                        product.id
                      )
                    }
                    onError={(
                      event
                    ) => {
                      event.currentTarget.onerror =
                        null;

                      event.currentTarget.src =
                        "/fallback.png";
                    }}
                  />

                  {/* REMOVE */}

                  {isLikedPage && (
                    <button
                      type="button"
                      className="liked-remove-icon"
                      disabled={
                        isRemoving
                      }
                      onClick={(
                        event
                      ) => {
                        event.preventDefault();
                        event.stopPropagation();

                        handleRemoveLike(
                          product.id
                        );
                      }}
                      aria-label={t(
                        "remove"
                      )}
                      title={t(
                        "remove"
                      )}
                    >
                      {isRemoving
                        ? "…"
                        : "×"}
                    </button>
                  )}
                </div>

                {/* ==================
                    CONTENT
                    ================== */}

                <div className="liked-card-content">
                  <h3
                    className="liked-item-name"
                    title={
                      productName
                    }
                    onClick={() =>
                      handleNavigate(
                        product.id
                      )
                    }
                  >
                    {productName}
                  </h3>

                  {/* PRICE */}

                 {/* ==================
    PRICE
    ================== */}

<div className="liked-price">
  {usdPrice > 0
    ? formatPrice(
        usdPrice
      )
    : t(
        "view_product"
      )}
</div>

{/* ==================
    PRICE CHANGE
    ================== */}

{product.priceChange && (
  <div
    className={`liked-price-change ${
      product.priceChange
        .direction === "down"
        ? "liked-price-change--down"
        : "liked-price-change--up"
    }`}
  >
    <div className="liked-price-change-content">
     <div className="liked-price-change-text">
  <span className="liked-price-change-label">
    {product.priceChange
      .direction === "down"
      ? t("price_dropped")
      : t("price_increased")}
  </span>

  <span className="liked-price-change-values">
    <span className="liked-old-price">
      {formatPrice(
        product.priceChange
          .oldPrice
      )}
    </span>

    <span
      aria-hidden="true"
    >
      →
    </span>

    <strong>
      {formatPrice(
        product.priceChange
          .newPrice
      )}
    </strong>
  </span>
</div>
    </div>

    <button
      type="button"
      className="liked-price-change-dismiss"
      onClick={(
        event
      ) => {
        event.preventDefault();
        event.stopPropagation();

        acknowledgePriceChange(
          productId
        );
      }}
      aria-label={t(
        "dismiss"
      )}
      title={t(
        "dismiss"
      )}
    >
      ×
    </button>
  </div>
)}

                  {/* BASKET */}

                  {inBasket ? (
                    <button
                      type="button"
                      className="liked-added-basket-button"
                      onClick={(
                        event
                      ) => {
                        event.preventDefault();
                        event.stopPropagation();

                        router.push(
                          withCountry(
                            "/basket"
                          )
                        );
                      }}
                    >
                      <span
                        aria-hidden="true"
                      >
                        🛒
                      </span>

                      <span>
                        {t(
                          "in_basket"
                        )}
                      </span>

                      <span className="liked-basket-quantity">
                        {
                          basketQuantity
                        }
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="liked-basket-button"
                      disabled={
                        isAdding
                      }
                      onClick={(
                        event
                      ) =>
                        handleAddToBasket(
                          product,
                          event
                        )
                      }
                    >
                      {isAdding
                        ? t(
                            "adding"
                          )
                        : t(
                            "add_to_basket"
                          )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LikedItems;