import Theme3Department from "@/components/Brands/theme3/theme3Department";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const {
    themeRoute = "theme3",
    brandName = "unknown",
    department = "",
  } = await params;

  if (themeRoute !== "theme3") {
    return <p className="p-6 text-red-600">This route is only for theme3.</p>;
  }

  return (
    <Theme3Department
      brandName={decodeURIComponent(brandName)}
      department={decodeURIComponent(department)}
    />
  );
}