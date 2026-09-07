"use client";

import { useState, useEffect } from "react";

function getScreenSize() {
  if (typeof window === "undefined") return {};

  const width = window.innerWidth;

  return {
    isVerySmall: width < 300,
    isSmallMobile: width >= 300 && width < 600,
    isMobile: width >= 600 && width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isWideDesktop: width >= 1300,
  };
}

export default function useScreenSize() {
  const [screenSize, setScreenSize] = useState({});

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize());
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return screenSize;
}