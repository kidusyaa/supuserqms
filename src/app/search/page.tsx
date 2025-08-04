"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";

// ✨ CORRECTED IMPORT: Get everything from your central types file

import { ServiceWithDetails } from "@/type";
// Import your mock data
import { mockServices } from "@/components/data/services";
import { mockCompanies } from "@/components/data/company";
import { mockQueueItems } from "@/components/data/queueItem";

// Import the reusable component
import ServiceCard from "../../../components/Servicescard"; // Use your correct path

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  // The local definition of ServiceWithDetails is no longer needed here.

  const servicesWithDetails: ServiceWithDetails[] = useMemo(() => {
    return mockServices.map((service) => {
      const company = mockCompanies.find((c) => c.id === service.companyId);
      const queueCount = mockQueueItems.filter(
        (q) => q.serviceId === service.id && q.status === "waiting"
      ).length;
      return { ...service, company, queueCount };
    });
  }, []);

  const filteredServices = useMemo(() => {
    if (!query) return [];
    const searchLower = query.toLowerCase();
    return servicesWithDetails.filter(
      (service) =>
        service.status === "active" &&
        (service.name.toLowerCase().includes(searchLower) ||
          service.company?.name.toLowerCase().includes(searchLower) ||
          service.code.toLowerCase().includes(searchLower))
    );
  }, [query, servicesWithDetails]);

  return (
     <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <Link href="/" className="inline-block">
             <Button variant="ghost" size="sm" className="mb-4 -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">
            Search Results for "{query}"
          </h1>
          <p className="text-slate-600 mt-1">{filteredServices.length} services found</p>
        </header>

        <main>
          {filteredServices.length > 0 ? (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 flex flex-col items-center">
              <Frown className="w-16 h-16 text-slate-400 mb-4" />
              <h2 className="text-2xl font-semibold text-slate-800">No Results Found</h2>
              <p className="text-slate-500 mt-2">
                We couldn't find any services matching your search. Try a different term.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}