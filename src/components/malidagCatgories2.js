
"use client";

import React from "react";
import "./malidagCategory2.css";

import useScreenSize from "./useIsMobile";
import ThemeForWomenFashionBrand1 from "./themeForWomenFashionBrand1";

function MalidagCategories2() {
  const { isMobile, isDesktop, isTablet } = useScreenSize();

  const showCategories = isMobile || isTablet || isDesktop;

  return (
    <section className="malidag-category2">
      {/*
        <div className="malidag-category2__item">
          {showCategories && <ThemeForGamers />}
        </div>
      */}

      {showCategories && (
        <div className="malidag-category2__item">
          <ThemeForWomenFashionBrand1 />
        </div>
      )}

      {/*
        <div className="malidag-category2__item">
          {showCategories && <ThemeForWomenFashion />}
        </div>
      */}

      {/*
        <div className="malidag-category2__item">
          {showCategories && <ThemeForHomeAndKitchen />}
        </div>
      */}

      {/*
        <div className="malidag-category2__item">
          {showCategories && <ThemeForKidsFashion />}
        </div>
      */}
    </section>
  );
}

export default MalidagCategories2;
