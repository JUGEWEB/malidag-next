"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./theme3.css";
import { useTranslation } from "react-i18next";

function Theme3({ brandName }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [brandDetails, setBrandDetails] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeKey = (value = "") =>
    String(value).trim().toLowerCase().replace(/\s+/g, "_");

  const themeConfig = brandDetails?.themeConfig || {};

  useEffect(() => {
    const fetchTheme3Home = async () => {
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
        console.error("Theme3 home fetch error:", error);
        setBrandDetails(null);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme3Home();
  }, [brandName]);

  const departmentTiles = useMemo(() => {
    return departments.map((department) => {
      const key = normalizeKey(department?.name);
      const config = themeConfig?.departments?.[key] || {};

      return {
        ...department,
        key,
        image:
          config?.image ||
          themeConfig?.defaultDepartmentImage ||
          brandDetails?.headerImage ||
          "/fallback.png",
        title: config?.title || t(department?.name) || department?.name,
        subtitle: config?.subtitle || "",
      };
    });
  }, [departments, themeConfig, brandDetails, t]);

  const handleDepartmentClick = (departmentName) => {
    router.push(
      `/brand/theme3/${encodeURIComponent(brandName)}/${encodeURIComponent(
        departmentName
      )}`
    );
  };

  if (loading) {
    return <div className="th3-loading">Loading...</div>;
  }

  return (
    <div className="th3-wrapper">
      <section className="th3-hero">
        {brandDetails?.headerImage && (
          <img
            src={brandDetails.headerImage}
            alt={brandName}
            className="th3-hero-image"
          />
        )}

        <div className="th3-hero-overlay">
          {brandDetails?.logo && (
            <img
              src={brandDetails.logo}
              alt={brandName}
              className="th3-logo"
            />
          )}

          <h1>{brandName}</h1>
        </div>
      </section>

      <main className="th3-main">
        <section className="th3-tile-grid">
          {departmentTiles.map((department) => (
            <button
              key={department.key}
              type="button"
              className="th3-large-tile"
              onClick={() => handleDepartmentClick(department.name)}
            >
              <img src={department.image} alt={department.title} />

              <div className="th3-tile-overlay">
                {department.title && <h2>{department.title}</h2>}
                {department.subtitle && <p>{department.subtitle}</p>}
              </div>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Theme3;