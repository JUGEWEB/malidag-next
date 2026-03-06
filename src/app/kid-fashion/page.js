// app/kid-fashion/page.jsx
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import KidFashion from "@/components/kidFashion";

const API_BASE = "https://api.malidag.com";

async function getData() {
  const [mtypesRes, itemsRes, cryptoRes] = await Promise.all([
    fetch(`${API_BASE}/categories/FashionKick`, { next: { revalidate: 3600 } }).then(r => r.json()),
    fetch(`${API_BASE}/items`, { next: { revalidate: 3600 } }).then(r => r.json()),
    fetch(`${API_BASE}/crypto-prices`, { next: { revalidate: 600 } }).then(r => r.json()),
  ]);

  const mtypes = mtypesRes;
  const data = itemsRes.items;
  const cryptoPrices = cryptoRes;

  // 🎯 filter only kids’ genres
  const filteredData = data.filter(item =>
    ["boy", "girl", "baby", "girls", "boys", "babies", "baby-girl", "baby-boy"].includes(item.item.genre)
  );

  // group items by type
  const groupedData = filteredData.reduce((acc, item) => {
    const type = item.item.type || "Other";
    if (!acc[type]) acc[type] = { type, items: [] };
    acc[type].items.push(item);
    return acc;
  }, {});

  return { mtypes, groupedData, cryptoPrices, filteredData };
}

// ✅ Metadata (SEO)
export async function generateMetadata() {
  const h = headers();
  const lang = (h.get("accept-language") || "en").split(",")[0].split("-")[0];

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("kids_fashion_title", { defaultValue: "Kids' Fashion" })} | Malidag`;
  const description = t("kids_fashion_description", {
    defaultValue:
      "Discover stylish kids' fashion on Malidag. Shop for boys, girls, and babies with crypto or USD, shipped worldwide.",
  });

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/kid-fashion`;
  const ogImage = `${baseUrl}/og/kids-default.jpg`;

  const keywordsCsv =
    t("kids_fashion_keywords", {
      defaultValue:
        "kids fashion, boys clothes, girls clothes, baby fashion, children clothing, kids wear, Malidag shopping, crypto kids wear, USD kids clothing",
    }) || "";
  const keywords = keywordsCsv.split(",").map(k => k.trim()).filter(Boolean);

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

export default async function KidFashionPage() {
  const { mtypes, groupedData, cryptoPrices, filteredData } = await getData();

  const baseUrl = "https://www.malidag.com";
  const url = `${baseUrl}/kid-fashion`;

  // ✅ Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Kids' Fashion | Malidag",
    "url": url,
    "description": "Shop stylish kids' fashion—boys, girls, and babies—pay with crypto or USD.",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${baseUrl}/` },
        { "@type": "ListItem", "position": 2, "name": "Kids' Fashion", "item": url }
      ]
    }
  };

  // ✅ ItemList schema for products
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Kids' Fashion Products",
    "url": url,
    "numberOfItems": filteredData.length,
    "itemListElement": filteredData.slice(0, 20).map((item, index) => ({
      "@type": "Product",
      "position": index + 1,
      "name": item.item.name,
      "image": item.item.images?.[0] || `${baseUrl}/malidag.png`,
      "brand": item.item.brand || "Malidag",
      "category": item.item.type || "Kids Fashion",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": item.item.usdPrice || "0.00",
        "availability": "https://schema.org/InStock",
        "url": `${baseUrl}/product/${item.id}`,
      }
    }))
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
      <KidFashion mtypes={mtypes} types={groupedData} cryptoPrices={cryptoPrices} />
    </>
  );
}
