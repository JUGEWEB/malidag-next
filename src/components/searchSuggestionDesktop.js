"use client";

import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContext } from "./appContext";
import "./SearchSuggestionsDesktop.css";
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "./checkoutStore";

const SearchSuggestionsDesktop = () => {
  const appContext = useContext(AppContext);
  const [suggestions, setSuggestions] = useState([]);
  const userId = appContext?.user?.uid;
  const [brandCount, setBrandCount] = useState(0);
  const [brandThemes, setBrandThemes] = useState([]);

  const chunkArray = (array, size) => {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
};

const visibleSuggestions = suggestions;
const suggestionRows = chunkArray(visibleSuggestions, 4);

  const { push } = useRouter();
const setSelectedBrandName = useCheckoutStore(
  (state) => state.setSelectedBrandName
);

const normalizeBrand = (value = "") => value.trim().toLowerCase();

const handleVisitBrand = (brandName) => {
  if (!brandName) return;

  const matchedBrand = brandThemes.find(
    (item) => normalizeBrand(item.brandName) === normalizeBrand(brandName)
  );

  const themeRoute = matchedBrand?.theme?.trim()?.toLowerCase();

  if (!themeRoute) {
    console.warn("No theme found for brand:", brandName);
    return;
  }

  setSelectedBrandName(brandName);

  push(`/brand/${themeRoute}/${encodeURIComponent(brandName)}`);
};

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        if (!userId) {
          localStorage.setItem("brandCount", "0");
          setBrandCount(0);
          return;
        }

        const lastFetched = localStorage.getItem("brandSuggestionsFetchedAt");

        if (lastFetched) {
          const now = new Date();
          const lastFetchedDate = new Date(lastFetched);
          const diffInDays = (now - lastFetchedDate) / (1000 * 60 * 60 * 24);

          if (diffInDays > 7) {
            localStorage.removeItem("brandSuggestionsFetchedAt");
            localStorage.removeItem("brandCount");
            return;
          }
        }

        const res = await axios.get(
          "https://api.malidag.com/types/suggestions/user-brand-suggestions",
          {
            params: { userId },
          }
        );

        const count = res.data.brandCount || 0;

        setSuggestions(res.data.suggestions || []);
        setBrandCount(count);

        localStorage.setItem("brandCount", count);
        localStorage.setItem(
          "brandSuggestionsFetchedAt",
          new Date().toISOString()
        );
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };

    fetchSuggestions();
  }, [userId]);

  useEffect(() => {
  const fetchBrandThemes = async () => {
    try {
      const res = await axios.get("https://api.malidag.com/api/brands/themes");
      setBrandThemes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch brand themes:", err);
    }
  };

  fetchBrandThemes();
}, []);

  if (brandCount === 0) return null;

 return (
  <section className="search-suggestions-desktop">
    {suggestionRows.map((row, rowIndex) => (
      <div
        key={rowIndex}
        className={`suggestion-row-desktop row-count-${row.length}`}
      >
        {row.map(({ brand, items }, brandIndexInRow) => {
          const globalIndex = rowIndex * 4 + brandIndexInRow;
          const itemLimit = globalIndex % 2 === 0 ? 3 : 4;
          const visibleItems = items.slice(0, itemLimit);

          return (
            <article
              key={brand}
              className={`suggestion-card-desktop ${
                visibleItems.length === 3 ? "layout-three" : "layout-four"
              } ${row.length === 1 ? "layout-single-brand" : ""}`}
            >
              <h3 className="suggestion-title-desktop">
                Explore {brand}
              </h3>

              <div className="suggestion-items-desktop">
                {visibleItems.map((item) => (
                  <div key={item?.itemId} className="suggestion-item-desktop">
                    <img
                      src={
                        item?.item?.images?.[0] ||
                        "https://via.placeholder.com/150"
                      }
                      alt={item?.item?.name || "Product"}
                      className="suggestion-image-desktop"
                    />

                    <div
                      className="suggestion-name-desktop"
                      title={item?.item?.name}
                    >
                      {item?.item?.name}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="suggestion-brand-button-desktop"
                onClick={() => handleVisitBrand(brand)}
              >
                view more
              </button>
            </article>
          );
        })}
      </div>
    ))}
  </section>
);
};

export default SearchSuggestionsDesktop;