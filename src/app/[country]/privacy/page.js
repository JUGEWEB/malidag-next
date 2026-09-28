import { notFound } from "next/navigation";
import initI18n from "@/components/i18nServer";
import PrivacyPolicy from "@/components/PrivacyPolicy";

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

export async function generateMetadata({ params }) {
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
    i18n.t("privacy_seo_title");

  const description =
    i18n.t("privacy_seo_description");

  const url =
    `${BASE_URL}/${countryCode}/privacy`;

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

  if (!SUPPORTED_COUNTRIES[countryCode]) {
    notFound();
  }

  return <PrivacyPolicy />;
}