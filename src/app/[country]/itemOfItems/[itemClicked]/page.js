// app/[country]/itemOfItems/[itemClicked]/page.js

import Item from "@/components/itemsOfItem";
import initI18n from "@/components/i18nServer";

export const dynamic = "force-dynamic";

const BASE_URL = "https://web.malidag.com";

const SUPPORTED_COUNTRIES = {
  fr: {
    code: "fr",
    seoLanguage: "fr",
    locale: "fr_FR",
  },

  gb: {
    code: "gb",
    seoLanguage: "en",
    locale: "en_GB",
  },

  br: {
    code: "br",
    seoLanguage: "br",
    locale: "pt_BR",
  },
};

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

export async function generateMetadata({
  params,
}) {
  const {
    country,
    itemClicked = "electronics",
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
    itemClicked stays in English for
    routing/product matching.

    Only its presentation is translated.
  */
  const translatedItem =
    translateTaxonomy(
      itemClicked,
      t
    );

  const title = t(
    "items_category_seo_title",
    {
      type: translatedItem,
    }
  );

  const description = t(
    "items_category_seo_description",
    {
      type: translatedItem,
    }
  );

  const keywordsCsv = t(
    "items_category_seo_keywords",
    {
      type: translatedItem,
    }
  );

  const keywords = String(
    keywordsCsv || ""
  )
    .split(",")
    .map((keyword) =>
      keyword.trim()
    )
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/itemOfItems/${encodeURIComponent(
      itemClicked
    )}`;

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
      locale: selectedCountry.locale,
      type: "website",
    },

    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function Page({
  params,
}) {
  const {
    country,
    itemClicked = "electronics",
  } = await params;

  const countryCode =
    country?.toLowerCase();

  if (!SUPPORTED_COUNTRIES[countryCode]) {
    return null;
  }

  return (
    <Item
      countryCode={countryCode}
      itemClicked={itemClicked}
    />
  );
}