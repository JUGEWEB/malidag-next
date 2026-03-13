"use client";

import React, { useState, useEffect } from "react";
import "./BrandDepartment.css";
import axios from "axios";
import { useRouter } from "next/navigation";
import useScreenSize from "../../useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

function Theme1Department({ brandName, department, brandType }) {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const { isDesktop, isMobile, isVerySmall, isSmallMobile, isTablet, isVeryVerySmall } = useScreenSize();
  const [expandedDeptIndex, setExpandedDeptIndex] = useState(null);
  const [translations, setTranslations] = useState({});
  const { t } = useTranslation();

  const [brandDetails, setBrandDetails] = useState({
    logo: null,
    headerImage: null,
    theme: null,
  });

  const fetchTranslation = async (productId, lang) => {
    if (!productId || translations?.[productId]?.[lang]) return;

    try {
      const response = await fetch(
        `https://api.malidag.com/translate/product/translate/${productId}/${lang}`
      );
      const data = await response.json();

      setTranslations((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [lang]: data?.translation || {},
        },
      }));
    } catch (error) {
      console.error(`Error fetching translation for product ${productId}`, error);
    }
  };

  useEffect(() => {
    const lang = i18n.language || "en";
    items.forEach((item) => {
      if (item?.itemId) fetchTranslation(item.itemId, lang);
    });
  }, [items]);

  useEffect(() => {
    const fetchBrandTheme = async () => {
      try {
        const res = await fetch("https://api.malidag.com/api/brands/themes");
        const data = await res.json();

        const brand = Array.isArray(data)
          ? data.find(
              (b) =>
                b?.brandName?.trim()?.toLowerCase() ===
                brandName?.trim()?.toLowerCase()
            )
          : null;

        if (brand) {
          setBrandDetails({
            logo: brand?.logo || null,
            headerImage: brand?.headerImage || null,
            theme: brand?.theme || null,
          });
        }
      } catch (err) {
        console.error("Theme fetch error:", err);
      }
    };

    if (brandName) {
      fetchBrandTheme();
    }
  }, [brandName]);

  useEffect(() => {
    if (!brandName) return;

    fetch(`https://api.malidag.com/api/brands/${brandName}`)
      .then((res) => res.json())
      .then((data) => setDepartments(Array.isArray(data?.departments) ? data.departments : []))
      .catch((err) => console.error("Department fetch error:", err));
  }, [brandName]);

  useEffect(() => {
    if (!department || !brandType || !brandName) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    axios
      .get(`https://api.malidag.com/api/brands/${brandName}/items`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        const filtered = data.filter((item) => {
          const itemDepartment = item?.item?.department?.trim()?.toLowerCase() || "";
          const itemBrandType = item?.item?.brandType?.trim()?.toLowerCase() || "";
          const targetDepartment = department?.trim()?.toLowerCase() || "";
          const targetBrandType = brandType?.trim()?.toLowerCase() || "";

          return (
            itemDepartment === targetDepartment &&
            itemBrandType === targetBrandType
          );
        });

        setItems(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load items");
        setLoading(false);
      });
  }, [department, brandType, brandName]);

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    return translations?.[itemId]?.[lang]?.name || item?.item?.name || "Unnamed product";
  };

  return (
    <div>
      {isDesktop && (
        <div className="brandDepartmentContainer">
          <div className="blaDepartement" style={{ color: "black" }}>
            <div className="bladeprt">
              <div>
                {brandDetails?.logo ? (
                  <img
                    src={brandDetails.logo}
                    alt={`${brandName} Logo`}
                    className="logoImage"
                  />
                ) : null}

                <div className="departementTitle">{t("departments_label")}</div>

                <div className="departmentCategories">
                  <ul>
                    {departments.map((dep, index) => (
                      <li key={index}>
                        <strong>{t(dep?.name)}</strong>
                        <ul>
                          {(dep?.brandTypes || []).map((brand, bIndex) => (
                            <li
                              key={bIndex}
                              className={`clickableBrandType ${
                                brand === brandType && dep?.name === department
                                  ? "selectedBrandType"
                                  : ""
                              }`}
                              onClick={() =>
                                router.push(
                                  `/${brandDetails?.theme?.toLowerCase()}department/${encodeURIComponent(dep?.name || "")}/${encodeURIComponent(brand || "")}/${encodeURIComponent(brandName || "")}`
                                )
                              }
                            >
                              {t(brand)}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rightColumn">
            {loading && <p className="loadingMessage">{t("loading")}</p>}
            {error && <p className="errorMessage">{t("error_label")}: {error}</p>}

            <div
              style={{
                display: "grid",
                gap: "5px",
                padding: "5px",
                gridTemplateColumns: "repeat(3, 1fr)",
              }}
            >
              {items.map((item) => (
                <div key={item.id}>
                  <div
                    style={{ filter: "brightness(0.9) contrast(1.2)", cursor: "pointer" }}
                    onClick={() => router.push(`/product/${item.id}`)}
                  >
                    {item?.item?.images?.[0] ? (
                      <img
                        src={item.item.images[0]}
                        alt={item?.item?.name || "Product"}
                        style={{
                          width: "100%",
                          height: "250px",
                          backgroundColor: "white",
                          objectFit: "contain",
                        }}
                      />
                    ) : null}
                  </div>

                  <div
                    className="itemDetails"
                    onClick={() => router.push(`/product/${item.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <h3 className="itemTitle" style={{ color: "black" }}>
                      {getTranslatedName(item, item.itemId)}
                    </h3>
                    <p className="itemPrice">
                      {t("price")}: ${item?.item?.usdPrice || "0"}
                    </p>

                    <div
                      onClick={() => router.push(`/product/${item.id}`)}
                      style={{
                        color: "#007bff",
                        textDecoration: "underline",
                        cursor: "pointer",
                        marginTop: "5px",
                      }}
                    >
                      {t("view_label")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isDesktop && (
        <div style={{ padding: "10px", maxWidth: "100%", overflow: "hidden" }}>
          <div style={{ position: "relative" }}>
            {brandDetails?.logo ? (
              <img src={brandDetails.logo} alt={`${brandName} Logo`} style={{ width: "150px" }} />
            ) : null}

            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  width: "100%",
                  zIndex: 1000,
                  padding: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    overflowX: "auto",
                    gap: "16px",
                    color: "black",
                  }}
                >
                  {departments.map((dep, index) => (
                    <div
                      key={index}
                      style={{
                        minWidth: "140px",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        onClick={() =>
                          setExpandedDeptIndex(expandedDeptIndex === index ? null : index)
                        }
                        style={{
                          fontWeight: "bold",
                          cursor: "pointer",
                          textAlign: "center",
                          border: "1px solid #222",
                          borderRadius: "4px",
                          padding: "8px",
                        }}
                      >
                        {t(dep?.name)}
                      </div>

                      {expandedDeptIndex === index && (
                        <div
                          style={{
                            top: "100%",
                            left: 0,
                            width: "100%",
                            background: "white",
                            border: "1px solid #ccc",
                            boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
                            maxHeight: "300px",
                            overflowY: "auto",
                          }}
                        >
                          {(dep?.brandTypes || []).map((brand, bIndex) => (
                            <div
                              key={bIndex}
                              onClick={() =>
                                router.push(
                                  `/${brandDetails?.theme?.toLowerCase()}department/${encodeURIComponent(dep?.name || "")}/${encodeURIComponent(brand || "")}/${encodeURIComponent(brandName || "")}`
                                )
                              }
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                                cursor: "pointer",
                              }}
                            >
                              {brand}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ position: "relative", marginTop: "50px" }}>
              {loading && <p>{t("loading")}</p>}
              {error && <p>{t("error_label")}: {error}</p>}

              <div
                style={{
                  display: "grid",
                  gap: "5px",
                  padding: "5px",
                  gridTemplateColumns:
                    isVerySmall
                      ? "repeat(2, 1fr)"
                      : isVeryVerySmall
                      ? "repeat(1, 1fr)"
                      : isSmallMobile
                      ? "repeat(2, 1fr)"
                      : isMobile
                      ? "repeat(3, 1fr)"
                      : isTablet
                      ? "repeat(4, 1fr)"
                      : "repeat(5, 1fr)",
                }}
              >
                {items.map((item) => (
                  <div key={item.id} style={{ padding: "10px" }}>
                    <div
                      style={{
                        cursor: "pointer",
                        filter: "brightness(0.88) contrast(1.2)",
                        width: "100%",
                        height: isVerySmall ? "230px" : "250px",
                        backgroundColor: "white",
                      }}
                      onClick={() => router.push(`/product/${item.id}`)}
                    >
                      {item?.item?.images?.[0] ? (
                        <img
                          src={item.item.images[0]}
                          alt={item?.item?.name || "Product"}
                          style={{
                            width: "100%",
                            height: isVerySmall ? "230px" : "250px",
                            objectFit: "contain",
                          }}
                        />
                      ) : null}
                    </div>

                    <div
                      style={{ marginTop: "10px", color: "black", cursor: "pointer" }}
                      onClick={() => router.push(`/product/${item.id}`)}
                    >
                      <div>{getTranslatedName(item, item.itemId)}</div>
                      <div style={{ fontWeight: "bold" }}>${item?.item?.usdPrice || "0"}</div>
                      <div>{t("view_label")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Theme1Department;