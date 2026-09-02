"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "react-i18next";

const BASE_URLs = "https://api.malidag.com";

const AVAILABLE_COUNTRIES = [
  {
    name: "France",
    nameKey: "country_france",
    code: "fr",
    flag: "https://flagcdn.com/w320/fr.png",
  },
  {
    name: "United Kingdom",
    nameKey: "country_united_kingdom",
    code: "gb",
    flag: "https://flagcdn.com/w320/gb.png",
  },
  {
    name: "Brazil",
    nameKey: "country_brazil",
    code: "br",
    flag: "https://flagcdn.com/w320/br.png",
  },
];

const LOGO =
  "https://firebasestorage.googleapis.com/v0/b/benege-93e7c.appspot.com/o/uploads%2FChatGPT%20Image%20May%206%2C%202026%2C%2012_09_22%20AM.png?alt=media&token=19d4b065-b842-4e9a-81be-028450001cad";

export default function HomePageClient() {
  const router = useRouter();
  const { t } = useTranslation();

  const [detectedCountry, setDetectedCountry] = useState(null);
  const [detecting, setDetecting] = useState(true);
  const [navigatingCode, setNavigatingCode] = useState(null);

  const SELECTED_COUNTRY_KEY = "selectedCountry";

  const saveDeliveryCountry = (country) => {
    localStorage.setItem(SELECTED_COUNTRY_KEY, JSON.stringify(country));
    window.dispatchEvent(new Event("countryChanged"));
  };

  const handleCountrySelect = (country) => {
    setNavigatingCode(country.code);
    saveDeliveryCountry(country);
    router.push(`/${country.code}`);
  };

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const ipRes = await axios.get("https://api.ipify.org?format=json");

        const { data } = await axios.get(
          `${BASE_URLs}/api/country/${ipRes.data.ip}`
        );

        setDetectedCountry({
          name: data.countryName,
          code: data.countryCode?.toLowerCase(),
        });
      } catch (err) {
        console.error("Country detection failed:", err);
      } finally {
        setDetecting(false);
      }
    };

    detectCountry();
  }, []);

  const supportedDetectedCountry = AVAILABLE_COUNTRIES.find(
    (country) => country.code === detectedCountry?.code
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #fff7ed 0, transparent 32%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        padding: "32px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "780px",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #e5e7eb",
          borderRadius: "28px",
          boxShadow: "0 24px 70px rgba(15,23,42,0.10)",
          padding: "34px 24px",
        }}
      >
      
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      marginBottom: "18px",
    }}
  >
    <img
      src={LOGO}
      alt="Malidag"
      style={{
        width: "86px",
        height: "86px",
        objectFit: "contain",
      }}
    />

    <div
      style={{
        background: "#111827",
        borderRadius: "999px",
        padding: "6px 8px",
      }}
    >
      <LanguageSelector />
    </div>
  </div>

  <div style={{ textAlign: "center" }}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 12px",
        borderRadius: "999px",
        background: "#111827",
        color: "#fff",
        fontSize: "12px",
        fontWeight: 900,
        marginBottom: "16px",
      }}
    >
     {t("country_delivery_required")}
    </div>

          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 52px)",
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.06em",
              color: "#111827",
              margin: "0 0 14px",
            }}
          >
           {t("country_choose_delivery")}
          </h1>

          <p
            style={{
              maxWidth: "560px",
              margin: "0 auto",
              color: "#64748b",
              fontSize: "15px",
              lineHeight: 1.7,
            }}
          >
          {t("country_personalize_message")}
          </p>
        </div>

        {detecting && (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "18px",
              marginBottom: "20px",
              background: "#fff",
              color: "#64748b",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
          {t("country_detecting_location")}
          </div>
        )}

        {!detecting && detectedCountry && supportedDetectedCountry && (
          <div
            style={{
              border: "1px solid #fed7aa",
              background: "#fff7ed",
              borderRadius: "22px",
              padding: "20px",
              marginBottom: "22px",
              display: "flex",
              gap: "16px",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  color: "#9a3412",
                  marginBottom: "6px",
                }}
              >
               {t("country_detected_location")}
              </div>

              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 950,
                  color: "#111827",
                }}
              >
              {t(supportedDetectedCountry.nameKey)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCountrySelect(supportedDetectedCountry)}
              disabled={navigatingCode === supportedDetectedCountry.code}
              style={{
                border: "none",
                borderRadius: "999px",
                background: "#f97316",
                color: "#fff",
                padding: "13px 18px",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
             {navigatingCode === supportedDetectedCountry.code
            ? t("country_opening_shop")
            : t("country_continue_to", {
                country: t(supportedDetectedCountry.nameKey),
              })}
            </button>
          </div>
        )}

        {!detecting && detectedCountry && !supportedDetectedCountry && (
          <div
            style={{
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              borderRadius: "22px",
              padding: "20px",
              marginBottom: "22px",
            }}
          >
            <p style={{ margin: 0, color: "#111827", fontWeight: 800 }}>
              {t("country_not_deliver_directly", {
                country: detectedCountry.name,
              })}
            </p>

           <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            {t("country_choose_available_below")}
          </p>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          {AVAILABLE_COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country)}
              disabled={Boolean(navigatingCode)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "22px",
                padding: "18px",
                background: "#fff",
                color: "#111827",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: navigatingCode ? "wait" : "pointer",
                boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={country.flag}
                  alt={country.name}
                  style={{
                    width: "34px",
                    height: "24px",
                    objectFit: "cover",
                    borderRadius: "5px",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
                  }}
                />

                <span>
                  <strong style={{ display: "block", fontSize: "16px" }}>
                   {t(country.nameKey)}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#64748b",
                      marginTop: "3px",
                      textTransform: "uppercase",
                      fontWeight: 900,
                    }}
                  >
                    {country.code}
                  </span>
                </span>
              </span>

              <span style={{ fontWeight: 950, color: "#f97316" }}>
                {navigatingCode === country.code ? "..." : "→"}
              </span>
            </button>
          ))}
        </div>

        <p
          style={{
            margin: "24px 0 0",
            textAlign: "center",
            fontSize: "12px",
            color: "#94a3b8",
            lineHeight: 1.6,
          }}
        >
         {t("country_selection_explanation")}
        </p>
      </section>
    </main>
  );
}