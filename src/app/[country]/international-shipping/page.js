// app/international-shipping/page.js
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import InternationalShipping from "@/components/internationnalShipping";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/international-shipping`;
  const ogImage = `${baseUrl}/og/international-shipping.jpg`;

 const title = t("intl_ship_title", {
  defaultValue: "International Shipping & Availability | Malidag",
});

const description = t("intl_ship_desc", {
  defaultValue:
    "Learn how shipping and product availability work on Malidag. We currently support France, the United Kingdom, and Brazil, with more countries planned.",
});

const keywordsCsv =
  t("intl_ship_keywords", {
    defaultValue:
      "Malidag shipping, international shipping, France delivery, UK delivery, Brazil delivery, product availability",
  }) || "";

  const keywords = keywordsCsv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

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
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/international-shipping`;

  const jsonLd = [
    {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "International Shipping & Availability | Malidag",
  description:
    "Learn how shipping and product availability work on Malidag. We currently support France, the United Kingdom, and Brazil, with more countries planned.",
  mainEntityOfPage: url,
  dateModified: "2026-09-24",
  author: {
    "@type": "Organization",
    name: "Malidag",
  },
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
      name: "Which countries does Malidag currently support for shipping?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Malidag currently supports shipping for available products in France, the United Kingdom, and Brazil.",
      },
    },
    {
      "@type": "Question",
      name: "Will Malidag ship to more countries?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. Malidag is working on expanding availability to additional countries. New countries and products may become available gradually.",
      },
    },
    {
      "@type": "Question",
      name: "Why are some products available in one country but not another?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Product availability can vary depending on the brand, the location of its products, the markets where the brand operates, and the shipping options available for a particular destination.",
      },
    },
    {
      "@type": "Question",
      name: "Will every product become available at the same time in a new country?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Not necessarily. Some brands or products may become available earlier than others depending on their location and shipping availability.",
      },
    },
    {
      "@type": "Question",
      name: "How does Malidag decide which products to show for my country?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Malidag uses the selected country to display products that are currently available for that market. Products that are not currently available for the selected country may not appear in the catalog.",
      },
    },
    {
      "@type": "Question",
      name: "Are delivery times the same for every product?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. Delivery times can vary depending on the product, brand, product location, destination, and available shipping method.",
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