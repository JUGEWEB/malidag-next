import { headers } from "next/headers";
import initI18n from "@/components/i18nServer"; 
import ItemOfPetCare from "@/components/itemOfPetCare";

export const dynamic = "force-dynamic"; // ✅ allow dynamic metadata per request

// ✅ SEO Metadata with translations
export async function generateMetadata({ params }) {
  const { gender, type } = params;

  // detect language
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  // i18n instance
  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  // translate static words + type/gender separately
  const title = `${t("buy")} ${t(type)} ${t("for")} ${t(gender)} | Malidag`;

  const description = `${t("petcare_item_description_prefix")} ${t(type)} ${t("petcare_item_description_connector")} ${t(gender)}. ${t("petcare_item_description_suffix")}`;

  const baseUrl = "https://www.malidag.com";
  const url = `${baseUrl}/petcare/${gender}/${type}`;
  const image = `https://api.malidag.com/og/petcare.jpg`;

  const keywordsCsv = `${t(type)}, ${t(gender)}, ${t("petcare_item_keywords_static")}`;
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
      locale: lang,
      type: "website",
      images: [{ url: image, width: 800, height: 600, alt: `${t(type)} ${t("petcare_item_title_connector")} ${t(gender)}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ✅ Page
export default function Page({ params }) {
  return <ItemOfPetCare params={params} />;
}

