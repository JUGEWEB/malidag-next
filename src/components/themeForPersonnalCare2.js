"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useScreenSize from './useIsMobile';
import { useRouter, useSearchParams } from "next/navigation";

const ThemeForPersonnalCare2 = () => {
   const router = useRouter();
  const [themes, setThemes] = useState([]);
  const { isSmallMobile, isVerySmall } = useScreenSize();
  const [loadedImages, setLoadedImages] = useState({});

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const res = await axios.get('https://api.malidag.com/themes/');
        const allThemes = res.data.themes;

        const filtered = allThemes.filter(
          t => t.mode === 'default' && t.theme === 'Personal care for you'
        ).slice(0, 4);

        // Preload images
        filtered.forEach((theme) => {
          const img = new Image();
          img.src = theme.image;
          img.onload = () => {
            setLoadedImages(prev => ({ ...prev, [theme.id]: true }));
          };
        });

        setThemes(filtered);
      } catch (error) {
        console.error('Error fetching themes:', error);
      }
    };

    fetchThemes();
  }, []);

  if (themes.length === 0) return null;

  return (
    <div style={{
      position: "relative",
      width: (isSmallMobile || isVerySmall) ? "100%" : '270px',
      height: '400px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      backgroundColor: '#fff'
    }}>
      <div style={{
        fontSize: '25px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '10px',
        textAlign: 'center',
      }}>
        Personal care for you
      </div>

      <div style={{
        display: (isSmallMobile || isVerySmall) ? "grid" : 'flex',
        flexWrap: 'wrap',
        width: "100%",
        gap: "1px",
        justifyContent: 'space-between',
        gridTemplateColumns: 'repeat(2, 1fr)',
        alignItems: "center",
        height: "auto"
      }}>
        {themes.map((theme) => (
          <div
            key={theme.id}
            onClick={() => router.push(`/itemOfItems/${encodeURIComponent(theme.types[0])}`)}
            style={{
              width: (isSmallMobile || isVerySmall) ? "100%" : '100px',
              textAlign: 'center',
              minHeight: '100%',
              cursor: 'pointer',
            }}
          >
            <img
              src={theme.image}
              alt={theme.types[0]}
              loading="lazy"
              style={{
                width: (isSmallMobile || isVerySmall) ? "100%" : '100px',
                height: (isSmallMobile || isVerySmall) ? "185px" : '100px',
                objectFit: 'cover',
                opacity: loadedImages[theme.id] ? 1 : 0,
                transition: 'opacity 0.3s ease',
                filter: "contrast(1.08) saturate(1.08) brightness(1.02)",
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                borderRadius: "5px",
                backgroundColor: '#fff'
              }}
            />
            <div style={{
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#555',
              marginTop: '6px',
            }}>
              {theme.types[0]}
            </div>
          </div>
        ))}
      </div>

      <div
        onClick={() => router.push('/beauty')}
        style={{
          fontSize: '0.8rem',
          fontWeight: 'bold',
          color: 'blue',
          marginTop: "2rem",
          textAlign: 'start',
          textDecoration: "underline",
          cursor: "pointer"
        }}
      >
        Discover Now
      </div>
    </div>
  );
};

export default ThemeForPersonnalCare2;
