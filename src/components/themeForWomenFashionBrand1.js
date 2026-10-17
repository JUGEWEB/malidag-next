
"use client";

import React, { useContext, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppContext } from "./appContext";
import { useTranslation } from "react-i18next";
import "./ThemeForWomenFashionBrand1.css";

const theme = {
  id: 456,
  theme: "Women fashion",
  image:
    "https://cdn.malidag.com/themes/1760454830463-0a9bff23-526a-40ba-a2b9-be41271c845f.webp",
};

const ThemeForWomenFashionBrand1 = () => {
  const { t } = useTranslation();
  const { country } = useContext(AppContext);

  const countryCode = country?.code;

  const withCountry = useCallback(
    (path) => {
      if (!countryCode) return path;

      return `/${countryCode}${
        path.startsWith("/") ? path : `/${path}`
      }`;
    },
    [countryCode]
  );

  return (
    <section
      className="women-brand-hero-brand1"
      aria-label={t("women_fashion")}
    >
      <Link
        href={withCountry("/women-fashion")}
        className="women-brand-hero__link-brand1"
      >
        <Image
          src={theme.image}
          alt={theme.theme}
          fill
          priority
          quality={75}
          sizes="(max-width: 768px) 100vw, (max-width: 1440px) 95vw, 1400px"
          className="women-brand-hero__image-brand1"
        />

        <div
          className="women-brand-hero__overlay-brand1"
          aria-hidden="true"
        />

        <div className="women-brand-hero__content-brand1">
          <span className="women-brand-hero__eyebrow-brand1">
            MALIDAG COLLECTION
          </span>

          <h2 className="women-brand-hero__title-brand1">
            {t("women_fashion")}
          </h2>

          <p className="women-brand-hero__subtitle-brand1">
            {t("women_fashion_subtitle")}
          </p>

          <span className="women-brand-hero__cta-brand1">
            <span>{t("discover_now")}</span>

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </section>
  );
};

export default ThemeForWomenFashionBrand1;
