
import FashionKickTrending from "@/components/FashionKickTrending";

export const metadata = {
  title: "Trending Shoes & Footwear | Malidag FashionKick",
  description:
    "Discover trending shoes and popular footwear on Malidag FashionKick. Explore the latest styles and best-selling shoes.",
};

export default async function TrendingPage({ params }) {
  const { country } = await params;

  return <FashionKickTrending countryCode={country} />;
}
