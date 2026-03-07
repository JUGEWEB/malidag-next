// app/brand/[themeRoute]/[brandName]/page.js
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

import Theme1 from "@/components/Brands/Theme1/Theme1";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const themeRoute = params.themeRoute || "theme1";
  const brandName = params.brandName || "unknown";

  const url = `https://web.malidag.com/brand/${encodeURIComponent(themeRoute)}/${encodeURIComponent(brandName)}`;
  const ogImage = "https://web.malidag.com/og/brand-default.jpg";

  return {
    title: t("brand_meta_title", { brand: brandName }),
    description: t("brand_meta_description", { brand: brandName }),
    keywords: [brandName, "brand", "shopping", "reviews", "Malidag"],
    alternates: { canonical: url },
    openGraph: {
      title: t("brand_og_title", { brand: brandName }),
      description: t("brand_og_description", { brand: brandName }),
      url,
      siteName: "Malidag",
      locale: lang,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: t("brand_og_alt", { brand: brandName }),
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("brand_twitter_title", { brand: brandName }),
      description: t("brand_twitter_description", { brand: brandName }),
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  };
}

export default function Page({ params }) {
  const { themeRoute = "theme1", brandName = "unknown" } = params;

  switch (themeRoute) {
    case "theme1":
      return <Theme1 brandName={brandName} />;
    default:
      return <p className="p-6 text-red-600">Unknown theme: {themeRoute}</p>;
  }
}