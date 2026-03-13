import Theme1Department from "@/components/Brands/Theme1/Theme1Departement";

export default async function Page({ params }) {
  const {
    department = "",
    brandType = "",
    brandName = "",
  } = await params;

  return (
    <Theme1Department
      department={department}
      brandType={brandType}
      brandName={brandName}
    />
  );
}