// app/itemOfShoes/[itemClicked]/page.js
import ItemOfShoes from "@/components/itemsOfShoes";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const { itemClicked } = await params;

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const translatedItem = t(itemClicked, { defaultValue: itemClicked });

  const url = `https://www.malidag.com/itemOfShoes/${encodeURIComponent(itemClicked)}`;
  const ogImage = "https://www.malidag.com/images/og/shoes-default.jpg";

  return {
    title: `${t("malidag")} ${translatedItem} - ${t("explore_trendy_shoes")}`,
    description: `${t("browse_latest")} ${translatedItem} ${t("crypto_shoes_description")}`,
    keywords: [
      translatedItem,
      "shoes",
      "sneakers",
      "boots",
      "sandals",
      "crypto shopping",
      "USD shopping",
      t("footwear"),
      "Malidag",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${t("malidag")} ${translatedItem}`,
      description: `${t("discover_shoes")} ${translatedItem} ${t("shoes_crypto_discover")}`,
      url,
      siteName: "Malidag",
      locale: lang,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${t("malidag")} ${t("shoes_collection")}`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("malidag")} ${translatedItem}`,
      description: `${t("find_top_rated")} ${translatedItem} ${t("shoes_items")}`,
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

export default async function Page({ params }) {
  const { itemClicked } = await params;
  return <ItemOfShoes itemClicked={itemClicked} />;
}