"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useScreenSize from './useIsMobile';
import { useRouter, useSearchParams } from "next/navigation";

const ThemeForMenFashion = () => {
  const router = useRouter();
  const { isDesktop, isMobile, isTablet, isSmallMobile, isVerySmall } = useScreenSize();
    const [loadedImages, setLoadedImages] = useState({});
   
     useEffect(() => {
       const img = new Image();
       img.src = theme.image;
       img.onload = () => {
         setLoadedImages(prev => ({ ...prev, [theme.id]: true }));
       };
     }, []);

   const theme = {
    id: 2,
    theme: "Men fashion",
    image: "https://cdn.malidag.com/themes/1760454633076-72b7665a-bdb7-4f07-b388-aa5ca6219345.webp"
  };

 

  if (!theme) return null;

  const handleDiscoverClick = () => {
    router.push("/men-fashion");
  };

  return (
    <div style={{
      overflow: 'hidden',
      width:(isDesktop || isTablet || isMobile) ? '270px' : "150px",
      height:(isDesktop || isTablet || isMobile) ? '400px' : "270px",
      borderRadius:(isDesktop || isMobile || isTablet) ? "0px" : "0px",
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      backgroundColor: '#fdfdfd',
    }}>
      <div style={{
        padding: '10px',
        fontWeight: 'bold',
        color: '#333',
        fontSize: "24px",
        backgroundColor: '#fafafa',
        textAlign: 'center',
        borderBottom: '1px solid #eee',
      }}>
        Men fashion
      </div>

      <div style={{ width:(isSmallMobile || isVerySmall) ? "150px" : '100%', height:(isSmallMobile || isVerySmall) ? "170px" : 'auto', backgroundColor: "#ddd5"}}>
      <img
        src={theme.image}
        alt={theme.theme}
         loading="lazy"
        onClick={handleDiscoverClick}
        style={{
          width: '100%',
          height: (isSmallMobile || isVerySmall) ? "100%" : 'auto',
          display: 'block',
          opacity: loadedImages[theme.id] ? 1 : 1,
          objectFit: 'cover',
          cursor: "pointer"
        }}
      />
      </div>
        {(isDesktop || isMobile || isTablet) && (
     
      <div onClick={handleDiscoverClick} style={{ cursor: "pointer", color: "blue", marginTop: "4rem", fontSize: "0.8rem", textDecoration: "underline", marginLeft: "1rem"}}>discover now</div>
             
    )}
    </div>
  );
};

export default ThemeForMenFashion;
