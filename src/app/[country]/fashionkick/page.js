import FashionKick from "@/components/fashionkick";
import initI18n from "@/components/i18nServer";
import { headers } from "next/headers";

const BASE_URLs = "https://api.malidag.com";
const BASE_URL = "https://api.malidag.com";

export async function generateMetadata({ params }) {
  const { country } = await params;
  const countryCode = country;

  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);

  const title = i18n.t("fashionkick_title") || "Top Fashion Items | Malidag";
  const description =
    i18n.t("fashionkick_description") ||
    "Explore the best-selling fashion items, sneakers and boots for men and women.";

  return {
    title,
    description,
    keywords: i18n.t("fashionkick_keywords", {
      defaultValue: "fashion, sneakers, boots, shoes, buy online",
    }),
    alternates: {
      canonical: `https://www.malidag.com/${countryCode}/fashionkick`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.malidag.com/${countryCode}/fashionkick`,
      siteName: "Malidag",
      images: [
        {
          url: "https://www.malidag.com/og/fashionKick.jpg",
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
      images: ["https://www.malidag.com/og/fashionKick.jpg"],
    },
  };
}

export default async function Page({ params }) {
  const { country } = await params;
  const countryCode = country;

  let mtypes = [];

  try {
    const categoriesRes = await fetch(`${BASE_URLs}/categories/FashionKick`, {
      cache: "no-store",
    });

    if (categoriesRes.ok) {
      mtypes = await categoriesRes.json();
    }
  } catch (err) {
    console.error("FashionKick categories error:", err);
  }

  let types = {};

  try {
    const itemsRes = await fetch(
      `${BASE_URL}/items?country=${encodeURIComponent(countryCode)}`,
      { cache: "no-store" }
    );

    if (itemsRes.ok) {
      const data = await itemsRes.json();

      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      const filteredData = items.filter((item) => {
        const category = (item?.category || "").toLowerCase();
        const sold = Number(item?.item?.sold || 0);

        return category === "shoes" && sold >= 100;
      });

      types = filteredData.reduce((acc, item) => {
        const type = item?.item?.type || "Other";
        const genre = item?.item?.genre || "General";

        if (!acc[type]) acc[type] = {};
        if (!acc[type][genre]) {
          acc[type][genre] = { genre, items: [] };
        }

        if (acc[type][genre].items.length < 10) {
          acc[type][genre].items.push({
            id: item.id,
            itemId: item.itemId,
            item: item.item,
          });
        }

        return acc;
      }, {});
    }
  } catch (err) {
    console.error("FashionKick items error:", err);
  }

  return <FashionKick initialMTypes={mtypes} initialTypes={types} />;
}