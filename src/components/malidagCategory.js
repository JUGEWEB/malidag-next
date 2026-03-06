'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import "./malidagCategory.css";
import SearchSuggestions from "./searchSuggestion";
import ThemeForPersonnalCare from "./themeForPersonnalCare";
import useScreenSize from "./useIsMobile";
import ThemeForFashionKick from "./themeForFasionKick";
import ThemeForMenFashion from "./themeForMenFashion";
import ThemeForGamers from "./themeForGamers";
import ThemeWithText from "./themewithtext";

const BASE_URL = "https://api.malidag.com";
const BASE_URLs = "https://api.malidag.com";

function MalidagCategory({ user, auth }) {
   const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [searchedItems, setSearchedItems] = useState([]);
 
  const {isMobile, isDesktop, isSmallMobile, isTablet, isVerySmall} = useScreenSize()


  const userId = user?.uid;

 

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${BASE_URL}/themes/`);
        const data = await response.json();

        const groupedCategories = data.themes.reduce((acc, item) => {
          const theme = item.theme;
          if (!acc[theme]) {
            acc[theme] = { mode: item.mode || "default", theme, items: [] };
          }
          acc[theme].items.push(item);
          return acc;
        }, {});

        const processedCategories = Object.entries(groupedCategories).map(
          ([themeName, { mode, theme, items }]) => ({
            name: themeName,
            mode,
            theme,
            items: items.slice(0, mode === "full" ? 1 : 4),
          })
        );

        setCategories(processedCategories);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchSearchedItems = async () => {
      try {
        const response = await fetch(`${BASE_URLs}/search-items?userId=${userId}`);
        const data = await response.json();

        if (data?.userSearches) {
          const allSearchedItems = [];
          for (let search of data.userSearches) {
            const searchTerm = search.search;
            const itemsResponse = await fetch(`${BASE_URLs}/items/${searchTerm}`);
            const itemsData = await itemsResponse.json();
            if (itemsData?.items) {
              allSearchedItems.push(...itemsData.items);
            }
          }
          setSearchedItems(allSearchedItems.slice(0, 4));
        } else {
          setSearchedItems([]);
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
    <div style={{display: "flex", alignItems: "center", justifyContent:isDesktop ? "center" : "start", width: "100%", margin: "0px", overflowX: "auto"}}>
<div style={{margin: "20px"}}>
{(isTablet || isDesktop || isMobile) && (
      <ThemeForPersonnalCare/>
    )}
    </div>

    <div style={{margin: "20px"}}>

    {(isTablet || isDesktop || isMobile) && (
      <ThemeForFashionKick/>
    )}
    </div>

    <div style={{margin: "20px"}}>

    {(isTablet || isDesktop || isMobile) && (
      <ThemeForMenFashion/>
    )}
    </div>

     <div style={{margin: "20px"}}>

    {(isTablet || isDesktop || isMobile) && (
      <ThemeWithText/>
    )}
    </div>
     
    </div>
  );
}

export default MalidagCategory;
