
"use client";

import { useEffect, useState } from "react";
import { normalizeBestSeller } from "../utils/productHelpers";

const BASE_URL = "https://api.malidag.com";

export default function useBestSeller({
  brandName,
  countryCode,
  setSelectedColorByItem,
}) {
  const [bestSeller, setBestSeller] = useState(null);

  useEffect(() => {
    if (!brandName || !countryCode) {
      setBestSeller(null);
      return;
    }

    let cancelled = false;

    fetch(
      `${BASE_URL}/api/brands/${encodeURIComponent(
        brandName
      )}/best-seller?country=${encodeURIComponent(countryCode)}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;

        const normalized = data
          ? normalizeBestSeller(data)
          : null;

        if (normalized) {
          const colorKeys = Object.keys(
            normalized?.imagesVariants || {}
          );

          if (colorKeys.length > 0) {
            setSelectedColorByItem((previous) => ({
              ...previous,
              [normalized.id]:
                previous[normalized.id] || colorKeys[0],
            }));
          }
        }

        setBestSeller(normalized);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Error fetching best seller:", error);
        setBestSeller(null);
      });

    return () => {
      cancelled = true;
    };
  }, [brandName, countryCode, setSelectedColorByItem]);

  return bestSeller;
}
