// app/itemHome/page.js
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import ItemHomePage from "@/components/homePageKithen";

export const dynamic = "force-dynamic"; // allow headers() in metadata

export async function generateMetadata() {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("home_kitchen_title", { defaultValue: "Home & Kitchen" })} | Malidag`;
  const description =
    t("home_kitchen_description", {
      defaultValue:
        "Explore premium home and kitchen products on Malidag. Shop using cryptocurrency or USD, with seamless international delivery.",
    });

  // Prefer hosting OG assets on your own domain (faster + safer for crawlers)
  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/itemHome`;
  const ogImage = `${baseUrl}/og/home-kitchen.jpg`; // put this file at /public/og/home-kitchen.jpg

  // Localized keyword string -> array
  const keywordsCsv =
    t("home_kitchen_keywords", {
      defaultValue:
        "home, kitchen, home appliances, cookware, bakeware, small appliances, kitchen tools, home essentials, crypto shopping, USD shopping, international delivery, Malidag",
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

export default async function Page() {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/itemHome`;

  // Minimal JSON-LD (CollectionPage + Breadcrumbs)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Home & Kitchen | Malidag",
    "url": url,
    "description": "Shop high-quality home and kitchen items—pay with crypto or USD.",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${baseUrl}/` },
        { "@type": "ListItem", "position": 2, "name": "Home & Kitchen", "item": url }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ItemHomePage />
    </>
  );
}
