"use client";

import { useState, useEffect, useMemo } from "react";
import { getAllServices } from "@/lib/firebase-utils";
import FilterNav from "@/components/FilterNav";
import { Service, FilterState } from "@/type";
import Link from "next/link";
// LocationOption and useAuth are not directly related to the fix, but keeping them.
import { useAuth } from "@/lib/AuthContext";
import { LocationOption } from "@/type";

const initialFilterState: FilterState = {
  searchTerm: '',
  location: null,
  categoryId: null,
  showNoQueue: false,
  isFavorite: false,
};

export default function ServicesListPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // Fetches active services from the database.
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const allServices = await getAllServices(); // returns only active
      setServices(allServices);
      setLoading(false);
    };
    fetchServices();
  }, []);

  // useMemo hook now filters out inactive services first.
  const filteredServices = useMemo(() => {
    // --- THIS IS THE KEY CHANGE ---
    // 1. Start by filtering for active services only.
    let filtered = services.filter(service => service.status === 'active');

    // 2. Then, apply all other user-driven filters to the already-active list.
    
    // Apply search term filter
    if (filters.searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        service.company?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.categoryId) {
      filtered = filtered.filter(service => service.categoryId === filters.categoryId);
    }

    // Apply location filter
    if (filters.location?.value) {
        if (filters.location.value === 'my_location') {
            console.log("Filtering by 'Near Me' is not yet implemented.");
        } else {
            // Filtering by a specific company location
            filtered = filtered.filter(service => service.companyId === filters.location?.value);
        }
    }
    
    // ... add other filters like isFavorite in the same way

    return filtered;

  }, [services, filters]); // Re-run when the full service list or filters change

  // The rest of your JSX is perfect and requires no changes.
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