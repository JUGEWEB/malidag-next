import HomePageClient from "@/components/HomePageClient";

const BASE_URL = "https://web.malidag.com";

export const metadata = {
  title: "Malidag | Official Online Shopping Website",

  description:
    "Shop online with Malidag for fashion, electronics, beauty, home essentials and more. Choose your delivery country to explore products and availability.",

  alternates: {
    canonical: BASE_URL,

    languages: {
      "fr-FR": `${BASE_URL}/fr`,
      "en-GB": `${BASE_URL}/gb`,
      "pt-BR": `${BASE_URL}/br`,
      "x-default": BASE_URL,
    },
  },

  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },

  openGraph: {
    title: "Malidag | Official Online Shopping Website",

    description:
      "Shop online with Malidag for fashion, electronics, beauty, home essentials and more. Choose your delivery country to explore products and availability.",

    url: BASE_URL,
    siteName: "Malidag",
    type: "website",

    images: [
      {
        url: `${BASE_URL}/og/malidag.png`,
        width: 1200,
        height: 630,
        alt: "Malidag",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Malidag | Official Online Shopping Website",

    description:
      "Shop online with Malidag for fashion, electronics, beauty, home essentials and more. Choose your delivery country to explore products and availability.",

    images: [
      `${BASE_URL}/og/malidag.png`,
    ],
  },
};

export default function CountryShopPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",

    name: "Malidag",
    url: BASE_URL,

    description:
      "Malidag is an online shopping website for fashion, electronics, beauty, home essentials and more.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            jsonLd
          ).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <HomePageClient />
    </>
  );
}