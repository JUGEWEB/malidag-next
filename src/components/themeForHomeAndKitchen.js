"use client";

import React, { useEffect, useState } from 'react';
import useScreenSize from './useIsMobile';
import { useRouter, useSearchParams } from "next/navigation";

const ThemeForHomeAndKitchen = () => {
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
    id: 456,
    theme: "Home and kitchen",
    image: "https://cdn.malidag.com/themes/1760454730252-d5988e60-265a-464e-8553-f0c54c74233d.webp"
  };

  const brandCount = parseInt(localStorage.getItem('brandCount')) || 0;
  

  

  const handleDiscoverClick = () => {
    router.push("/itemHome");
  };

  return (
    <div style={{
      overflow: 'hidden',
      width:
  (isDesktop || isTablet || isMobile)
    ? "270px"
    : "100%",
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
       height:(isDesktop || isTablet || isMobile) ? '400px' : "270px",
      backgroundColor: '#fdfdfd',
      borderRadius: (isDesktop || isMobile || isTablet) ? "0px" : "0px",
      marginTop:(isSmallMobile || isVerySmall) ? "0rem" : "1rem",
      marginBottom:(isSmallMobile || isVerySmall) ? "0rem" : "1rem"
    }}>
      <div style={{
        padding: '1rem',
        fontSize: (isDesktop || isTablet || isMobile) ? '1.5rem' : "1rem",
        fontWeight: 'bold',
        color: '#333',
        backgroundColor: '#fafafa',
        textAlign: 'center',
        borderBottom: '1px solid #eee',
      }}>
        Home and kitchen
      </div>

      <div  style={{ width:(isSmallMobile || isVerySmall) ? "100%" : '100%', height:(isSmallMobile || isVerySmall) ? "auto" : 'auto', backgroundColor: "#ddd5"}}>
          <img
            src={theme.image}
            alt={theme.theme}
             loading="lazy"
            onClick={handleDiscoverClick}
            style={{
              width: '100%',
              height: (isDesktop || isTablet || isMobile)
    ? (brandCount === 0 ? "400px" : "auto")
    : "auto",
              display: 'block',
              opacity: loadedImages[theme.id] ? 1 : 1,
              objectFit:  (isDesktop || isTablet || isMobile)
    ? "cover"
    : "cover",
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
      </div>

      {(isDesktop || isTablet || isMobile) && (
        <div
          onClick={handleDiscoverClick}
          style={{
            color: "blue",
            marginTop: "1rem",
            fontSize: "0.8rem",
            textDecoration: "underline",
            marginLeft: "1rem"
          }}
        >
          discover now
        </div>
      )}
    </div>
  );
};

export default ThemeForHomeAndKitchen;
