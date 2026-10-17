
"use client";

import React, { useContext } from "react";
import Image from "next/image";
import Link from "next/link";

import { AppContext } from "./appContext";
import { useTranslation } from "react-i18next";

import "./ThemeForMenFashion.css";

const theme = {
  id: 2,
  theme: "Men fashion",
  image:
    "https://cdn.malidag.com/themes/1760454633076-72b7665a-bdb7-4f07-b388-aa5ca6219345.webp",
};

const ThemeForMenFashion = () => {
  const { t } = useTranslation();
  const { country } = useContext(AppContext);

  const countryCode = country?.code;

  const href = countryCode
    ? `/${countryCode}/men-fashion`
    : "/men-fashion";

  return (
    <article className="men-fashion-card">
      <Link
        href={href}
        className="men-fashion-card__link"
        aria-label={t("men_fashion")}
      >
        <div className="men-fashion-card__image-wrap">
          <Image
            src={theme.image}
            alt={theme.theme}
            fill
            quality={75}
            sizes="(max-width: 480px) 82vw, 270px"
            className="men-fashion-card__image"
          />

          <span className="men-fashion-card__badge">
            MALIDAG STYLE
          </span>
        </div>

        <div className="men-fashion-card__content">
          <span className="men-fashion-card__eyebrow">
            THE COLLECTION
          </span>

          <h3 className="men-fashion-card__title">
            {t("men_fashion")}
          </h3>

          <span className="men-fashion-card__cta">
            {t("explore_now")}

            <svg
              width="17"
              height="17"
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
    </article>
  );
};

export default ThemeForMenFashion;
