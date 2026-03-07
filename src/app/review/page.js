import dynamic from "next/dynamic";
import { headers, cookies } from "next/headers";
import initI18n from "@/components/i18nServer";
import ReviewPage from "@/components/reviewPage";

export async function generateMetadata() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  const i18n = await initI18n(lang);
  const t = i18n.t.bind(i18n);

  const cookiesList = await cookies();
  const itemData = cookiesList.get("itemData")?.value;
  let item = null;

  try {
    item = itemData ? JSON.parse(decodeURIComponent(itemData)) : null;
  } catch {
    item = null;
  }

  const title = item
    ? `${item.name} Reviews | Malidag`
    : t("product_reviews_title");

  const description = item
    ? `Read verified reviews for ${item.name} — honest feedback and customer ratings on Malidag.`
    : t("product_reviews_description");

  const image =
    item?.images?.[0] || "https://malidag.com/default-share-image.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      url: "https://malidag.com/review",
      siteName: "Malidag",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function ReviewRoute() {
  return <ReviewPage />;
}