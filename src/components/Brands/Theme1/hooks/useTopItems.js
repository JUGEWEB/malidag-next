
"use client";

import { useEffect, useState } from "react";
import { normalizeTopItem } from "../utils/productHelpers";

const BASE_URL = "https://api.malidag.com";

export default function useTopItems({
  brandName,
  countryCode,
  setSelectedColorByItem,
}) {
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    if (!brandName || !countryCode) {
      setTopItems([]);
      return;
    }

    let cancelled = false;

    fetch(
      `${BASE_URL}/api/brands/${encodeURIComponent(
        brandName
      )}/top-items?country=${encodeURIComponent(countryCode)}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;

        const normalized = Array.isArray(data)
          ? data.map(normalizeTopItem)
          : [];

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

        setTopItems(normalized);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Error fetching top items:", error);
        setTopItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [brandName, countryCode, setSelectedColorByItem]);

  return topItems;
}
