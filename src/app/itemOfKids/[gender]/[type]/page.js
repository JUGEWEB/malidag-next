// app/itemOfKids/[gender]/[type]/page.js
import ItemOfKids from "@/components/itemOfKids";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic"; // required for headers()

export async function generateMetadata({ params }) {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const gender = params.gender || "kids";
  const type = params.type || "clothing";

  const translatedGender = t(gender, { defaultValue: gender });
  const translatedType = t(type, { defaultValue: type });

  const url = `https://www.malidag.com/itemOfKids/${encodeURIComponent(gender)}/${encodeURIComponent(type)}`;
  const ogImage = "https://www.malidag.com/images/og/kids-default.jpg";

  return {
    title: `${t("malidag")} ${translatedGender} ${translatedType} - ${t("explore_top_kids_products")}`,
    description: `${t("discover_best")} ${translatedType} ${t("items_for")} ${translatedGender} ${t("on_malidag_compare")}`,
    keywords: [
      translatedGender,
      translatedType,
      "kids",
      "crypto shopping",
      "USD shopping",
      t("online_marketplace"),
      t("reviews"),
      "Malidag",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${t("malidag_kids")} - ${translatedGender} ${translatedType}`,
      description: `${t("browse")} ${translatedType} ${t("items_for")} ${translatedGender} ${t("with_crypto_reviews")}`,
      url,
      siteName: "Malidag",
      locale: lang,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${t("malidag_kids_collection")}`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("malidag")} - ${translatedGender} ${translatedType} ${t("kids_items")}`,
      description: `${t("crypto_shopping_for")} ${translatedGender} ${translatedType} ${t("on_malidag")}`,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  };
}

export default function Page({ params }) {
  const { gender = "kids", type = "clothing" } = params;
  return <ItemOfKids gender={gender} type={type} />;
}
