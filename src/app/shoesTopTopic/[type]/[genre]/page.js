// app/shoesTopTopic/[type]/[genre]/page.js
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import ShoesTopTopic from "@/components/shoesTopTopic";

export const dynamic = "force-dynamic"; // ✅ allow language detection

// ✅ SEO Metadata with i18n
export async function generateMetadata({ params }) {
  const { type, genre } = params;

  // Detect user language
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  // Human-friendly type label
  const typeLabel = type.replace(/-/g, " ");

  // Translated metadata
  const title = `${t(genre)} ${t(typeLabel)} - ${t("shoes_top_title")}`;
  const description = t("shoes_top_description", {
    genre: t(genre),
    type: t(typeLabel),
    defaultValue: `Browse top-selling ${genre} ${typeLabel} shoes with great reviews and discounts.`,
  });

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/shoesTopTopic/${encodeURIComponent(type)}/${encodeURIComponent(genre)}`;
  const ogImage = `${baseUrl}/og/shoes-top.jpg`; // ✅ put in /public/og/

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
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

// ✅ Page
export default function Page({ params }) {
  return <ShoesTopTopic params={params} />;
}
