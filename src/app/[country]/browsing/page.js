import Browsing from "@/components/basedbrowsing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browsing History | Malidag",
  description: "Recommended items based on your browsing and search history.",
};

export default function Page() {
  return <Browsing />;
}