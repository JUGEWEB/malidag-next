'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import "./malidagCategory.css";
import useScreenSize from "./useIsMobile";

import ThemeForPersonnalCare from "./themeForPersonnalCare";
import ThemeForFashionKick from "./themeForFasionKick";
import ThemeForMenFashion from "./themeForMenFashion";
import ThemeForGamers from "./themeForGamers";

const BASE_URL = "https://api.malidag.com";

function MalidagCategorySmall({ user }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [searchedItems, setSearchedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall } = useScreenSize();

  const userId = user?.uid;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${BASE_URL}/themes/`);
        const data = await response.json();

        const grouped = data.themes.reduce((acc, item) => {
          const theme = item.theme;
          if (!acc[theme]) {
            acc[theme] = { mode: item.mode || "default", theme, items: [] };
          }
          acc[theme].items.push(item);
          return acc;
        }, {});

        const processed = Object.entries(grouped).map(([themeName, { mode, items }]) => ({
          name: themeName,
          mode,
          items: items.slice(0, mode === "full" ? 1 : 4),
        }));

        setCategories(processed);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchSearchedItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/search-items?userId=${userId}`);
        const data = await response.json();

        if (data?.userSearches) {
          const allItems = [];

          for (let search of data.userSearches) {
            const searchTerm = search.search;
            const res = await fetch(`${BASE_URL}/items/${searchTerm}`);
            const itemsData = await res.json();
            if (itemsData?.items) {
              allItems.push(...itemsData.items);
            }
          }

          setSearchedItems(allItems.slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching searched items:", error);
      }
    };

    fetchSearchedItems();
  }, [userId]);

  const handleDiscoverNowClick = (theme) => {
    switch (theme.toLowerCase()) {
      case "personal care for you":
        router.push("/personal");
        break;
      case "women fashion":
        router.push("/woFashion");
        break;
      case "fashion's kick":
        router.push("/faKick");
        break;
      default:
        console.warn(`Unknown theme: ${theme}`);
    }
  };

  return (
    <div >
    
          {(isSmallMobile || isVerySmall) && (
            <div style={{overflowX: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", margin: "0px"  }}>
              <div style={{margin: "5px"}}>
              <ThemeForFashionKick />
              </div>
              <div style={{margin: "5px"}}>
              <ThemeForMenFashion />
              </div>
              <div style={{margin: "5px"}}>
              <ThemeForGamers />
              </div>
            </div>
          )}
    </div>
  );
}

export default MalidagCategorySmall;
