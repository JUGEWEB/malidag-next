"use client";
import { useState, useEffect } from "react";

function getScreenSize() {
  if (typeof window === "undefined") return {}; // avoid SSR crash

  const width = window.innerWidth;
  return {
     isVerySmall: width <= 480,
    isSmallMobile: width > 480 && width <= 600,
    isMobile: width > 600 && width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}

export default function useScreenSize() {
  const [screenSize, setScreenSize] = useState({}); // empty by default

  useEffect(() => {
    setScreenSize(getScreenSize()); // now it's safe to access window

    const handleResize = () => setScreenSize(getScreenSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
}
