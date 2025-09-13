// app/services/page.tsx
import { getAllServices, getCategories, getLocations } from "@/lib/api";
import { getCompanyOptions } from "@/lib/supabase-utils";
import ServiceListClient from "./_componet/ServiceListClient";
import { Location, LocationOption } from "@/type";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ✅ Await it here
  const resolvedSearchParams = await searchParams;

  const plainSearchParams: { [key: string]: string | string[] | undefined } = {};

  if (resolvedSearchParams.searchTerm) {
    plainSearchParams.searchTerm = resolvedSearchParams.searchTerm;
  }
  if (resolvedSearchParams.categoryId) {
    plainSearchParams.categoryId = resolvedSearchParams.categoryId;
  }
  if (resolvedSearchParams.companyIds) {
    plainSearchParams.companyIds = resolvedSearchParams.companyIds;
  }
  if (resolvedSearchParams.locations) {
    plainSearchParams.locations = resolvedSearchParams.locations;
  }

  console.log("ServicesPage (Server Component): Converted plainSearchParams:", plainSearchParams);

  const [services, categories, rawLocations, companyOptions] = await Promise.all([
    getAllServices(),
    getCategories(),
    getLocations(),
    getCompanyOptions(),
  ]);

  const formattedLocations: LocationOption[] = rawLocations.map(
    (location: Location) => ({
      id: location.id,
      value: `${location.place}, ${location.city}`,
      label: `${location.place}, ${location.city}`,
    })
  );

  return (
    <ServiceListClient
      initialServices={services}
      allCategories={categories}
      allLocationOptions={formattedLocations}
      allCompanyOptions={companyOptions}
      serverSearchParams={plainSearchParams}
    />
  );
}
// --- IGNORE ---