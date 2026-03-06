import ItemOfWomen from "@/components/itemOfWomen";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export async function generateMetadata({ params }) {
  const { itemClicked } = params;

  // ✅ detect language from request
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  // ✅ translate itemClicked (fallback to itself)
  const translatedItem = t(itemClicked, { defaultValue: itemClicked });

  const url = `https://www.malidag.com/item-of-women/${encodeURIComponent(itemClicked)}`;
  const ogImage = "https://web.malidag.com/og/womenFashion.jpg";

  return {
    title: `${t("malidag")} ${translatedItem} - ${t("womens_collection")}`,
    description: `${t("discover_top_rated")} ${translatedItem} ${t("for_women_on_malidag")}`,
    keywords: [
      translatedItem,
      `${t("womens")} ${translatedItem}`,
      "Malidag fashion",
      "crypto fashion store",
      "buy clothes with cryptocurrency",
      "women clothing",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${t("malidag")} ${translatedItem}`,
      description: `${t("shop_the_best")} ${translatedItem} ${t("products_for_women")}`,
      url,
      siteName: "Malidag",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${t("womens")} ${translatedItem} | Malidag`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("shop_womens")} ${translatedItem} | Malidag`,
      description: `${t("discover_womens")} ${translatedItem} ${t("on_malidag")}`,
      images: [ogImage],
    },
  };
}

export default function Page({ params }) {
  return <ItemOfWomen itemClicked={params.itemClicked} />;
}
