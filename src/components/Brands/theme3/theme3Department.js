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

  const normalizeKey = (value = "") =>
    String(value).trim().toLowerCase().replace(/\s+/g, "_");

  const themeConfig = brandDetails?.themeConfig || {};

  useEffect(() => {
    const fetchDepartmentPage = async () => {
      try {
        setLoading(true);

        const [themesRes, departmentsRes] = await Promise.all([
          fetch("https://api.malidag.com/api/brands/themes"),
          fetch(`https://api.malidag.com/api/brands/${brandName}`),
        ]);

        const themesData = await themesRes.json();
        const departmentsData = await departmentsRes.json();

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