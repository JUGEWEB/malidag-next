"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./searchInfo.css";

export default function SearchInfoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const query = searchParams.get("q") || "";
  const searchTerm = searchParams.get("term") || query;

  return (
    <main className="search-info-page">
      <div className="search-info-container">
        <button
          type="button"
          className="search-info-back"
          onClick={() => router.back()}
        >
          ← {t("search_info_back")}
        </button>

        <h1 className="search-info-title">
          {t("search_info_title")}
        </h1>

        <p className="search-info-intro">
          {t("search_info_intro")}
        </p>

        {query && (
          <div className="search-info-query-box">
            <span className="search-info-query-label">
              {t("search_info_your_search")}
            </span>

            <strong className="search-info-query">
              “{query}”
            </strong>
          </div>
        )}

        <section className="search-info-section">
          <h2>{t("search_info_how_title")}</h2>

          <p>
            {t("search_info_how_description")}
          </p>

          {searchTerm && (
            <div className="search-info-term">
              <span>{t("search_info_search_term")}</span>
              <strong>{searchTerm}</strong>
            </div>
          )}
        </section>

        <section className="search-info-section">
          <h2>{t("search_info_match_title")}</h2>

          <p>
            {t("search_info_match_description")}
          </p>

          <ul>
            <li>{t("search_info_match_name")}</li>
            <li>{t("search_info_match_category")}</li>
            <li>{t("search_info_match_type")}</li>
            <li>{t("search_info_match_gender")}</li>
            <li>{t("search_info_match_brand")}</li>
            <li>{t("search_info_match_product_info")}</li>
          </ul>
        </section>

        <section className="search-info-section">
          <h2>{t("search_info_country_title")}</h2>

          <p>
            {t("search_info_country_description")}
          </p>
        </section>

        <section className="search-info-section">
          <h2>{t("search_info_results_title")}</h2>

          <p>
            {t("search_info_results_description")}
          </p>
        </section>

        <section className="search-info-section">
          <h2>{t("search_info_change_title")}</h2>

          <p>
            {t("search_info_change_description")}
          </p>
        </section>
      </div>
    </main>
  );
}