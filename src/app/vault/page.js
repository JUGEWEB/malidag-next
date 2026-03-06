import { redirect } from "next/navigation";

export const dynamic = "force-static";

const VAULT_URL = "https://vault.malidag.com/";
const VAULT_OG_IMAGE = "https://vault.malidag.com/static/media/bbb.3b89bece17b09ae0318d.png";

export async function generateMetadata() {
  const title = "Vault Presale | Powered by MALIDAG Enterprise";
  const description =
    "Join the VLT Presale today. Earn 10% bonus VLT tokens and be part of the DeFi revolution — powered by MALIDAG Enterprise.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: VAULT_URL,
      images: [
        {
          url: VAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Vault Presale by MALIDAG",
        },
      ],
      siteName: "MALIDAG Enterprise",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@mag353O",
      creator: "@mag353O",
      title,
      description,
      images: [VAULT_OG_IMAGE],
    },
  };
}

export default function VaultRedirectPage() {
  // Instant redirect to your live Vault App
  redirect(VAULT_URL);
  return null;
}
