import About from "@/components/About";
import initI18n from "@/components/i18nServer";
import { notFound } from "next/navigation";

const BASE_URL = "https://web.malidag.com";

const SUPPORTED_COUNTRIES = {
  fr: {
    seoLanguage: "fr",
    locale: "fr_FR",
  },

  gb: {
    seoLanguage: "en",
    locale: "en_GB",
  },

  br: {
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
    i18n.t("about_seo_title");

  const description =
    i18n.t("about_seo_description");

  const url =
    `${BASE_URL}/${countryCode}/about-us`;

  return {
    title,
    description,

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
    notFound();
  }

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const url =
    `${BASE_URL}/${countryCode}/about`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: t("about_title"),
      description: t(
        "about_seo_description"
      ),
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
          item:
            `${BASE_URL}/${countryCode}`,
        },

        {
          "@type": "ListItem",
          position: 2,
          name: t("about_title"),
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
          ).replace(/</g, "\\u003c"),
        }}
      />

      <About />
    </>
  );
}