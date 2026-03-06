// app/fashionPage/page.js
import ItemFashionPage from "@/components/fashionForAllPage";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export async function generateMetadata() {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);

  const title = i18n.t("fashion_title") || "Top Fashion Brands | Malidag";
  const description =
    i18n.t("fashion_description") ||
    "Explore top clothing, shoes, and bags from leading fashion brands.";
  const keywords =
    i18n.t("fashion_keywords", {
      defaultValue: "fashion, clothing, shoes, bags, crypto fashion",
    });

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: "https://web.malidag.com/fashionPage",
    },
    openGraph: {
      title,
      description,
      url: "https://web.malidag.com/fashionPage",
      siteName: "Malidag",
      images: [
        {
          url: "https://web.malidag.com/og/fashion.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: lang, // ← detected from headers
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://web.malidag.com/og/fashion.jpg"],
    },
  };
}

export default function Page() {
  return <ItemFashionPage />;
}
