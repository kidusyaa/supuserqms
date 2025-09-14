// src/app/companies/page.tsx
import { getAllCompanies, getCompanyLocationOptions } from '@/lib/supabase-utils';
import CompaniesClientPage from '@/components/company-componets/CompaniesClientPage';
import React from 'react';

export default async function CompaniesPage() {
  try {
    const allCompanies = await getAllCompanies();
    const allLocationOptions = await getCompanyLocationOptions();

    return (
      <CompaniesClientPage
        initialCompanies={allCompanies}
        initialLocationOptions={allLocationOptions}
      />
    );
  } catch (error) {
    console.error("SERVER: Error in CompaniesPage Server Component:", error);
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">
          Error loading companies. Please try again later.
        </p>
      </div>
    );
  }
}