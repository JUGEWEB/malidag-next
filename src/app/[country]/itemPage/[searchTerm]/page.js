// app/[country]/itemPage/[searchTerm]/page.js

import ItemPage from "@/components/itemPage";
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

const cleanSearchValue = (value) => {
  return String(value || "")
    .replace(/[-+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export async function generateMetadata({
  params,
  searchParams,
}) {
  const {
    country,
    searchTerm,
  } = await params;

  const query = await searchParams;

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

  /*
    searchTerm = canonical English lookup term
    q          = localized customer-facing term
  */

  const canonicalSearchTerm =
    cleanSearchValue(
      decodeURIComponent(
        searchTerm || ""
      )
    );

  const localizedQuery =
    cleanSearchValue(
      query?.q
        ? decodeURIComponent(query.q)
        : ""
    );

  /*
    Prefer q for what the customer searched.

    Fall back to translating the canonical
    English term when q isn't present.
  */
  const displaySearch =
    localizedQuery ||
    i18n.t(
      canonicalSearchTerm
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_"),
      {
        defaultValue:
          canonicalSearchTerm,
      }
    );

  const title = i18n.t(
    "search_results_seo_title",
    {
      term: displaySearch,
    }
  );

  const description = i18n.t(
    "search_results_seo_description",
    {
      term: displaySearch,
    }
  );

  /*
    Deliberately exclude ?q= from canonical.

    q is presentation/search context.
    searchTerm identifies the result set.
  */
  const url =
    `${BASE_URL}/${countryCode}/itemPage/${encodeURIComponent(
      searchTerm
    )}`;

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
  searchParams,
}) {
  const {
    country,
    searchTerm,
  } = await params;

  const query = await searchParams;

  const countryCode =
    country?.toLowerCase();

  if (!SUPPORTED_COUNTRIES[countryCode]) {
    return null;
  }

  const localizedQuery =
    query?.q
      ? decodeURIComponent(query.q)
      : "";

  return (
    <ItemPage
      searchTerm={searchTerm}
      q={localizedQuery}
    />
  );
}