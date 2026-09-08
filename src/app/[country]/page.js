import { headers } from "next/headers";
import { redirect } from "next/navigation";
import initI18n from "@/components/i18nServer";
import Malidag from "@/components/malidag";

const BASE_URL = "https://web.malidag.com";

const SUPPORTED_COUNTRIES = {
  fr: {
    name: "France",
    code: "fr",
    flag: "https://flagcdn.com/w320/fr.png",
  },

  gb: {
    name: "United Kingdom",
    code: "gb",
    flag: "https://flagcdn.com/w320/gb.png",
  },

  br: {
    name: "Brazil",
    code: "br",
    flag: "https://flagcdn.com/w320/br.png",
  },
};

// SEO metadata
export async function generateMetadata({ params }) {
  const { country } = await params;

  const countryCode = country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  // Unsupported storefront
  if (!selectedCountry) {
    return {};
  }

  // Browser language controls SEO language
  const h = await headers();

  const acceptLanguage =
    h.get("accept-language") || "en";

  const browserLang =
    acceptLanguage
      .split(",")[0]
      .split("-")[0]
      .toLowerCase();

  const lang =
    browserLang === "pt"
      ? "br"
      : ["en", "fr", "br"].includes(browserLang)
        ? browserLang
        : "en";

  const i18n = await initI18n(lang);

  const title =
    i18n.t("home_title") ||
    "Online Shopping | Malidag";

  const description =
    i18n.t("home_description") ||
    "Discover fashion, electronics, beauty, and more from top brands. Shop securely and easily with Malidag.";

  const keywords =
    i18n.t("home_keywords") ||
    "online shopping, fashion, electronics, beauty, secure shopping, Malidag";

  // Country controls storefront URL
  const countryUrl =
    `${BASE_URL}/${countryCode}`;

  const ogImage = {
    url: `${BASE_URL}/og/home.jpg`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "Malidag Logo – Online Shopping Made Simple",
  };

  const ogLocale =
    lang === "fr"
      ? "fr_FR"
      : lang === "br"
        ? "pt_BR"
        : "en_GB";

  return {
    title,
    description,
    keywords,

    alternates: {
      canonical: countryUrl,
    },

    openGraph: {
      title,
      description,
      url: countryUrl,
      siteName: "Malidag",
      images: [ogImage],
      locale: ogLocale,
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },

    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Malidag",
        url: BASE_URL,
        logo: ogImage.url,
      }),
    },
  };
}

export default async function Page({ params }) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  // Only unsupported country URLs go back to "/"
  if (!selectedCountry) {
    redirect("/");
  }

  return (
    <>
      <h1 className="sr-only">
        Online Shopping | Malidag
      </h1>

      <Malidag view="home" />
    </>
  );
}