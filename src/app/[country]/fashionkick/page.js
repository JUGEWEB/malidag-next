import FashionKick from "@/components/fashionkick";
import initI18n from "@/components/i18nServer";

const API_URL = "https://api.malidag.com";
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
    i18n.t("fashionkick_title");

  const description =
    i18n.t("fashionkick_description");

  const keywordsCsv =
    i18n.t("fashionkick_keywords") || "";

  const keywords = keywordsCsv
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/fashionkick`;

  /*
    Keep only if this exact image exists
    on web.malidag.com.
  */
  const ogImage =
    `${BASE_URL}/og/malidag.png`;

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
      locale: selectedCountry.locale,
      type: "website",

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
      `${API_URL}/categories/FashionKick`,
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

  const items =
    Array.isArray(itemsData?.items)
      ? itemsData.items
      : Array.isArray(itemsData)
        ? itemsData
        : [];

  /*
    FashionKick currently means:
    - shoes
    - 100+ sold
  */
  const filteredData =
    items.filter((item) => {
      const category = String(
        item?.category || ""
      )
        .toLowerCase()
        .trim();

      const sold =
        Number(
          item?.item?.sold || 0
        );

      return (
        category === "shoes" &&
        sold >= 100
      );
    });

  const types =
    filteredData.reduce(
      (acc, item) => {
        const type =
          item?.item?.type ||
          "Other";

        const genre =
          item?.item?.genre ||
          "General";

        if (!acc[type]) {
          acc[type] = {};
        }

        if (!acc[type][genre]) {
          acc[type][genre] = {
            genre,
            items: [],
          };
        }

        if (
          acc[type][genre].items.length <
          10
        ) {
          acc[type][genre].items.push({
            id: item.id,
            itemId: item.itemId,
            item: item.item,
          });
        }

        return acc;
      },
      {}
    );

  return {
    mtypes,
    types,
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

  const {
    mtypes,
    types,
  } = await getData(countryCode);

  return (
    <FashionKick
      initialMTypes={mtypes}
      initialTypes={types}
    />
  );
}