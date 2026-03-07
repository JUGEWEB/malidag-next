import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import Providers from "@/components/providers";
import TermsModal from "@/components/TermsModal";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Malidag",
  description: "Global shopping made simple",
  icons: {
    icon: "/malidag.png",
  },
};

export default async function RootLayout({ children }) {
  const requestHeaders = await headers();
  const acceptLanguage = requestHeaders.get("accept-language") || "en";
  const lang = acceptLanguage.split(",")[0].split("-")[0] || "en";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}>
        <Providers initialLang={lang}>
          <main className="bg-white">{children}</main>
          <TermsModal />
        </Providers>
      </body>
    </html>
  );
}