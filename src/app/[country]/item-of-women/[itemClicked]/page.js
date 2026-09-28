import ItemOfWomen from "@/components/itemOfWomen";
import initI18n from "@/components/i18nServer";

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

const getReadableValue = (value) => {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const getTaxonomyKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const translateTaxonomy = (value, t) => {
  const readableValue =
    getReadableValue(value);

  const key =
    getTaxonomyKey(value);

  return t(key, {
    defaultValue: readableValue,
  });
};

export async function generateMetadata({
  params,
}) {
  const {
    country,
    itemClicked,
  } = await params;

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

  /*
    Keep itemClicked in its canonical English
    form for routing/product matching.

    Translate only what users/search engines see.
  */
  const translatedItem =
    translateTaxonomy(
      itemClicked,
      t
    );

  const title = t(
    "women_category_seo_title",
    {
      type: translatedItem,
    }
  );

  const description = t(
    "women_category_seo_description",
    {
      type: translatedItem,
    }
  );

  const keywordsCsv = t(
    "women_category_seo_keywords",
    {
      type: translatedItem,
    }
  );

  const keywords = String(
    keywordsCsv || ""
  )
    .split(",")
    .map((keyword) =>
      keyword.trim()
    )
    .filter(Boolean);

  const url =
    `${BASE_URL}/${countryCode}/item-of-women/${encodeURIComponent(
      itemClicked
    )}`;

  /*
    Keep this only if the image really exists
    in production.
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

export default async function Page({
  params,
}) {
  const {
    country,
    itemClicked,
  } = await params;

  const countryCode =
    country?.toLowerCase();

  if (!SUPPORTED_COUNTRIES[countryCode]) {
    return null;
  }

  return (
    <ItemOfWomen
      countryCode={countryCode}
      itemClicked={itemClicked}
    />
  );
}