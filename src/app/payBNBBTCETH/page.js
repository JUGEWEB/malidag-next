import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import PayBBE from "@/components/payBNBBTCETH";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const title = `${t("bnbbtceth_discount_title", { defaultValue: "BNB/BTC/ETH Discount" })} | Malidag`;
  const description = t("bnbbtceth_discount_description", {
    defaultValue: "Save up to 50% when paying with BNB, BTC, or ETH on Malidag.",
  });

  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/payBNBBTCETH`;
  const ogImage = `${baseUrl}/og/payBNBBTCETH.jpg`;

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
      locale: lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function Page() {
  const baseUrl = "https://web.malidag.com";
  const url = `${baseUrl}/payBNBBTCETH`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "BNB/BTC/ETH Discount | Malidag",
    url,
    description: "Save more when you checkout with BNB, Bitcoin, or Ethereum on Malidag.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: "BNB/BTC/ETH Discount", item: url },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PayBBE />
    </>
  );
}