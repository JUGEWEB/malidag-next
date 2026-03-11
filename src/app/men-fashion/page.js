// app/men-fashion/page.js
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import MenFashion from "@/components/MenFa";

const BASE_URL = "https://api.malidag.com";
const CRYPTO_URL = "https://api.malidag.com/crypto-prices";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("men_fashion_title", { defaultValue: "Men's Fashion" })} | Malidag`;
  const description = t("men_fashion_description", {
    defaultValue:
      "Discover top styles in men's fashion on Malidag. Shop with crypto or USD — from casual wear to premium looks.",
  });

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/men-fashion`;
  const ogImage = `${baseUrl}/og/menFashion.jpg`;

  const keywordsCsv =
    t("men_fashion_keywords", {
      defaultValue:
        "men fashion, men's clothing, men's shoes, shirts, pants, jackets, crypto shopping, Malidag",
    }) || "";
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
  const [categoriesRes, itemsRes, cryptoRes] = await Promise.all([
    fetch(`${BASE_URL}/categories/MenFashion`, { cache: "no-store" }),
    fetch(`${BASE_URL}/items`, { cache: "no-store" }),
    fetch(CRYPTO_URL, { cache: "no-store" }),
  ]);

  if (!categoriesRes.ok || !itemsRes.ok || !cryptoRes.ok) {
    throw new Error("Failed to fetch one or more API endpoints");
  }

  const [categoriesData, itemsData, cryptoData] = await Promise.all([
    categoriesRes.json(),
    itemsRes.json(),
    cryptoRes.json(),
  ]);

  const mtypes = Array.isArray(categoriesData) ? categoriesData : [];
  const allItems = Array.isArray(itemsData) ? itemsData : itemsData?.items || [];
  const cryptoPrices = cryptoData ?? [];

  const menItems = allItems.filter(
    (item) =>
      (item?.item?.genre || "").toLowerCase().includes("men") &&
      (item?.category || "").toLowerCase() !== "beauty"
  );

  const groupedTypes = menItems.reduce((acc, item) => {
    const type = item?.item?.type || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  return { mtypes, groupedTypes, cryptoPrices };
}

export default async function Page() {
  const { mtypes, groupedTypes, cryptoPrices } = await getData();

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/men-fashion`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Men's Fashion | Malidag",
    url,
    description: "Shop the best men's fashion on Malidag with crypto or USD.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "Men's Fashion", item: url },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MenFashion
        mtypes={mtypes}
        groupedTypes={groupedTypes}
        cryptoPrices={cryptoPrices}
      />
    </>
  );
}