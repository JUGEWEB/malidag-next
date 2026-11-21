
"use client";

import { useEffect, useState } from "react";
import { normalizeBrandItem } from "../utils/productHelpers";

const BASE_URL = "https://api.malidag.com";

export default function useDepartmentItems({
  brandName,
  countryCode,
  selectedDepartment,
  selectedBrandType,
  setSelectedColorByItem,
}) {
  const [brandItems, setBrandItems] = useState([]);
  const [departmentItemsLoading, setDepartmentItemsLoading] =
    useState(false);
  const [departmentItemsError, setDepartmentItemsError] =
    useState(null);

  useEffect(() => {
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
    brandName,
    countryCode,
    selectedDepartment,
    selectedBrandType,
    setSelectedColorByItem,
  ]);

  return {
    brandItems,
    departmentItemsLoading,
    departmentItemsError,
  };
}
