'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './MainSlider.css';
import MalidagCategorySmall from './malidagCategorySmall';
import MalidagCategory from './malidagCategory';
import useScreenSize from './useIsMobile';
import { useTranslation } from 'react-i18next';
import Head from 'next/head';
import SlideVideo from './SlideVideo';
import SlideOverlay from './SlideOverlay';

const Slider = dynamic(() => import('react-slick').then((mod) => mod.default), {
  ssr: false,
});

const SLIDE_STORAGE_KEY = 'malidag_home_current_slide';

const MainSlider = ({ user }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isMobile, isDesktop, isTablet } = useScreenSize();

  const sliderRef = useRef(null);

  const isStandardWidth = isDesktop || isTablet || isMobile;
  const isHome = pathname === '/';

  const slides = useMemo(
    () => [
      /*{
        id: '1',
        url: 'https://cdn.malidag.com/public/header/4/Untitled%20video%20-%20Made%20with%20Clipchamp%20(13).webm',
        type: '#000000ff',
        content: 'video',
        cover: 'https://cdn.malidag.com/public/header/4/finetto.webp',
        router: '/brand/theme1/finetoo',
        headerText: 'Fineto Fashion',
        paragText: 'Elevate your style this season ✨',
        buttonText: 'Explore Brand',
      },
      {
        id: '2',
        url: 'https://cdn.malidag.com/public/header/5/Untitled%20video%20-%20Made%20with%20Clipchamp%20(14).webm',
        type: 'pink',
        content: 'video',
        cover: 'https://cdn.malidag.com/public/header/5/Untitled%20design%20(29).webp',
        router: '/product/9e0da5b9-f4b3-42d0-8024-211ea47d0abd',
        headerText: 'Snow Boots Winter Plush Warm Ankle...',
        paragText: 'Get it now',
        buttonText: 'Buy now',
      },*/

       {
        id: '1',
        url: 'https://cdn.malidag.com/themes/1775517425727-e79e4283-6b2a-4a70-a6ba-271053176df0.webp',
        type: '#024163',
        content: 'image',
        textPosition: 'center',
        headerText: 'Jack & Jones',
        paragText: 'Elevate your style this season ✨',
        buttonText: 'Explore Brand',
      },
      {
        id: '2',
        url: 'https://cdn.malidag.com/public/header/3/malidag-all-header.webp',
        type: '#024163',
        content: 'image',
        textPosition: 'center',
        headline: 'Save Big',
        sub: 'Join our deals',
      },
    ],
    []
  );

  const routeMap = useMemo(
    () => ({
      '1': '/brand/theme1/jack&jones',
     // '2': '/product/9e0da5b9-f4b3-42d0-8024-211ea47d0abd',
      '2': '/save-big',
    }),
    []
  );

  const [mounted, setMounted] = useState(false);
  const [sliderReady, setSliderReady] = useState(false);
  const [initialSlideIndex, setInitialSlideIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState(null);

  const saveSlideIndex = useCallback((index) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SLIDE_STORAGE_KEY, String(index));
  }, []);

  const readSavedSlideIndex = useCallback(() => {
    if (typeof window === 'undefined') return 0;

    const saved = parseInt(localStorage.getItem(SLIDE_STORAGE_KEY), 10);

    if (!Number.isNaN(saved) && saved >= 0 && saved < slides.length) {
      return saved;
    }

    return 0;
  }, [slides.length]);

  const stopVideoPlayback = useCallback(() => {
    setPlayingVideoId(null);
  }, []);

  const goToRoute = useCallback(
    (path) => {
      if (!path) return;
      saveSlideIndex(currentSlide);
      stopVideoPlayback();
      router.push(path);
    },
    [router, currentSlide, saveSlideIndex, stopVideoPlayback]
  );

  const handleNavigation = useCallback(
    (id) => {
      const nextRoute = routeMap[id?.toString()];
      if (!nextRoute) return;
      goToRoute(nextRoute);
    },
    [goToRoute, routeMap]
  );

  const handleSlideChange = useCallback(
    (index) => {
      setCurrentSlide(index);
      saveSlideIndex(index);
      stopVideoPlayback();
    },
    [saveSlideIndex, stopVideoPlayback]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isHome) return;

    const safeSlide = readSavedSlideIndex();
    setInitialSlideIndex(safeSlide);
    setCurrentSlide(safeSlide);
    setSliderReady(true);
  }, [mounted, isHome, readSavedSlideIndex]);

  useEffect(() => {
    return () => {
      saveSlideIndex(currentSlide);
      stopVideoPlayback();
    };
  }, [currentSlide, saveSlideIndex, stopVideoPlayback]);

  useEffect(() => {
    if (!isHome) {
      saveSlideIndex(currentSlide);
      stopVideoPlayback();
      setSliderReady(false);
    }
  }, [isHome, currentSlide, saveSlideIndex, stopVideoPlayback]);

  useEffect(() => {
    if (!mounted || !sliderReady || !isHome || playingVideoId) return;

    const interval = setInterval(() => {
      if (!sliderRef.current) return;
      const nextSlide = currentSlide + 1 < slides.length ? currentSlide + 1 : 0;
      sliderRef.current.slickGoTo(nextSlide);
    }, 15000);

    return () => clearInterval(interval);
  }, [mounted, sliderReady, isHome, currentSlide, slides.length, playingVideoId]);

  const Arrow = ({ direction, className, style, onClick }) => {
    const isNext = direction === 'next';

    return (
      <div
        className={`${className} main-slider__arrow ${
          isNext ? 'main-slider__arrow--next' : 'main-slider__arrow--prev'
        }`}
        style={style}
        onClick={onClick}
      />
    );
  };

  const settings = useMemo(
    () => ({
      dots: false,
      infinite: false,
      speed: 100,
      slidesToShow: 1,
      slidesToScroll: 1,
      initialSlide: initialSlideIndex,
      beforeChange: (_, nextIndex) => handleSlideChange(nextIndex),
      afterChange: (index) => handleSlideChange(index),
      arrows: true,
      nextArrow: <Arrow direction="next" />,
      prevArrow: <Arrow direction="prev" />,
    }),
    [initialSlideIndex, handleSlideChange]
  );

  if (!isHome) return null;

  return (
    <div>
      <Head>
        <link rel="preconnect" href="https://cdn.malidag.com" crossOrigin="anonymous" />
        {slides.map((slide) =>
          slide.content === 'video' ? (
            <link key={slide.id} rel="preload" as="image" href={slide.cover} />
          ) : (
            <link key={slide.id} rel="preload" as="image" href={slide.url} />
          )
        )}
      </Head>

      <div className="main-slider">
        <div className="main-slider__surface">
          <div
            className={`main-slider__frame ${
              isStandardWidth ? 'main-slider__frame--standard' : 'main-slider__frame--compact'
            }`}
          >
            {mounted && sliderReady && (
              <Slider key={`home-slider-${initialSlideIndex}`} ref={sliderRef} {...settings}>
                {slides.map((slide, index) => (
                  <div key={slide.id} className="main-slider__slide">
                    <div
                      className={`main-slider__top ${
                        isStandardWidth ? 'main-slider__top--standard' : 'main-slider__top--compact'
                      }`}
                      style={{ backgroundColor: slide.type }}
                    >
                      {slide.content === 'video' ? (
                        <SlideVideo
                          src={slide.url}
                          cover={slide.cover}
                          onClick={() => goToRoute(slide.router)}
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
                          isPlaying={currentSlide === index && playingVideoId === slide.id}
                          overlay={
                            <div className="main-slider__video-overlay">
                              <h2
                                className={`main-slider__video-title ${
                                  isStandardWidth
                                    ? 'main-slider__video-title--standard'
                                    : 'main-slider__video-title--compact'
                                }`}
                              >
                                {slide.headerText}
                              </h2>
                              <p
                                className={`main-slider__video-text ${
                                  isStandardWidth
                                    ? 'main-slider__video-text--standard'
                                    : 'main-slider__video-text--compact'
                                }`}
                              >
                                {slide.paragText}
                              </p>
                              <button
                                onClick={() => goToRoute(slide.router)}
                                className="main-slider__cta"
                              >
                                {slide.buttonText}
                              </button>
                            </div>
                          }
                        />
                      ) : (
                        <div className="main-slider__image-wrap">
                          <picture>
                            <source srcSet={slide.url} type="image/webp" />
                            <img
                              src={slide.url}
                              alt={`Slide ${slide.id}`}
                              onClick={() => handleNavigation(slide.id)}
                              loading="lazy"
                              className={`main-slider__image ${
                                isStandardWidth
                                  ? 'main-slider__image--standard'
                                  : 'main-slider__image--compact'
                              }`}
                              style={{ backgroundColor: slide.type }}
                              onLoad={(e) => {
                                e.currentTarget.classList.add('main-slider__image--loaded');
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
                        className="main-slider__fade"
                        style={{
                          background: `linear-gradient(to bottom, transparent, ${
                            slide.type || 'white'
                          })`,
                        }}
                      />
                    </div>

                    <div
                      className={`main-slider__bottom ${
                        isStandardWidth
                          ? 'main-slider__bottom--standard'
                          : 'main-slider__bottom--compact'
                      }`}
                      style={{
                        background: `linear-gradient(to bottom, ${slide.type}, white)`,
                      }}
                    />
                  </div>
                ))}
              </Slider>
            )}
          </div>
        </div>

        <div className="main-slider__footer">
          {(isTablet || isDesktop) && (
            <span className="span-warning">
              {t('shipping_notice')}
              <a
                onClick={() => router.push('/international-shipping')}
                className="main-slider__shipping-link"
              >
                {t('learn_about_shipping')}
              </a>
            </span>
          )}

          <div className="main-slider__categories">
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