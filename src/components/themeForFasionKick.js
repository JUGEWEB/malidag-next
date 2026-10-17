
"use client";

import React, { useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppContext } from "./appContext";
import { useTranslation } from "react-i18next";
import "./ThemeForFashionKick.css";

const theme = {
  id: 1,
  theme: "Fashion's kick",
  image:
    "https://cdn.malidag.com/themes/1760454565150-92293723-212a-4179-bfe8-53e9d9c40c5b.webp",
};

const ThemeForFashionKick = () => {
  const { t } = useTranslation();
  const { country } = useContext(AppContext);

  const countryCode = country?.code;
  const href = countryCode
    ? `/${countryCode}/fashionkick`
    : "/fashionkick";

  return (
    <article className="fashion-kick-card">
      <Link
        href={href}
        className="fashion-kick-card__link"
        aria-label={t("fashion_kick")}
      >
        <div className="fashion-kick-card__image-wrap">
          <Image
            src={theme.image}
            alt={theme.theme}
            fill
            quality={75}
            sizes="(max-width: 480px) 82vw, 270px"
            className="fashion-kick-card__image"
          />

          <span className="fashion-kick-card__badge">
            MALIDAG STYLE
          </span>
        </div>

        <div className="fashion-kick-card__content">
          <span className="fashion-kick-card__eyebrow">
            THE COLLECTION
          </span>

          <h3 className="fashion-kick-card__title">
            {t("fashion_kick")}
          </h3>

          <span className="fashion-kick-card__cta">
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

export default ThemeForFashionKick;
