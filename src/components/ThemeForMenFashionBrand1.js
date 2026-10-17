
"use client";

import React, { useContext, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppContext } from "./appContext";
import { useTranslation } from "react-i18next";
import "./ThemeForMenFashionBrand1.css";

const theme = {
  id: 2,
  theme: "Men fashion",
  image:
    "https://cdn.malidag.com/themes/1760454633076-72b7665a-bdb7-4f07-b388-aa5ca6219345.webp",
};

const ThemeForMenFashionBrand1 = () => {
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
      className="men-brand-hero-brand1"
      aria-label={t("men_fashion")}
    >
      <Link
        href={withCountry("/men-fashion")}
        className="men-brand-hero__link-brand1"
      >
        <Image
          src={theme.image}
          alt={theme.theme}
          fill
          priority
          quality={75}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 95vw, 1200px"
          className="men-brand-hero__image-brand1"
        />

        <div
          className="men-brand-hero__overlay-brand1"
          aria-hidden="true"
        />

        <div className="men-brand-hero__content-brand1">
          <span className="men-brand-hero__eyebrow-brand1">
            MALIDAG MEN'S COLLECTION
          </span>

          <h2 className="men-brand-hero__title-brand1">
            {t("men_fashion")}
          </h2>

          <p className="men-brand-hero__subtitle-brand1">
            {t("men_fashion_subtitle")}
          </p>

          <span className="men-brand-hero__cta-brand1">
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

export default ThemeForMenFashionBrand1;
