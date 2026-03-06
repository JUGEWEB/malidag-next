// app/itemOfHome/page.js
import ItemOfHome from "@/components/itemOfHome";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic"; // allow headers() in metadata

export async function generateMetadata({ params }) {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

   const { itemClicked } = params;
  const translatedItem = t(itemClicked, { defaultValue: itemClicked });

  const url = `https://www.malidag.com/itemOfHome?itemClicked=${encodeURIComponent(
    itemClicked
  )}`;
  const ogImage = "https://web.malidag.com/og/home-kitchen.jpg";

  return {
    title: `${t("malidag")} ${translatedItem} - ${t("explore_home_kitchen")}`,
    description: `${t("browse_high_quality")} ${translatedItem} ${t("home_kitchen_description")}`,
    keywords: [
      translatedItem,
      "home",
      "kitchen",
      t("home_appliances"),
      t("kitchen_products"),
      "crypto shopping",
      "USD shopping",
      "Malidag",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${t("malidag")} ${translatedItem}`,
      description: `${t("discover_products")} ${translatedItem} ${t("home_kitchen_discover")}`,
      url,
      siteName: "Malidag",
      locale: lang,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${t("malidag")} ${t("home_kitchen")}` }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("malidag")} ${translatedItem}`,
      description: `${t("find_top_rated")} ${translatedItem} ${t("home_items")}`,
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
  const { itemClicked } = params;
  return <ItemOfHome itemClicked={itemClicked} />;
}
