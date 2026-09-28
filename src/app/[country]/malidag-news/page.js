// app/[country]/malidag-news/page.js

import initI18n from "@/components/i18nServer";
import MalidagNews from "@/components/malidagNews";

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
    i18n.t("malidag_news_seo_title");

  const description =
    i18n.t("malidag_news_seo_description");

  const keywordsCsv =
    i18n.t("malidag_news_seo_keywords") || "";

  const keywords = keywordsCsv
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/malidag-news`;

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
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    return null;
  }

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const title =
    i18n.t("malidag_news_seo_title");

  const description =
    i18n.t("malidag_news_seo_description");

  const url =
    `${BASE_URL}/${countryCode}/malidag-news`;

  const jsonLd = {
    "@context": "https://schema.org",

    "@type": "WebPage",

    name: title,
    description,
    url,

    isPartOf: {
      "@type": "WebSite",
      name: "Malidag",
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLd
          ).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <MalidagNews />
    </>
  );
}