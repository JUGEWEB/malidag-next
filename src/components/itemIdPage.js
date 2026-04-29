"use client";

import React, { useState, useEffect } from "react";
import useScreenSize from "./useIsMobile";
import './ItemIdPage.css';
import { Carousel } from "antd";
import { useTranslation } from "react-i18next";
import i18n from "i18next";


const ItemIdPage = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {isMobile, isDesktop, isTablet, isSmallMobile, isVerySmall, isVeryVerySmall} = useScreenSize()
  const { t } = useTranslation();
   const [translation, setTranslation] = useState(null);
  const getTranslationById = (id) => {
  return translation?.find(t => t.id === id)?.translatedText || null;
};

console.log("Translation array:", translation);


  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://api.malidag.com/api/items/items/${id}`);
      if (!res.ok) throw new Error("Item not found or API error");

      const itemData = await res.json();
      setData(itemData);

      // ✅ Now fetch translations
      const lang = i18n.language;
      const folderID = itemData.folderID;
      const transRes = await fetch(`https://api.malidag.com/translate/brand-media/${folderID}/${lang}`);

      if (transRes.ok) {
        const transData = await transRes.json();
        setTranslation(transData.translation);
      } else {
        console.warn("No translations found for current language.");
        setTranslation(null);
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id, i18n.language]);


  if (loading) return <div className="text-center py-10 text-lg">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!data) return <div className="text-center">No data found</div>;

  return (
    <div style={{width: "100%", maxWidth: "100%", overflow: "hidden"}} >
      <h1 className="text-centerSlide">From the brand</h1>

        {data.media.map((item, index) => {
         const hasText = item.text && item.text.trim();

  return (

          <div key={index}  style={{width: "100%", maxWidth: "100%"}}>
            {/* Image with Text */}
            {item.type === "image_with_text" && (
              <div className="flex-colSlide" style={{display:(isDesktop || isTablet) ? "grid" : "", alignItems:(isDesktop || isTablet) ? "center" : "start", justifyContent: "end", padding: "10px", gridTemplateColumns: (isDesktop || isTablet) ? "1fr 2fr" : undefined,}}>
                <img
                  src={`${item.files}`}
                  alt="With text"
                  className="w-full-slide"
                  style={{maxWidth: (isDesktop || isTablet) ? "500px" : "100%", height: "100%"}}
                />
                <p className="text-l-hgeslid" style={{color: "black", padding: "5px"}}>{hasText ? (getTranslationById(item.id) || item.text) : null}</p>
              </div>
            )}

            {item.type === "image-Left_with_text" && (
              <div className="f-grid-versionHsion" style={{display:(isDesktop || isTablet) ? "flex" : "", alignItems:(isDesktop || isTablet) ? "center" : "start", justifyContent: "end", padding: "20px",  width: "100%", maxWidth: "100%"}}>
                <p className="text-lgGar" style={{color: "black", padding: "20px"}}>{hasText ? (getTranslationById(item.id) || item.text) : null}</p>
                <img
                  src={`${item.files}`}
                  alt="With text"
                  className="w-fullAdsfer"
                  style={{maxWidth: (isDesktop || isTablet) ? "500px" : "100%", height: "100%"}}
                />
              
              </div>
            )}

            {/* Video with Text */}
            {item.type === "video_with_text" && (
              <div className="flexfgrts" style={{display:(isDesktop || isTablet) ? "grid" : "", alignItems:(isDesktop || isTablet) ? "center" : "start", justifyContent: "space-between", padding: "10px", gridTemplateColumns: (isDesktop || isTablet) ? "1fr 2fr" : undefined,}}>
                <video
                  src={`${item.files}`}
                  controls
                  className="w-fuldfreh"
                  style={{maxWidth: (isDesktop || isTablet) ? "500px" : "100%", height: "100%"}}
                />
                <p className="text-lgrdsea" style={{color: "black", padding: "20px"}}> {getTranslationById(item.id) || item.text}</p>
              </div>
            )}

             {/* Video with Text */}
            {item.type === "single_video" && (
              <div className="flexfgrts" style={{display:(isDesktop || isTablet) ? "grid" : "", alignItems:(isDesktop || isTablet) ? "center" : "start", justifyContent: "space-between", padding: "10px", gridTemplateColumns: (isDesktop || isTablet) ? "1fr 1fr" : undefined,}}>
                <video
                  src={`${item.files}`}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-fuldfreh"
                  style={{maxWidth: (isDesktop || isTablet) ? "100%" : "100%", height: "auto", objectFit: "cover"}}
                />
              </div>
            )}

            {item.type === "text_only" && (
  <div className="mobile-brand-text-only">
    {item.title && <h2>{item.title}</h2>}
    {item.subtitle && <p>{item.subtitle}</p>}
  </div>
)}

{item.type === "image_right_with_title_subtitle" && (
  <div className="mobile-brand-title-image">
    <div className="mobile-brand-title-copy">
      {item.title && <h2>{item.title}</h2>}
      {item.subtitle && <p>{item.subtitle}</p>}
    </div>

    <img src={item.files} alt={item.title || "Brand visual"} />
  </div>
)}

{item.type === "title_image_subtitle" && (
  <div className="mobile-brand-title-image center">
    {item.title && <h2>{item.title}</h2>}

    <img src={item.files} alt={item.title || "Brand visual"} />

    {item.subtitle && <p>{item.subtitle}</p>}
  </div>
)}

{item.type === "multiple_images_title_subtitle" && (
  <div className="mobile-brand-multi-grid">
    {Array.isArray(item.files) &&
      item.files.map((img, i) => (
        <div className="mobile-brand-multi-item" key={i}>
          <img src={img.url} alt={img.title || `Brand image ${i + 1}`} />
          {img.title && <h3>{img.title}</h3>}
          {img.subtitle && <p>{img.subtitle}</p>}
        </div>
      ))}
  </div>
)}

{item.type === "multiple_icons_title_subtitle" && (
  <div className="mobile-brand-icons-grid">
    {Array.isArray(item.files) &&
      item.files.map((img, i) => (
        <div className="mobile-brand-icon-item" key={i}>
          <img src={img.url} alt={img.title || `Brand icon ${i + 1}`} />
          {img.title && <h3>{img.title}</h3>}
          {img.subtitle && <p>{img.subtitle}</p>}
        </div>
      ))}
  </div>
)}

           {/* Slide Images */}
{item.type === "slide_images" && (
  <div
    className="fderslijd"
    style={{
      display: (isDesktop || isTablet) ? "" : "block",
      alignItems: (isDesktop || isTablet) ? "start" : "start",
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
    {hasText ? (getTranslationById(item.id) || item.text) : null}
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
                  height: (isDesktop || isTablet) ? "400px" : "300px",
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


            {/* Single Image (Full Width) */}
            {item.type === "single_image" && (
              <div className="w-fullDersir" style={{display: "", alignItems:"center" , justifyContent: "space-between", padding: "10px", width: "100%", objectFit: "cover"}}>
                <img
                  src={`${item.files}`}
                  alt="Full Image"
                  className="w-fulGdertsion"
                  style={{maxWidth: (isDesktop || isTablet) ? "100%" : "100%", height: "100%"}}
                />
              </div>
            )}
          </div>
  )
})}
    
      </div>
    
  );
};

export default ItemIdPage;
