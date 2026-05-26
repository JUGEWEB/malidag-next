import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import TypePage from "@/components/typePage.js";

export const dynamic = "force-dynamic";

// ✅ SEO Metadata with translations
export async function generateMetadata() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("new_products_title", { defaultValue: "New Product Arrivals" })} | Malidag`;
  const description = t("new_products_description", {
    defaultValue:
      "Discover the newest items added in the last 60 days. Shop by type, explore trending categories.",
  });

  const baseUrl = "https://www.malidag.com";
  const url = `${baseUrl}/type-page`;
  const ogImage = `${baseUrl}/og/new-arrivals.jpg`;

  const keywordsCsv =
    t("new_products_keywords", {
      defaultValue:
        "new products, latest items, new arrivals, product deals, product shopping, shop by type, digital goods",
    }) || "";
  const keywords = keywordsCsv.split(",").map((k) => k.trim()).filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Malidag",
      locale: lang,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ✅ Page
export default function TypePageWrapper() {
  return <TypePage />;
}