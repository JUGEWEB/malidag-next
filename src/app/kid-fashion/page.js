import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import KidFashion from "@/components/kidFashion";

const API_BASE = "https://api.malidag.com";
const SITE_URL = "https://web.malidag.com";

async function getData() {
  try {
    const [mtypesResponse, itemsResponse] = await Promise.all([
      fetch(`${API_BASE}/categories/kidFashion`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${API_BASE}/items`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (!mtypesResponse.ok) {
      throw new Error(`Kid categories fetch failed: ${mtypesResponse.status}`);
    }

    if (!itemsResponse.ok) {
      throw new Error(`Items fetch failed: ${itemsResponse.status}`);
    }

    const [mtypesRes, itemsRes] = await Promise.all([
      mtypesResponse.json(),
      itemsResponse.json(),
    ]);

    const mtypes = Array.isArray(mtypesRes) ? mtypesRes : [];

    const data = Array.isArray(itemsRes)
      ? itemsRes
      : Array.isArray(itemsRes?.items)
      ? itemsRes.items
      : [];

    const allowedGenres = new Set([
      "boy",
      "girl",
      "baby",
      "girls",
      "boys",
      "babies",
      "baby-girl",
      "baby-boy",
      "baby girl",
      "baby boy",
      "kid",
      "kids",
      "children",
    ]);

    const filteredData = data.filter((entry) => {
      const genre = String(entry?.item?.genre || entry?.details?.genre || "")
        .trim()
        .toLowerCase();

      return allowedGenres.has(genre);
    });

    const groupedData = filteredData.reduce((acc, entry) => {
      const type = String(
        entry?.item?.type || entry?.details?.type || "Other"
      ).trim();

      const genre = String(
        entry?.item?.genre || entry?.details?.genre || ""
      ).trim();

      if (!acc[type]) {
        acc[type] = {
          type,
          genre,
          items: [],
        };
      }

      acc[type].items.push(entry);
      return acc;
    }, {});

    return {
      mtypes,
      groupedData,
      filteredData,
    };
  } catch (error) {
    console.error("getData error:", error);

    return {
      mtypes: [],
      groupedData: {},
      filteredData: [],
    };
  }
}

export async function generateMetadata() {
  const h = await headers();
  const lang = (h.get("accept-language") || "en").split(",")[0].split("-")[0];

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("kids_fashion_title", { defaultValue: "Kids' Fashion" })} | Malidag`;
  const description = t("kids_fashion_description", {
    defaultValue:
      "Discover stylish kids' fashion on Malidag. Shop for boys, girls, and babies with stablecoin or USD pricing, shipped worldwide.",
  });

  const url = `${SITE_URL}/kid-fashion`;
  const ogImage = `${SITE_URL}/og/kids-default.jpg`;

  const keywordsCsv =
    t("kids_fashion_keywords", {
      defaultValue:
        "kids fashion, boys clothes, girls clothes, baby fashion, children clothing, kids wear, Malidag shopping, stablecoin kids wear, USD kids clothing",
    }) || "";

  const keywords = keywordsCsv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
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
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function KidFashionPage() {
  const { mtypes, groupedData, filteredData } = await getData();

  const url = `${SITE_URL}/kid-fashion`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Kids' Fashion | Malidag",
    url,
    description:
      "Shop stylish kids' fashion for boys, girls, and babies on Malidag.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Kids' Fashion",
          item: url,
        },
      ],
    },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Kids' Fashion Products",
    url,
    numberOfItems: filteredData.length,
    itemListElement: filteredData.slice(0, 20).map((entry, index) => ({
      "@type": "Product",
      position: index + 1,
      name: entry?.item?.name || "Product",
      image: entry?.item?.images?.[0] || `${SITE_URL}/malidag.png`,
      brand: entry?.item?.brand || "Malidag",
      category: entry?.item?.type || "Kids Fashion",
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: String(entry?.item?.usdPrice || "0.00"),
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/product/${entry?.id || ""}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <KidFashion mtypes={mtypes} types={groupedData} />
    </>
  );
}