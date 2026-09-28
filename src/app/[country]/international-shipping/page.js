// app/[country]/international-shipping/page.js

import initI18n from "@/components/i18nServer";
import InternationalShipping from "@/components/internationnalShipping";

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
    i18n.t("intl_ship_title");

  const description =
    i18n.t("intl_ship_desc");

  const keywordsCsv =
    i18n.t("intl_ship_keywords") || "";

  const keywords = keywordsCsv
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/international-shipping`;

  /*
    Keep this only if the image exists
    at this exact production URL.
  */
  const ogImage =
    `${BASE_URL}/og/international-shipping.jpg`;

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

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    return null;
  }

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const url =
    `${BASE_URL}/${countryCode}/international-shipping`;

  const countryHome =
    `${BASE_URL}/${countryCode}`;

  const title =
    t("intl_ship_title");

  const description =
    t("intl_ship_desc");

  const jsonLd = [
    {
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
    },

    {
      "@context": "https://schema.org",

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
          name: t(
            "international_shipping"
          ),
          item: url,
        },
      ],
    },
  ];

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

      <InternationalShipping />
    </>
  );
}