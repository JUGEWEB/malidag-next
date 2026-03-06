// app/international-shipping/page.js
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import InternationalShipping from "@/components/internationnalShipping";

export const dynamic = "force-dynamic"; // so headers() is allowed

export async function generateMetadata() {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/international-shipping`;
  const ogImage = `${baseUrl}/og/international-shipping.jpg`; // put your real image in /public/og/

  const title = t("intl_ship_title", { defaultValue: "International Shipping | Malidag" });
  const description = t("intl_ship_desc", {
    defaultValue:
      "Learn how Malidag delivers products internationally. Shipping times, regions, and fees explained.",
  });

  // Keywords from i18n (CSV -> array) with safe fallback
  const keywordsCsv =
    t("intl_ship_keywords", {
      defaultValue:
        "international shipping, Malidag shipping policy, crypto shopping delivery, Malidag shipping, global delivery",
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
      type: "article",
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
  const url = `${baseUrl}/international-shipping`;

  // ——— JSON-LD: Article + FAQ + Breadcrumbs ———
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "International Shipping | Malidag",
      description:
        "Learn how Malidag delivers products internationally. Shipping times, regions, and fees explained.",
      mainEntityOfPage: url,
      datePublished: "2024-01-01",
      dateModified: "2025-09-02",
      author: { "@type": "Organization", name: "Malidag" },
      publisher: {
        "@type": "Organization",
        name: "Malidag",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/malidag.png`,
          width: 200,
          height: 200,
        },
      },
      image: [`${baseUrl}/og/international-shipping.jpg`],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Which countries do you ship to?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "We ship to most countries worldwide. Shipping availability depends on the item and destination regulations.",
          },
        },
        {
          "@type": "Question",
          name: "How long does international shipping take?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Typical delivery times range from 7–20 business days depending on the region, carrier, and customs processing.",
          },
        },
        {
          "@type": "Question",
          name: "How are shipping fees calculated?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Fees are based on the destination, package weight and dimensions, and the selected shipping method.",
          },
        },
        {
          "@type": "Question",
          name: "Do I pay customs or import taxes?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Some countries require duties or taxes upon import. These charges are the responsibility of the recipient.",
          },
        },
        {
          "@type": "Question",
          name: "Can I track my order?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Yes, most shipments include tracking. A tracking link is provided as soon as your order is dispatched.",
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "International Shipping", item: url },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InternationalShipping lang={lang} />
    </>
  );
}
