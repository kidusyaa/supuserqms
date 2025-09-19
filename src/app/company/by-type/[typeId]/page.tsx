// app/companies/by-type/[typeId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCompanyTypeById, getCompaniesByType } from "@/lib/supabase-utils";
import { Company, CompanyType } from "@/type";
import DivCenter from "@/components/divCenter"; // Assuming you have this component
import CompanyCard from "@/components/CompanyCard"; // Import our new component

export default function CompaniesByTypePage() {
  const params = useParams();
  const typeId = params.typeId as string;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyType, setCompanyType] = useState<CompanyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!typeId) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch both the type details and the list of companies in parallel
      const [typeData, companiesData] = await Promise.all([
        getCompanyTypeById(typeId),
        getCompaniesByType(typeId),
      ]);

      setCompanyType(typeData);
      setCompanies(companiesData);
      setIsLoading(false);
    };

    fetchData();
  }, [typeId]); // Re-run the effect if the typeId changes

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-orange-500 font-semibold text-xl">Loading companies...</div>
      </div>
    );
  }

  if (!companyType) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 font-semibold text-xl">Company type not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <DivCenter>
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-orange-600">
              {companyType.name}
            </h1>
            <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
              {companyType.description || `Browse all companies under the ${companyType.name} type.`}
            </p>
          </div>

          {/* Companies Grid */}
          {companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-700">No Companies Found</h3>
                <p className="mt-2 text-gray-500">
                    There are currently no companies listed under the "{companyType.name}" type.
                </p>
            </div>
          )}
        </div>
      </DivCenter>
    </div>
  );
}