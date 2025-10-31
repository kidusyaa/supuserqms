// pages/company-types.tsx or app/company-types/page.tsx

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CompanyTypeWithCount } from "@/type";
import { getCompanyTypesWithCounts } from "@/lib/supabase-utils";
import {  LayoutDashboard } from "lucide-react"
import DivCenter from "./divCenter";
// --- Image mapping remains the same ---
const categoryImages: { [key: string]: string } = {
  'ctyp_barbershop': '/images/category/barbershop.png',
  'ctyp_beauty_salon': '/images/category/beautysalon.png',
  'ctyp_massage_parlor': '/images/category/massage.png',
};

export default function CompanyTypesPage() {
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyTypes = async () => {
      setIsLoading(true);
      try {
        const data = await getCompanyTypesWithCounts();
        setCompanyTypes(data);
      } catch (error) {
        console.error("Failed to fetch company types:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanyTypes();
  }, []);
  
  // +++ NEW: A skeleton loader that matches the new circular design +++
  const ItemSkeleton = () => (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="h-32 w-32 rounded-full bg-gray-200 md:h-40 md:w-40"></div>
      <div className="h-5 w-28 rounded bg-gray-200"></div>
    </div>
  );

  return (
    <div className=" my-10  ">
    <DivCenter>
     
    <div className=" mx-auto  ">
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid  gap-x-6 gap-y-12 grid-cols-3 ">
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : (
          <div className="grid  gap-x-6 gap-y-12 grid-cols-3">
            {companyTypes.map((type) => (
              // +++ THE NEW "PLANE" DESIGN +++
              <Link
                key={type.id}
                href={`/company?companyTypeId=${type.id}`}
                // The 'group' is essential for hover effects on child elements
                className="group flex flex-col items-center gap-4 text-center"
              >
                {/* 1. Circular Image Container */}
                <div className="relative  overflow-hidden rounded-full ring-2 ring-gray-200 transition-all duration-300 group-hover:ring-4 group-hover:ring-primary h-20 w-20">
                  <Image
                    src={categoryImages[type.id] || '/placeholder.svg'}
                    alt={type.name}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-110 p-2"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                {/* 2. Centered Text Below */}
                <div>
                  <h3 className="md:text-lg text-sm font-bold text-gray-800 transition-colors group-hover:text-primary">
                    {type.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {type.company_count}{" "}
                    {type.company_count === 1 ? "provider" : "providers"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div> 
    </div>
     <div className="flex items-center justify-between md:mb-10 mb-4 pt-5 ">
            <h2 className="text-2xl font-bold text-tertiary flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-orange-500" />
              Business Categories
            </h2>
        </div>
    </DivCenter>
    </div>
  );
}