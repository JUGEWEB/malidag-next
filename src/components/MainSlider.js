'use client';


import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import MalidagCategorySmall from "./malidagCategorySmall";
import MalidagCategory from "./malidagCategory";
import ThemeWithText from "./themewithtext";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import Head from 'next/head';
import SlideVideo from './SlideVideo';
import SlideOverlay from './SlideOverlay';

const Slider = dynamic(() => import("react-slick").then(mod => mod.default), {
  ssr: false,
});

// ✅ Predefined fallback slides (instant load)
const fallbackSlides = [
  { id: "1", url: "https://cdn.malidag.com/public/header/1/headerImage1.webp", type: "#689c85", content: "image" },
  { id: "2", url: "https://cdn.malidag.com/public/header/2/malidagheader2.webp", type: "#e87909", content: "image" },
  { id: "3", url: "https://cdn.malidag.com/public/header/3/malidag-all-header.webp", type: "#024163", content: "image" },
   { id: "4", url: "https://cdn.malidag.com/public/header/4/Untitled%20video%20-%20Made%20with%20Clipchamp%20(13).mp4", type: "#000000ff", content: "video" },
];


const MainSlider = ({user}) => {
  const [currentSlide, setCurrentSlide] = useState(0)
   const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall} = useScreenSize()
    const router = useRouter();
    const pathname = usePathname();
     const videoRefs = React.useRef({});

    const isStandardWidth = isDesktop || isTablet || isMobile;
const { t } = useTranslation();


  const isHome = pathname === "/";

   const slides = [
     { id: "1", url: "https://cdn.malidag.com/public/header/4/Untitled%20video%20-%20Made%20with%20Clipchamp%20(13).webm", type: "#000000ff", content: "video", cover: "https://cdn.malidag.com/public/header/4/finetto.webp", router: "/brand/theme1/finetoo", headerText: " Fineto Fashion", paragText: " Elevate your style this season ✨" , buttonText: " Explore Brand"},
     { id: "2", url: "https://cdn.malidag.com/public/header/5/Untitled%20video%20-%20Made%20with%20Clipchamp%20(14).webm", type: "pink", content: "video", cover: "https://cdn.malidag.com/public/header/5/Untitled%20design%20(29).webp", router: "product/9e0da5b9-f4b3-42d0-8024-211ea47d0abd", headerText: "Snow Boots Winter Plush Warm Ankle...", paragText: "Get it now", buttonText: "Buy now" },
  { id: "3", url: "https://cdn.malidag.com/public/header/1/headerImage1.webp", type: "#689c85", content: "image", textPosition: "left", headline: "Earn Crypto", sub: "Start saving today" },
  { id: "4", url: "https://cdn.malidag.com/public/header/2/malidagheader2.webp", type: "#e87909", content: "image", textPosition: "right", headline: "Buy BNB", sub: "Fast & secure" },
  { id: "5", url: "https://cdn.malidag.com/public/header/3/malidag-all-header.webp", type: "#024163", content: "image", textPosition: "center", headline: "Save Big", sub: "Join our deals" },
];
const activeSlides = isStandardWidth ? slides : slides;

  const NextArrow = ({ className, style, onClick }) => {
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        right: "20px",
        marginRight: "20px",
        top: "10%", // 👈 move arrow up (adjust % as needed)
        zIndex: 2,
      }}
      onClick={onClick}
    />
  );
};


const PrevArrow = ({ className, style, onClick }) => {
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        left: "20px",
        marginLeft: "20px",
        top: "10%", // 👈 move arrow up
        zIndex: 2,
      }}
      onClick={onClick}
    />
  );
};


 const settings = {
  dots: false,
  infinite: true,
  speed: 100,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 150009,
  initialSlide: currentSlide,
  beforeChange: (oldIndex, newIndex) => {
    setCurrentSlide(newIndex);
    // Pause all videos when switching away
    Object.values(videoRefs.current).forEach((v) => v && v.pause());
  },
   afterChange: (newIndex) => {
    // Play the video if the active slide has one
    const slide = activeSlides[newIndex];
    if (slide && slide.content === "video") {
      const vid = videoRefs.current[slide.url];
      if (vid) {
        vid.currentTime = 0; // optional: restart from beginning
        vid.play().catch(() => {});
      }
    }
  },
  arrows: true,
  nextArrow: <NextArrow />,
  prevArrow: <PrevArrow />
};





  // Handle navigation based on ID
 const handleNavigation = (id) => {
    if (!id) return;
    switch (id.toString()) {
       case "1": router.push("/brand/theme1/finetoo"); break;
       case "2": router.push("/product/9e0da5b9-f4b3-42d0-8024-211ea47d0abd"); break;
      case "3": router.push("/payBNBBTCETH"); break;
      case "4": router.push("/buyBNB"); break;
      case "5": router.push("/save-big"); break;
      default: console.warn("Unknown id:", id); break;
    }
  };

  if (!isHome) return null; // ✅ No slider, no space

  return (
    <div>
      {/* 👆 NEVER UNMOUNT slider, just hide it with CSS */}
  <Head>
  <link rel="preconnect" href="https://cdn.malidag.com" crossOrigin="anonymous" />
  {activeSlides.map((slide) =>
    slide.content === "video" ? (
      <link
        key={slide.id}
        rel="preload"
        as="video"
        href={slide.url}
        type="video/mp4"
      />
    ) : (
      <link
        key={slide.id}
        rel="preload"
        as="image"
        href={slide.url}
      />
    )
  )}
</Head>

      <div style={{position: "relative"}}>
      <div style={{width: "100%", height: (isDesktop || isTablet || isMobile) ? "auto" : "auto", backgroundColor: "white"}}>
<div style={{ width: "100%", height: isStandardWidth ? "650px" : "440px" }}>
<Slider {...settings}>
  {activeSlides.map((slide) => (
    <div
      key={slide.id}
      style={{
        position: "relative",
        width: "100%",
        height: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          height: isStandardWidth ? "350px" : "210px",
          position: "relative",
          backgroundColor: slide.type,
        }}
      >
         {slide.content === "video" ? (
                  <SlideVideo
  src={slide.url}
  cover={slide.cover}
  onClick={() => router.push(slide.router)}
  isStandardWidth={isStandardWidth}
  videoRefs={videoRefs}
  overlay={
    <div>
      <h2 style={{ fontSize: isStandardWidth ? "2.2rem" : "1.5rem", fontWeight: "700", marginBottom: "8px" }}>
        {slide.headerText}
      </h2>
      <p style={{ fontSize: isStandardWidth ? "1.2rem" : "0.9rem", opacity: 0.9 }}>
       {slide.paragText}
      </p>
      <button
        onClick={() => router.push("/brand/theme1/finetoo")}
        style={{
          marginTop: "15px",
          backgroundColor: "white",
          color: "black",
          border: "none",
          borderRadius: "25px",
          padding: "10px 24px",
          fontWeight: "600",
          cursor: "pointer",
          pointerEvents: "auto", // allows clicking
        }}
      >
       {slide.buttonText}
      </button>
    </div>
  }
/>
                  ) : (
                    <div style={{ position: "relative" }}>
        <picture>
          <source srcSet={slide.url} type="image/webp" />
          <img
            src={slide.url}
            alt={`Slide ${slide.id}`}
            onClick={() => handleNavigation(slide.id)}
             loading="lazy"
            style={{
               height: isStandardWidth ? "300px" : "200px",
               cursor: "pointer",
              width: "100%",
              objectFit: "cover",
              backgroundColor: slide.type, // 👈 optional placeholder color
              filter: "contrast(1.2) brightness(1.1)",
              transition: "opacity 0.4s ease-in-out", // 👈 smooth fade-in
              opacity: 0.9
            }}
            onLoad={(e) => (e.target.style.opacity = 1)} // 👈 fade after load
          />
        </picture>
         <SlideOverlay
      position={slide.textPosition}
      headline={slide.headline}
      sub={slide.sub}
      buttonText={slide.buttonText}
      onClick={() => handleNavigation(slide.id)}
    />
        </div>
         )}
        <div
          style={{
            width: "100%",
            height: "50px",
            position: "absolute",
            bottom: isStandardWidth ? "50px" : "10px",
            background: `linear-gradient(to bottom, transparent, ${slide.type || "#ddd5"})`,
          }}
        ></div>
      </div>

      <div
        style={{
          width: "100%",
          height: isStandardWidth ? "300px" : "230px",
          top: "0px",
          background: `linear-gradient(to bottom, ${slide.type}, #ddd5)`,
        }}
      ></div>
    </div>
  ))}
</Slider>
</div>
</div>


    <div style={{position: "absolute", bottom: "0px", width: "100%" }}>

    {(isTablet || isDesktop) && (
<span className="span-warning">
  {t("shipping_notice")}
  <a onClick={() => router.push("/international-shipping")} style={{ color: "blue", marginLeft: "5px", textDecoration: "underline", cursor: "pointer" }}>
    {t("learn_about_shipping")}
  </a>
</span>
)}
        <div style={{width: "100%", height: "auto", margin: "0px" }}>
           {!(isDesktop || isTablet) && (
          <div>
          <MalidagCategorySmall/>
          </div>
           )}

          {(isDesktop || isTablet) && (
          <div>
            <MalidagCategory user={user} />
            </div>
                 
          )}
            </div>

          </div>
        </div>
    </div>
  );
};

export default MainSlider;
