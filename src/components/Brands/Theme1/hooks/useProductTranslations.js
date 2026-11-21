
"use client";

import { useEffect, useRef, useState } from "react";

export default function useProductTranslations({
  topItems,
  brandItems,
  bestSeller,
  currentLanguage,
}) {
  const [translations, setTranslations] = useState({});
  const requestedRef = useRef(new Set());

  useEffect(() => {
    if (currentLanguage === "en") return;

    const products = [
      ...topItems,
      ...brandItems,
      ...(bestSeller ? [bestSeller] : []),
    ];

    const productIds = [
      ...new Set(
        products.map((item) => item?.itemId).filter(Boolean)
      ),
    ];

    productIds.forEach(async (productId) => {
      const requestKey = `${productId}:${currentLanguage}`;

      if (requestedRef.current.has(requestKey)) return;

      requestedRef.current.add(requestKey);

      try {
        const response = await fetch(
          `https://api.malidag.com/translate/product/translate/${productId}/${currentLanguage}`
        );

        if (!response.ok) {
          throw new Error(`Translation request failed: ${response.status}`);
        }

        const data = await response.json();

        setTranslations((previous) => ({
          ...previous,
          [productId]: {
            ...(previous[productId] || {}),
            [currentLanguage]: data?.translation || {},
          },
        }));
      } catch (error) {
        requestedRef.current.delete(requestKey);
        console.error(
          `Error fetching translation for product ${productId}`,
          error
        );
      }
    });
  }, [topItems, brandItems, bestSeller, currentLanguage]);

  return translations;
}
