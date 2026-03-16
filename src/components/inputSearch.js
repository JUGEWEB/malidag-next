"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

import en from "../keywords.json";
import fr from "../locales/fr/keywords.json";
import ar from "../locales/ar/keywords.json";
import pt from "../locales/pt/keywords.json";

const LANG_KEYWORDS_MAP = {
  en,
  fr,
  ar,
  pt,
  "pt-BR": pt, // Brazil uses Portuguese keywords for now
};

const SUPPORTED_LANGS = ["en", "fr", "ar", "pt", "pt-BR"];

function InputSearch({ isBasketVisible, basketItems, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  const { isMobile, isSmallMobile, isVerySmall, isVeryVerySmall } = useScreenSize();
  const { t } = useTranslation();
  const router = useRouter();

  const normalize = (str = "") =>
    String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const normalizeForUrl = (str = "") =>
    String(str).trim().toLowerCase().replace(/\s+/g, "+");

 const detectedLang = useMemo(() => {
  const currentLang = i18n.language || "en";

  if (SUPPORTED_LANGS.includes(currentLang)) return currentLang;

  const shortLang = currentLang.split("-")[0];
  return SUPPORTED_LANGS.includes(shortLang) ? shortLang : "en";
}, [i18n.language]);

  const reverseTranslate = (input) => {
    if (!input || typeof input !== "string") return "";

    const userKeywords = LANG_KEYWORDS_MAP[detectedLang] || LANG_KEYWORDS_MAP.en;
    const englishKeywords = LANG_KEYWORDS_MAP.en || {};
    const normalizedInput = normalize(input);

    const phraseEntry = Object.entries(userKeywords).find(
      ([, val]) => normalize(val) === normalizedInput
    );

    if (phraseEntry) {
      const key = phraseEntry[0].replace(/_alt$/, "");
      return englishKeywords[key] || input;
    }

    const inputWords = normalizedInput.split(/\s+/).filter(Boolean);

    const translations = inputWords.map((word) => {
      const matchedEntry = Object.entries(userKeywords).find(
        ([, val]) => normalize(val) === word
      );

      if (!matchedEntry) return word;

      const cleanKey = matchedEntry[0].replace(/_alt$/, "");
      return englishKeywords[cleanKey] || word;
    });

    return translations.join(" ");
  };

  const handleSearch = async (term) => {
    const trimmed = String(term || "").trim();
    if (!trimmed) return;

    const userId = user?.uid || "guest";
    const translatedKey = normalizeForUrl(reverseTranslate(trimmed));

    console.log("Original:", trimmed);
    console.log("Translated to English:", translatedKey);

    try {
      await axios.post("https://api.malidag.com/search-item", {
        userId,
        userSearch: translatedKey,
      });
      console.log("Search saved");
    } catch (err) {
      console.error("Error saving search:", err);
    }

    router.push(`/itemPage/${translatedKey}?q=${encodeURIComponent(trimmed)}`);
  };

  const updateSuggestions = (term) => {
    const lowerTerm = normalize(term);

    if (!lowerTerm) {
      setSuggestions([]);
      return;
    }

    const langKeywords =
      LANG_KEYWORDS_MAP[detectedLang] || LANG_KEYWORDS_MAP.en;

    const results = Object.entries(langKeywords)
      .filter(([, value]) => normalize(value).includes(lowerTerm))
      .map(([, value]) => ({
        value,
        display: value,
        type: "keyword",
      }));

    setSuggestions(results.slice(0, 5));
  };

  useEffect(() => {
    updateSuggestions(searchTerm);
  }, [searchTerm, detectedLang]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        width:
          isVeryVerySmall || isVerySmall
            ? "95%"
            : isSmallMobile
            ? "90%"
            : isMobile
            ? "85%"
            : "100%",
        margin: "0 auto",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          backgroundColor: "white",
          border: `2px solid ${isFocused ? "#0078ff" : "white"}`,
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={t("search_placeholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchTerm.trim()) {
              handleSearch(searchTerm);
              setIsFocused(false);
            }
          }}
          style={{
            flex: 1,
            height: "45px",
            padding: "0 10px",
            border: "none",
            fontSize: "16px",
            outline: "none",
          }}
        />
        <div
          onClick={() => {
            if (searchTerm.trim()) {
              handleSearch(searchTerm);
            }
            setIsFocused(false);
          }}
          style={{
            height: "45px",
            padding: "0 15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: "orange",
            borderLeft: "1px solid #ddd",
          }}
        >
          <FaSearch style={{ fontSize: "15px", color: "#333" }} />
        </div>
      </div>

      {suggestions.length > 0 && isFocused && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            left: 0,
            width: "100%",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "5px",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            color: "black",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            fontSize: isVeryVerySmall || isVerySmall ? "12px" : "14px",
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.value}-${index}`}
              onMouseDown={(e) => {
                e.preventDefault();
                setSearchTerm(suggestion.value);
                setSuggestions([]);
                setIsFocused(false);
                handleSearch(suggestion.value);
              }}
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff",
                borderBottom: "1px solid #eee",
              }}
            >
              <span style={{ marginRight: "8px" }}>🔍</span>
              {suggestion.display}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InputSearch;