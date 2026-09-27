import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import Providers from "@/components/providers";
import TermsBanner from "@/components/TermsBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
  Root layout contains only global,
  language-neutral metadata.

  Storefront SEO belongs to:
  /fr
  /gb
  /br
*/
export const metadata = {
  icons: {
    icon: "/malidag.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }) {
  /*
    Browser language is used for the Malidag UI,
    NOT for country-specific SEO.
  */
  const requestHeaders = await headers();

  const acceptLanguage =
    requestHeaders.get("accept-language") || "en";

  const browserLang =
    acceptLanguage
      .split(",")[0]
      .split("-")[0]
      .toLowerCase();

  /*
    Malidag currently supports:
    en = English
    fr = French
    br = Brazilian Portuguese

    Browsers report Portuguese as "pt",
    so map pt -> br for the UI.
  */
  const lang =
    browserLang === "pt"
      ? "br"
      : ["en", "fr", "br"].includes(browserLang)
        ? browserLang
        : "en";

  /*
    HTML uses the standard BCP 47 language code.
    "br" is our internal i18n key for Brazilian
    Portuguese, but HTML should use "pt-BR".
  */
  const htmlLang =
    lang === "br"
      ? "pt-BR"
      : lang;

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <Providers initialLang={lang}>
          <main className="bg-white">
            {children}
          </main>

          <TermsBanner />
        </Providers>
      </body>
    </html>
  );
}