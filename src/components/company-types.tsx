"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { getCompanyTypesWithCounts } from "@/lib/supabase-utils";
import { CompanyTypeWithCount } from "@/type";

// This mapping uses the names from your database. 
// Make sure these strings match your database 'name' column exactly.
const categoryImages: Record<string, string> = {
  "Barbershop": "/catgorylist/barbershop (1).png",
  "Beauty Salon": "/catgorylist/woman-hair.png",
  "Makeup Artist": "/catgorylist/makeover.png",
  "Massage Parlor": "/catgorylist/spa.png",
  "Nail Studio": "/catgorylist/nail-polish.png",
  "Skincare Clinic": "/catgorylist/skincare (1).png",
};

export default function CompanyTypesPage() {
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompanyTypes = async () => {
      try {
        const data = await getCompanyTypesWithCounts();
        setCompanyTypes(data);
      } catch (error) {
        console.error("Error loading company types:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyTypes();
  }, []);

  const SkeletonCard = () => (
    <div className="flex items-center gap-4 p-5 rounded-2xl border bg-white animate-pulse">
      <div className="h-16 w-16 rounded-full bg-gray-200"></div>
      <div className="flex-1">
        <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-slate-900">
            Explore by Category
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Discover and book the best local service providers
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companyTypes.map((type) => {
              // FIX: Use type.name to find the image, fallback to cosmetics if not found
              const imageSrc = categoryImages[type.name] || "/catgorylist/cosmetics.png";

              return (
                <Link
                  key={type.id}
                  href={`/company?companyTypeId=${type.id}`}
                  className="group flex items-center gap-5 bg-white border rounded-3xl p-6 hover:shadow-xl transition-all duration-300"
                >
                  {/* Image Container */}
                  <div className="relative h-20 w-20 flex-shrink-0 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                    <Image
                      src={imageSrc}
                      alt={type.name}
                      fill
                      className="object-cover p-3" // added padding so icons don't hit the edges
                      sizes="80px"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-slate-900 truncate">
                      {type.name}
                    </h3>
                    <p className="text-gray-500 text-lg">
                      {type.company_count}{" "}
                      {type.company_count === 1 ? "provider" : "providers"}
                    </p>
                  </div>

                  {/* Arrow Button */}
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}