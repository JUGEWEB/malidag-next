"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from "next/navigation";
import useScreenSize from './useIsMobile';
import './themeSkeleton.css';

const themes = [
  {
    id: 1,
    type: "Perfume",
    url: "https://cdn.malidag.com/themes/1760451347324-3fb652f1-cfce-4748-a6dc-5b638d56b5b9.webp",
  },
  {
    id: 2,
    type: "Eyebrow",
    url: "https://cdn.malidag.com/themes/1760454526816-b3ace095-dd88-4b22-8697-48c7ed9888c5.webp",
  },
  {
    id: 3,
    type: "Make-up",
    url: "https://cdn.malidag.com/themes/1760454544841-fd7ff68f-6779-4777-8d11-d698005ced30.webp",
  },
  {
    id: 4,
    type: "Skincare",
    url: "https://cdn.malidag.com/themes/1760454491817-060ed533-180f-4751-8dad-a98141825edf.webp",
  },
];

const ThemeForPersonnalSmall = () => {
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } = useScreenSize();
  const pathname = usePathname();
  const [loadedImages, setLoadedImages] = useState({}); // ✅ Keep track of loaded images

  useEffect(() => {
    themes.forEach((theme) => {
      const img = new Image();
      img.src = theme.url;
      img.onload = () => {
        setLoadedImages(prev => ({ ...prev, [theme.id]: true }));
      };
    });
  }, []); // Preload once on mount

  if ((isMobile || isSmallMobile || isVerySmall) && pathname !== "/") {
    return null;
  }

  return (
    <div style={{ padding: (isSmallMobile || isVerySmall) ? "0rem" : '0rem' }}>
      <span style={{ marginTop: (isSmallMobile || isVerySmall) ? "0rem" : '', fontWeight: "bold" }}>
        Personal care for you
      </span>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        overflowX: "auto",
        gap: "10px",
        marginTop: "10px",
      }}>
        {themes.map((theme) => (
          <div key={theme.id} style={{
            width: '140px',
            textAlign: 'center',
            background: '#fff',
            padding: '0.5rem',
            borderRadius: '8px',
          }}>
            <img
              src={theme.url}
              alt={theme.type}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                objectFit: 'cover',
                filter: loadedImages[theme.id] ? "contrast(1.08) saturate(1.08) brightness(1.02)" : "contrast(1.08) saturate(1.08) brightness(1.02)", // ✅ Add filter for unloaded images
                marginBottom: '0.5rem',
                opacity: loadedImages[theme.id] ? 1 : 0.6, // ✅ Smooth fade
                transition: 'opacity 0.5s ease-in-out',
                backgroundColor: loadedImages[theme.id] ? 'gray' : '#f0f0f0', // ✅ Light background if not loaded
              }}
            />
            <div style={{
              fontSize: '0.9rem',
              color: '#555',
              fontWeight: '500',
            }}>
              {theme.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeForPersonnalSmall;
