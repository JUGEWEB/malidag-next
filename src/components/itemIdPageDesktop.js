"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Carousel } from "antd";
import { useTranslation } from "react-i18next";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import i18n from "i18next";
import "./ItemIdPageDesktop.css";

const API_BASE = "https://api.malidag.com";

export default function ItemIdPageDesktop({ id }) {
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
        <h2>From the brand</h2>
      </div>

      <div className="brand-media-list">
        {data.media.map((item, index) => {
          const text = getText(item);

          if (item.type === "image_with_text") {
            return (
              <article className="brand-media-card-image_with_text brand-media-split" key={index}>
                <div className="brand-media-visual-image_with_text">
                  <img src={item.files} alt={text || "Brand visual"} />
                </div>
                {text && <p className="brand-media-copy">{text}</p>}
              </article>
            );
          }

          if (item.type === "image-Left_with_text") {
            return (
              <article
                className="brand-media-card-image-Left_with_text brand-media-split brand-media-reverse"
                key={index}
              >
                {text && <p className="brand-media-copy">{text}</p>}
                <div className="brand-media-visual-image-left_with_text">
                  <img src={item.files} alt={text || "Brand visual"} />
                </div>
              </article>
            );
          }

             if (item.type === "image_right_with_title_subtitle") {
  return (
    <article
      className="brand-media-card-image_right_with_title_subtitle-brand brand-media-split-brand"
      key={index}
    >
      <div className="brand-media-text-block-brand">
        {item.title && (
          <h1 className="brand-media-title-brand">
            {getText({ ...item, text: item.title })}
          </h1>
        )}

        {item.subtitle && (
          <p className="brand-media-subtitle-brand">
            {getText({ ...item, text: item.subtitle })}
          </p>
        )}
      </div>

      <div className="brand-media-visual-image_right-brand">
        <img src={item.files} alt="Brand visual" />
      </div>
    </article>
  );
}

if (item.type === "title_image_subtitle") {
  return (
    <article className="brand-media-card-title_image_subtitle-brand" key={index}>
      {item.title && (
        <h1 className="brand-media-title-brand brand-media-title-center">
          {getText({ ...item, text: item.title })}
        </h1>
      )}

      <div className="brand-media-visual-center-brand">
        <img src={item.files} alt="Brand visual" />
      </div>

      {item.subtitle && (
        <p className="brand-media-subtitle-brand brand-media-subtitle-center">
          {getText({ ...item, text: item.subtitle })}
        </p>
      )}
    </article>
  );
}

if (item.type === "text_only") {
  return (
    <article className="brand-media-card-text_only" key={index}>
      <div className="brand-media-text-only-inner">
        {item.title && (
          <h1 className="brand-media-title-brand brand-media-title-center">
            {item.title}
          </h1>
        )}

        {item.subtitle && (
          <p className="brand-media-subtitle-brand brand-media-subtitle-center">
            {item.subtitle}
          </p>
        )}
      </div>
    </article>
  );
}

if (item.type === "multiple_images_title_subtitle") {
  return (
    <article key={index} className="brand-media-multi">
      <div className="brand-media-multi-grid">
        {Array.isArray(item.files) &&
          item.files.map((img, i) => (
            <div key={i} className="brand-media-multi-item">
              <img src={img.url} alt="" />

              {img.title && <h3>{img.title}</h3>}
              {img.subtitle && <p>{img.subtitle}</p>}
            </div>
          ))}
      </div>
    </article>
  );
}

          if (item.type === "video_with_text") {
            return (
              <article className="brand-media-card-video_with_text brand-media-split-video_with_text" key={index}>
                <div className="brand-media-visual-video_with_text">
                  <video src={item.files} controls playsInline />
                </div>
                {text && <p className="brand-media-copy">{text}</p>}
              </article>
            );
          }

          if (item.type === "single_video") {
            return (
              <article className="brand-media-card-single_video" key={index}>
                <div className="brand-media-hero-single_video">
                  <video src={item.files} controls muted loop playsInline />
                </div>
              </article>
            );
          }

          if (item.type === "image_top_text_position") {
  const position = item.textPosition || "left";

  return (
    <article
      className={`brand-media-card-image_top_text_position brand-media-text-${position}`}
      key={index}
    >
      <img src={item.files} alt={item.title || "Brand visual"} />

      <div className="brand-media-top-text-overlay">
        {item.title && (
          <h1 className="brand-media-title-brand">
            {item.title}
          </h1>
        )}

        {item.subtitle && (
          <p className="brand-media-subtitle-brand">
            {item.subtitle}
          </p>
        )}
      </div>
    </article>
  );
}

if (item.type === "multiple_image_top_text_position") {
  return (
    <article className="brand-media-horizontal-top-text" key={index}>
      <div className="brand-media-horizontal-scroll">
        {Array.isArray(item.files) &&
          item.files.map((img, i) => {
            const position = img.textPosition || "left";

            return (
              <div
                className={`brand-media-horizontal-card brand-media-text-${position}`}
                key={i}
              >
                <img src={img.url} alt={img.title || `Brand image ${i + 1}`} />

                <div className="brand-media-horizontal-text-overlay">
                  {img.title && <h2>{img.title}</h2>}
                  {img.subtitle && <p>{img.subtitle}</p>}
                </div>
              </div>
            );
          })}
      </div>
    </article>
  );
}

          if (item.type === "single_image") {
            return (
              <article className="brand-media-card-single_image" key={index}>
                <div className="brand-media-hero-single_image">
                  <img src={item.files} alt="Brand visual" />
                </div>
              </article>
            );
          }

         if (item.type === "slide_images") {
  return (
    <article className="brand-media-card-slide_images" key={index}>
      {text && <h3 className="brand-media-slide-title">{text}</h3>}

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
              <div className="brand-media-slide-slide_images">
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