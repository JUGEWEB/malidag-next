import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import ReviewPage from "@/components/reviewPage";
import { getReviewsForProductId } from "../../../../../lib/reviews";
import clientPromise from "../../../../../lib/mongodb.js";

export const revalidate = 60; // ISR

// -----------------
// Metadata
// -----------------
export async function generateMetadata({ params }) {
  const { id } = params;
  const headersList = headers();
  const acceptLanguage = headersList.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0];
  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const reviewsData = await getReviewsForProductId(id);

  // 🔑 also fetch product doc for image
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const product = await db.collection("products").findOne({ id });

  const image =
    product?.item?.images?.[0] || "https://malidag.com/default-share-image.png";

  const title = reviewsData.itemName
    ? `${reviewsData.itemName} Reviews | Malidag`
    : t("product_reviews_title");

  const description = reviewsData.itemName
    ? `Read verified reviews for ${reviewsData.itemName} — ${reviewsData.count} ratings, average ${reviewsData.avg} stars.`
    : t("product_reviews_description");

  return {
    title,
    description,
    alternates: {
      canonical: `https://malidag.com/product/${id}/review`,
    },
    openGraph: {
      title,
      description,
      images: [image],
      url: `https://malidag.com/product/${id}/review`,
      siteName: "Malidag",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// -----------------
// Page
// -----------------
export default async function ReviewRoute({ params }) {
  const { id } = params;

  const reviewsData = await getReviewsForProductId(id);

  // also fetch product (for name + image)
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const product = await db.collection("products").findOne({ id });

  // ✅ strip _id before passing to client
  const safeReviews = (reviewsData.reviews || []).map((r) => ({
    name: r.name,
    rating: r.rating,
    comment: r.comment,
  }));

  const reviewJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: reviewsData.itemName,
    image: product?.item?.images || [],
    aggregateRating: reviewsData.count
      ? {
          "@type": "AggregateRating",
          ratingValue: String(reviewsData.avg),
          reviewCount: String(reviewsData.count),
        }
      : undefined,
    review: safeReviews.slice(0, 20).map((r) => ({
      "@type": "Review",
      reviewBody: r.comment,
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.rating),
      },
      author: {
        "@type": "Person",
        name: r.name,
      },
    })),
  };

  return (
    <>
      {/* ✅ JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
      />
      <ReviewPage
        productId={product.itemId}
        product={product?.item}
        reviews={safeReviews}   // ✅ safe reviews only
        avg={reviewsData.avg}
        count={reviewsData.count}
        itemName={reviewsData.itemName}
      />
    </>
  );
}
