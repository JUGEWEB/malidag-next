import FAQ from "@/components/FAQ";
import initI18n from "@/components/i18nServer";

const BASE_URL = "https://web.malidag.com";

const SUPPORTED_COUNTRIES = {
  fr: {
    code: "fr",
    seoLanguage: "fr",
    locale: "fr_FR",
  },

  gb: {
    code: "gb",
    seoLanguage: "en",
    locale: "en_GB",
  },

  br: {
    code: "br",
    seoLanguage: "br",
    locale: "pt_BR",
  },
};

export async function generateMetadata({
  params,
}) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    return {};
  }

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const title =
    i18n.t("faq_seo_title");

  const description =
    i18n.t("faq_seo_description");

  const url =
    `${BASE_URL}/${countryCode}/faq`;

  return {
    title,
    description,

    alternates: {
      canonical: url,
    },

    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },

    openGraph: {
      title,
      description,
      url,
      siteName: "Malidag",
      locale: selectedCountry.locale,
      type: "website",
    },

    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function Page({
  params,
}) {
  const { country } = await params;

  const countryCode =
    country?.toLowerCase();

  const selectedCountry =
    SUPPORTED_COUNTRIES[countryCode];

  if (!selectedCountry) {
    return null;
  }

  const i18n = await initI18n(
    selectedCountry.seoLanguage
  );

  const t = i18n.t.bind(i18n);

  const url =
    `${BASE_URL}/${countryCode}/faq`;

  const countryHome =
    `${BASE_URL}/${countryCode}`;

  /*
    These questions/answers correspond directly
    to content rendered by the FAQ component.
  */
  const faqItems = [
    [
      "faq_what_is_malidag_title",
      ["faq_what_is_malidag_1"],
    ],

    [
      "faq_account_title",
      ["faq_account_1"],
    ],

    [
      "faq_payment_methods_title",
      ["faq_payment_methods_1"],
    ],

    [
      "faq_payment_security_title",
      [
        "faq_payment_security_1",
        "faq_payment_security_2",
      ],
    ],

    [
      "faq_prices_country_title",
      ["faq_prices_country_1"],
    ],

    [
      "faq_order_success_title",
      ["faq_order_success_1"],
    ],

    [
      "faq_cancel_order_title",
      ["faq_cancel_order_1"],
    ],

    [
      "faq_delivery_locations_title",
      ["faq_delivery_locations_1"],
    ],

    [
      "faq_delivery_time_title",
      [
        "faq_delivery_time_1",
        "faq_delivery_time_2",
      ],
    ],

    [
      "faq_tracking_title",
      ["faq_tracking_1"],
    ],

    [
      "faq_order_not_arrived_title",
      ["faq_order_not_arrived_1"],
    ],

    [
      "faq_damaged_product_title",
      [
        "faq_damaged_product_1",
        "faq_damaged_product_2",
      ],
    ],

    [
      "faq_return_product_title",
      ["faq_return_product_1"],
    ],

    [
      "faq_all_returnable_title",
      ["faq_all_returnable_1"],
    ],

    [
      "faq_refund_processing_title",
      [
        "faq_refund_processing_1",
        "faq_refund_processing_2",
      ],
    ],

    [
      "faq_refund_missing_title",
      [
        "faq_refund_missing_1",
        "faq_refund_missing_2",
      ],
    ],

    [
      "faq_customs_title",
      ["faq_customs_1"],
    ],

    [
      "faq_unavailable_country_title",
      ["faq_unavailable_country_1"],
    ],

    [
      "faq_contact_title",
      ["faq_contact_1"],
    ],
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",

    mainEntity: faqItems.map(
      ([questionKey, answerKeys]) => ({
        "@type": "Question",

        name: t(questionKey),

        acceptedAnswer: {
          "@type": "Answer",

          text: answerKeys
            .map((key) => t(key))
            .join(" "),
        },
      })
    ),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("home"),
        item: countryHome,
      },

      {
        "@type": "ListItem",
        position: 2,
        name: t("faq_title"),
        item: url,
      },
    ],
  };

  const jsonLd = [
    faqJsonLd,
    breadcrumbJsonLd,
  ];

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

      <FAQ />
    </>
  );
}