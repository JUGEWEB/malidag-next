"use client";

// InputSearch.js
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

// Language keyword imports
import af from "../locales/af/keywords.json";
import am from "../locales/am/keywords.json";
import ar from "../locales/ar/keywords.json";
import az from "../locales/az/keywords.json";
import be from "../locales/be/keywords.json";
import bg from "../locales/bg/keywords.json";
import bn from "../locales/bn/keywords.json";
import bs from "../locales/bs/keywords.json";
import ca from "../locales/ca/keywords.json";
import ceb from "../locales/ceb/keywords.json";
import co from "../locales/co/keywords.json";
import cs from "../locales/cs/keywords.json";
import cy from "../locales/cy/keywords.json";
import da from "../locales/da/keywords.json";
import de from "../locales/de/keywords.json";
import el from "../locales/el/keywords.json";
import en from "../keywords.json";
import eo from "../locales/eo/keywords.json";
import es from "../locales/es/keywords.json";
import et from "../locales/et/keywords.json";
import eu from "../locales/eu/keywords.json";
import fa from "../locales/fa/keywords.json";
import fi from "../locales/fi/keywords.json";
import fr from "../locales/fr/keywords.json";
import fy from "../locales/fy/keywords.json";
import ga from "../locales/ga/keywords.json";
import gd from "../locales/gd/keywords.json";
import gl from "../locales/gl/keywords.json";
import gu from "../locales/gu/keywords.json";
import ha from "../locales/ha/keywords.json";
import haw from "../locales/haw/keywords.json";
import he from "../locales/he/keywords.json";
import hi from "../locales/hi/keywords.json";
import hmn from "../locales/hmn/keywords.json";
import hr from "../locales/hr/keywords.json";
import ht from "../locales/ht/keywords.json";
import hu from "../locales/hu/keywords.json";
import hy from "../locales/hy/keywords.json";
import id from "../locales/id/keywords.json";
import ig from "../locales/ig/keywords.json";
import is from "../locales/is/keywords.json";
import it from "../locales/it/keywords.json";
import ja from "../locales/ja/keywords.json";
import jw from "../locales/jw/keywords.json";
import ka from "../locales/ka/keywords.json";
import kk from "../locales/kk/keywords.json";
import km from "../locales/km/keywords.json";
import kn from "../locales/kn/keywords.json";
import ko from "../locales/ko/keywords.json";
import ku from "../locales/ku/keywords.json";
import ky from "../locales/ky/keywords.json";
import la from "../locales/la/keywords.json";
import lb from "../locales/lb/keywords.json";
import lo from "../locales/lo/keywords.json";
import lt from "../locales/lt/keywords.json";
import lv from "../locales/lv/keywords.json";
import mg from "../locales/mg/keywords.json";
import mi from "../locales/mi/keywords.json";
import mk from "../locales/mk/keywords.json";
import ml from "../locales/ml/keywords.json";
import mn from "../locales/mn/keywords.json";
import mr from "../locales/mr/keywords.json";
import ms from "../locales/ms/keywords.json";
import mt from "../locales/mt/keywords.json";
import my from "../locales/my/keywords.json";
import ne from "../locales/ne/keywords.json";
import nl from "../locales/nl/keywords.json";
import no from "../locales/no/keywords.json";
import ny from "../locales/ny/keywords.json";
import pa from "../locales/pa/keywords.json";
import pl from "../locales/pl/keywords.json";
import ps from "../locales/ps/keywords.json";
import pt from "../locales/pt/keywords.json";
import ro from "../locales/ro/keywords.json";
import ru from "../locales/ru/keywords.json";
import rw from "../locales/rw/keywords.json";
import sd from "../locales/sd/keywords.json";
import si from "../locales/si/keywords.json";
import sk from "../locales/sk/keywords.json";
import sl from "../locales/sl/keywords.json";
import sm from "../locales/sm/keywords.json";
import sn from "../locales/sn/keywords.json";
import so from "../locales/so/keywords.json";
import sq from "../locales/sq/keywords.json";
import sr from "../locales/sr/keywords.json";
import st from "../locales/st/keywords.json";
import su from "../locales/su/keywords.json";
import sv from "../locales/sv/keywords.json";
import sw from "../locales/sw/keywords.json";
import ta from "../locales/ta/keywords.json";
import te from "../locales/te/keywords.json";
import tg from "../locales/tg/keywords.json";
import th from "../locales/th/keywords.json";
import tk from "../locales/tk/keywords.json";
import tl from "../locales/tl/keywords.json";
import tr from "../locales/tr/keywords.json";
import tt from "../locales/tt/keywords.json";
import ug from "../locales/ug/keywords.json";
import uk from "../locales/uk/keywords.json";
import ur from "../locales/ur/keywords.json";
import uz from "../locales/uz/keywords.json";
import vi from "../locales/vi/keywords.json";
import xh from "../locales/xh/keywords.json";
import yi from "../locales/yi/keywords.json";
import yo from "../locales/yo/keywords.json";
import zh from "../locales/zh/keywords.json";
import zu from "../locales/zu/keywords.json";

const LANG_KEYWORDS_MAP = {
  af, am, ar, az, be, bg, bn, bs, ca, ceb, co, cs, cy, da, de, el, en, eo, es,
  et, eu, fa, fi, fr, fy, ga, gd, gl, gu, ha, haw, he, hi, hmn, hr, ht, hu, hy,
  id, ig, is, it, ja, jw, ka, kk, km, kn, ko, ku, ky, la, lb, lo, lt, lv, mg, mi,
  mk, ml, mn, mr, ms, mt, my, ne, nl, no, ny, pa, pl, ps, pt, ro, ru, rw, sd, si,
  sk, sl, sm, sn, so, sq, sr, st, su, sv, sw, ta, te, tg, th, tk, tl, tr, tt, ug,
  uk, ur, uz, vi, xh, yi, yo, zh, zu
};

function InputSearch({ isBasketVisible, basketItems, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const { isMobile, isSmallMobile, isVerySmall, isVeryVerySmall } = useScreenSize();
  const { t } = useTranslation();
  const router = useRouter();


const normalize = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const reverseTranslate = (input) => {
  if (!input || typeof input !== "string") return "";

 const detectedLang = i18n.language?.split("-")[0] || "en";
  const userKeywords = LANG_KEYWORDS_MAP[detectedLang] || {};
  const englishKeywords = LANG_KEYWORDS_MAP["en"] || {};

  const normalizedInput = normalize(input);

  // ✅ Try full phrase match first
  const phraseEntry = Object.entries(userKeywords).find(([_, val]) => normalize(val) === normalizedInput);
  if (phraseEntry) {
    const key = phraseEntry[0].replace(/_alt$/, "");
    const translation = englishKeywords[key];
    if (translation) return translation;
  }

  // 🔄 Fall back to word-by-word matching
  const inputWords = normalizedInput.split(/\s+/);
  const translations = [];

  for (const word of inputWords) {
    let matchedKey = null;

    for (const [key, val] of Object.entries(userKeywords)) {
      if (normalize(val) === word) {
        matchedKey = key.replace(/_alt$/, "");
        break;
      }
    }

    if (matchedKey && englishKeywords[matchedKey]) {
      translations.push(englishKeywords[matchedKey]);
    } else {
      translations.push(word); // fallback to the raw word
    }
  }

  return translations.join(" ");
};

  const handleSearch = (searchTerm) => {
  const trimmed = searchTerm.trim();
  if (!trimmed) return;
const normalizeForUrl = (str) =>
  str.trim().toLowerCase().replace(/\s+/g, "+");
  const userId = user?.uid || "guest";
   const translatedKey = normalizeForUrl(reverseTranslate(trimmed));

  console.log("🔍 Original:", trimmed);
  console.log("🔁 Translated to English:", translatedKey);

  // Send translated term to backend
  axios.post("https://api.malidag.com/search-item", {
    userId,
    userSearch: translatedKey
  }).then(() => console.log("✅ Search saved"))
    .catch((err) => console.error("❌ Error saving search:", err));

  // 👇 Navigate to route using translated key, but show original input in query
  router.push(`/itemPage/${translatedKey}?q=${encodeURIComponent(trimmed)}`);
};




  const updateSuggestions = (term) => {
  const lowerTerm = term?.toLowerCase().trim();
  if (!lowerTerm) {
    setSuggestions([]);
    return;
  }

  const detectedLang = i18n.language?.split("-")[0] || "en";
  const langKeywords = LANG_KEYWORDS_MAP[detectedLang] || {};

  const results = Object.entries(langKeywords)
    .filter(([key, value]) => value.toLowerCase().includes(lowerTerm))
    .map(([key, value]) => ({
      value,
      display: value,
      type: "keyword"
    }));

  setSuggestions(results.slice(0, 5));
};


 useEffect(() => {
  updateSuggestions(searchTerm);
}, [searchTerm]);


  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        width:
          isVeryVerySmall || isVerySmall ? "95%" :
          isSmallMobile ? "90%" :
          isMobile ? "85%" : "100%",
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
              key={index}
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
