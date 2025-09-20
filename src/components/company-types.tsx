// pages/company-types.tsx or app/company-types/page.tsx

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CompanyTypeWithCount } from "@/type";
import { getCompanyTypesWithCounts } from "@/lib/supabase-utils"; // Use our new API function
import DivCenter from "./divCenter";

export default function CompanyTypesPage() {
  // 1. Update state variable name and type
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyTypes = async () => {
      setIsLoading(true);
      // 2. Call the new API function
      const data = await getCompanyTypesWithCounts();
      setCompanyTypes(data);
      setIsLoading(false);
    };

    fetchCompanyTypes();
  }, []);

  if (isLoading) {
    // A slightly improved loading state to match your app's style
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading business types...</p>
      </div>
    );
  }

  return (
    <div className=" min-h-screen py-12">
      <DivCenter>
        <div className="container mx-auto px-4">
          {/* 3. Update Header */}
          <h1 className="text-4xl font-extrabold text-center mb-10 text-orange-600">
            Browse Companies by Type
          </h1>

          {/* 4. Update Grid and Mapping logic */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companyTypes.map((type) => (
              <Link
                key={type.id}
                href={`/company?companyTypeId=${type.id}`} // MUST start with a "/"
                passHref
                // ... other props
              >
                <div className="group block bg-white rounded-2xl border border-orange-200 shadow-md hover:shadow-xl hover:border-orange-400 transition-all duration-300 cursor-pointer overflow-hidden">
                  {/* Icon + Title */}
                  <div className="p-6 flex items-center gap-4">
                    <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full bg-orange-100 text-4xl group-hover:bg-orange-200 transition-colors duration-300">
                      🏢 {/* Use icon or a default emoji */}
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                        {type.name}
                      </h5>
                      {/* <p className="text-gray-600 text-sm">
                            {type.description}
                        </p> */}
                    </div>
                  </div>

                  {/* 5. Update Footer with company count */}
                  <div className="bg-orange-50 px-6 py-4 text-sm font-semibold text-orange-700 group-hover:bg-orange-100 transition-colors duration-300">
                    {type.company_count}{" "}
                    {type.company_count === 1 ? "company" : "companies"}{" "}
                    available
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DivCenter>
    </div>
  );
}
