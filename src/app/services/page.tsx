// app/services/page.tsx
// This file is a Server Component by default in the App Router

import { getAllServices } from "@/lib/api";
import { getCategories, getLocations } from "@/lib/api";
import { getCompanyOptions } from "@/lib/supabase-utils";
import ServiceListClient from "./_componet/ServiceListClient";// Import the new client component
import { Location, LocationOption } from "@/type";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // --- FIX START ---
  // Convert searchParams to a plain object to ensure it's fully resolved and accessible client-side.
  const plainSearchParams: { [key: string]: string | string[] | undefined } = Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => value !== undefined)
  );

  // Add logging for debugging
  console.log("ServicesPage (Server Component): Original searchParams received:", searchParams);
  console.log("ServicesPage (Server Component): Passing plainSearchParams to client:", plainSearchParams);
  // --- FIX END ---

  // All data fetching happens on the server, before the page is sent to the client
  const [services, categories, rawLocations, companyOptions] = await Promise.all([
    getAllServices(),
    getCategories(),
    getLocations(),
    getCompanyOptions(),
  ]);

  // Format locations for client component
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
      // Pass the now-plain object
      serverSearchParams={plainSearchParams}
    />
  );
}