"use client";

import { useState, useEffect, useMemo } from "react";
import { getAllServices } from "@/lib/firebase-utils";
import FilterNav from "@/components/FilterNav";
import { Service, FilterState } from "@/type";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext"; 
import { LocationOption } from "@/type";

const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null, // This is ready to be used
  companyIds: [],
};

export default function ServicesListPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      // IMPORTANT: Make sure getAllServices() fetches the 'categoryId' field for each service
      const allServices = await getAllServices(); 
      setServices(allServices);
      setLoading(false);
    };
    fetchServices();
  }, []);

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
      // selectedLocationValues will be an array of strings like: ["4 Kilo, Addis Ababa"]
      const selectedLocationValues = filters.locations.map((loc) => loc.value);
      
      filtered = filtered.filter(
        (service) =>
          // Check if the company's location string is in our array of selected locations
          service.company?.location &&
          selectedLocationValues.includes(service.company.location)
      );
    }


    // --- THIS IS THE NEW LOGIC ---
    // If a categoryId is selected in the filters, apply this filter.
    if (filters.categoryId) {
      filtered = filtered.filter(
        (service) => service.categoryId === filters.categoryId
      );
    }

    return filtered;
  }, [services, filters]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Find a Service</h1>
        <p className="text-slate-500 mt-1">Discover and book services from top companies near you.</p>
      </div>

      <FilterNav onFilterChange={setFilters} />

      {loading ? (
        <div className="text-center text-slate-500 mt-10">Loading services...</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center text-slate-500 mt-10 bg-slate-50 p-8 rounded-lg">
          <h3 className="text-xl font-semibold text-slate-700">No Services Found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredServices.map(service => (
            <Link 
              key={service.id} 
              href={`/services/${service.id}?companyId=${service.companyId}`} 
              className="block bg-white rounded-lg shadow border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="text-xl font-bold text-blue-900 mb-1">{service.name}</div>
              {service.company && (
                <div className="text-sm font-medium text-slate-500 mb-2">{service.company.name}</div>
              )}
              <p className="text-slate-600 mb-4 text-sm line-clamp-2">{service.description}</p>
              <div className="flex gap-4 text-sm text-slate-700 border-t pt-3 mt-3">
                <span><strong className="text-green-600">${service.price}</strong></span>
                <span className="border-l pl-4">~{service.estimatedWaitTime} min</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}