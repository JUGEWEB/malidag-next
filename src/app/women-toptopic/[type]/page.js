import WomenTopTopic from "@/components/womentoptopic";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const type = resolvedParams?.type || "women-fashion";

  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const readableType = type
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const title = t("women_top_topic_title", { type: readableType });
  const description = t("women_top_topic_description", { type: readableType });

  return {
    title,
    description,
    keywords: [
      readableType,
      ...t("women_top_topic_keywords")
        .split(",")
        .map((k) => k.trim()),
    ],
    openGraph: {
      title,
      description,
      url: `https://malidag.com/women-fashion/${type}`,
      siteName: "Malidag",
      images: [
        {
          url: "https://api.malidag.com/images/1752764163519-steptodown.com980265.webp",
          width: 1200,
          height: 630,
          alt: `Top ${readableType} products on Malidag`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        "https://api.malidag.com/images/1752764163519-steptodown.com980265.webp",
      ],
    },
    alternates: {
      canonical: `https://malidag.com/women-fashion/${type}`,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
    },
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <WomenTopTopic params={resolvedParams} />;
}