import { redirect } from "next/navigation";
import initI18n from "@/components/i18nServer";
import SaveBig from "@/components/saveBig";

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

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const title =
    `${t("save_big_seo_title")} | Malidag`;

  const description =
    t("save_big_seo_description");

  const url =
    `${BASE_URL}/${countryCode}/save-big`;

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
   PAGE + STRUCTURED DATA
========================================= */

export default async function SaveBigPage({
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

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const url =
    `${BASE_URL}/${countryCode}/save-big`;

  const countryHome =
    `${BASE_URL}/${countryCode}`;

  const pageName =
    `${t("save_big_seo_title")} | Malidag`;

  const description =
    t("save_big_seo_description");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",

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
          name: t("save_big_seo_title"),
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
          __html: JSON.stringify(jsonLd).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <SaveBig
        countryCode={countryCode}
      />
    </>
  );
}