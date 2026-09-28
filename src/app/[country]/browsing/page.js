import Browsing from "@/components/basedbrowsing";
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
    i18n.t("browsing_history_seo_title");

  const description =
    i18n.t(
      "browsing_history_seo_description"
    );

  const url =
    `${BASE_URL}/${countryCode}/browsing-history`;

  return {
    title,
    description,

    alternates: {
      canonical: url,
    },

    robots: {
      index: false,
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
    return null;
  }

  return (
    <Browsing
      countryCode={countryCode}
    />
  );
}