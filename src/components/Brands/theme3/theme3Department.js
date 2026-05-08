"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./theme3.css";
import { useTranslation } from "react-i18next";

function Theme3Department({ brandName, department }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [brandDetails, setBrandDetails] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topItems, setTopItems] = useState([]);

  const normalizeKey = (value = "") =>
    String(value).trim().toLowerCase().replace(/\s+/g, "_");

  const themeConfig = brandDetails?.themeConfig || {};

  const normalizeTopItem = (product) => {
  const source = product?.item || product || {};

  const firstVariantList = Object.values(source?.imagesVariants || {}).find(
    Array.isArray
  );

  const firstVariantImage =
    firstVariantList?.[0]?.url ||
    firstVariantList?.[0] ||
    null;

  return {
    id: product?.id || source?.id || "",
    itemId: product?.itemId || source?.itemId || "",
    name: source?.name || "",
    department: source?.department || "",
    brandType: source?.brandType || "",
    image: source?.images?.[0] || firstVariantImage || "/fallback.png",
    usdPrice: source?.usdPrice || source?.price || product?.usdPrice || 0,
  };
};

  useEffect(() => {
    const fetchDepartmentPage = async () => {
      try {
        setLoading(true);

        const [themesRes, departmentsRes, topItemsRes] = await Promise.all([
  fetch("https://api.malidag.com/api/brands/themes"),
  fetch(`https://api.malidag.com/api/brands/${brandName}`),
  fetch(`https://api.malidag.com/api/brands/${brandName}/top-items`),
]);

        const themesData = await themesRes.json();
        const departmentsData = await departmentsRes.json();
        const topItemsData = topItemsRes.ok ? await topItemsRes.json() : [];

        const foundBrand = Array.isArray(themesData)
          ? themesData.find(
              (brand) =>
                brand?.brandName?.trim()?.toLowerCase() ===
                brandName?.trim()?.toLowerCase()
            )
          : null;

        setBrandDetails(foundBrand);
        setDepartments(
          Array.isArray(departmentsData?.departments)
            ? departmentsData.departments
            : []
        );

        setTopItems(
  Array.isArray(topItemsData)
    ? topItemsData.map(normalizeTopItem)
    : []
);
      } catch (error) {
        console.error("Theme3 department fetch error:", error);
        setBrandDetails(null);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentPage();
  }, [brandName]);

  const departmentTopItems = useMemo(() => {
  return topItems.filter(
    (item) => normalizeKey(item.department) === normalizeKey(department)
  );
}, [topItems, department]);

  const selectedDepartmentData = useMemo(() => {
    return departments.find(
      (item) => normalizeKey(item?.name) === normalizeKey(department)
    );
  }, [departments, department]);

  const departmentConfig = useMemo(() => {
    return themeConfig?.departments?.[normalizeKey(department)] || {};
  }, [themeConfig, department]);

  const typeTiles = useMemo(() => {
  const brandTypes = selectedDepartmentData?.brandTypes || [];
  const uniqueTypes = new Map();

  brandTypes.forEach((type) => {
    const key = normalizeKey(type);

    if (!uniqueTypes.has(key)) {
      uniqueTypes.set(key, type);
    }
  });

  return Array.from(uniqueTypes.entries()).map(([key, type]) => {
    const config = themeConfig?.types?.[key] || {};

    return {
      rawType: type,
      key,
      image:
        config?.image ||
        themeConfig?.defaultTypeImage ||
        departmentConfig?.image ||
        themeConfig?.defaultDepartmentImage ||
        "/fallback.png",
      title: config?.title || t(type) || type,
      subtitle: config?.subtitle || "",
    };
  });
}, [selectedDepartmentData, themeConfig, departmentConfig, t]);

 const departmentHeroImage =
  departmentConfig?.heroImage ||
  departmentConfig?.image ||
  themeConfig?.defaultDepartmentHeroImage ||
  themeConfig?.defaultDepartmentImage ||
  brandDetails?.headerImage ||
  "/fallback.png";

const departmentTitle =
  departmentConfig?.heroTitle ||
  themeConfig?.defaultDepartmentHeroTitle ||
  "";

const departmentSubtitle =
  departmentConfig?.heroSubtitle ||
  themeConfig?.defaultDepartmentHeroSubtitle ||
  "";

  const handleTypeClick = (brandType) => {
    router.push(
      `/brand/theme3/${encodeURIComponent(brandName)}/${encodeURIComponent(
        department
      )}/${encodeURIComponent(brandType)}`
    );
  };

  if (loading) {
    return <div className="th3-loading">Loading...</div>;
  }

 return (
  <div className="th3-wrapper">
    <section className="th3-type-hero">
      <img src={departmentHeroImage} alt={departmentTitle} />

     <div className="th3-type-hero-overlay">
  {departmentTitle && <h2>{departmentTitle}</h2>}
  {departmentSubtitle && <p>{departmentSubtitle}</p>}
</div>
    </section>

    {departmentTopItems.length > 0 && (
  <section className="th3-top-picks-section">
    <h2>Top Picks</h2>

    <div className="th3-top-picks-scroll">
      {departmentTopItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className="th3-top-pick-card"
          onClick={() => router.push(`/product/${item.id}`)}
        >
          <img src={item.image} alt={item.name} />

          <div className="th3-top-pick-info">
            <span>Top Pick</span>
            <h3>{item.name}</h3>
            <p>${Number(item.usdPrice || 0).toFixed(2)}</p>
          </div>
        </button>
      ))}
    </div>
  </section>
)}

    <main className="th3-main">

      {typeTiles.length > 0 ? (
        <section className="th3-tile-grid">
          {typeTiles.map((type) => (
            <button
              key={type.key}
              type="button"
              className="th3-large-tile"
              onClick={() => handleTypeClick(type.rawType)}
            >
              <img src={type.image} alt={type.title} />

              <div className="th3-tile-overlay">
                {type.title && <h2>{type.title}</h2>}
                {type.subtitle && <p>{type.subtitle}</p>}
              </div>
            </button>
          ))}
        </section>
      ) : (
        <p className="th3-empty">No types found.</p>
      )}
    </main>
  </div>
);
}

export default Theme3Department;