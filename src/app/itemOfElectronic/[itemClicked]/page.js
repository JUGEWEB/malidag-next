// app/itemOfElectronic/page.js
import React from "react";
import ItemOfElectronic from "@/components/itemOfElectronic";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export async function generateMetadata({ params }) {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const { itemClicked } = params;
  const translatedItem = t(itemClicked, { defaultValue: itemClicked });

  const baseUrl = "https://www.malidag.com";
  const url = `${baseUrl}/itemOfElectronic?itemClicked=${encodeURIComponent(itemClicked)}`;
  const ogImage = "https://web.malidag.com/og/electronics.jpg";

  return {
    title: `${t("buy")} ${translatedItem} | Malidag Electronics`,
    description: `${t("explore_high_quality")} ${translatedItem} ${t("at_malidag")}`,
    alternates: { canonical: url },
    keywords: [
      translatedItem,
      `${t("best")} ${translatedItem}`,
      "electronics",
      "gadgets",
      "Malidag",
      "buy with crypto",
      "tech deals",
    ],
    openGraph: {
      title: `${t("shop")} ${translatedItem} | Malidag`,
      description: `${t("discover_top_selling")} ${translatedItem} ${t("pay_with_crypto")}`,
      url,
      siteName: "Malidag",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${t("electronics")} - ${translatedItem}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("buy")} ${translatedItem} | Malidag Electronics`,
      description: `${t("explore_high_quality")} ${translatedItem} ${t("and_shop_with_crypto")}`,
      images: [ogImage],
    },
  };
}

export default function Page({ params }) {
  const { itemClicked } = params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Electronics — ${itemClicked} | Malidag`,
    url: `https://www.malidag.com/itemOfElectronic?itemClicked=${encodeURIComponent(itemClicked)}`,
    description: `Browse ${itemClicked} on Malidag with prices, videos, and reviews.`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.malidag.com/" },
        { "@type": "ListItem", position: 2, name: "Electronics", item: "https://www.malidag.com/itemOfElectronic" },
        {
          "@type": "ListItem",
          position: 3,
          name: itemClicked,
          item: `https://www.malidag.com/itemOfElectronic?itemClicked=${encodeURIComponent(itemClicked)}`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ItemOfElectronic itemClicked={itemClicked} />
    </>
  );
}