// app/the-crypto-shop/page.js
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import TheCryptoShop from "@/components/theCryptoShop";

export const dynamic = "force-dynamic";

// 🔎 Fetch live prices from your API
async function fetchPrices() {
  try {
    const res = await fetch("https://api.malidag.com/crypto-prices", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

// 🔎 SEO Metadata
export async function generateMetadata() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const prices = await fetchPrices();

  const priceText = [
    prices.bnb ? `BNB: $${prices.bnb}` : null,
    prices.eth ? `ETH: $${prices.eth}` : null,
    prices.usdt ? `USDT: $${prices.usdt}` : null,
    prices.sol ? `SOL: $${prices.sol}` : null,
    prices.usdc ? `USDC: $${prices.usdc}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const title = `The Crypto Shop | Malidag`;
  const description =
    priceText.length > 0
      ? `Live crypto prices today — ${priceText}. Explore and buy verified tokens directly on Malidag.`
      : `Explore and buy verified crypto assets directly from Malidag. Integrated with Binege — your trusted token directory.`;

  return {
    title,
    description,
    keywords: [
      "crypto shop",
      "Malidag crypto",
      "buy tokens",
      "Binege",
      "BNB price",
      "ETH price",
      "USDT price",
      "SOL price",
      "USDC price",
      "crypto ecommerce",
      "web3 shopping",
    ],
    openGraph: {
      title,
      description,
      url: "https://www.malidag.com/the-crypto-shop",
      siteName: "Malidag",
      images: [
        {
          url: "https://www.malidag.com/og/crypto-shop.png",
          width: 1200,
          height: 630,
          alt: "The Crypto Shop by Malidag",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.malidag.com/og/crypto-shop.png"],
    },
  };
}

// 🔎 Page Component with JSON-LD schema
export default async function Page() {
  const prices = await fetchPrices();
  const baseUrl = "https://www.malidag.com";

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": Object.entries(prices).map(([symbol, price]) => ({
      "@type": "Product",
      name: `${symbol.toUpperCase()} Price on Malidag`,
      description: `Live price of ${symbol.toUpperCase()} on Malidag.`,
      image: `${baseUrl}/og/crypto-shop.png`,
      brand: { "@type": "Brand", name: "Malidag" },
      offers: {
        "@type": "Offer",
        url: `${baseUrl}/the-crypto-shop`,
        price: price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        priceValidUntil: nextMonth.toISOString().split("T")[0],
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TheCryptoShop />
    </>
  );
}