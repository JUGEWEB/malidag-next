// app/kid-toy/page.jsx
import React from "react";
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import KidToy from "@/components/kidsToy";

const BASE_URL = "https://api.malidag.com";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("kid_toys_title", { defaultValue: "Kids Toys" })} | Malidag`;
  const description = t("kid_toys_description", {
    defaultValue:
      "Discover fun and educational toys for kids on Malidag. Shop with crypto or USD and enjoy global delivery.",
  });

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/kid-toy`;
  const ogImage = `${baseUrl}/malidag.png`;

  const keywordsCsv =
    t("kid_toys_keywords", {
      defaultValue:
        "kids toys, baby toys, learning toys, dolls, lego, puzzles, outdoor toys, Malidag crypto shopping",
    }) || "";

  const keywords = keywordsCsv
    ? keywordsCsv.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

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

async function getData() {
  let itemsRes = [];

  try {
    const response = await fetch(`${BASE_URL}/items`, { cache: "no-store" });
    const data = await response.json();

    if (Array.isArray(data)) {
      itemsRes = data;
    }
  } catch (e) {
    console.error("Error fetching kid-toy data:", e.message);
  }

  const filteredData = itemsRes.filter((item) => {
    const cat = String(
      item?.category || item?.details?.category || item?.item?.department || ""
    )
      .trim()
      .toLowerCase();

    return ["toy", "toys", "kids toy", "kid toys", "children toys"].some((k) =>
      cat.includes(k)
    );
  });

  const groupedData = filteredData.reduce((acc, item) => {
    const type = String(item?.item?.type || item?.details?.type || "other")
      .trim()
      .toLowerCase();

    if (!acc[type]) acc[type] = { type, items: [] };
    acc[type].items.push(item);

    return acc;
  }, {});

  return { groupedData };
}

export default async function KidToyPage() {
  const { groupedData } = await getData();

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/kid-toy`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Kids Toys | Malidag",
    url,
    description: "Shop kids toys on Malidag — pay with crypto or USD.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "Kids Toys", item: url },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KidToy types={groupedData} />
    </>
  );
}