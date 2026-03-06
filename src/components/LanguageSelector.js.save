"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "./LanguageContext"; // ✅ use global lang context
import { auth } from "./firebaseConfig"; // 👈 at the top
import i18n from "@/i18n";
import { Color } from "antd/es/color-picker";


// Full list of supported languages
const languages = [
  { code: "af", label: "Afrikaans" },
  { code: "am", label: "አማርኛ" },
  { code: "ar", label: "العربية" },
  { code: "az", label: "Azərbaycan dili" },
  { code: "be", label: "Беларуская" },
  { code: "bg", label: "Български" },
  { code: "bn", label: "বাংলা" },
  { code: "bs", label: "Bosanski" },
  { code: "ca", label: "Català" },
  { code: "ceb", label: "Cebuano" },
  { code: "co", label: "Corsu" },
  { code: "cs", label: "Čeština" },
  { code: "cy", label: "Cymraeg" },
  { code: "da", label: "Dansk" },
  { code: "de", label: "Deutsch" },
  { code: "el", label: "Ελληνικά" },
  { code: "en", label: "English" },
  { code: "eo", label: "Esperanto" },
  { code: "es", label: "Español" },
  { code: "et", label: "Eesti" },
  { code: "eu", label: "Euskara" },
  { code: "fa", label: "فارسی" },
  { code: "fi", label: "Suomi" },
  { code: "fr", label: "Français" },
  { code: "fy", label: "Frysk" },
  { code: "ga", label: "Gaeilge" },
  { code: "gd", label: "Gàidhlig" },
  { code: "gl", label: "Galego" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "ha", label: "Hausa" },
  { code: "haw", label: "ʻŌlelo Hawaiʻi" },
  { code: "he", label: "עברית" },
  { code: "hi", label: "हिन्दी" },
  { code: "hmn", label: "Hmoob" },
  { code: "hr", label: "Hrvatski" },
  { code: "ht", label: "Kreyòl ayisyen" },
  { code: "hu", label: "Magyar" },
  { code: "hy", label: "Հայերեն" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ig", label: "Igbo" },
  { code: "is", label: "Íslenska" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "jw", label: "Basa Jawa" },
  { code: "ka", label: "ქართული" },
  { code: "kk", label: "Қазақ тілі" },
  { code: "km", label: "ភាសាខ្មែរ" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ko", label: "한국어" },
  { code: "ku", label: "Kurdî" },
  { code: "ky", label: "Кыргызча" },
  { code: "la", label: "Latina" },
  { code: "lb", label: "Lëtzebuergesch" },
  { code: "lo", label: "ລາວ" },
  { code: "lt", label: "Lietuvių" },
  { code: "lv", label: "Latviešu" },
  { code: "mg", label: "Malagasy" },
  { code: "mi", label: "Māori" },
  { code: "mk", label: "Македонски" },
  { code: "ml", label: "മലയാളം" },
  { code: "mn", label: "Монгол" },
  { code: "mr", label: "मराठी" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "mt", label: "Malti" },
  { code: "my", label: "မြန်မာ" },
  { code: "ne", label: "नेपाली" },
  { code: "nl", label: "Nederlands" },
  { code: "no", label: "Norsk" },
  { code: "ny", label: "Chichewa" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "pl", label: "Polski" },
  { code: "ps", label: "پښتو" },
  { code: "pt", label: "Português" },
  { code: "ro", label: "Română" },
  { code: "ru", label: "Русский" },
  { code: "rw", label: "Kinyarwanda" },
  { code: "sd", label: "سنڌي" },
  { code: "si", label: "සිංහල" },
  { code: "sk", label: "Slovenčina" },
  { code: "sl", label: "Slovenščina" },
  { code: "sm", label: "Gagana Samoa" },
  { code: "sn", label: "ChiShona" },
  { code: "so", label: "Soomaali" },
  { code: "sq", label: "Shqip" },
  { code: "sr", label: "Српски" },
  { code: "st", label: "Sesotho" },
  { code: "su", label: "Basa Sunda" },
  { code: "sv", label: "Svenska" },
  { code: "sw", label: "Kiswahili" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "tg", label: "Тоҷикӣ" },
  { code: "th", label: "ไทย" },
  { code: "tk", label: "Türkmen" },
  { code: "tl", label: "Tagalog" },
  { code: "tr", label: "Türkçe" },
  { code: "tt", label: "Татар" },
  { code: "ug", label: "ئۇيغۇرچە" },
  { code: "uk", label: "Українська" },
  { code: "ur", label: "اردو" },
  { code: "uz", label: "Oʻzbekcha" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "xh", label: "isiXhosa" },
  { code: "yi", label: "ייִדיש" },
  { code: "yo", label: "Yorùbá" },
  { code: "zh", label: "中文" },
  { code: "zu", label: "isiZulu" },

];


const LanguageSelector = () => {
  const { lang, setLang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  const selectedLang = languages.find((l) => l.code === lang) || languages[0];

  const handleChangeLanguage = async (newLang) => {
    await i18n.changeLanguage(newLang); // update i18n
    setLang(newLang); // update context
    localStorage.setItem("lang", newLang);

    // sync with backend if logged in
    const user = auth?.currentUser;
    if (user?.uid) {
      try {
        await fetch("https://api.malidag.com/api/lang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, lang: newLang }),
        });
      } catch (err) {
        console.error("Failed to sync language:", err);
      }
    }

    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* ✅ Always UK flag */}
      <div
        style={{
          borderRadius: "0px",
          padding: "6px 10px",
          minWidth: "auto",
          cursor: "pointer",
          display: "flex",
          marginRight: "10px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src="https://flagcdn.com/gb.svg"
          alt="UK Flag"
          style={{ width: "24px", height: "16px", objectFit: "cover" }}
        />
        <span style={{color: "white"}}>
          {selectedLang?.code.charAt(0).toUpperCase() + selectedLang?.code.slice(1)}
        </span>
        <span style={{ marginLeft: "0px", color: "white" }}>▼</span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            zIndex: 10,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            listStyle: "none",
            color: "black",
            padding: 0,
            margin: "5px 0 0 0",
            minWidth: "180px",
            maxHeight: "400px",
            overflowY: "auto",
            fontSize: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
           <li
            onClick={() => {
              setShowModal(true);
              setIsOpen(false);
            }}
            style={{
              padding: "10px 14px",
              textAlign: "center",
              backgroundColor: "#f9f9f9",
              fontStyle: "italic",
              cursor: "pointer",
              color: "#0078ff",
              fontSize: "11px",
              borderTop: "1px solid #ddd",
            }}
          >
            ℹ️ {t("language_info_link")}
          </li>

          {languages.map((l) => (
            <li
              key={l.code}
              onClick={() => handleChangeLanguage(l.code)}
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                backgroundColor: l.code === lang ? "#f0f0f0" : "#fff",
                borderBottom: "1px solid #eee",
              }}
            >
              {`${l.label} (${l.code})`}
            </li>
          ))}
        </ul>
      )}

      {/* Info modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: "12px" }}>{t("language_change_title")}</h3>
            <p style={{ fontSize: "14px", lineHeight: "1.5" }}>
              {t("language_change_body_1")}
              <br />
              <br />
              {t("language_change_body_2")}
              <br />
              <br />
              {t("language_change_body_3")}
              <br />
              <br />
              {t("language_change_body_4")}
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: "20px",
                padding: "8px 16px",
                backgroundColor: "#0078ff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {t("got_it")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
