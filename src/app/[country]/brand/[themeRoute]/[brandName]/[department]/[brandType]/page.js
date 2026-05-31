import Theme3DepartmentType from "@/components/Brands/theme3/theme3DepartmentType";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const {
    themeRoute = "theme3",
    brandName = "unknown",
    department = "",
    brandType = "",
  } = await params;

  if (themeRoute !== "theme3") {
    return <p className="p-6 text-red-600">This route is only for theme3.</p>;
  }

  return (
    <Theme3DepartmentType
      brandName={decodeURIComponent(brandName)}
      department={decodeURIComponent(department)}
      brandType={decodeURIComponent(brandType)}
    />
  );
}