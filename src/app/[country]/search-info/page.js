import { redirect } from "next/navigation";
import initI18n from "@/components/i18nServer";
import SearchInfoPage from "@/components/SearchInfoPage";

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

/* =========================================
   SEO
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
    `${t("search_info_seo_title")} | Malidag`;

  const description =
    t("search_info_seo_description");

  /*
    IMPORTANT:
    Do NOT include ?q= or ?term= in canonical.
  */
  const url =
    `${BASE_URL}/${countryCode}/search-info`;

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
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  if (!SUPPORTED_COUNTRIES[countryCode]) {
    redirect("/");
  }

  return <SearchInfoPage />;
}