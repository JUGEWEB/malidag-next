"use client"

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import useScreenSize from "./useIsMobile";
import "./type.css";

const Type = () => {
   const router = useRouter();
   const pathname = usePathname()
  const {isMobile, isDesktop, isTablet, isSmallMobile, isVerySmall} = useScreenSize()

  // Handle navigation when a type is clicked
  const handleTypeClick = () => {
    router.push(`/type-page`);
  };

   // ✅ Hide if mobile/small/verySmall and route is not home
 if (
  (isMobile || isSmallMobile || isVerySmall) &&
  pathname !== "/"
) {
  return null;
}

  return (
    <div className="type-scroll-container"style={{marginLeft: (isDesktop || isTablet) ? "0px" : "20px", width: (isDesktop || isTablet) ? "60%" : "100%", color: "white"}}>
      <div className="type-scroll">
          <div
          className="type-item"
          onClick={handleTypeClick}
          >
            New
          </div>
          <div
          className="type-itemT"
          onClick={() => router.push("/the-crypto-shop")}
          >
            The crypto shop
          </div>
      </div>
    </div>
  );
};

export default Type;