import CoinPage from "@/components/coinPage.js";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const PUBLIC_OG_BASE = "https://web.malidag.com/og";
const SYMBOL_OG = {
  usdt: "usdt.jpg",
  eth: "eth.jpg",
  usdc: "usdc.jpg",
  sol: "sol.jpg",
  bnb: "bnb.jpg",
};
const FALLBACK_FILE = "malidag-coin.jpg";

export async function generateMetadata({ params }) {
  const symbol = String(params?.symbol || "").toLowerCase();

  const h = await headers(); // ✅ FIX
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);

  const isSupported = Object.prototype.hasOwnProperty.call(SYMBOL_OG, symbol);
  const imageUrl = `${PUBLIC_OG_BASE}/${isSupported ? SYMBOL_OG[symbol] : FALLBACK_FILE}`;

  const title = isSupported
    ? `${symbol.toUpperCase()} ${i18n.t("title_suffix")}`
    : `Unsupported coin | Malidag`;

  const description = isSupported
    ? `${i18n.t("description_prefix")} ${symbol.toUpperCase()} ${i18n.t("description_suffix")}`
    : `The coin ${symbol.toUpperCase()} is not supported on Malidag. Shop with supported cryptocurrencies (USDT, ETH, USDC, SOL, BNB) or credit card.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://web.malidag.com/coin/${symbol}`,
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

export default function Page({ params }) {
  return <CoinPage params={params} />;
}