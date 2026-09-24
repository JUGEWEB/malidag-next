"use client";

import React from "react";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import { parseWithEmoji } from "./twemojiflag";

export default function InternationalShipping() {
  const { t } = useTranslation();

  const supportedCountries = [
    {
      code: "fr",
      flag: "🇫🇷",
      nameKey: "shipping_country_france",
    },
    {
      code: "gb",
      flag: "🇬🇧",
      nameKey: "shipping_country_uk",
    },
    {
      code: "br",
      flag: "🇧🇷",
      nameKey: "shipping_country_brazil",
    },
  ];

  return (
    <main className="intl-shipping-page">
      <Head>
        <title>{t("intl_ship_title")}</title>
        <meta
          name="description"
          content={t("intl_ship_desc")}
        />
      </Head>

      <style>
        {`
          .intl-shipping-page {
            width: 100%;
            background: #ffffff;
            color: #111827;
            padding: 32px 20px 64px;
            box-sizing: border-box;
          }

          .intl-shipping-container {
            width: 100%;
            max-width: 920px;
            margin: 0 auto;
          }

          .intl-shipping-hero {
            padding-bottom: 28px;
            border-bottom: 1px solid #e5e7eb;
          }

          .intl-shipping-eyebrow {
            display: inline-flex;
            align-items: center;
            padding: 6px 11px;
            margin-bottom: 14px;
            border-radius: 999px;
            background: #f3f4f6;
            color: #374151;
            font-size: 0.78rem;
            font-weight: 800;
          }

          .intl-shipping-title {
            margin: 0 0 14px;
            color: #111827;
            font-size: clamp(2rem, 5vw, 3.2rem);
            line-height: 1.08;
            letter-spacing: -0.04em;
          }

          .intl-shipping-intro {
            max-width: 760px;
            margin: 0;
            color: #4b5563;
            font-size: 1.05rem;
            line-height: 1.75;
          }

          .intl-shipping-section {
            padding: 30px 0;
            border-bottom: 1px solid #e5e7eb;
          }

          .intl-shipping-section:last-child {
            border-bottom: none;
          }

          .intl-shipping-section h2 {
            margin: 0 0 12px;
            color: #111827;
            font-size: 1.35rem;
            line-height: 1.3;
          }

          .intl-shipping-section p {
            margin: 0 0 14px;
            color: #4b5563;
            font-size: 0.98rem;
            line-height: 1.75;
          }

          .intl-shipping-section p:last-child {
            margin-bottom: 0;
          }

          .intl-country-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 20px;
          }

          .intl-country-card {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 68px;
            padding: 14px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #ffffff;
          }

          .intl-country-flag {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 1.7rem;
          }

          .intl-country-name {
            color: #111827;
            font-size: 0.95rem;
            font-weight: 800;
          }

          .intl-country-status {
            display: block;
            margin-top: 2px;
            color: #15803d;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .intl-info-box {
            margin-top: 18px;
            padding: 16px 18px;
            border: 1px solid #dbeafe;
            border-radius: 10px;
            background: #eff6ff;
          }

          .intl-info-box p {
            margin: 0;
            color: #1e3a5f;
          }

          .intl-expansion-box {
            margin-top: 18px;
            padding: 18px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }

          .intl-expansion-box strong {
            display: block;
            margin-bottom: 6px;
            color: #111827;
            font-size: 0.95rem;
          }

          .intl-expansion-box p {
            margin: 0;
          }

          .intl-help-link {
            color: #1677ff;
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .emoji {
            height: 1em;
            width: 1em;
            margin: 0 2px;
            vertical-align: -0.15em;
          }

          @media (max-width: 767px) {
            .intl-shipping-page {
              padding: 22px 16px 48px;
            }

            .intl-shipping-hero {
              padding-bottom: 22px;
            }

            .intl-shipping-section {
              padding: 24px 0;
            }

            .intl-country-grid {
              grid-template-columns: 1fr;
            }

            .intl-country-card {
              min-height: 60px;
            }

            .intl-shipping-intro {
              font-size: 0.96rem;
            }

            .intl-shipping-section p {
              font-size: 0.93rem;
            }
          }
        `}
      </style>

      <div className="intl-shipping-container">

        {/* Hero */}
        <header className="intl-shipping-hero">
          <div className="intl-shipping-eyebrow">
            {t("shipping_learn_more")}
          </div>

          <h1 className="intl-shipping-title">
            {t("international_shipping_policy_title")}
          </h1>

          <p className="intl-shipping-intro">
            {t("shipping_intro")}
          </p>
        </header>

        {/* Currently supported countries */}
        <section className="intl-shipping-section">
          <h2>{t("shipping_current_countries_title")}</h2>

          <p>{t("shipping_current_countries_text")}</p>

          <div className="intl-country-grid">
            {supportedCountries.map((country) => (
              <div
                key={country.code}
                className="intl-country-card"
              >
                <span
                  className="intl-country-flag"
                  dangerouslySetInnerHTML={{
                    __html: parseWithEmoji(country.flag),
                  }}
                />

                <div>
                  <span className="intl-country-name">
                    {t(country.nameKey)}
                  </span>

                  <span className="intl-country-status">
                    {t("shipping_currently_supported")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="intl-info-box">
            <p>{t("shipping_country_selection_note")}</p>
          </div>
        </section>

        {/* How shipping works */}
        <section className="intl-shipping-section">
          <h2>{t("shipping_how_it_works_title")}</h2>

          <p>{t("shipping_how_it_works_p1")}</p>

          <p>{t("shipping_how_it_works_p2")}</p>
        </section>

        {/* Brand / product availability */}
        <section className="intl-shipping-section">
          <h2>{t("shipping_availability_title")}</h2>

          <p>{t("shipping_availability_p1")}</p>

          <p>{t("shipping_availability_p2")}</p>

          <div className="intl-info-box">
            <p>{t("shipping_availability_example")}</p>
          </div>
        </section>

        {/* Expansion */}
        <section className="intl-shipping-section">
          <h2>{t("shipping_expansion_title")}</h2>

          <p>{t("shipping_expansion_p1")}</p>

          <div className="intl-expansion-box">
            <strong>{t("shipping_expansion_box_title")}</strong>
            <p>{t("shipping_expansion_box_text")}</p>
          </div>
        </section>

        {/* Delivery */}
        <section className="intl-shipping-section">
          <h2>{t("shipping_delivery_title")}</h2>

          <p>{t("shipping_delivery_p1")}</p>

          <p>{t("shipping_delivery_p2")}</p>
        </section>

        {/* Costs */}
        <section className="intl-shipping-section">
          <h2>{t("shipping_cost_title")}</h2>

          <p>{t("shipping_cost_p1")}</p>
        </section>

        {/* Customs */}
        <section className="intl-shipping-section">
          <h2>{t("shipping_customs_title")}</h2>

          <p>{t("shipping_customs_p1")}</p>
        </section>

        {/* Help */}
        <section className="intl-shipping-section">
          <h2>{t("Need_Help_title")}</h2>

          <p>
            {t("Need_Help_part1")}{" "}
            <a
              className="intl-help-link"
              href="mailto:support@malidag.com"
            >
              support@malidag.com
            </a>{" "}
            {t("Need_Help_part2")}
          </p>
        </section>

      </div>
    </main>
  );
}