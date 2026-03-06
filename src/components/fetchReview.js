"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

const BASE_URL = "https://api.malidag.com";

const firstNames = ["James", "Sophia", "Liam", "Olivia", "Noah", "Emma", "Ethan", "Ava", "Mason", "Isabella"];
const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Harris"];

const generateRandomName = () => `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

const processRating = (rating) => {
  if (!rating || rating.toLowerCase() === "n/a" || /[a-zA-Z]/.test(rating)) return 5;
  const parsed = parseFloat(rating);
  return isNaN(parsed) ? 5 : parsed;
};

const processName = (name) => {
  if (!name || name.length > 15 || name === "Unknown" || /[*@#$%^&()_+=]/.test(name)) return generateRandomName();
  return name;
};

const supportedLanguages = [
  { label: "Arabic", code: "ar" }, { label: "Azerbaijani", code: "az" },
  { label: "Chinese (Simplified)", code: "zh" }, { label: "Chinese (Traditional)", code: "zh-Hant" },
  { label: "Czech", code: "cs" }, { label: "Danish", code: "da" }, { label: "Dutch", code: "nl" },
  { label: "English", code: "en" }, { label: "French", code: "fr" }, { label: "German", code: "de" },
  { label: "Greek", code: "el" }, { label: "Hindi", code: "hi" }, { label: "Indonesian", code: "id" },
  { label: "Italian", code: "it" }, { label: "Japanese", code: "ja" }, { label: "Korean", code: "ko" },
  { label: "Persian", code: "fa" }, { label: "Polish", code: "pl" }, { label: "Portuguese", code: "pt" },
  { label: "Portuguese (Brazil)", code: "pt-BR" }, { label: "Romanian", code: "ro" }, { label: "Russian", code: "ru" },
  { label: "Spanish", code: "es" }, { label: "Swedish", code: "sv" }, { label: "Thai", code: "th" },
  { label: "Turkish", code: "tr" }, { label: "Ukrainian", code: "uk" }, { label: "Vietnamese", code: "vi" }
];

const supportedLangCodes = supportedLanguages.map(l => l.code);

const FetchReviews = ({ productId, selectedRating, onRatingClick, serverReviews = [] }) => {
  const { i18n } = useTranslation();
  const userLang = i18n.language.split("-")[0].toLowerCase();

  const [reviews, setReviews] = useState(serverReviews.length ? serverReviews : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(11);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState(null);
  const reviewsRef = useRef(null);
  const pathname = usePathname();
  const isReviewPage = pathname === "/review";
   const { t } = useTranslation()

  const translateComment = async (index, text, targetLang) => {
    setReviews(prev => prev.map((r, i) => i === index ? { ...r, isTranslating: true } : r));
    try {
      const res = await axios.post(`${BASE_URL}/translate`, { q: text, source: "auto", target: targetLang, format: "text" });
      setReviews(prev => prev.map((r, i) => i === index ? { ...r, translatedComment: res.data.translatedText, isTranslating: false } : r));
    } catch {
      setReviews(prev => prev.map((r, i) => i === index ? { ...r, isTranslating: false } : r));
    }
  };

  const getTranslationAction = (reviewLang) => {
    if (!supportedLangCodes.includes(reviewLang)) return null;
    if (supportedLangCodes.includes(userLang) && userLang !== reviewLang) return "direct";
    if (!supportedLangCodes.includes(userLang)) return "select";
    return null;
  };

  
  useEffect(() => {
    if (!productId) return;
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/get-reviews/${productId}`);
        if (res.data.success) {
          const prepared = res.data.reviews.map(r => ({
            ...r,
            rating: processRating(r.rating),
            name: processName(r.name),
            reviewLang: r.lang,
            translatedComment: null,
            isTranslating: false,
          }));
          setReviews(prepared);
          localStorage.setItem("reviewCount", prepared.length);
        } else throw new Error("Failed to fetch reviews.");
      } catch (err) {
        setError("Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (selectedRating !== null && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedRating]);


  const sortedReviews = [...reviews].sort((a, b) => {
    if (selectedRating) return parseFloat(a.rating) === selectedRating ? -1 : 1;
    return 0;
  });
  const visibleReviews = sortedReviews.slice(0, visibleCount);

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "start" }}>
      <div ref={reviewsRef} style={{ padding: "1rem", width: "100%" }}>
        <h2>{t("customer_reviews")}</h2>
        {loading ? <p>{t("loading_reviews")}</p> : error ? <p>{error}</p> : reviews.length === 0 ? <p>{t("no_reviews_yet")}</p> : (
          <>
            {visibleReviews.map((r, index) => {
              const realIndex = reviews.findIndex(item => item === r);
              const action = getTranslationAction(r.reviewLang);
              return (
                <div key={realIndex} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #ccc", color: "black" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <img
    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=random`}
    alt="profile"
    style={{ width: "32px", height: "32px", borderRadius: "50%" }}
  />
  <h4 style={{ margin: 0 }}>{r.name}</h4>
</div>

                  <p>{r.translatedComment || r.comment}</p>

                {action === "direct" && (
  <button
    onClick={() => {
      if (r.translatedComment) {
        setReviews(prev => prev.map((item, i) =>
          i === realIndex ? { ...item, translatedComment: null } : item
        ));
      } else {
        translateComment(realIndex, r.comment, userLang);
      }
    }}
    disabled={r.isTranslating}
    style={{
      color: "black",
      border: "none",
      cursor: "pointer"
    }}
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/d/db/Google_Translate_Icon.png"
      alt="translate"
      style={{ width: "20px", height: "20px" }}
    />
    {" "}
    {r.isTranslating
      ? t("translating")
      : r.translatedComment
        ? t("show_original", { lang: r.reviewLang?.toUpperCase() })
        : t("translate_to", { lang: userLang.toUpperCase() })}
  </button>
)}


                 {action === "select" && (
  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/d/db/Google_Translate_Icon.png"
      alt="translate"
      style={{ width: "20px", height: "20px" }}
    />
    {r.isTranslating ? (
      <span style={{ fontSize: "14px", fontWeight: "bold" }}>{ t("translating")}</span>
    ) : (
      <select
        onChange={(e) => e.target.value && translateComment(realIndex, r.comment, e.target.value)}
        disabled={r.isTranslating}
        style={{ color: "black", border: "none", padding: "0px", marginRight: "12px" }}
        defaultValue=""
      >
        <option value="">{t("translate_to_select")}</option>
        {supportedLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    )}
  </div>
)}


                  <p style={{ color: "blue", cursor: "pointer", fontSize: "14px" }} onClick={() => setSelectedReviewIndex(realIndex)}>
                    {t("from")}: {r.country || t("no_country")} — {t("date")}: {new Date(r.date).toLocaleDateString()}
                  </p>
                  <p style={{ color: "black", fontWeight: selectedRating === r.rating ? "bold" : "normal" }} onClick={() => onRatingClick?.(r.rating)}>
                    {t("rating")}: {r.rating} 
                  </p>
                </div>
              )
            })}
            {isReviewPage && visibleCount < reviews.length && (
              <div style={{ marginTop: "20px", cursor: "pointer", color: "blue", textDecoration: "underline", textAlign: "center", marginBottom: "20px" }} onClick={() => setVisibleCount(prev => prev + 11)}>
                {t("show_more_reviews")}
              </div>
            )}
          </>
        )}

        {selectedReviewIndex !== null && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.09)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }} onClick={() => setSelectedReviewIndex(null)}>
            <div style={{ background: "white", padding: "20px", borderRadius: "8px", minWidth: "300px", maxWidth: "90%", boxShadow: "0 4px 8px rgba(0,0,0,0.2)", position: "relative", color: "black" }} onClick={e => e.stopPropagation()}>
              <button style={{ position: "absolute", top: "10px", right: "10px", background: "transparent", border: "none", fontSize: "18px", cursor: "pointer" }} onClick={() => setSelectedReviewIndex(null)}>×</button>
              <h3>{t("review_details")}</h3>
              <p><b>👤</b> {reviews[selectedReviewIndex].name}</p>
              <p><b>{t("email")}:</b> <a href={`mailto:${reviews[selectedReviewIndex].email}`} style={{ color: "blue", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">{reviews[selectedReviewIndex].email}</a></p>
              <p><b>{t("date_of_writing")}:</b> {new Date(reviews[selectedReviewIndex].date).toLocaleString()}</p>
              <p><b>{t("full_comment")}:</b> {reviews[selectedReviewIndex].translatedComment || reviews[selectedReviewIndex].comment}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FetchReviews;
