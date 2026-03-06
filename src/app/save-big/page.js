import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import SaveBig from "@/components/saveBig";

export const dynamic = "force-dynamic"; // ✅ allow headers for i18n

// ✅ SEO Metadata
export async function generateMetadata() {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0];

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("crypto_discount_title")} | Malidag`;
  const description = t("crypto_discount_description");
  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/save-big`;
  const ogImage = `${baseUrl}/og/discount-crypto.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Malidag",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: "website",
      locale: lang,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ✅ Page with structured data
export default async function SaveBigPage() {
  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/save-big`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Save Big with Crypto | Malidag",
    "url": url,
    "description": "Exclusive discounts on Malidag when paying with crypto. Save big with BTC, ETH, BNB, and more.",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "Save Big", item: url },
      ],
    },
    "offers": {
      "@type": "SpecialOffer",
      "name": "Crypto Discounts - Save Big",
      "url": url,
      "priceCurrency": "USD",
      "price": "0", // ✅ generic since multiple discounts
      "eligibleRegion": {
        "@type": "Place",
        "name": "Worldwide"
      },
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString(),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SaveBig />
    </>
  );
}
