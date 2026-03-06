import ElectronicPage from "@/components/electronicPage";
import initI18n from "@/components/i18nServer"; // assuming you already have this

export async function generateMetadata({ params, locale = "en" }) {
  const i18n = await initI18n(locale);

  const title = i18n.t("electronic_title") || "Top Electronics | Malidag";
  const description = i18n.t("electronic_description") || "Discover the best-selling electronics across top brands.";

  return {
    title,
    description,
    keywords: i18n.t("electronic_keywords", {
      defaultValue: "electronics, gadgets, crypto electronics, buy with bitcoin",
    }),
    alternates: {
      canonical: `https://www.malidag.com/electronic`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.malidag.com/electronic`,
      siteName: "Malidag",
      images: [
        {
          url: "https://www.malidag.com/og/electronics.jpg", // replace with real image if needed
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.malidag.com/og/electronics.jpg"],
    },
  };
}

export default function Page() {
  return <ElectronicPage />;
}
