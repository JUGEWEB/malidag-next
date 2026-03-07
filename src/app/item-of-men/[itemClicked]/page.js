import ItemOfMen from "@/components/itemOfMen";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export async function generateMetadata({ params }) {
  const { itemClicked } = params;

  // ✅ detect language
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const translatedItem = t(itemClicked, { defaultValue: itemClicked });

  const url = `https://www.malidag.com/item-of-men/${encodeURIComponent(itemClicked)}`;
  const ogImage = "https://web.malidag.com/og/menFashion.jpg";

  return {
    title: `${t("buy")} ${translatedItem} ${t("for_men")} | Malidag`,
    description: `${t("explore_high_quality")} ${translatedItem} ${t("for_men_at_malidag")}`,
    keywords: [
      translatedItem,
      `${t("men_s")} ${translatedItem}`,
      "Malidag fashion",
      "crypto fashion store",
      "buy clothes with cryptocurrency",
      "men clothing",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${t("shop")} ${translatedItem} ${t("for_men")} | Malidag`,
      description: `${t("discover_top_selling")} ${translatedItem} ${t("for_men_pay_crypto")}`,
      url,
      siteName: "Malidag",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${t("men_s")} ${translatedItem} | Malidag`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("buy")} ${translatedItem} ${t("for_men")} | Malidag`,
      description: `${t("explore_high_quality")} ${translatedItem} ${t("and_shop_with_crypto")}`,
      images: [ogImage],
    },
  };
}

export default function Page({ params }) {
  return <ItemOfMen itemClicked={params.itemClicked} />;
}