import initI18n from "@/components/i18nServer";
import { notFound } from "next/navigation";

import Theme1 from "@/components/Brands/Theme1/Theme1";
import Theme2 from "@/components/Brands/theme2/theme2";
import Theme3 from "@/components/Brands/theme3/theme3";

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

const THEMES = {
  theme1: Theme1,
  theme2: Theme2,
  theme3: Theme3,
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { country, themeRoute, brandName } =
    await params;

  const countryCode = country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (
    !selectedCountry ||
    !THEMES[themeRoute] ||
    !brandName?.trim()
  ) {
    notFound();
  }

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const url =
    `${BASE_URL}/${countryCode}/brand/` +
    `${encodeURIComponent(themeRoute)}/` +
    `${encodeURIComponent(brandName)}`;

  const title = t("brand_meta_title", {
    brand: brandName,
  });

  const description = t("brand_meta_description", {
    brand: brandName,
  });

  const ogTitle = t("brand_og_title", {
    brand: brandName,
  });

  const ogDescription = t("brand_og_description", {
    brand: brandName,
  });

  return {
    title,
    description,

    keywords: [
      brandName,
      `${brandName} products`,
      "Malidag",
    ],

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
      title: ogTitle,
      description: ogDescription,
      url,
      siteName: "Malidag",
      locale: selectedCountry.locale,
      type: "website",
    },

    twitter: {
      card: "summary",
      title: t("brand_twitter_title", {
        brand: brandName,
      }),
      description: t("brand_twitter_description", {
        brand: brandName,
      }),
    },
  };
}

export default async function Page({ params }) {
  const { country, themeRoute, brandName } =
    await params;

  const countryCode = country?.toLowerCase();

  if (
    !SUPPORTED_COUNTRIES[countryCode] ||
    !THEMES[themeRoute] ||
    !brandName?.trim()
  ) {
    notFound();
  }

  const BrandTheme = THEMES[themeRoute];

  return (
    <BrandTheme
      brandName={brandName}
    />
  );
}