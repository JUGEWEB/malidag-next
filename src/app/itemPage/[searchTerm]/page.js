// app/itemPage/[searchTerm]/page.js
import ItemPage from "@/components/itemPage";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang, ["translation", "keywords"]);
  const t = i18n.t.bind(i18n);

  const { searchTerm } = params;

  const parts = decodeURIComponent(searchTerm).split(/[-+\s]+/);

  const translatedParts = parts.map((p) =>
    t(p.toLowerCase(), { ns: ["keywords", "translation"], defaultValue: p })
  );

  const translatedSearch = translatedParts.join(" ");

  const url = `https://www.malidag.com/itemPage/${encodeURIComponent(searchTerm)}`;
  const ogImage = "https://www.malidag.com/images/malidag.png";

  return {
    title: `${t("malidag", { ns: "translation" })} - ${t("search_results_for", { ns: "translation" })} "${translatedSearch}"`,
    description: `${t("browse_crypto_results_for", { ns: "translation" })} "${translatedSearch}" ${t("find_top_rated_with_reviews", { ns: "translation" })}`,
    keywords: [
      ...translatedParts,
      "crypto shopping",
      "USD shopping",
      t("online_marketplace", { ns: "translation" }),
      t("reviews", { ns: "translation" }),
      "Malidag",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${t("search", { ns: "translation" })} "${translatedSearch}" ${t("on_malidag", { ns: "translation" })}`,
      description: `${t("find_crypto_results_for", { ns: "translation" })} "${translatedSearch}" ${t("with_real_time_pricing", { ns: "translation" })}`,
      url,
      siteName: "Malidag",
      locale: lang,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${t("search_result_page_for", { ns: "translation" })} ${translatedSearch}`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("malidag", { ns: "translation" })} - "${translatedSearch}"`,
      description: `${t("explore_best_items_for", { ns: "translation" })} "${translatedSearch}" ${t("with_ratings_and_deals", { ns: "translation" })}`,
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
  const { searchTerm } = params;
  return <ItemPage searchTerm={searchTerm} />;
}