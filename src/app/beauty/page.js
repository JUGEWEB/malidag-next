import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import PersonalCare from "@/components/persCareFY";
import Head from "next/head";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("beauty_title")} | Malidag`;
  const description = t("beauty_description");

  const url = "https://web.malidag.com/beauty";
  const ogImage = "https://web.malidag.com/og/beauty-cover.webp";
  const ogVideo = "https://web.malidag.com/og/beauty.mp4";

  const keywordsCsv =
    t("beauty_keywords", {
      defaultValue:
        "beauty, skincare, makeup, haircare, fragrance, personal care, cosmetics, organic skincare, luxury beauty, buy beauty products online, global beauty shopping, crypto beauty shopping",
    }) || "";

  const keywords = keywordsCsv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

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
      type: "video.other",
      locale: lang,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      videos: [{ url: ogVideo, width: 1280, height: 720, type: "video/mp4" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BeautyPage() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const url = "https://web.malidag.com/beauty";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Beauty & Personal Care | Malidag",
    url,
    description: "Shop beauty, skincare, makeup, and personal care on Malidag.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://web.malidag.com/" },
        { "@type": "ListItem", position: 2, name: "Beauty", item: url },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PersonalCare lang={lang} />
    </>
  );
}