"use client";

import React, { useMemo, useState } from "react";
import Head from "next/head";
import useScreenSize from "./useIsMobile";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { parseWithEmoji } from "./twemojiflag";

const kebab = (s = "") =>
  String(s).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const splitCountries = (csv) =>
  String(csv || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function InternationalShipping() {
  const { isMobile, isTablet, isSmallMobile, isVerySmall } = useScreenSize();
  const { t } = useTranslation();
  const currentLang = i18n.language;

  // —— Regions config (translation keys) ——
  const regions = useMemo(
    () => [
      { slug: "americas", titleKey: "americas", listKey: "americas_list" },
      { slug: "europe", titleKey: "europe", listKey: "europe_list" },
      { slug: "middle-east-africa", titleKey: "middle_east_africa", listKey: "middle_east_africa_list" },
      { slug: "asia-pacific", titleKey: "asia_pacific", listKey: "asia_pacific_list" },
    ],
    []
  );

  // —— Modal state ——
  const [openRegion, setOpenRegion] = useState(null);
  const [query, setQuery] = useState("");

  const currentRegion = regions.find((r) => r.slug === openRegion);
  const countries = currentRegion ? splitCountries(t(currentRegion.listKey)) : [];
  const filteredCountries = query
    ? countries.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : countries;

  return (
    <div style={{ padding: "20px", backgroundColor: "#fefefe", color: "#222" }}>
      <Head>
        <title>International Shipping | Malidag</title>
        <meta
          name="description"
          content="Learn how Malidag delivers products internationally. Shipping times, regions, and fees explained."
        />
      </Head>

      <style>
        {`
        .emoji { height: 1em; width: 1em; margin: 0 2px; vertical-align: -0.2em; }
        .region-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin: 12px 0 8px;
        }
        .region-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .region-card:hover { border-color: #ddd; }
        .chip {
          font-size: 12px; background: #f5f5f5; border-radius: 999px; padding: 4px 10px;
        }
        /* Modal */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-card {
          background: #fff; border-radius: 12px; width: min(92vw, 720px);
          max-height: 82vh; overflow: hidden; display: flex; flex-direction: column;
        }
        .modal-head {
          padding: 16px 18px; border-bottom: 1px solid #eee; display: flex; gap: 12px; align-items: center;
        }
        .modal-title { margin: 0; font-size: 18px; color: #111; flex: 1; }
        .modal-body { padding: 14px 18px; overflow-y: auto; }
        .modal-actions { padding: 12px 18px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 8px; }
        .btn {
          border: 1px solid #ddd; background: #fff; padding: 8px 14px; border-radius: 8px; cursor: pointer;
        }
        .btn-primary { background: #111; color: #fff; border-color: #111; }
        .search-input {
          width: 260px; max-width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 8px;
        }
        .country-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px 16px; list-style: none; padding: 0; margin: 0;
        }
        .country-item { font-size: 15px; }
        `}
      </style>

      <h1 style={{ fontSize: "24px", marginBottom: "10px", color: "#111" }}>
        🌍 {t("international_shipping_policy_title")}
      </h1>

      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("international_shipping_policy")}</p>

      {/* Regions */}
      <h2 style={{ marginTop: 16 }}>🛫 {t("shipping_regions_country_title")}</h2>
      <div className="region-grid" role="list">
        {regions.map((r) => {
          const list = splitCountries(t(r.listKey));
          const titleHtml = parseWithEmoji(`<strong>${t(r.titleKey)}</strong>`);
          return (
            <button
              key={r.slug}
              className="region-card"
              role="listitem"
              onClick={() => {
                setOpenRegion(r.slug);
                setQuery("");
              }}
              aria-haspopup="dialog"
              aria-controls={`modal-${r.slug}`}
            >
              <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
              <span className="chip">{list.length} {t("countries_label", { defaultValue: "countries" })}</span>
            </button>
          );
        })}
      </div>

      {/* Delivery time */}
      <h2 style={{ marginTop: "20px", fontSize: "18px", color: "#333" }}>⏱️ {t("Estimate_delivery_time_title")}</h2>
      <p style={{ lineHeight: "1.6", fontSize: "16px" }}>{t("Estimate_delivery_time_paragraph1")}</p>
      <p style={{ lineHeight: "1.6", fontSize: "16px" }}>{t("Estimate_delivery_time_paragraph2")}</p>
      <ul style={{ paddingLeft: "20px", fontSize: "16px", lineHeight: "1.6" }}>
        <li dangerouslySetInnerHTML={{ __html: t("standard") }} />
        <li dangerouslySetInnerHTML={{ __html: t("express") }} />
      </ul>
      <p style={{ lineHeight: "1.6", fontSize: "16px" }}>{t("Estimate_delivery_time_paragraph3")}</p>
      <p style={{ lineHeight: "1.6", fontSize: "16px" }}>{t("Estimate_delivery_time_paragraph4")}</p>

      {/* Fees */}
      <h2 style={{ marginTop: "20px", fontSize: "18px", color: "#333" }}>💰 {t("Shipping_Fees_title")}</h2>
      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("Shipping_Fees_paragraph1")}</p>
      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("Shipping_Fees_paragraph2")}</p>
      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("Shipping_Fees_paragraph3")}</p>
      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("Shipping_Fees_paragraph4")}</p>

      {/* Customs */}
      <h2 style={{ marginTop: "20px", fontSize: "18px", color: "#333" }}>📦 {t("Customs_Duties_Taxes_title")}</h2>
      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("Customs_Duties_Taxes_paragraph1")}</p>
      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("Customs_Duties_Taxes_paragraph2")}</p>
      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("Customs_Duties_Taxes_paragraph3")}</p>
      <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{t("Customs_Duties_Taxes_paragraph4")}</p>

      {/* Help */}
      <h2 style={{ marginTop: "20px", fontSize: "18px", color: "#333" }}>📧 {t("Need_Help_title")}</h2>
      <p>
        {t("Need_Help_part1")}{" "}
        <a href="mailto:support@malidag.com">support@malidag.com</a>{" "}
        {t("Need_Help_part2")}
      </p>

      {/* —— Modal for region —— */}
      {openRegion && currentRegion && (
        <div
          className="modal-backdrop"
          onClick={() => setOpenRegion(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${currentRegion.slug}`}
        >
          <div
            id={`modal-${currentRegion.slug}`}
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3 id={`modal-title-${currentRegion.slug}`} className="modal-title">
                {t(currentRegion.titleKey)} — {t("countries_label", { defaultValue: "Countries" })}
              </h3>
              <input
                className="search-input"
                placeholder={t("search_countries_placeholder", { defaultValue: "Search countries..." })}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-body">
              {filteredCountries.length === 0 ? (
                <p style={{ color: "#666", margin: "8px 0 0" }}>
                  {t("no_match", { defaultValue: "No matching countries." })}
                </p>
              ) : (
                <ul className="country-grid">
                  {filteredCountries.map((name) => (
                    <li key={`${currentRegion.slug}-${kebab(name)}`} className="country-item">
                      <span dangerouslySetInnerHTML={{ __html: parseWithEmoji(name) }} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setQuery("")}>
                {t("clear", { defaultValue: "Clear" })}
              </button>
              <button className="btn btn-primary" onClick={() => setOpenRegion(null)}>
                {t("close", { defaultValue: "Close" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
