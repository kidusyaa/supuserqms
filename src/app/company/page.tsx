// Save this code in: src/app/companies/page.tsx

import {
  getAllCompanies,
  getCompanyLocationOptions,
  getAllCompanyTypes,
} from "@/lib/supabase-utils";
import CompaniesClientPage from "@/components/company-componets/CompaniesClientPage"; // Make sure this path is correct
import React from "react";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  try {
    // Read the companyTypeId from the URL search parameters
    const initialCompanyTypeId = searchParams.companyTypeId as string | undefined;

    // Fetch all the data needed for the page
    const [allCompanies, allLocationOptions, allCompanyTypes] = await Promise.all([
      getAllCompanies(),
      getCompanyLocationOptions(),
      getAllCompanyTypes(),
    ]);

    // Render the client component and pass the data and initial filter as props
    return (
      <CompaniesClientPage
        initialCompanies={allCompanies}
        initialLocationOptions={allLocationOptions}
        initialCompanyTypes={allCompanyTypes}
        initialCompanyTypeId={initialCompanyTypeId} 
      />
    );
  } catch (error) {
    console.error("SERVER: Error in CompaniesPage:", error);
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Error loading companies.</p>
      </div>
    );
  }
}