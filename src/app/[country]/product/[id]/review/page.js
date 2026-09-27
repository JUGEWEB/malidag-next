import { cache } from "react";
import { notFound } from "next/navigation";

import initI18n from "@/components/i18nServer";
import ReviewPage from "@/components/reviewPage";
import { getReviewsForProductId } from "../../../../../../lib/reviews";
import clientPromise from "../../../../../../lib/mongodb.js";

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
   PRODUCT
========================================= */

const findProduct = cache(
  async (idParam) => {
    const id = decodeURIComponent(
      String(idParam || "")
    );

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB
    );

    const product = await db
      .collection("products")
      .findOne({
        id,
      });

    if (!product) {
      return null;
    }

    const { _id, ...rest } = product;

    return rest;
  }
);

/* =========================================
   REVIEWS
========================================= */

const getProductReviews = cache(
  async (id) => {
    return getReviewsForProductId(id);
  }
);

/* =========================================
   PRODUCT TRANSLATION
========================================= */

const getProductTranslation = cache(
  async (itemId, lang) => {
    /*
      English is the original product language.
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
          "Review product translation failed:",
          response.status
        );

        return null;
      }

      const data =
        await response.json();

      return data?.translation || null;
    } catch (error) {
      console.error(
        "Review product translation error:",
        error
      );

      return null;
    }
  }
);

/* =========================================
   LOCALIZED PRODUCT NAME
========================================= */

async function getLocalizedProductName(
  product,
  reviewsData,
  lang
) {
  const translation =
    await getProductTranslation(
      product?.itemId,
      lang
    );

  return (
    translation?.name ||
    reviewsData?.itemName ||
    product?.item?.name ||
    "Product"
  );
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
    const [
      product,
      reviewsData,
    ] = await Promise.all([
      findProduct(id),
      getProductReviews(id),
    ]);

    if (!product) {
      return {
        title:
          `${t("product_not_found")} | Malidag`,

        description:
          t("product_reviews_description"),

        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const itemName =
      await getLocalizedProductName(
        product,
        reviewsData,
        selectedCountry.seoLanguage
      );

    const title =
      t("product_reviews_seo_title", {
        product: itemName,
      });

    const description =
      t(
        "product_reviews_seo_description",
        {
          product: itemName,
          count: reviewsData?.count || 0,
          avg: reviewsData?.avg || 0,
        }
      );

    const url =
      `${BASE_URL}/${countryCode}/product/${encodeURIComponent(
        product.id
      )}/review`;

    const image =
      product.item?.images?.[0] ||
      `${BASE_URL}/og/malidag.png`;

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
            alt: itemName,
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
      "Review metadata error:",
      error
    );

    return {
      title:
        `${t("product_reviews_title")} | Malidag`,

      description:
        t("product_reviews_description"),
    };
  }
}

/* =========================================
   PAGE
========================================= */

export default async function ReviewRoute({
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

  const [
    reviewsData,
    product,
  ] = await Promise.all([
    getProductReviews(id),
    findProduct(id),
  ]);

  if (!product) {
    notFound();
  }

  const itemName =
    await getLocalizedProductName(
      product,
      reviewsData,
      selectedCountry.seoLanguage
    );

  const safeReviews =
    (reviewsData?.reviews || [])
      .map((review) => ({
        name: review.name,
        rating: Number(review.rating),
        comment: review.comment,
      }))
      .filter(
        (review) =>
          review.name &&
          review.comment &&
          Number.isFinite(review.rating)
      );

  const count =
    Number(reviewsData?.count) || 0;

  const avg =
    Number(reviewsData?.avg) || 0;

  const productUrl =
    `${BASE_URL}/${countryCode}/product/${encodeURIComponent(
      product.id
    )}`;

  /* =========================================
     REVIEW STRUCTURED DATA
  ========================================= */

  const reviewJsonLd = {
    "@context":
      "https://schema.org",

    "@type":
      "Product",

    name:
      itemName,

    url:
      productUrl,

    image:
      product.item?.images || [],

    sku:
      product.itemId,

    ...(count > 0 &&
      avg > 0 && {
        aggregateRating: {
          "@type":
            "AggregateRating",

          ratingValue:
            avg,

          reviewCount:
            count,
        },
      }),

    ...(safeReviews.length > 0 && {
      review: safeReviews
        .slice(0, 20)
        .map((review) => ({
          "@type":
            "Review",

          reviewBody:
            review.comment,

          reviewRating: {
            "@type":
              "Rating",

            ratingValue:
              review.rating,

            bestRating:
              5,

            worstRating:
              1,
          },

          author: {
            "@type":
              "Person",

            name:
              review.name,
          },
        })),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            reviewJsonLd
          ).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <ReviewPage
        productId={
          product.itemId
        }

        product={{
          ...product.item,
          id: product.id,
          itemId:
            product.itemId,
        }}

        reviews={
          safeReviews
        }

        avg={
          avg
        }

        count={
          count
        }

        itemName={
          reviewsData?.itemName ||
          product.item?.name
        }
      />
    </>
  );
}