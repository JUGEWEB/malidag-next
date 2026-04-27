"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Carousel } from "antd";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import "./ItemIdPageDesktop.css";

const API_BASE = "https://api.malidag.com";

export default function ItemIdPageDesktop({ id }) {
  const [data, setData] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [status, setStatus] = useState("loading");
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setStatus("loading");

        const { data: itemData } = await axios.get(
          `${API_BASE}/api/items/items/${id}`
        );

        if (cancelled) return;

        setData(itemData);

        try {
          const { data: transData } = await axios.get(
            `${API_BASE}/translate/brand-media/${itemData.folderID}/${i18n.language}`
          );

          if (!cancelled) {
            setTranslation(transData?.translation || null);
          }
        } catch {
          if (!cancelled) setTranslation(null);
        }

        if (!cancelled) setStatus("success");
      } catch (err) {
        console.error("Item brand media error:", err);
        if (!cancelled) setStatus("error");
      }
    }

    if (id) fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, i18n.language]);

  const translationMap = useMemo(() => {
    if (!Array.isArray(translation)) return {};
    return translation.reduce((acc, item) => {
      acc[item.id] = item.translatedText;
      return acc;
    }, {});
  }, [translation]);

  const getText = (item) => {
    const text = translationMap[item.id] || item.text;
    return text?.trim() || "";
  };

  if (status === "loading") {
    return (
      <section className="brand-media-shell">
        <div className="brand-media-state">Loading brand content...</div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="brand-media-shell">
        <div className="brand-media-state brand-media-state-error">
          Brand content is currently unavailable.
        </div>
      </section>
    );
  }

  if (!data?.media?.length) return null;

  return (
    <section className="brand-media-shell">
      <div className="brand-media-header">
        <span className="brand-media-eyebrow">Brand story</span>
        <h2>{t("from_the_brand") || "From the brand"}</h2>
      </div>

      <div className="brand-media-list">
        {data.media.map((item, index) => {
          const text = getText(item);

          if (item.type === "image_with_text") {
            return (
              <article className="brand-media-card brand-media-split" key={index}>
                <div className="brand-media-visual">
                  <img src={item.files} alt={text || "Brand visual"} />
                </div>
                {text && <p className="brand-media-copy">{text}</p>}
              </article>
            );
          }

          if (item.type === "image-Left_with_text") {
            return (
              <article
                className="brand-media-card brand-media-split brand-media-reverse"
                key={index}
              >
                {text && <p className="brand-media-copy">{text}</p>}
                <div className="brand-media-visual">
                  <img src={item.files} alt={text || "Brand visual"} />
                </div>
              </article>
            );
          }

          if (item.type === "video_with_text") {
            return (
              <article className="brand-media-card brand-media-split" key={index}>
                <div className="brand-media-visual">
                  <video src={item.files} controls playsInline />
                </div>
                {text && <p className="brand-media-copy">{text}</p>}
              </article>
            );
          }

          if (item.type === "single_video") {
            return (
              <article className="brand-media-card" key={index}>
                <div className="brand-media-hero">
                  <video src={item.files} controls muted loop playsInline />
                </div>
              </article>
            );
          }

          if (item.type === "single_image") {
            return (
              <article className="brand-media-card" key={index}>
                <div className="brand-media-hero">
                  <img src={item.files} alt="Brand visual" />
                </div>
              </article>
            );
          }

          if (item.type === "slide_images") {
            return (
              <article className="brand-media-card" key={index}>
                {text && <h3 className="brand-media-slide-title">{text}</h3>}

                <Carousel autoplay dots>
                  {Array.isArray(item.files) &&
                    item.files.map((slide, i) => (
                      <div key={i}>
                        <div className="brand-media-slide">
                          <img src={slide} alt={`Brand slide ${i + 1}`} />
                        </div>
                      </div>
                    ))}
                </Carousel>
              </article>
            );
          }

          return null;
        })}
      </div>
    </section>
  );
}