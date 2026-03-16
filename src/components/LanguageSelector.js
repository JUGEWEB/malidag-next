"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "./LanguageContext";
import { auth } from "./firebaseConfig";
import i18n from "@/i18n";

const languages = [
  { code: "en", label: "English", flag: "https://flagcdn.com/gb.svg" },
  { code: "fr", label: "Français", flag: "https://flagcdn.com/fr.svg" },
  { code: "ar", label: "العربية", flag: "https://flagcdn.com/sa.svg" },
  { code: "pt", label: "Português", flag: "https://flagcdn.com/pt.svg" },
  { code: "pt-BR", label: "Português (Brasil)", flag: "https://flagcdn.com/br.svg" },
];

const LanguageSelector = () => {
  const { lang, setLang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  const selectedLang = languages.find((l) => l.code === lang) || languages[0];

  const handleChangeLanguage = async (newLang) => {
    await i18n.changeLanguage(newLang);
    setLang(newLang);
    localStorage.setItem("lang", newLang);

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
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "4px 6px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          color: "white",
          fontSize: "12px",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        <img
          src={selectedLang.flag}
          alt={selectedLang.label}
          style={{
            width: "18px",
            height: "12px",
            objectFit: "cover",
            borderRadius: "2px",
          }}
        />
        <span style={{ fontSize: "11px", fontWeight: 500 }}>
          {selectedLang.code.toUpperCase()}
        </span>
        <span style={{ fontSize: "9px" }}>▼</span>
      </div>

      {isOpen && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            zIndex: 10,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "6px",
            listStyle: "none",
            color: "black",
            padding: 0,
            margin: "4px 0 0 0",
            minWidth: "120px",
            overflow: "hidden",
            fontSize: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          {languages.map((l) => (
            <li
              key={l.code}
              onClick={() => handleChangeLanguage(l.code)}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                backgroundColor: l.code === lang ? "#f5f5f5" : "#fff",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <img
                src={l.flag}
                alt={l.label}
                style={{
                  width: "16px",
                  height: "11px",
                  objectFit: "cover",
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <span>{l.label}</span>
            </li>
          ))}

          <li
            onClick={() => {
              setShowModal(true);
              setIsOpen(false);
            }}
            style={{
              padding: "8px 10px",
              textAlign: "center",
              backgroundColor: "#fafafa",
              cursor: "pointer",
              color: "#0078ff",
              fontSize: "10px",
            }}
          >
            ℹ️ {t("language_info_link")}
          </li>
        </ul>
      )}

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
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "380px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
              {t("language_change_title")}
            </h3>

            <p style={{ fontSize: "13px", lineHeight: "1.5" }}>
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
                marginTop: "16px",
                padding: "8px 14px",
                backgroundColor: "#0078ff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
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