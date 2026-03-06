// app/women-fashion/page.js
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import WoFashion from "@/components/woFashion";

export const dynamic = "force-dynamic"; // ✅ allow headers in metadata

// ✅ SEO Metadata with translations
export async function generateMetadata() {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("women_fashion_title", { defaultValue: "Women's Fashion" })} | Malidag`;
  const description = t("women_fashion_description", {
    defaultValue:
      "Shop the latest trends in women's fashion including dresses, tops, accessories and more at Malidag.",
  });

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/women-fashion`;
  const ogImage = "https://api.malidag.com/images/1752764163519-steptodown.com980265.webp";

  const keywordsCsv =
    t("women_fashion_keywords", {
      defaultValue:
        "women's fashion, ladies clothes, trendy outfits, online shopping, Malidag fashion, dresses, tops, skirts, pants, affordable fashion",
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
      locale: lang,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Stylish women's fashion banner" }],
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
export default function Page() {
  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/women-fashion`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Women's Fashion | Malidag",
    url,
    description: "Shop premium and affordable women's fashion on Malidag with crypto or USD.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "Women's Fashion", item: url },
      ],
    },
  };

  return (
    <>
      {/* ✅ SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WoFashion />
    </>
  );
}
