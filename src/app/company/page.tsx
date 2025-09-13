// src/app/companies/page.tsx
import { getAllCompanies, getCompanyLocationOptions } from '@/lib/supabase-utils';
import CompaniesClientPage from '@/components/company-componets/CompaniesClientPage'; // Import the new client component


// This is an async Server Component
export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  console.log("SERVER: CompaniesPage Server Component rendering.");
  console.log("SERVER: searchParams received:", searchParams);

  try {
    const allCompanies = await getAllCompanies();
    console.log(`SERVER: Fetched ${allCompanies.length} companies.`);
    const allLocationOptions = await getCompanyLocationOptions();
    console.log(`SERVER: Fetched ${allLocationOptions.length} location options.`);

    return (
      <CompaniesClientPage
        initialCompanies={allCompanies}
        initialLocationOptions={allLocationOptions}
      />
    );
  } catch (error) {
    console.error("SERVER: Error in CompaniesPage Server Component:", error);
    // You can render a basic error message here for server-side errors
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">Error loading companies. Please try again later.</p>
      </div>
    );
  }
}