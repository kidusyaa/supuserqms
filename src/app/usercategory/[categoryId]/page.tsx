"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, SearchX } from "lucide-react"; // Import new icons

// --- YOUR IMPORTS (UNCHANGED) ---
import FilterNav from "@/components/FilterNav";
import { Service, FilterState } from "@/type";
import {
  getAllServicesByCategory,
  getCategoryById,
} from "@/lib/firebase-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Import Button for a better back link
import DivCenter from "@/components/divCenter";

// --- YOUR STATE AND LOGIC (UNCHANGED) ---
const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null,
  companyIds: [],
};

const ServicesListPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [categoryIcon, setCategoryIcon] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;

  useEffect(() => {
    if (categoryId) {
      const fetchData = async () => {
        setIsLoading(true);
        const [data, category] = await Promise.all([
          getAllServicesByCategory(categoryId),
          getCategoryById(categoryId),
        ]);
        setServices(data);
        setCategoryName(category?.name || categoryId);
        setCategoryIcon(category?.icon || categoryId);
        setIsLoading(false);
      };
      fetchData();
    }
  }, [categoryId]);

  const filteredServices = useMemo(() => {
    let filtered = services;
    if (filters.searchTerm) {
      const lowercasedTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(lowercasedTerm) ||
          service.company?.name?.toLowerCase().includes(lowercasedTerm)
      );
    }
    if (filters.companyIds.length > 0) {
      filtered = filtered.filter((service) =>
        filters.companyIds.includes(service.companyId)
      );
    }
    if (filters.locations.length > 0) {
      const selectedLocationValues = filters.locations.map((loc) => loc.value);
      filtered = filtered.filter(
        (service) =>
          service.company?.location &&
          selectedLocationValues.includes(service.company.location)
      );
    }
    return filtered;
  }, [services, filters]);

  // --- UI/UX IMPROVEMENT: LOADING STATE ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center gap-3 text-lg text-slate-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          Loading services...
        </div>
      </div>
    );
  }

  return (
    <DivCenter>
    <div className="container my-20">
      {/* --- UI/UX IMPROVEMENT: HERO HEADER --- */}
      <div className=" flex justify-between items-center    ">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 text-slate-600 hover:text-slate-900 md:bg-none bg-slate-100 "
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="md:block hidden">Back to Categories</span>
        </Button>
        <div className="flex md:flex-row flex-row-reverse  md:items-center items-end md:gap-4 dm:mt-[-10px] mt-[-20px]">
          <div className="md:text-5xl text-3xl">{categoryIcon}</div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 uppercase">
              {categoryName}
            </h1>
           
          </div>
        </div>
      </div>

      {/* --- YOUR FILTERNAV COMPONENT (UNCHANGED) --- */}
      <div className="my-6">
         <FilterNav
            onFilterChange={setFilters}
            initialFilters={{ categoryId: categoryId }}
            isCategoryLocked={true}
          />
      </div>

      {/* --- UI/UX IMPROVEMENT: BETTER "NO RESULTS" STATE --- */}
      {filteredServices.length === 0 ? (
        <div className="text-center mt-12">
          <div className="flex justify-center">
            <div className="flex flex-col items-center bg-white border rounded-lg p-10 max-w-md">
              <SearchX className="h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700">
                No Services Match Your Filters
              </h3>
              <p className="text-slate-500 mt-2">
                Try removing some filters or adjusting your search to find what
                you're looking for.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // --- YOUR SERVICE CARD GRID (UNCHANGED) ---
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredServices.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}?companyId=${service.companyId}`}
              className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                {service.name}
              </div>
              {service.company && (
                <div className="mt-1 inline-block text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {service.company.name}
                </div>
              )}
              <p className="mt-3 text-slate-600 text-sm line-clamp-2">
                {service.description}
              </p>
              <div className="flex justify-between items-center border-t pt-3 mt-4 text-sm">
                <span className="text-green-600 font-bold text-base">
                  ${service.price}
                </span>
                {service.estimatedWaitTime && (
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    ~{service.estimatedWaitTime} min
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </DivCenter>
  );
};

export default ServicesListPage;