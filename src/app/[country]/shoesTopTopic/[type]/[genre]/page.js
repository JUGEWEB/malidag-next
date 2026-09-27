import { redirect } from "next/navigation";
import initI18n from "@/components/i18nServer";
import ShoesTopTopic from "@/components/shoesTopTopic";

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

/* =========================================
   TAXONOMY HELPERS
========================================= */

const getReadableValue = (value) => {
  return String(value || "")
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

const translateTaxonomy = (value, t) => {
  const readableValue =
    getReadableValue(value);

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
  const {
    country,
    type,
    genre,
  } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    return {};
  }

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  /*
    Keep raw taxonomy in the URL,
    translate only the visible SEO text.
  */

  const translatedType =
    translateTaxonomy(type, t);

  const translatedGenre =
    translateTaxonomy(genre, t);

  const title = t("shoes_top_title", {
    genre: translatedGenre,
    type: translatedType,
  });

  const description = t(
    "shoes_top_description",
    {
      genre: translatedGenre,
      type: translatedType,
    }
  );

  const url =
    `${BASE_URL}/${countryCode}/shoesTopTopic/${encodeURIComponent(type)}/${encodeURIComponent(genre)}`;

  return {
    title,
    description,

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
      type: "website",
      locale: selectedCountry.locale,
    },

    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/* =========================================
   PAGE
========================================= */

export default async function Page({
  params,
}) {
  const resolvedParams =
    await params;

  const countryCode =
    resolvedParams.country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    redirect("/");
  }

  return (
    <ShoesTopTopic
      params={resolvedParams}
    />
  );
}