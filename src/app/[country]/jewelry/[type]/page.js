import JewelryPage from "@/components/jewelryPage.js";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const PUBLIC_OG_BASE = "https://web.malidag.com/og";

const JEWELRY_OG = {
  watches: "watches.jpg",
  rings: "rings.jpg",
  necklaces: "necklaces.jpg",
  bracelets: "bracelets.jpg",
  earrings: "earrings.jpg",
};

const FALLBACK_FILE = "malidag-jewelry.jpg";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const type = String(resolvedParams?.type || resolvedParams?.symbol || "watches").toLowerCase();

  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);

  const isSupported = Object.prototype.hasOwnProperty.call(JEWELRY_OG, type);
  const imageUrl = `${PUBLIC_OG_BASE}/${isSupported ? JEWELRY_OG[type] : FALLBACK_FILE}`;

  const readableType = type.charAt(0).toUpperCase() + type.slice(1);

  const title = isSupported
    ? `${readableType} store | Malidag`
    : "Jewelry store | Malidag";

  const description = isSupported
    ? `Shop ${readableType.toLowerCase()} and jewelry pieces on Malidag.`
    : "Explore watches, rings, necklaces, bracelets, earrings, and more jewelry pieces on Malidag.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://web.malidag.com/jewelry/${type}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function Page() {
  return <JewelryPage />;
}