// app/itemOfItems/page.js
import Item from "@/components/itemsOfItem";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const itemClicked = params.itemClicked || "electronics";
  const translatedItem = t(itemClicked, { defaultValue: itemClicked });

  const url = `https://www.malidag.com/itemOfItems/${encodeURIComponent(itemClicked)}`;
  const ogImage = `https://www.malidag.com/images/og/beauty-cover.webp`;

  return {
    title: `${t("malidag")} ${translatedItem} - ${t("shop_with_crypto")}`,
    description: `${t("browse_high_quality")} ${translatedItem} ${t("crypto_pricing_description")}`,
    keywords: [
      translatedItem,
      "crypto shopping",
      "USD shopping",
      t("online_marketplace"),
      t("electronics"),
      t("reviews"),
      "Malidag",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${t("shop")} ${translatedItem} ${t("on_malidag")}`,
      description: `${t("explore")} ${translatedItem} ${t("compare_prices_reviews")}`,
      url,
      siteName: "Malidag",
      locale: lang,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${t("malidag")} - ${translatedItem}`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("malidag")} - ${translatedItem}`,
      description: `${t("top_items")} ${translatedItem} ${t("crypto_payments")}`,
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
  const { itemClicked = "electronics" } = params;
  return <Item itemClicked={itemClicked} />;
}