"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import useScreenSize from "./useIsMobile";
import "./ItemIdPage.css";
import { Carousel } from "antd";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const ItemIdPageDesktop = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [translation, setTranslation] = useState(null);
  const { t } = useTranslation();
  const { isDesktop, isTablet } = useScreenSize();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const getTranslationById = (id) => {
    return translation?.find((t) => t.id === id)?.translatedText || null;
  };

  useEffect(() => {
    if (!mounted) return; // ✅ don't fetch until mounted, but hooks order stays consistent
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: itemData } = await axios.get(
          `https://api.malidag.com/api/items/items/${id}`
        );

        if (cancelled) return;
        setData(itemData);

        const lang = i18n.language;
        const folderID = itemData.folderID;

        try {
          const { data: transData } = await axios.get(
            `https://api.malidag.com/translate/brand-media/${folderID}/${lang}`
          );
          if (!cancelled) setTranslation(transData.translation);
        } catch {
          console.warn("⚠️ No translations found for current language.");
          if (!cancelled) setTranslation(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("❌ Axios error:", err.response?.status, err.message);
          setError(err.response?.data?.message || "Item not found or API error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, i18n.language, mounted]);

  // 🌀 UI STATES
  if (!mounted) return <div className="text-center py-10 text-lg">Loading...</div>;
  if (loading) return <div className="text-center py-10 text-lg">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!data) return <div className="text-center">No data found</div>;

  // 🧱 MAIN RENDER
  return (
    <div style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <h1 className="text-centerSlide">From the brand</h1>

      {data.media.map((item, index) => {
        const hasText = item.text && item.text.trim();

        return (
          <div key={index} style={{ width: "100%", maxWidth: "100%" }}>
            {/* image_with_text */}
            {item.type === "image_with_text" && (
              <div
                className="flex-colSlide"
                style={{
                  display: "grid",
                  alignItems: "center",
                  justifyContent: "end",
                  padding: "10px",
                  gridTemplateColumns: "1fr 2fr",
                }}
              >
                <img
                  src={`${item.files}`}
                  alt="With text"
                  className="w-full-slide"
                  style={{ maxWidth: "500px", height: "100%" }}
                />
                <p
                  className="text-l-hgeslid"
                  style={{ color: "black", padding: "5px" }}
                >
                  {hasText ? getTranslationById(item.id) || item.text : null}
                </p>
              </div>
            )}

            {/* image-Left_with_text */}
            {item.type === "image-Left_with_text" && (
              <div
                className="f-grid-versionHsion"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "end",
                  padding: "20px",
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                <p
                  className="text-lgGar"
                  style={{ color: "black", padding: "20px" }}
                >
                  {hasText ? getTranslationById(item.id) || item.text : null}
                </p>
                <img
                  src={`${item.files}`}
                  alt="With text"
                  className="w-fullAdsfer"
                  style={{ maxWidth: "500px", height: "100%" }}
                />
              </div>
            )}

            {/* video_with_text */}
            {item.type === "video_with_text" && (
              <div
                className="flexfgrts"
                style={{
                  display: "grid",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  gridTemplateColumns: "1fr 2fr",
                }}
              >
                <video
                  src={`${item.files}`}
                  controls
                  className="w-fuldfreh"
                  style={{ maxWidth: "500px", height: "100%" }}
                />
                <p
                  className="text-lgrdsea"
                  style={{ color: "black", padding: "20px" }}
                >
                  {getTranslationById(item.id) || item.text}
                </p>
              </div>
            )}

            {/* single_video */}
            {item.type === "single_video" && (
              <div
                className="flexfgrts"
                style={{
                  display: "grid",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <video
                  src={`${item.files}`}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-fuldfreh"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

            {/* slide_images */}
            {item.type === "slide_images" && (
              <div
                className="fderslijd"
                style={{
                  alignItems: "start",
                  justifyContent: "space-between",
                  padding: "10px",
                }}
              >
                <h2
                  className="fgtbchwid"
                  style={{
                    color: "black",
                    marginBottom: "10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  {hasText ? getTranslationById(item.id) || item.text : null}
                </h2>

                <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
                  <Carousel
                    showThumbs={false}
                    infiniteLoop
                    autoPlay
                    interval={3000}
                    showStatus={false}
                    showIndicators={true}
                    dynamicHeight={false}
                  >
                    {Array.isArray(item.files) &&
                      item.files.map((slide, i) => (
                        <div key={i}>
                          <img
                            src={`${slide}`}
                            alt={`Slide ${i + 1}`}
                            className="rounded-gfrtse"
                            style={{
                              width: "100%",
                              height: "400px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                        </div>
                      ))}
                  </Carousel>
                </div>
              </div>
            )}

            {/* single_image */}
            {item.type === "single_image" && (
              <div
                className="w-fullDersir"
                style={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  width: "100%",
                  objectFit: "cover",
                }}
              >
                <img
                  src={`${item.files}`}
                  alt="Full Image"
                  className="w-fulGdertsion"
                  style={{ maxWidth: "100%", height: "100%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ItemIdPageDesktop;
