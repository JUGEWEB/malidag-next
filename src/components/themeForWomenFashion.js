"use client"

import React, { useEffect, useState } from 'react';
import useScreenSize from './useIsMobile';
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link"

const ThemeForWomenFashion = () => {
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
    theme: "Women fashion",
    image: "https://cdn.malidag.com/themes/1760454830463-0a9bff23-526a-40ba-a2b9-be41271c845f.webp"
  };

  

  const handleDiscoverClick = () => {
    router.push("/women-fashion");
   
  };

  return (
    <div style={{
      overflow: 'hidden',
      width: (isDesktop || isTablet || isMobile) ? '270px' : "100%",
      height:(isSmallMobile || isVerySmall) ? "100%" :  '400px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
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
        Women fashion
      </div>

      <div style={{ width:(isSmallMobile || isVerySmall) ? "100%" : '100%', height:(isSmallMobile || isVerySmall) ? "auto" : 'auto', backgroundColor: "#ddd5"}}>
       <Link
  href="/women-fashion"
>
          <img
            src={theme.image}
            alt={theme.theme}
             loading="lazy"
            //onClick={handleDiscoverClick}
             onClick={() => window.scrollTo(0, 0)}
            style={{
              width: '100%',
              height: (isSmallMobile || isVerySmall) ? "auto" : 'auto',
              display: 'block',
              opacity: loadedImages[theme.id] ? 1 : 1,
              objectFit: 'cover',
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
          </Link>
          
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

export default ThemeForWomenFashion;
