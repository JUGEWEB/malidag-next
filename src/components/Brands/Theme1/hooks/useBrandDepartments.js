
"use client";

import { useEffect, useState } from "react";

const BASE_URL = "https://api.malidag.com";

export default function useBrandDepartments({
  brandName,
  countryCode,
}) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (!brandName || !countryCode) {
      setDepartments([]);
      return;
    }

    let cancelled = false;

    fetch(
      `${BASE_URL}/api/brands/${encodeURIComponent(
        brandName
      )}?country=${encodeURIComponent(countryCode)}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;

        const actualDepartments = Array.isArray(data?.departments)
          ? data.departments
          : [];

        setDepartments(actualDepartments);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Error fetching departments:", error);
        setDepartments([]);
      });

    return () => {
      cancelled = true;
    };
  }, [brandName, countryCode]);

  return departments;
}
