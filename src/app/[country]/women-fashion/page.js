// app/[country]/women-fashion/page.js

import { redirect } from "next/navigation";
import initI18n from "@/components/i18nServer";
import WoFashion from "@/components/woFashion";

export const dynamic = "force-dynamic";

const BASE_URL = "https://web.malidag.com";

const OG_IMAGE =
  "https://cdn.malidag.com/themes/1790434520397-7d89b2f9-476c-498a-bd4d-9eabfea46700.webp";

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
    SEO language comes from the country route.

    /fr -> French
    /gb -> English
    /br -> Brazilian Portuguese
  */
  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const title =
    `${t("women_fashion_title")} | Malidag`;

  const description =
    t("women_fashion_description");

  const keywordsCsv =
    t("women_fashion_keywords") || "";

  const keywords = keywordsCsv
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/women-fashion`;

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
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },

    openGraph: {
      title,
      description,
      url,
      siteName: "Malidag",
      type: "website",
      locale: selectedCountry.locale,

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

export default async function Page({
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

  /*
    Structured data follows the same
    country-specific SEO language.
  */
  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const url =
    `${BASE_URL}/${countryCode}/women-fashion`;

  const countryHome =
    `${BASE_URL}/${countryCode}`;

  const pageName =
    `${t("women_fashion_title")} | Malidag`;

  const description =
    t("women_fashion_description");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",

    name: pageName,
    url,
    description,

    breadcrumb: {
      "@type": "BreadcrumbList",

      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("home"),
          item: countryHome,
        },

        {
          "@type": "ListItem",
          position: 2,
          name: t("women_fashion_title"),
          item: url,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c"),
        }}
      />

      <WoFashion
        countryCode={countryCode}
      />
    </>
  );
}