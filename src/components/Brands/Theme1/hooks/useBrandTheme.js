
"use client";

import { useEffect, useState } from "react";

const INITIAL_BRAND_DETAILS = {
  headerImage: null,
  logo: null,
};

export default function useBrandTheme(brandName) {
  const [brandDetails, setBrandDetails] = useState(
    INITIAL_BRAND_DETAILS
  );

  useEffect(() => {
    if (!brandName) {
      setBrandDetails(INITIAL_BRAND_DETAILS);
      return;
    }

    let cancelled = false;

    // Clear the previous brand's images while loading.
    setBrandDetails(INITIAL_BRAND_DETAILS);

    const fetchBrandDetails = async () => {
      try {
        const res = await fetch(
          "https://api.malidag.com/api/brands/themes"
        );

        if (!res.ok) {
          throw new Error(`Brand theme request failed: ${res.status}`);
        }

        const data = await res.json();

        if (cancelled) return;

        const brand = Array.isArray(data)
          ? data.find(
              (item) =>
                item?.brandName?.trim()?.toLowerCase() ===
                brandName?.trim()?.toLowerCase()
            )
          : null;

        setBrandDetails({
          headerImage: brand?.headerImage || null,
          logo: brand?.logo || null,
        });
      } catch (error) {
        if (cancelled) return;

        console.error("Error fetching brand theme:", error);
        setBrandDetails(INITIAL_BRAND_DETAILS);
      }
    };

    fetchBrandDetails();

    return () => {
      cancelled = true;
    };
  }, [brandName]);

  return brandDetails;
}
