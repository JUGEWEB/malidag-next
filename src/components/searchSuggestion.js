"use client";

import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContext } from "./appContext";
import "./SearchSuggestions.css";
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "./checkoutStore";

const SearchSuggestions = () => {
  const appContext = useContext(AppContext);
  const userId = appContext?.user?.uid;

  const [suggestions, setSuggestions] = useState([]);
  const [brandCount, setBrandCount] = useState(0);
  const [brandThemes, setBrandThemes] = useState([]);

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
    <section className="search-suggestions-c">
      {suggestions.slice(0, 4).map(({ brand, theme, items }, brandIndex) => {
        const itemLimit = brandIndex % 2 === 0 ? 3 : 4;
        const visibleItems = items.slice(0, itemLimit);

        return (
          <article
            key={brand}
            className={`suggestion-card-c ${
              visibleItems.length === 3 ? "layout-three" : "layout-four"
            }`}
          >
            <h3 className="suggestion-title-ch1"> Explore {brand}</h3>

            <div className="suggestion-items-c">
              {visibleItems.map((item) => (
                <div key={item?.itemId} className="suggestion-item-c">
                  <img
                    src={
                      item?.item?.images?.[0] ||
                      "https://via.placeholder.com/150"
                    }
                    alt={item?.item?.name || "Product"}
                    className="suggestion-image-c"
                  />

                  <div className="suggestion-name-c" title={item?.item?.name}>
                    {item?.item?.name}
                  </div>
                </div>
              ))}
            </div>

            <button
            type="button"
            className="suggestion-brand-button-c"
            onClick={() => handleVisitBrand(brand)}
          >
            Explore more
          </button>
          </article>
        );
      })}
    </section>
  );
};

export default SearchSuggestions;