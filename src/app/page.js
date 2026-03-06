// app/page.js
import { headers } from "next/headers";
import initI18n from "@/components/i18nServer";
import Malidag from "@/components/malidag";

// ✅ SEO metadata (server-side only)
export async function generateMetadata() {
  const h = headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);

  const title =
    i18n.t("home_title") || "Global Shopping Made Simple | Malidag";
  const description =
    i18n.t("home_description") ||
    "Discover fashion, electronics, beauty, and more from top brands. Pay securely with credit cards or cryptocurrencies like Bitcoin, Ethereum, and USDT on Malidag.";
  const keywords =
    i18n.t("home_keywords") ||
    "online shopping, pay with credit card, pay with Bitcoin, pay with Ethereum, pay with crypto, fashion, electronics, beauty, Malidag";

  const ogImage = {
    url: "https://web.malidag.com/og/home.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "Malidag Logo – Global Shopping Made Simple",
  };

  return {
    title,
    description,
    keywords,
    alternates: { canonical: "https://web.malidag.com/" },
    openGraph: {
      title,
      description,
      url: "https://web.malidag.com/",
      siteName: "Malidag",
      images: [ogImage],
      locale: lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Malidag",
        url: "https://web.malidag.com",
        logo: ogImage.url,
      }),
    },
  };
}

// ✅ Page (UI gets language from Layout/Providers, not SSR props)
export default function Page() {
  return (
    <>
      {/* Hidden SEO fallback H1 (can stay static or use t() in client if needed) */}
      <h1 className="sr-only">
        Global Shopping Made Simple | Malidag
      </h1>

      <Malidag view="home" />
    </>
  );
}
