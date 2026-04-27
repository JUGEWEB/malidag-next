"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Carousel } from "antd";
import { useTranslation } from "react-i18next";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import i18n from "i18next";
import "./brandIdPage.css";

const API_BASE = "https://api.malidag.com";

export default function BrandIdPage({ brandName }) {
  const [data, setData] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [status, setStatus] = useState("loading");
  const { t } = useTranslation();

  const PrevArrow = (props) => {
  const { onClick } = props;
  return (
    <div className="brand-carousel-arrow brand-carousel-prev" onClick={onClick}>
      <LeftOutlined />
    </div>
  );
};

const NextArrow = (props) => {
  const { onClick } = props;
  return (
    <div className="brand-carousel-arrow brand-carousel-next" onClick={onClick}>
      <RightOutlined />
    </div>
  );
};

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setStatus("loading");

        const { data: itemData } = await axios.get(
          `${API_BASE}/api/items/items/${brandName}`
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

    if (brandName) fetchData();

    return () => {
      cancelled = true;
    };
  }, [brandName, i18n.language]);

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
      <section className="brand-media-shell-brand">
        <div className="brand-media-state">Loading brand content...</div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="brand-media-shell-brand">
        <div className="brand-media-state-brand brand-media-state-error-brand">
          Brand content is currently unavailable.
        </div>
      </section>
    );
  }

  if (!data?.media?.length) return null;

  return (
    <section className="brand-media-shell-brand">
      <div className="brand-media-header-brand">
        <span className="brand-media-eyebrow-brand">trusted brand</span>
        <h2>We Elevate quality</h2>
      </div>

      <div className="brand-media-list-brand">
        {data.media.map((item, index) => {
          const text = getText(item);

          if (item.type === "image_with_text") {
            return (
              <article className="brand-media-card-image_with_text-brand brand-media-split-brand" key={index}>
                <div className="brand-media-visual-image_with_text-brand">
                  <img src={item.files} alt={text || "Brand visual"} />
                </div>
                {text && <p className="brand-media-copy-brand">{text}</p>}
              </article>
            );
          }

          if (item.type === "image-Left_with_text") {
            return (
              <article
                className="brand-media-card-image-Left_with_text-brand brand-media-split-brand brand-media-reverse-brand"
                key={index}
              >
                {text && <p className="brand-media-copy-brand">{text}</p>}
                <div className="brand-media-visual-image-left_with_text-brand">
                  <img src={item.files} alt={text || "Brand visual"} />
                </div>
              </article>
            );
          }

          if (item.type === "video_with_text") {
            return (
              <article className="brand-media-card-video_with_text-brand brand-media-split-video_with_text-brand" key={index}>
                <div className="brand-media-visual-video_with_text-brand">
                  <video src={item.files} controls playsInline />
                </div>
                {text && <p className="brand-media-copy-brand">{text}</p>}
              </article>
            );
          }

          if (item.type === "single_video") {
            return (
              <article className="brand-media-card-single_video-brand" key={index}>
                <div className="brand-media-hero-single_video-brand">
                  <video src={item.files} controls muted loop playsInline />
                </div>
              </article>
            );
          }

          if (item.type === "single_image") {
            return (
              <article className="brand-media-card-single_image-brand" key={index}>
                <div className="brand-media-hero-single_image-brand">
                  <img src={item.files} alt="Brand visual" />
                </div>
              </article>
            );
          }

         if (item.type === "slide_images") {
  return (
    <article className="brand-media-card-slide_images-brand" key={index}>
      {text && <h3 className="brand-media-slide-title-brand">{text}</h3>}

      <Carousel
        autoplay
        dots
        arrows
        prevArrow={<PrevArrow />}
        nextArrow={<NextArrow />}
      >
        {Array.isArray(item.files) &&
          item.files.map((slide, i) => (
            <div key={i}>
              <div className="brand-media-slide-slide_images-brand">
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