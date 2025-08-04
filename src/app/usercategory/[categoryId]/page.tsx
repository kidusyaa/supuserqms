"use client";

// ✨ 1. REMOVE `use` and IMPORT `useParams`
import { useState, useMemo } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation"; // Import useParams
import { ChevronLeft } from "lucide-react";

import { mockServices } from "@/components/data/services";
import { mockCategories } from "@/components/data/categories";
import { mockCompanies } from "@/components/data/company";
import { mockQueueItems } from "@/components/data/queueItem";

import ServiceCard from "@/components/ServiceCard";
import ServiceFilters, {Filters} from "@/components/ServiceFilters";
import { Button } from "@/components/ui/button";
import { ServiceWithDetails } from "@/type";

// Helper function remains the same
const getServicesWithDetails = (categoryId: string): ServiceWithDetails[] => {
  const servicesForCategory = mockServices.filter(
    (service) => service.categoryId === categoryId
  );
  return servicesForCategory.map((service) => {
    const company = mockCompanies.find((c) => c.id === service.companyId);
    const queueCount = mockQueueItems.filter(
      (q) => q.serviceId === service.id && q.status === "waiting"
    ).length;
    return { ...service, company, queueCount };
  });
};

// ✨ 2. REMOVE `params` FROM THE COMPONENT'S PROPS
export default function CategoryServicesPage() {
  // ✨ 3. USE THE `useParams` HOOK TO GET THE URL PARAMS
  const params = useParams();
  // The hook returns an object like { categoryId: 'some-value' }.
  // We assert the type to string, as we know it will be a string in this route.
  const categoryId = params.categoryId as string; 

  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    sortBy: "default",
    location: "all",
  });

  // Now, use the `categoryId` variable derived from the hook
  const category = useMemo(
    () => mockCategories.find((cat) => cat.id === categoryId),
    [categoryId]
  );

  const baseServices: ServiceWithDetails[] = useMemo(
    () => getServicesWithDetails(categoryId),
    [categoryId]
  );

  const availableLocations = useMemo(() => {
    const locations = baseServices.map((s) => s.company?.location).filter(Boolean);
    return [...new Set(locations)] as string[];
  }, [baseServices]);

  // The rest of the component logic can stay the same
  if (!category) {
    notFound();
  }
  
  const filteredAndSortedServices = useMemo(() => {
    let services = [...baseServices];

    if (filters.searchTerm) {
      services = services.filter((service) =>
        service.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.location !== "all") {
      services = services.filter(
        (service) => service.company?.location === filters.location
      );
    }

    switch (filters.sortBy) {
      case "wait-time":
        services.sort((a, b) => a.estimatedWaitTime - b.estimatedWaitTime);
        break;
      case "queue-size":
        services.sort((a, b) => a.queueCount - b.queueCount);
        break;
      case "price-asc":
        services.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        services.sort((a, b) => Number(b.price) - Number(a.price));
        break;
    }

    return services;
  }, [baseServices, filters]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link href="/">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Categories
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                {category.name}
              </h1>
              <p className="text-slate-600 mt-1">{category.description}</p>
            </div>
          </div>
        </header>

        <ServiceFilters
          locations={availableLocations}
          onFilterChange={setFilters}
        />

        <main>
          {filteredAndSortedServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-slate-800">
                No services found
              </h3>
              <p className="text-slate-500 mt-2">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}