// app/services/page.tsx
import { getAllServices, getCategories, getLocations } from "@/lib/api";
import { getCompanyOptions, getCompanyTypeOptions } from "@/lib/supabase-utils";
import ServiceListClient from "./_componet/ServiceListClient";
import { Location, LocationOption } from "@/type";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse and book services: beauty, barbershop, haircut, massage, spa",
  description:
    "Explore services across salons, barbershops, massage and wellness. Filter by category, company and location, then book instantly.",
  keywords: [
    "booking",
    "services",
    "beauty",
    "beauty products",
    "barbershop",
    "haircut",
    "massage",
    "spa",
    "wellness",
    "salon",
  ],
  alternates: { canonical: "/services" },
};

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
  if (resolvedSearchParams.companyTypeIds) {
    plainSearchParams.companyTypeIds = resolvedSearchParams.companyTypeIds;
  }

  console.log("ServicesPage (Server Component): Converted plainSearchParams:", plainSearchParams);

  const [services, categories, rawLocations, companyOptions, companyTypeOptions] = await Promise.all([
    getAllServices(),
    getCategories(),
    getLocations(),
    getCompanyOptions(),
    getCompanyTypeOptions(),
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
      allCompanyTypeOptions={companyTypeOptions}
      serverSearchParams={plainSearchParams}
    />
  );
}
// --- IGNORE ---