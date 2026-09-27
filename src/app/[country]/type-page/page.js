// app/[country]/type-page/page.js

import { redirect } from "next/navigation";
import initI18n from "@/components/i18nServer";
import TypePage from "@/components/typePage.js";

export const dynamic = "force-dynamic";

const BASE_URL = "https://web.malidag.com";

const SUPPORTED_COUNTRIES = {
  fr: {
    name: "France",
    code: "fr",
    seoLanguage: "fr",
    locale: "fr_FR",
  },

  gb: {
    name: "United Kingdom",
    code: "gb",
    seoLanguage: "en",
    locale: "en_GB",
  },

  br: {
    name: "Brazil",
    code: "br",
    seoLanguage: "br",
    locale: "pt_BR",
  },
};

const OG_IMAGE =
  `https://cdn.malidag.com/themes/1790434520397-7d89b2f9-476c-498a-bd4d-9eabfea46700.webp`;

/* =========================================
   SEO METADATA
========================================= */

export async function generateMetadata({
  params,
}) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    return {};
  }

  /*
    SEO language is determined by
    the country route.

    /fr -> French
    /gb -> English
    /br -> Brazilian Portuguese
  */
  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const title =
    `${t("new_products_title")} | Malidag`;

  const description =
    t("new_products_description");

  const keywordsCsv =
    t("new_products_keywords") || "";

  const keywords = keywordsCsv
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/type-page`;

  return {
    title,
    description,
    keywords,

    alternates: {
      canonical: url,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title,
      description,
      url,
      siteName: "Malidag",
      locale: selectedCountry.locale,
      type: "website",

      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

/* =========================================
   PAGE
========================================= */

export default async function TypePageWrapper({
  params,
}) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    redirect("/");
  }

  return (
    <TypePage
      countryCode={countryCode}
    />
  );
}