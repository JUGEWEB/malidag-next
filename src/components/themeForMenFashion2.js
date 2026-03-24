"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useScreenSize from './useIsMobile';
import { useRouter, useSearchParams } from "next/navigation";

const ThemeForMenFashion2 = () => {
   const router = useRouter();
  const [theme, setTheme] = useState(null);
  const { isDesktop, isMobile, isTablet } = useScreenSize();

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await axios.get('https://api.malidag.com/themes/');
        const allThemes = res.data.themes;

        const selected = allThemes.find(
          t => t.theme === "Men fashion"
        );

        if (selected) {
          setTheme(selected);
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
      }
    };

    fetchTheme();
  }, []);

  const brandCount = parseInt(localStorage.getItem('brandCount')) || 0;


  if (!theme) return null;

  return (
    <div style={{
      overflow: 'hidden',
      width: '270px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      backgroundColor: '#fdfdfd',
     height: "400px"
    }}>
      <div style={{
        padding: '10px',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
        backgroundColor: '#fafafa',
        textAlign: 'center',
        borderBottom: '1px solid #eee',
      }}>
        {theme.theme}
      </div>

      <img
        src={theme.image}
        alt={theme.theme}
        onClick={() => router.push(`/men-fashion`)}

        style={{
          cursor: "pointer",
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'cover',
          filter: "contrast(1.08) saturate(1.08) brightness(1.02)",
        }}
      />

      <div onClick={() => router.push('/men-fashion')}
 style={{cursor: "pointer" , color: "blue", marginTop: "4rem", fontSize: "0.8rem", textDecoration: "underline", marginLeft: "1rem"}}>discover now</div>
    </div>
  );
};

export default ThemeForMenFashion2;
