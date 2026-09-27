import WomenTopTopic from "@/components/womentoptopic";
import initI18n from "@/components/i18nServer";
import { redirect } from "next/navigation";

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
  "https://cdn.malidag.com/themes/1790434520397-7d89b2f9-476c-498a-bd4d-9eabfea46700.webp";

/* =========================================
   HELPERS
========================================= */

/* =========================================
   HELPERS
========================================= */

const getReadableType = (type) => {
  return String(type || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const getTaxonomyKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const translateTaxonomy = (
  value,
  t
) => {
  const readableValue =
    getReadableType(value);

  const key =
    getTaxonomyKey(value);

  return t(key, {
    defaultValue: readableValue,
  });
};

/* =========================================
   SEO METADATA
========================================= */

export async function generateMetadata({
  params,
}) {
  const resolvedParams = await params;

  const countryCode =
    resolvedParams?.country?.toLowerCase();

  const type =
    resolvedParams?.type ||
    "women-fashion";

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

 const translatedType =
  translateTaxonomy(type, t);

const title = t(
  "women_top_topic_title",
  {
    type: translatedType,
  }
);

const description = t(
  "women_top_topic_description",
  {
    type: translatedType,
  }
);

  const translatedKeywords = t(
    "women_top_topic_keywords"
  )
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const canonicalUrl =
    `${BASE_URL}/${countryCode}/women-toptopic/${encodeURIComponent(type)}`;

  return {
    title,
    description,

   keywords: [
  translatedType,
  ...translatedKeywords,
],

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title,
      description,
      url: canonicalUrl,
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

    robots: {
      index: true,
      follow: true,
    },
  };
}

/* =========================================
   PAGE
========================================= */

export default async function Page({
  params,
}) {
  const resolvedParams = await params;

  const countryCode =
    resolvedParams?.country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    redirect("/");
  }

  return (
    <WomenTopTopic
      params={resolvedParams}
    />
  );
}