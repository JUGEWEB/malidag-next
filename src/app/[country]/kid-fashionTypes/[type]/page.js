import KidFashionTypePage from "@/components/KidFashionTypePage";

export default async function Page({ params }) {
  const resolvedParams = await params;
  const type = resolvedParams?.type || "";

  return <KidFashionTypePage typeSlug={type} />;
}