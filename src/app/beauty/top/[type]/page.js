// app/beauty/top/[type]/page.js
import BeautyTopTopic from "@/components/beautyTopTopic";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { type } = params;
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const translatedType = t(type) || type;

  const title = `${t("top")} ${translatedType} ${t("beauty_items")} | Malidag`;
  const description = `${t("browse_popular")} ${translatedType} ${t("beauty_products")}.`;

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/beauty/top/${encodeURIComponent(type)}`;
  const ogImage = `${baseUrl}/og/beauty-cover.webp`;

  // ✅ localized keywords (with type included)
  const keywordsCsv =
    t("beauty_keywords", {
      defaultValue:
        "beauty, skincare, makeup, haircare, fragrance, personal care, cosmetics, organic skincare, luxury beauty, buy beauty products online, global beauty shopping, crypto beauty shopping",
    }) || "";
  const keywords = [translatedType, ...keywordsCsv.split(",").map(k => k.trim()).filter(Boolean)];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Malidag",
      type: "website",
      locale: lang,
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

export default function Page({ params }) {
  const { type } = params;

  const url = `https://web.malidag.com/beauty/top/${encodeURIComponent(type)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Top ${type} Beauty Items | Malidag`,
    "url": url,
    "description": `Browse popular ${type} beauty products on Malidag.`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://web.malidag.com/" },
        { "@type": "ListItem", "position": 2, "name": "Beauty", "item": "https://web.malidag.com/beauty" },
        { "@type": "ListItem", "position": 3, "name": type, "item": url }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BeautyTopTopic type={type} />
    </>
  );
}
