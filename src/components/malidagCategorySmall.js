
"use client";

import React from "react";

import "./malidagCategorySmall.css";

import useScreenSize from "./useIsMobile";
import ThemeForFashionKick from "./themeForFasionKick";
import ThemeForMenFashion from "./themeForMenFashion";

// import ThemeForGamers from "./themeForGamers";

function MalidagCategorySmall() {
  const { isSmallMobile, isVerySmall } = useScreenSize();

  if (!isSmallMobile && !isVerySmall) {
    return null;
  }

  return (
    <section className="malidag-category-small">
      <div className="malidag-category-small__scroll">
        <div className="malidag-category-small__item">
          <ThemeForFashionKick />
        </div>

        <div className="malidag-category-small__item">
          <ThemeForMenFashion />
        </div>

        {/*
        <div className="malidag-category-small__item">
          <ThemeForGamers />
        </div>
        */}
      </div>
    </section>
  );
}

export default MalidagCategorySmall;
