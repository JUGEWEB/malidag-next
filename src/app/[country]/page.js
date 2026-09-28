import { redirect } from "next/navigation";
import initI18n from "@/components/i18nServer";
import Malidag from "@/components/malidag";

const BASE_URL = "https://web.malidag.com";

const SUPPORTED_COUNTRIES = {
  fr: {
    name: "France",
    code: "fr",
    seoLanguage: "fr",
    locale: "fr_FR",
    flag: "https://flagcdn.com/w320/fr.png",
  },

  gb: {
    name: "United Kingdom",
    code: "gb",
    seoLanguage: "en",
    locale: "en_GB",
    flag: "https://flagcdn.com/w320/gb.png",
  },

  br: {
    name: "Brazil",
    code: "br",
    seoLanguage: "br",
    locale: "pt_BR",
    flag: "https://flagcdn.com/w320/br.png",
  },
};

/* =========================================
   SEO METADATA
========================================= */

export async function generateMetadata({ params }) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  // Unsupported storefront
  if (!selectedCountry) {
    return {};
  }

  /*
    SEO language is controlled by the
    country route — NOT browser language.

    /fr -> French
    /gb -> English
    /br -> Brazilian Portuguese
  */
  const lang =
    selectedCountry.seoLanguage;

  const i18n =
    await initI18n(lang);

  const title =
    i18n.t("home_title");

  const description =
    i18n.t("home_description");

  const keywords =
    i18n.t("home_keywords");

  const countryUrl =
    `${BASE_URL}/${countryCode}`;

  const ogImageUrl =
    `${BASE_URL}/og/malidag.png`;

  const ogImage = {
    url: ogImageUrl,
    width: 1200,
    height: 630,
    type: "image/png",
    alt: title,
  };

  return {
    title,
    description,
    keywords,

   alternates: {
  canonical: countryUrl,

  languages: {
    "fr-FR": `${BASE_URL}/fr`,
    "en-GB": `${BASE_URL}/gb`,
    "pt-BR": `${BASE_URL}/br`,
    "x-default": BASE_URL,
  },
},

    openGraph: {
      title,
      description,
      url: countryUrl,
      siteName: "Malidag",
      images: [ogImage],
      locale: selectedCountry.locale,
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/* =========================================
   PAGE
========================================= */

export default async function Page({ params }) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  // Unsupported country URLs go back to "/"
  if (!selectedCountry) {
    redirect("/");
  }

  /*
    Server-rendered SEO content follows
    the country route as well.
  */
  const i18n =
    await initI18n(
      selectedCountry.seoLanguage
    );

  return (
    <>
      <h1 className="sr-only">
        {i18n.t("home_h1")}
      </h1>

      <Malidag view="home" />
    </>
  );
}