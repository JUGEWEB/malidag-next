// app/[country]/men-fashion/page.js

import initI18n from "@/components/i18nServer";
import MenFashion from "@/components/MenFa";

const API_URL = "https://api.malidag.com";
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

export const dynamic = "force-dynamic";

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
    `${i18n.t("men_fashion_title")} | Malidag`;

  const description =
    i18n.t("men_fashion_description");

  const keywordsCsv =
    i18n.t("men_fashion_keywords") || "";

  const keywords = keywordsCsv
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/men-fashion`;

  const ogImage =
    `${BASE_URL}/og/menFashion.jpg`;

  return {
    title,
    description,
    keywords,

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
      type: "website",
      locale: selectedCountry.locale,

      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getData(countryCode) {
  const [
    categoriesRes,
    itemsRes,
  ] = await Promise.allSettled([
    fetch(
      `${API_URL}/categories/MenFashion`,
      {
        cache: "no-store",
      }
    ),

    fetch(
      `${API_URL}/items?country=${encodeURIComponent(
        countryCode
      )}`,
      {
        cache: "no-store",
      }
    ),
  ]);

  const categoriesOk =
    categoriesRes.status === "fulfilled" &&
    categoriesRes.value.ok;

  const itemsOk =
    itemsRes.status === "fulfilled" &&
    itemsRes.value.ok;

  const categoriesData =
    categoriesOk
      ? await safeJson(categoriesRes.value)
      : [];

  const itemsData =
    itemsOk
      ? await safeJson(itemsRes.value)
      : [];

  const mtypes =
    Array.isArray(categoriesData)
      ? categoriesData
      : [];

  const allItems =
    Array.isArray(itemsData)
      ? itemsData
      : Array.isArray(itemsData?.items)
        ? itemsData.items
        : [];

  const menItems = allItems.filter(
    (item) => {
      const genre = String(
        item?.item?.genre || ""
      )
        .toLowerCase()
        .trim();

      const category = String(
        item?.category || ""
      )
        .toLowerCase()
        .trim();

      const isMen =
        genre === "men" ||
        genre === "man" ||
        genre === "male" ||
        genre === "mens" ||
        genre === "unisex" ||
        genre === "men's";

      return (
        isMen &&
        category !== "beauty"
      );
    }
  );

  const groupedTypes =
    menItems.reduce(
      (acc, item) => {
        const type =
          item?.item?.type || "Other";

        if (!acc[type]) {
          acc[type] = [];
        }

        acc[type].push(item);

        return acc;
      },
      {}
    );

  return {
    mtypes,
    groupedTypes,
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
    return null;
  }

  const [
    { mtypes, groupedTypes },
    i18n,
  ] = await Promise.all([
    getData(countryCode),

    initI18n(
      selectedCountry.seoLanguage
    ),
  ]);

  const pageName =
    i18n.t("men_fashion_title");

  const description =
    i18n.t("men_fashion_description");

  const homeName =
    i18n.t("home");

  const url =
    `${BASE_URL}/${countryCode}/men-fashion`;

  const countryHome =
    `${BASE_URL}/${countryCode}`;

  const jsonLd = {
    "@context": "https://schema.org",

    "@type": "CollectionPage",

    name: pageName,

    url,

    description,

    breadcrumb: {
      "@type": "BreadcrumbList",

      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: homeName,
          item: countryHome,
        },

        {
          "@type": "ListItem",
          position: 2,
          name: pageName,
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
          __html: JSON.stringify(
            jsonLd
          ).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <MenFashion
        mtypes={mtypes}
        groupedTypes={groupedTypes}
        countryCode={countryCode}
      />
    </>
  );
}