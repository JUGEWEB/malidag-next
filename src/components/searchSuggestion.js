"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useScreenSize from './useIsMobile';

const SearchSuggestions = ({ userId }) => {
  const [suggestions, setSuggestions] = useState([]); // { brand, items: [] }
  const { isMobile, isDesktop, isTablet } = useScreenSize();
  const[brandCount, setBrandCount] = useState(0);
  console.log("userId:", userId)
   console.log("API response:", suggestions);


 useEffect(() => {
  const fetchSuggestions = async () => {
    try {
      // 👇 Reset localStorage if no userId
      if (!userId) {
        localStorage.setItem('brandCount', '0');
        return;
      }

      const lastFetched = localStorage.getItem('brandSuggestionsFetchedAt');
      if (lastFetched) {
        const now = new Date();
        const lastFetchedDate = new Date(lastFetched);
        const diffInDays = (now - lastFetchedDate) / (1000 * 60 * 60 * 24);
        if (diffInDays > 7) {
          localStorage.removeItem('brandSuggestionsFetchedAt');
          localStorage.removeItem('brandCount');
          return;
        }
      }

      const res = await axios.get(`https://api.malidag.com/types/suggestions/user-brand-suggestions`, {
        params: { userId },
      });
      const count = res.data.brandCount || 0;
      setSuggestions(res.data.suggestions || []);
      localStorage.setItem('brandCount', count);
      localStorage.setItem('brandSuggestionsFetchedAt', new Date().toISOString());
      setBrandCount(count)
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  fetchSuggestions();
}, [userId]);

if (brandCount === 0) return null;

  return (
   
   
    <div style={{ padding: (isDesktop || isMobile || isTablet) ? '1px' : "" , position: "relative", width: "100%", height: "auto"}}>
      <div style={{
        display: (isDesktop || isMobile || isTablet) ? 'flex' : "",
        flexWrap: (isDesktop || isMobile || isTablet) ? '' : "none",
        gap: '10px',
        width: '100%'
      }}>
        {suggestions.length > 0 ? (
          suggestions.slice(0, 3).map(({ brand, items }) => (
            <div key={brand} style={{
              border: '1px solid #ddd',
              color: "black",
              width: (isDesktop || isMobile || isTablet) ? '270px' : "100%",
              flex: '1 1 300px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              backgroundColor: '#fff'
            }}>
              <h3>Suggested Brands Inspired by Your Searches</h3>
              <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: (isDesktop || isMobile || isTablet) ? 'wrap' : "none",
                overflowX: (isDesktop || isMobile || isTablet) ? 'none' : "auto"
              }}>
                {items.map(item => (
                  <div key={item?.itemId} style={{
                    padding: (isDesktop || isMobile || isTablet) ? '10px' : "0rem",
                    width: (isDesktop || isMobile || isTablet) ? '100px' : "300px",
                    textAlign: 'center',
                    backgroundColor: 'white'
                  }}>
                    <img
                      src={item?.item?.images?.[0] || 'https://via.placeholder.com/150'}
                      alt={item?.item?.name || 'Product'}
                      style={{
                        width: (isDesktop || isMobile || isTablet) ? '100%' : "300px",
                        height: (isDesktop || isMobile || isTablet) ? '100px' : "200px",
                        objectFit: 'contain',
                        marginBottom: (isDesktop || isMobile || isTablet) ? '0.5rem' : "0rem"
                      }}
                    />
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '10px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: "black"
                    }} title={item.item.name}>
                      {item.item.name}
                    </div>
                  </div>
                ))}
              </div>
              <h4 style={{ marginBottom: '10px', color: "blue", textDecoration: "underline", cursor: "pointer" }}>
                visite {brand}
              </h4>
            </div>
          ))
        ) : (
          <p>No suggestions available.</p>
        )}
      </div>
    </div>
       
  );
};

export default SearchSuggestions;
