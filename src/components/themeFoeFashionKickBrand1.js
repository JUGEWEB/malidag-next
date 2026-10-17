
"use client";

import React, { useContext, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

import { AppContext } from "./appContext";
import { useTranslation } from "react-i18next";

import "./ThemeForFashionKickBrand1.css";

const theme = {
  id: 1,
  theme: "Fashion's kick",
  image:
    "https://cdn.malidag.com/themes/1760454565150-92293723-212a-4179-bfe8-53e9d9c40c5b.webp",
};

const ThemeForFashionKickBrand1 = () => {
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
      className="fashion-kick-hero-brand1"
      aria-label={t("fashion_kick")}
    >
      <Link
        href={withCountry("/fashionkick")}
        className="fashion-kick-hero__link-brand1"
      >
        <Image
          src={theme.image}
          alt={theme.theme}
          fill
          priority
          quality={75}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="fashion-kick-hero__image-brand1"
        />

        <div
          className="fashion-kick-hero__overlay-brand1"
          aria-hidden="true"
        />

        <div className="fashion-kick-hero__content-brand1">
          <span className="fashion-kick-hero__eyebrow-brand1">
            MALIDAG FASHION COLLECTION
          </span>

          <h2 className="fashion-kick-hero__title-brand1">
            {t("fashion_kick")}
          </h2>

          <p className="fashion-kick-hero__subtitle-brand1">
            {t("fashion_kick_subtitle")}
          </p>

          <span className="fashion-kick-hero__cta-brand1">
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

export default ThemeForFashionKickBrand1;
