
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import "./ThemeForMenFashion2.css";

const ThemeForMenFashion2 = () => {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await axios.get(
          "https://api.malidag.com/themes/"
        );

        const allThemes = res.data?.themes || [];

        const selected = allThemes.find(
          (item) => item.theme === "Men fashion"
        );

        if (selected) {
          setTheme(selected);
        }
      } catch (error) {
        console.error("Error fetching men's fashion theme:", error);
      }
    };

    fetchTheme();
  }, []);

  if (!theme) return null;

  return (
    <article className="men-fashion2">
      <Link
        href="/men-fashion"
        className="men-fashion2__link"
        aria-label={`Discover ${theme.theme}`}
      >
        <div className="men-fashion2__image-wrapper">
          {theme.image && (
            <Image
              src={theme.image}
              alt={theme.theme}
              fill
              quality={75}
              sizes="(max-width: 480px) 85vw, 270px"
              className="men-fashion2__image"
            />
          )}

          <div
            className="men-fashion2__overlay"
            aria-hidden="true"
          />

          <span className="men-fashion2__badge">
            MALIDAG STYLE
          </span>
        </div>

        <div className="men-fashion2__content">
          <span className="men-fashion2__eyebrow">
            THE COLLECTION
          </span>

          <h3 className="men-fashion2__title">
            {theme.theme}
          </h3>

          <span className="men-fashion2__cta">
            Discover now

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
    </article>
  );
};

export default ThemeForMenFashion2;
