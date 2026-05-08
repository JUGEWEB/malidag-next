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
  const [bestSeller, setBestSeller] = useState(null);
  const [topItems, setTopItems] = useState([]);

  const normalizeKey = (value = "") =>
    String(value).trim().toLowerCase().replace(/\s+/g, "_");

  const themeConfig = brandDetails?.themeConfig || {};

const normalizeFeatureItem = (product) => {
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
    image: source?.images?.[0] || firstVariantImage || "/fallback.png",
    usdPrice: source?.usdPrice || source?.price || product?.usdPrice || 0,
  };
};

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

  useEffect(() => {
    const fetchTheme3Home = async () => {
      try {
        setLoading(true);

       const [themesRes, departmentsRes, bestSellerRes, topItemsRes] =
  await Promise.all([
    fetch("https://api.malidag.com/api/brands/themes"),
    fetch(`https://api.malidag.com/api/brands/${brandName}`),
    fetch(`https://api.malidag.com/api/brands/${brandName}/best-seller`),
    fetch(`https://api.malidag.com/api/brands/${brandName}/top-items`),
  ]);

        const themesData = await themesRes.json();
        const departmentsData = await departmentsRes.json();
        const bestSellerData = bestSellerRes.ok ? await bestSellerRes.json() : null;
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

       setBestSeller(bestSellerData ? normalizeFeatureItem(bestSellerData) : null);

setTopItems(
  Array.isArray(topItemsData)
    ? topItemsData.map(normalizeFeatureItem)
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

  const mixedTiles = useMemo(() => {
  const tiles = departmentTiles.map((department) => ({
    type: "department",
    key: `department-${department.key}`,
    data: department,
  }));

  const featureItems = [];

  if (bestSeller) {
    featureItems.push({
      type: "bestSeller",
      key: `best-seller-${bestSeller.id}`,
      data: bestSeller,
    });
  }

  topItems.forEach((item) => {
    if (!item?.id || item.id === bestSeller?.id) return;

    featureItems.push({
      type: "topItem",
      key: `top-item-${item.id}`,
      data: item,
    });
  });

  featureItems.forEach((item, index) => {
    const insertAt = Math.min(index * 2 + 1, tiles.length);
    tiles.splice(insertAt, 0, item);
  });

  return tiles;
}, [departmentTiles, bestSeller, topItems]);

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
            {mixedTiles.map((tile) => {
              if (tile.type === "bestSeller" || tile.type === "topItem") {
                    const item = tile.data;

                    return (
                        <button
                        key={tile.key}
                        type="button"
                        className={
                            tile.type === "bestSeller"
                            ? "th3-large-tile th3-product-feature-tile"
                            : "th3-small-product-tile"
                        }
                        onClick={() => router.push(`/product/${item.id}`)}
                        >
                        <img src={item.image} alt={item.name} />

                        <div
                            className={
                            tile.type === "bestSeller"
                                ? "th3-tile-overlay"
                                : "th3-small-product-info"
                            }
                        >
                            <span className="th3-tile-kicker">
                            {tile.type === "bestSeller" ? "Best Seller" : "Top Pick"}
                            </span>

                            <h2>{item.name}</h2>
                            <p>${Number(item.usdPrice || 0).toFixed(2)}</p>
                        </div>
                        </button>
                    );
                    }

                const department = tile.data;

                return (
                <button
                    key={tile.key}
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
                );
            })}
            </section>
      </main>
    </div>
  );
}

export default Theme3;