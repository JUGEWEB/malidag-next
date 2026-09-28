// app/[country]/fashionPage/page.js

import ItemFashionPage from "@/components/fashionForAllPage";
import initI18n from "@/components/i18nServer";

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

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const title =
    i18n.t("fashion_title");

  const description =
    i18n.t("fashion_description");

  const keywordsCsv =
    i18n.t("fashion_keywords") || "";

  const keywords = keywordsCsv
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/fashionPage`;

  /*
    Keep this only if this exact image
    exists in production.
  */
  const ogImage =
    `${BASE_URL}/og/malidag.png`;

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

      images: [
        {
          url: ogImage,
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
      images: [ogImage],
    },
  };
}

export default async function Page({
  params,
}) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  if (!SUPPORTED_COUNTRIES[countryCode]) {
    return null;
  }

  return (
    <ItemFashionPage
      countryCode={countryCode}
    />
  );
}