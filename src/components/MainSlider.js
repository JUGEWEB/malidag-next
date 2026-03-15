'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import MalidagCategorySmall from "./malidagCategorySmall";
import MalidagCategory from "./malidagCategory";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import Head from 'next/head';
import SlideVideo from './SlideVideo';
import SlideOverlay from './SlideOverlay';

const Slider = dynamic(() => import("react-slick").then(mod => mod.default), {
  ssr: false,
});

const SLIDE_STORAGE_KEY = "malidag_home_current_slide";

const MainSlider = ({ user }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isMobile, isDesktop, isTablet } = useScreenSize();

  const sliderRef = useRef(null);

  const isStandardWidth = isDesktop || isTablet || isMobile;
  const isHome = pathname === "/";

  const slides = useMemo(() => [
    {
      id: "1",
      url: "https://cdn.malidag.com/public/header/4/Untitled%20video%20-%20Made%20with%20Clipchamp%20(13).webm",
      type: "#000000ff",
      content: "video",
      cover: "https://cdn.malidag.com/public/header/4/finetto.webp",
      router: "/brand/theme1/finetoo",
      headerText: "Fineto Fashion",
      paragText: "Elevate your style this season ✨",
      buttonText: "Explore Brand"
    },
    {
      id: "2",
      url: "https://cdn.malidag.com/public/header/5/Untitled%20video%20-%20Made%20with%20Clipchamp%20(14).webm",
      type: "pink",
      content: "video",
      cover: "https://cdn.malidag.com/public/header/5/Untitled%20design%20(29).webp",
      router: "/product/9e0da5b9-f4b3-42d0-8024-211ea47d0abd",
      headerText: "Snow Boots Winter Plush Warm Ankle...",
      paragText: "Get it now",
      buttonText: "Buy now"
    },
    {
      id: "5",
      url: "https://cdn.malidag.com/public/header/3/malidag-all-header.webp",
      type: "#024163",
      content: "image",
      textPosition: "center",
      headline: "Save Big",
      sub: "Join our deals"
    },
  ], []);

  const [mounted, setMounted] = useState(false);
  const [sliderReady, setSliderReady] = useState(false);
  const [initialSlideIndex, setInitialSlideIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isHome) return;

    const saved = parseInt(localStorage.getItem(SLIDE_STORAGE_KEY), 10);
    const safeSlide =
      !isNaN(saved) && saved >= 0 && saved < slides.length ? saved : 0;

    setInitialSlideIndex(safeSlide);
    setCurrentSlide(safeSlide);
    setSliderReady(true);
  }, [mounted, isHome, slides.length]);

  useEffect(() => {
    return () => {
      localStorage.setItem(SLIDE_STORAGE_KEY, String(currentSlide));
      setPlayingVideoId(null);
    };
  }, [currentSlide]);

  useEffect(() => {
    if (!isHome) {
      localStorage.setItem(SLIDE_STORAGE_KEY, String(currentSlide));
      setPlayingVideoId(null);
      setSliderReady(false);
    }
  }, [isHome, currentSlide]);

  useEffect(() => {
  if (!mounted || !sliderReady || !isHome) return;
  if (playingVideoId) return; // optional: don't auto-switch while a video is playing

  const interval = setInterval(() => {
    if (!sliderRef.current) return;

    const nextSlide = currentSlide + 1;

    if (nextSlide < slides.length) {
      sliderRef.current.slickGoTo(nextSlide);
    } else {
      sliderRef.current.slickGoTo(0);
    }
  }, 15000);

  return () => clearInterval(interval);
}, [mounted, sliderReady, isHome, currentSlide, slides.length, playingVideoId]);

  const NextArrow = ({ className, style, onClick }) => (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        right: "20px",
        marginRight: "20px",
        top: "10%",
        zIndex: 2,
      }}
      onClick={onClick}
    />
  );

  const PrevArrow = ({ className, style, onClick }) => (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        left: "20px",
        marginLeft: "20px",
        top: "10%",
        zIndex: 2,
      }}
      onClick={onClick}
    />
  );

  const settings = {
    dots: false,
    infinite: false,
    speed: 100,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: initialSlideIndex,
    beforeChange: (oldIndex, newIndex) => {
      setCurrentSlide(newIndex);
      localStorage.setItem(SLIDE_STORAGE_KEY, String(newIndex));
      setPlayingVideoId(null);
    },
    afterChange: (index) => {
      setCurrentSlide(index);
      localStorage.setItem(SLIDE_STORAGE_KEY, String(index));
      setPlayingVideoId(null);
    },
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />
  };

  const handleNavigation = (id) => {
    setPlayingVideoId(null);
    localStorage.setItem(SLIDE_STORAGE_KEY, String(currentSlide));

    switch (id?.toString()) {
      case "1":
        router.push("/brand/theme1/finetoo");
        break;
      case "2":
        router.push("/product/9e0da5b9-f4b3-42d0-8024-211ea47d0abd");
        break;
      case "5":
        router.push("/save-big");
        break;
      default:
        console.warn("Unknown id:", id);
    }
  };

  if (!isHome) return null;

  return (
    <div>
      <Head>
        <link rel="preconnect" href="https://cdn.malidag.com" crossOrigin="anonymous" />
        {slides.map((slide) =>
          slide.content === "video" ? (
            <link key={slide.id} rel="preload" as="image" href={slide.cover} />
          ) : (
            <link key={slide.id} rel="preload" as="image" href={slide.url} />
          )
        )}
      </Head>

      <div style={{ position: "relative" }}>
        <div style={{ width: "100%", backgroundColor: "white" }}>
          <div style={{ width: "100%", height: isStandardWidth ? "650px" : "440px" }}>
            {mounted && sliderReady && (
              <Slider
                key={`home-slider-${initialSlideIndex}`}
                ref={sliderRef}
                {...settings}
              >
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    style={{
                      position: "relative",
                      width: "100%",
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
                        onClick={() => {
                          localStorage.setItem(SLIDE_STORAGE_KEY, String(currentSlide));
                          router.push(slide.router);
                        }}
                        onPlayClick={() => {
                          if (currentSlide === index) {
                            setPlayingVideoId(slide.id);
                          }
                        }}
                        onVideoEnd={() => {
                          if (playingVideoId === slide.id) {
                            setPlayingVideoId(null);
                          }
                        }}
                        isStandardWidth={isStandardWidth}
                        isPlaying={
                          currentSlide === index && playingVideoId === slide.id
                        }
                        overlay={
                          <div>
                            <h2 style={{ fontSize: isStandardWidth ? "2.2rem" : "1.5rem", fontWeight: "700", marginBottom: "8px" }}>
                              {slide.headerText}
                            </h2>
                            <p style={{ fontSize: isStandardWidth ? "1.2rem" : "0.9rem", opacity: 0.9 }}>
                              {slide.paragText}
                            </p>
                            <button
                              onClick={() => {
                                localStorage.setItem(SLIDE_STORAGE_KEY, String(currentSlide));
                                router.push(slide.router);
                              }}
                              style={{
                                marginTop: "15px",
                                backgroundColor: "white",
                                color: "black",
                                border: "none",
                                borderRadius: "25px",
                                padding: "10px 24px",
                                fontWeight: "600",
                                cursor: "pointer",
                                pointerEvents: "auto",
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
                                backgroundColor: slide.type,
                                filter: "contrast(1.2) brightness(1.1)",
                                transition: "opacity 0.4s ease-in-out",
                                opacity: 0.9
                              }}
                              onLoad={(e) => {
                                e.target.style.opacity = 1;
                              }}
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
                      />
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: isStandardWidth ? "300px" : "230px",
                        background: `linear-gradient(to bottom, ${slide.type}, #ddd5)`,
                      }}
                    />
                  </div>
                ))}
              </Slider>
            )}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "0px", width: "100%" }}>
          {(isTablet || isDesktop) && (
            <span className="span-warning">
              {t("shipping_notice")}
              <a
                onClick={() => router.push("/international-shipping")}
                style={{ color: "blue", marginLeft: "5px", textDecoration: "underline", cursor: "pointer" }}
              >
                {t("learn_about_shipping")}
              </a>
            </span>
          )}

          <div style={{ width: "100%", height: "auto", margin: "0px" }}>
            {!(isDesktop || isTablet || isMobile) ? (
              <div>
                <MalidagCategorySmall />
              </div>
            ) : (
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