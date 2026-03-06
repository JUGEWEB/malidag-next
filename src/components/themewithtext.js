"use client"

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useScreenSize from './useIsMobile';

const ThemeWithText = () => {
  const [theme, setTheme] = useState(null);
  const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall} = useScreenSize()
  const [loadedImages, setLoadedImages] = useState({});

  const loadTheme = {
    id: 2,
    theme: "Hot deals",
    image: "https://cdn.malidag.com/themes/1760455026024-650422e1-19ca-4421-88d4-92baa31c4cb0.webp"
  };

  useEffect(() => {
         const img = new Image();
         img.src = loadTheme.image;
         img.onload = () => {
           setLoadedImages(prev => ({ ...prev, [loadTheme.id]: true }));
         };
       }, []);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await axios.get('https://api.malidag.com/themes/');
        const allThemes = res.data.themes;

        const selected = allThemes.find(t =>
          t.theme.includes('explore our top brand')
        );

        if (selected) {
          setTheme(selected);
        }
      } catch (error) {
        console.error('Error fetching themes:', error);
      }
    };

    fetchTheme();
  }, []);
  
  

  if (!theme) return null;

  return (
    <div style={{
      overflow: 'hidden',
       width: (isSmallMobile || isVerySmall) ? "100%" : '270px',
      height:(isDesktop || isTablet || isMobile) ? '400px' : "270px",
      justifyContent: "space-between",
     
    }}>
      <div style={{
        padding:(isDesktop || isMobile || isTablet) ? '1.5rem' : "1rem",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize:(isDesktop || isMobile || isTablet) ? '1.5rem' : "0.9rem",
        fontWeight: 'bold',
        color: '#333',
         backgroundColor: '#f9f9f9'
      }}>
        Explore our top brands and shop with brands
      </div>

      <div style={{width: "100%", height: "190px"}}>
      {theme.image && (
        <img
          src={theme.image}
          alt={theme.theme}
          loading="lazy"
          style={{
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'cover',
            opacity: loadedImages[loadTheme.id] ? 1 : 1,
           marginTop: "30px"
          }}
        />
      )}
      </div>
    </div>
  );
};

export default ThemeWithText;
