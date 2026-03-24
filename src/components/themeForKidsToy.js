"use client";

import React, { useEffect, useState } from 'react';
import useScreenSize from './useIsMobile';
import { useRouter, useSearchParams } from "next/navigation";

const ThemeForKidToy = () => {
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
    id: 451,
    theme: "Kids toy",
    image: "https://cdn.malidag.com/themes/1760454593288-cf08a709-aca7-4244-b3de-2b76186ec35f.webp"
  };

  

  const handleDiscoverClick = () => {
    router.push("/kid-toy");
  };

  return (
    <div style={{
      overflow: 'hidden',
      width: (isDesktop || isTablet || isMobile) ? '270px' : "100%",
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      backgroundColor: '#fdfdfd',
      borderRadius: (isDesktop || isMobile || isTablet) ? "0px" : "0px",
       padding: isSmallMobile || isVerySmall ? "5px" : "0",
      height:(isDesktop || isTablet || isMobile) ? '400px' : "100%",
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
        Get a toy for your kid
      </div>

      <div style={{ width:(isSmallMobile || isVerySmall) ? "100%" : '100%', height:(isSmallMobile || isVerySmall) ? "auto" : 'auto', backgroundColor: "#ddd5"}}>
          <img
            src={theme.image}
            alt={theme.theme}
             loading="lazy"
            onClick={handleDiscoverClick}
            style={{
                cursor: "pointer",
              width: '100%',
              height: (isSmallMobile || isVerySmall) ? "auto" : 'auto',
              display: 'block',
              opacity: loadedImages[theme.id] ? 1 : 0,
              objectFit: 'cover',
              filter: "contrast(1.08) saturate(1.08) brightness(1.02)",
              cursor: "pointer",
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
      </div>

      {(isDesktop || isTablet || isMobile) && (
        <div
          onClick={handleDiscoverClick}
          style={{
            cursor: "pointer",
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

export default ThemeForKidToy;
