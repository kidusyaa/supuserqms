// components/ServiceListClient.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import FilterNav from "@/components/FilterNav";
import { Service, FilterState, Category, LocationOption } from "@/type";
import ServiceCard from "./ServiceCard";
import Link from "next/link";
// Removed useSearchParams as it's not strictly needed for initial load,
// but keep it if you plan to update the URL client-side later.
// import { useSearchParams } from 'next/navigation';

const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null,
  companyIds: [],
  companyTypeIds: [],
};

interface ServiceListClientProps {
  initialServices: Service[];
  allCategories: Category[];
  allLocationOptions: LocationOption[];
  allCompanyOptions: LocationOption[];
  allCompanyTypeOptions: LocationOption[];
  // This prop will now reliably be a plain object
  serverSearchParams: { [key: string]: string | string[] | undefined };
}

export default function ServiceListClient({
  initialServices,
  allCategories,
  allLocationOptions,
  allCompanyOptions,
  allCompanyTypeOptions,
  serverSearchParams,
}: ServiceListClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [loadingServices, setLoadingServices] = useState(false); // For future client-side refetches

  useEffect(() => {
    // --- Logging for debugging ---
    console.log("ServiceListClient (Client): Initializing filters from serverSearchParams:", serverSearchParams);

    const initialFiltersFromUrl: Partial<FilterState> = {};

    // searchTerm
    if (serverSearchParams.searchTerm) { // Now directly accessible
      initialFiltersFromUrl.searchTerm = serverSearchParams.searchTerm as string;
    }

    // categoryId
    if (serverSearchParams.categoryId) { // Now directly accessible
      const foundCategory = allCategories.find(c => c.id === serverSearchParams.categoryId);
      if (foundCategory) {
        initialFiltersFromUrl.categoryId = foundCategory.id;
      }
    }

    // companyIds
    if (serverSearchParams.companyIds) { // Now directly accessible
      const idsFromUrl = (serverSearchParams.companyIds as string).split(',');
      initialFiltersFromUrl.companyIds = allCompanyOptions
        .filter(co => idsFromUrl.includes(co.value))
        .map(co => co.value);
    }

    // companyTypeIds
    if (serverSearchParams.companyTypeIds) { // Now directly accessible
      const idsFromUrl = (serverSearchParams.companyTypeIds as string).split(',');
      initialFiltersFromUrl.companyTypeIds = allCompanyTypeOptions
        .filter(ct => idsFromUrl.includes(ct.value))
        .map(ct => ct.value);
    }

    // locations
    if (serverSearchParams.locations) { // Now directly accessible
      const locValuesFromUrl = (serverSearchParams.locations as string).split(';');
      initialFiltersFromUrl.locations = allLocationOptions.filter(loc =>
        locValuesFromUrl.includes(loc.value)
      );
    }

    // --- Logging for debugging ---
    console.log("ServiceListClient (Client): Constructed initialFiltersFromUrl:", initialFiltersFromUrl);

    setFilters(prevFilters => {
      const newFilters = { ...initialFilterState, ...initialFiltersFromUrl };
      // Prevent unnecessary re-renders if the filters are already the same
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        console.log("ServiceListClient (Client): Filters are already the same, skipping state update.");
        return prevFilters;
      }
      console.log("ServiceListClient (Client): Setting filters state to:", newFilters);
      return newFilters;
    });

  }, [serverSearchParams, allCategories, allLocationOptions, allCompanyOptions, allCompanyTypeOptions]);

  // Memoize the filter function for performance
  const filteredServices = useMemo(() => {
    // --- Logging for debugging ---
    console.log("ServiceListClient (Client): Re-filtering services. Current filters:", filters);

    let currentFiltered = services; // Start with the full list of services

    if (filters.searchTerm) {
      const lowercasedTerm = filters.searchTerm.toLowerCase();
      currentFiltered = currentFiltered.filter(
        (service) =>
          service.name.toLowerCase().includes(lowercasedTerm) ||
          service.company?.name?.toLowerCase().includes(lowercasedTerm)
      );
    }

    if (filters.companyIds.length > 0) {
      currentFiltered = currentFiltered.filter((service) =>
        filters.companyIds.includes(service.company_id)
      );
    }

    if (filters.companyTypeIds.length > 0) {
      currentFiltered = currentFiltered.filter((service) => {
        // Check if the service's company has any of the selected company types
        const companyTypes = (service.company as any)?.company_company_types || [];
        return companyTypes.some((ct: any) => 
          filters.companyTypeIds.includes(ct.company_type_id)
        );
      });
    }

    if (filters.locations.length > 0) {
      const selectedLocationValues = filters.locations.map((loc) => loc.value);
      currentFiltered = currentFiltered.filter(
        (service) =>
          service.company?.location_text &&
          selectedLocationValues.includes(service.company.location_text)
      );
    }

    if (filters.categoryId) {
      currentFiltered = currentFiltered.filter(
        (service) => service.category_id === filters.categoryId
      );
    }

    console.log("ServiceListClient (Client): Filtered services count:", currentFiltered.length);
    return currentFiltered;
  }, [services, filters]);


  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Find a Service</h1>
        <p className="text-slate-500 mt-1">Discover and book services from top companies near you.</p>
      </div>

      <FilterNav
        filters={filters}
        onFilterChange={setFilters} // Pass the setFilters directly
        // IMPORTANT: For optimal performance and consistency,
        // it's highly recommended to pass allCategories, allLocationOptions,
        // allCompanyOptions as props to FilterNav instead of having FilterNav
        // re-fetch them. This reduces redundant API calls.
        // categories={allCategories}
        // locationOptions={allLocationOptions}
        // companyOptions={allCompanyOptions}
      />

        {loadingServices ? (
        <div className="text-center text-muted-foreground mt-10">Loading services...</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center text-muted-foreground mt-10 bg-card p-8 rounded-lg">
          <h3 className="text-xl font-semibold text-foreground">No Services Found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        // --- 2. THIS IS THE REPLACEMENT ---
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-8">
          {filteredServices.map(service => {
            // Find the category for this service *before* rendering the card.
            // This is more efficient than searching inside every card.
            const category = allCategories.find(cat => cat.id === service.category_id);
            
            return (
              <ServiceCard 
                key={service.id} 
                service={service} 
                category={category}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}