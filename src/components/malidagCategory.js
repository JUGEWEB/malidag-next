
"use client";

import React from "react";
import "./malidagCategory.css";

import useScreenSize from "./useIsMobile";
import ThemeForFashionKickBrand1 from "./themeFoeFashionKickBrand1";
import ThemeForMenFashionBrand1 from "./ThemeForMenFashionBrand1";

function MalidagCategory() {
  const { isMobile, isDesktop, isTablet } = useScreenSize();

  const showCategories = isMobile || isTablet || isDesktop;

  return (
    <section className="malidag-category">
      {/*
        <div className="malidag-category__item">
          {showCategories && <ThemeForPersonnalCare />}
        </div>
      */}

      {showCategories && (
        <div className="malidag-category__grid">
          <div className="malidag-category__item">
            <ThemeForFashionKickBrand1 />
          </div>

          <div className="malidag-category__item">
            <ThemeForMenFashionBrand1 />
          </div>
        </div>
      )}

      {/*
        <div className="malidag-category__item">
          {showCategories && <ThemeForFashionKick />}
        </div>

        <div className="malidag-category__item">
          {showCategories && <ThemeForMenFashion />}
        </div>
      */}

      {/*
        <div className="malidag-category__item">
          {showCategories && <ThemeWithText />}
        </div>
      */}
    </section>
  );
}

export default MalidagCategory;
