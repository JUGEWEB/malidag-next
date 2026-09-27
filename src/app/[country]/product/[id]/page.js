import { cache } from "react";
import { notFound } from "next/navigation";

import ProductDetails from "@/components/itemLastPage.js";
import initI18n from "@/components/i18nServer";
import clientPromise from "../../../../../lib/mongodb";

export const revalidate = 60;

const BASE_URL = "https://web.malidag.com";
const API_URL = "https://api.malidag.com";

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

/* =========================================
   HELPERS
========================================= */

const norm = (value) =>
  value == null ? null : String(value);

const cleanDescription = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
};

/* =========================================
   PRODUCT
========================================= */

const findProduct = cache(
  async (idParam) => {
    const wanted = norm(
      decodeURIComponent(idParam)
    );

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB
    );

    const product = await db
      .collection("products")
      .findOne({
        id: wanted,
      });

    if (!product) {
      return null;
    }

    const { _id, ...rest } = product;

    return rest;
  }
);

/* =========================================
   PRODUCT TRANSLATION
========================================= */

const getProductTranslation = cache(
  async (itemId, lang) => {
    /*
      English is the original product language,
      so no translation request is needed.
    */

    if (
      lang === "en" ||
      !itemId
    ) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL}/translate/product/translate/${encodeURIComponent(
          itemId
        )}/${encodeURIComponent(lang)}`,
        {
          next: {
            revalidate: 3600,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Product translation request failed:",
          response.status
        );

        return null;
      }

      const data =
        await response.json();

      return data?.translation || null;
    } catch (error) {
      console.error(
        "Product SEO translation error:",
        error
      );

      return null;
    }
  }
);

/* =========================================
   PRODUCT SEO DATA
========================================= */

async function getProductSeo(
  product,
  lang
) {
  const translation =
    await getProductTranslation(
      product.itemId,
      lang
    );

  const name =
    translation?.name ||
    product.item?.name ||
    "Product";

  const description =
    cleanDescription(
      translation?.text ||
      product.item?.description ||
      product.item?.text ||
      ""
    );

  return {
    name,
    description,
  };
}

/* =========================================
   METADATA
========================================= */

export async function generateMetadata({
  params,
}) {
  const {
    country,
    id,
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

  try {
    const product =
      await findProduct(id);

    if (!product) {
      return {
        title:
          `${t("product_not_found")} | Malidag`,

        description:
          t("default_product_description"),

        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const {
      name,
      description,
    } = await getProductSeo(
      product,
      selectedCountry.seoLanguage
    );

    const url =
      `${BASE_URL}/${countryCode}/product/${encodeURIComponent(
        product.id
      )}`;

    const image =
      product.item?.images?.[0] ||
      `${BASE_URL}/og/malidag.png`;

    const title =
      `${name} | Malidag`;

    return {
      title,
      description,

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
        locale:
          selectedCountry.locale,

        images: [
          {
            url: image,
            alt: name,
          },
        ],
      },

      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch (error) {
    console.error(
      "Metadata generation error:",
      error
    );

    return {
      title: "Malidag",

      description:
        t("default_product_description"),
    };
  }
}

/* =========================================
   PAGE
========================================= */

export default async function Page({
  params,
}) {
  const {
    country,
    id,
  } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    notFound();
  }

  let product = null;

  try {
    product =
      await findProduct(id);
  } catch (error) {
    console.error(
      "Page fetch error (MongoDB):",
      error
    );
  }

  if (!product) {
    notFound();
  }

  const {
    name,
    description,
  } = await getProductSeo(
    product,
    selectedCountry.seoLanguage
  );

  const url =
    `${BASE_URL}/${countryCode}/product/${encodeURIComponent(
      product.id
    )}`;

  const images =
    product.item?.images?.length
      ? product.item.images
      : [
          `${BASE_URL}/og/malidag.png`,
        ];

  const price =
    Number(product.item?.usdPrice);

  /* =========================================
     PRODUCT STRUCTURED DATA
  ========================================= */

  const jsonLd = {
    "@context":
      "https://schema.org",

    "@type":
      "Product",

    name,

    image:
      images,

    description,

    sku:
      product.itemId,

    ...(product.item?.brand && {
      brand: {
        "@type": "Brand",
        name:
          product.item.brand,
      },
    }),

    ...(Number.isFinite(price) &&
      price > 0 && {
        offers: {
          "@type": "Offer",

          url,

          priceCurrency:
            "USD",

          price:
            price.toFixed(2),

          availability:
            "https://schema.org/InStock",
        },
      }),
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

      <ProductDetails
        product={product}
      />
    </>
  );
}