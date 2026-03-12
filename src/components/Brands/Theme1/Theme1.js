'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import useFinalRating from "../../finalRating";
import useScreenSize from "../../useIsMobile";
import "./Baasploa.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

function Theme1({ brandName }) {
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [bestSeller, setBestSeller] = useState(null);
  const [brandDetails, setBrandDetails] = useState({ headerImage: null, logo: null });
  const { isDesktop, isTablet, isVerySmall, isVeryVerySmall } = useScreenSize();
  const [expandedDeptIndex, setExpandedDeptIndex] = useState(null);
  const [translations, setTranslations] = useState({});
  const { t } = useTranslation();

  const { finalRating, loading, error } = useFinalRating(bestSeller?.itemId || 0);

  const normalizeTopItem = (product) => ({
    id: product?.id || "",
    itemId: product?.itemId || "",
    name: product?.name || "",
    images: Array.isArray(product?.images) ? product.images : [],
    videos: Array.isArray(product?.videos) ? product.videos : [],
    department: product?.department || "",
  });

  const normalizeBestSeller = (product) => {
    const source = product?.item || {};

    return {
      id: product?.id || "",
      itemId: product?.itemId || "",
      name: source?.name || "",
      images: Array.isArray(source?.images) ? source.images : [],
      videos: Array.isArray(source?.videos) ? source.videos : [],
      department: source?.department || product?.details?.department || "",
    };
  };

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

    topItems.forEach((item) => {
      if (item?.itemId) fetchTranslation(item.itemId, lang);
    });

    if (bestSeller?.itemId) {
      fetchTranslation(bestSeller.itemId, lang);
    }
  }, [topItems, bestSeller]);

  useEffect(() => {
    const fetchBrandDetails = async () => {
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
            headerImage: brand?.headerImage || null,
            logo: brand?.logo || null,
          });
        }
      } catch (err) {
        console.error("Error fetching brand theme:", err);
      }
    };

    fetchBrandDetails();
  }, [brandName]);

  useEffect(() => {
    fetch(`https://api.malidag.com/api/brands/${brandName}`)
      .then((response) => response.json())
      .then((data) => setDepartments(Array.isArray(data?.departments) ? data.departments : []))
      .catch((error) => {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      });
  }, [brandName]);

  useEffect(() => {
    fetch(`https://api.malidag.com/api/brands/${brandName}/top-items`)
      .then((response) => response.json())
      .then((data) => {
        const normalized = Array.isArray(data) ? data.map(normalizeTopItem) : [];
        setTopItems(normalized);
      })
      .catch((error) => {
        console.error("Error fetching top items:", error);
        setTopItems([]);
      });
  }, [brandName]);

  useEffect(() => {
    fetch(`https://api.malidag.com/api/brands/${brandName}/best-seller`)
      .then((response) => response.json())
      .then((data) => {
        setBestSeller(data ? normalizeBestSeller(data) : null);
      })
      .catch((error) => {
        console.error("Error fetching best seller:", error);
        setBestSeller(null);
      });
  }, [brandName]);

  const handleBrandTypeClick = (department, brandType) => {
    router.push(
      `/theme1department/${encodeURIComponent(department)}/${encodeURIComponent(
        brandType
      )}/${encodeURIComponent(brandName)}`
    );
  };

  const getTranslatedName = (item, itemId) => {
    const lang = i18n.language || "en";
    return translations?.[itemId]?.[lang]?.name || item?.name || "Unnamed product";
  };

  const shoeItems = useMemo(() => {
    return topItems.filter((item) => {
      const dept = item?.department?.trim()?.toLowerCase() || "";
      return (
        dept === "men-shoes" ||
        dept === "women-shoes" ||
        dept === "mwomen-shoes"
      );
    });
  }, [topItems]);

  const otherItems = useMemo(() => {
    return topItems.filter((item) => {
      const dept = item?.department?.trim()?.toLowerCase() || "";
      return (
        dept !== "men-shoes" &&
        dept !== "women-shoes" &&
        dept !== "mwomen-shoes"
      );
    });
  }, [topItems]);

  return (
    <div>
      {isDesktop && (
        <div className="blaasploaContainer">
          <div className="blaDepartement">
            <div className="bladeprt">
              <div>
                {brandDetails?.logo ? (
                  <img
                    src={brandDetails.logo}
                    alt={`${brandName} Logo`}
                    className="logoImage"
                  />
                ) : null}

                <div className="departementTitle">Departments</div>

                <div className="departmentCategories">
                  <ul>
                    {departments.map((department, index) => (
                      <li key={index}>
                        <strong>{t(department?.name)}</strong>
                        <ul>
                          {(department?.brandTypes || []).map((brandType, bIndex) => (
                            <li
                              key={bIndex}
                              className="clickableBrandType"
                              onClick={() => handleBrandTypeClick(department?.name, brandType)}
                            >
                              {t(brandType)}
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

          <div className="blaStyle">
            <div className="headerImage">
              {brandDetails?.headerImage ? (
                <img
                  src={brandDetails.headerImage}
                  alt={`${brandName} Header`}
                  className="headerImgStyle"
                />
              ) : null}
              <div className="baasploaT">{brandName}</div>
            </div>

            <div className="topItemsSection">
              {shoeItems.map((item) => (
                <div
                  key={item.id}
                  className="topItemCard"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  <div className="topLabel">Top</div>
                  <div className="imageContainIm">
                    {item?.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="topItemImage"
                      />
                    ) : null}
                  </div>
                  <div className="topItemDetails">
                    <div className="topItemName">
                      {getTranslatedName(item, item.itemId)}
                    </div>
                    <div className="ratingContainer">
                      {loading ? (
                        <span>Loading...</span>
                      ) : error ? (
                        <span>Error loading rating</span>
                      ) : (
                        <span className="stars">⭐ {finalRating || "No Rating"}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {bestSeller ? (
              <div className="bestSellerSection">
                {bestSeller?.videos?.length > 0 ? (
                  <div
                    style={{ cursor: "pointer" }}
                    className="videoContainer"
                    onClick={() => router.push(`/product/${bestSeller.id}`)}
                  >
                    <video autoPlay muted loop playsInline controls>
                      <source src={bestSeller.videos[0]} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <p>No video available</p>
                )}

                <div
                  className="bestSellerContainer"
                  onClick={() => router.push(`/product/${bestSeller.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {bestSeller?.images?.[0] ? (
                    <img
                      src={bestSeller.images[0]}
                      alt={bestSeller.name}
                      className="bestSellerImage"
                    />
                  ) : null}
                  <div className="bestSellerBadge">Best Seller</div>
                  <div className="bestSellerTitle">
                    {getTranslatedName(bestSeller, bestSeller.itemId)}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="topItemsSection">
              {otherItems.map((item) => (
                <div
                  key={item.id}
                  className="topItemCard"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  <div className="topLabel">Top</div>
                  <div className="imageContainIm">
                    {item?.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="topItemImage"
                      />
                    ) : null}
                  </div>
                  <div className="topItemDetails">
                    <div className="topItemName">
                      {getTranslatedName(item, item.itemId)}
                    </div>
                    <div className="ratingContainer">
                      {loading ? (
                        <span>Loading...</span>
                      ) : error ? (
                        <span>Error loading rating</span>
                      ) : (
                        <span className="stars">⭐ {finalRating || "No Rating"}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isDesktop && (
        <div style={{ color: "black", padding: "10px" }}>
          <div className="headerImage">
            {brandDetails?.headerImage ? (
              <img
                src={brandDetails.headerImage}
                alt={`${brandName} Header`}
                className="headerImgStyle"
              />
            ) : null}
            <div className="baasploaT">{brandName}</div>
          </div>

          <div className="blaDepartementforSmall">
            <div className="bladeprtforSmall">
              {brandDetails?.logo ? (
                <img
                  src={brandDetails.logo}
                  alt={`${brandName} Logo`}
                  className="logoImage"
                />
              ) : null}

              <div className="departmentCategoriesForSmall">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    overflowX: "auto",
                    gap: "16px",
                    padding: "10px 0",
                  }}
                >
                  {departments.map((department, index) => (
                    <div key={index} style={{ minWidth: "120px" }}>
                      <div
                        onClick={() =>
                          setExpandedDeptIndex(index === expandedDeptIndex ? null : index)
                        }
                        style={{
                          fontWeight: "bold",
                          cursor: "pointer",
                          color: "#333",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          backgroundColor: "#f0f0f0",
                          textAlign: "center",
                        }}
                      >
                        {t(department?.name)}
                      </div>

                      {expandedDeptIndex === index ? (
                        <div style={{ paddingTop: "8px" }}>
                          {(department?.brandTypes || []).map((brandType, bIndex) => (
                            <div
                              key={bIndex}
                              className="clickableBrandTypeforsmall"
                              onClick={() =>
                                handleBrandTypeClick(department?.name, brandType)
                              }
                              style={{
                                marginTop: "4px",
                                cursor: "pointer",
                                backgroundColor: "#fff",
                                border: "1px solid #ddd",
                                padding: "5px",
                                borderRadius: "3px",
                              }}
                            >
                              {t(brandType)}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {bestSeller ? (
            <div
              style={{
                marginTop: "20px",
                display: isTablet ? "grid" : isVeryVerySmall || isVerySmall ? "" : "grid",
                gridTemplateColumns: isTablet ? "1fr 2fr" : "1fr 1fr",
                width: isTablet ? "100%" : "",
                margin: "1rem",
              }}
            >
              <div
                style={{
                  width: isTablet ? "400px" : "100%",
                  height: "300px",
                  position: "relative",
                }}
              >
                {bestSeller?.videos?.length > 0 ? (
                  <div
                    style={{
                      cursor: "pointer",
                      marginBottom: isVeryVerySmall || isVerySmall ? "0px" : "",
                      width: isVeryVerySmall || isVerySmall ? "100%" : "auto",
                      height: isVeryVerySmall || isVerySmall ? "300px" : "auto",
                    }}
                    onClick={() => router.push(`/product/${bestSeller.id}`)}
                  >
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    >
                      <source src={bestSeller?.videos?.[0]} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <p>No video available</p>
                )}
              </div>

              <div
                onClick={() => router.push(`/product/${bestSeller.id}`)}
                style={{ position: "relative", width: "100%", cursor: "pointer" }}
              >
                {bestSeller?.images?.[0] ? (
                  <img
                    src={bestSeller.images[0]}
                    alt={bestSeller.name}
                    style={{
                      width: "100%",
                      height: isVerySmall ? "230px" : "300px",
                      objectFit: "contain",
                      marginTop: "0px",
                    }}
                  />
                ) : null}
                <div className="bestSellerBadge">Best Seller</div>
                <div className="bestSellerTitle">
                  {getTranslatedName(bestSeller, bestSeller.itemId)}
                </div>
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isVeryVerySmall ? "repeat(1, 1fr)" : "repeat(2, 1fr)",
              gap: "10px",
              padding: "10px",
            }}
          >
            {shoeItems.map((item) => (
              <div
                onClick={() => router.push(`/product/${item.id}`)}
                key={item.id}
                style={{ position: "relative", width: "100%", marginTop: "10px", cursor: "pointer" }}
              >
                <div className="topLabel">Top</div>
                <div>
                  {item?.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      style={{
                        height: isVerySmall ? "230px" : "300px",
                        width: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : null}
                </div>
                <div>
                  <div>{getTranslatedName(item, item.itemId)}</div>
                  <div>
                    {loading ? (
                      <span>Loading...</span>
                    ) : error ? (
                      <span>Error loading rating</span>
                    ) : (
                      <span className="stars">⭐ {finalRating || "No Rating"}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isVeryVerySmall ? "repeat(1, 1fr)" : "repeat(2, 1fr)",
              gap: "10px",
              padding: "10px",
            }}
          >
            {otherItems.map((item) => (
              <div
                onClick={() => router.push(`/product/${item.id}`)}
                key={item.id}
                style={{ position: "relative", width: "100%", marginTop: "10px", cursor: "pointer" }}
              >
                <div className="topLabel">Top</div>
                <div>
                  {item?.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      style={{
                        height: isVerySmall ? "230px" : "300px",
                        width: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : null}
                </div>
                <div>
                  <div>{getTranslatedName(item, item.itemId)}</div>
                  <div>
                    {loading ? (
                      <span>Loading...</span>
                    ) : error ? (
                      <span>Error loading rating</span>
                    ) : (
                      <span className="stars">⭐ {finalRating || "No Rating"}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Theme1;