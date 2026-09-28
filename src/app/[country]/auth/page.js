import AuthForm from "@/components/AuthForm";
import initI18n from "@/components/i18nServer";
import { notFound } from "next/navigation";

const SUPPORTED_COUNTRIES = {
  fr: {
    seoLanguage: "fr",
  },

  gb: {
    seoLanguage: "en",
  },

  br: {
    seoLanguage: "br",
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

  return {
    title: i18n.t("auth_seo_title"),

    description: i18n.t(
      "auth_seo_description"
    ),

    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AuthPage({
  params,
}) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  if (!SUPPORTED_COUNTRIES[countryCode]) {
    notFound();
  }

  return <AuthForm />;
}