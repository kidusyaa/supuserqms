import {
  getAllCompanies,
  getCompanyLocationOptions,
  getAllCompanyTypes,
} from "@/lib/supabase-utils";
import CompaniesClientPage from "@/components/company-componets/CompaniesClientPage"; 
import React from "react";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    // ✅ Await searchParams before accessing
    const resolvedSearchParams = await searchParams;
    const initialCompanyTypeId = resolvedSearchParams?.companyTypeId as string | undefined;

    const [allCompanies, allLocationOptions, allCompanyTypes] = await Promise.all([
      getAllCompanies(),
      getCompanyLocationOptions(),
      getAllCompanyTypes(),
    ]);

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