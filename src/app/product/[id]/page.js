import ProductDetails from "@/components/itemLastPage.js";
import initI18n from "@/components/i18nServer";
import { headers as nextHeaders } from "next/headers";
import clientPromise from "../../../../lib/mongodb";

export const revalidate = 60;

const norm = (v) => (v == null ? null : String(v));

async function findProduct(idParam) {
  const wanted = norm(decodeURIComponent(idParam));

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const product = await db.collection("products").findOne({ id: wanted });
  if (!product) return null;

  const { _id, ...rest } = product;
  return rest;
}

// -----------------
// Metadata from MongoDB
// -----------------
export async function generateMetadata(context) {
  const params = await context.params;
  const { id } = params;

  const headers = await nextHeaders();
  const acceptLanguage = headers.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18nInstance = await initI18n(lang);
  const translations = i18nInstance.getDataByLanguage(lang)?.translation || {};

  try {
    const product = await findProduct(id);

    if (!product) {
      return {
        title: "Product Not Found | Malidag",
        description: translations.default_product_description || "",
      };
    }

    const title = `${product.item?.name ?? "Product"} | Malidag`;
    const description =
      product.item?.description ||
      product.item?.text ||
      translations.default_product_description ||
      "";
    const image =
      product.item?.images?.[0] || "https://web.malidag.com/malidag.png";

    return {
      title,
      description,
      alternates: {
        canonical: `https://web.malidag.com/product/${encodeURIComponent(product.id)}`,
      },
      openGraph: {
        title,
        description,
        url: `https://web.malidag.com/product/${encodeURIComponent(product.id)}`,
        type: "article",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: product.item?.name ?? "Product image",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
        site: "@malidag",
        creator: "@malidag",
      },
    };
  } catch (err) {
    console.error("Metadata generation error:", err);
    return {
      title: "Product | Malidag",
      description: translations.default_product_description || "",
    };
  }
}

// -----------------
// Page Render
// -----------------
export default async function Page(context) {
  const params = await context.params;
  const { id } = params;

  const headers = await nextHeaders();
  const acceptLanguage = headers.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  await initI18n(lang);

  let product = null;

  try {
    product = await findProduct(id);
  } catch (err) {
    console.error("Page fetch error (MongoDB):", err);
  }

  if (!product) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Product temporarily unavailable</h1>
        <p>We couldn’t load this product right now. Please refresh in a moment.</p>
      </div>
    );
  }

  const image =
    product.item?.images?.[0] || "https://web.malidag.com/malidag.png";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.item?.name,
            image: product.item?.images || [image],
            description: product.item?.description || product.item?.text,
            sku: product.itemId,
            mpn: product.itemId,
            brand: {
              "@type": "Brand",
              name: "Malidag",
            },
            offers: {
              "@type": "Offer",
              url: `https://web.malidag.com/product/${encodeURIComponent(product.id)}`,
              priceCurrency: "USD",
              price: product.item?.usdPrice || "0",
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />
      <ProductDetails product={product} />
    </>
  );
}