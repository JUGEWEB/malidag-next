import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";
import Bnboff from "@/components/buyBNB";

export async function generateMetadata() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  return {
    title: `${t("bnb_discount_title")} | Malidag`,
    description: t("bnb_discount_description"),
    openGraph: {
      title: `${t("bnb_discount_title")} | Malidag`,
      description: t("bnb_discount_description"),
      url: "https://web.malidag.com/buyBNB",
      siteName: "Malidag",
      images: [
        {
          url: "https://web.malidag.com/og/bnb-discount.jpg",
          width: 1200,
          height: 630,
          alt: `${t("bnb_discount_title")} | Malidag`,
        },
      ],
      locale: lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("bnb_discount_title")} | Malidag`,
      description: t("bnb_discount_description"),
      images: ["https://web.malidag.com/og/bnb-discount.jpg"],
    },
  };
}

export default function BuyBnbPage() {
  return <Bnboff />;
}