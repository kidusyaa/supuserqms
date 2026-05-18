"use client";

import { useState, useMemo } from "react";
import { Service } from "@/type";
import CompanyServiceCard from "./CompanyServiceCard";
import { cn } from "@/lib/utils";
import { X } from "lucide-react"; // Import X icon

interface CompanyServicesListProps {
  services: Service[] | undefined;
  companyTypes: any[] | undefined; 
}

export default function CompanyServicesList({ services, companyTypes }: CompanyServicesListProps) {
  // Initial state is null (showing everything)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  // Filter logic
  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (!selectedTypeId) return services;

    // Find the currently selected company type mapping
    const activeType = companyTypes?.find(t => t.id === selectedTypeId);
    const allowedCategoryIds = activeType?.allowedCategoryIds || [];

    return services.filter((s) => allowedCategoryIds.includes(s.category_id));
  }, [services, selectedTypeId, companyTypes]);

  return (
    <div className="space-y-8">
      {/* Company Type Tabs Section */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md py-4 border-b">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Filter by Business Type
          </p>
          
          {/* Display 'X' Clear button ONLY when a filter is active */}
          {selectedTypeId && (
            <button
              onClick={() => setSelectedTypeId(null)}
              className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors bg-amber-50 px-2 py-1 rounded-lg border border-amber-200"
            >
              <X className="w-3 h-3" />
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {companyTypes?.map((type) => {
            const isActive = selectedTypeId === type.id;

            return (
              <button
                key={type.id}
                onClick={() => setSelectedTypeId(type.id)}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border uppercase tracking-tight",
                  isActive
                    ? "bg-amber-600 text-white border-amber-600 shadow-lg scale-95"
                    : "bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600"
                )}
              >
                {type.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-amber-500 rounded-full"></span>
            {selectedTypeId 
              ? companyTypes?.find(t => t.id === selectedTypeId)?.name 
              : "All Services"}
          </h2>
          <div className="text-xs font-bold text-gray-400 border px-3 py-1 rounded-full">
            {filteredServices.length} {filteredServices.length === 1 ? 'Service' : 'Services'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <CompanyServiceCard key={service.id} service={service} />
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">
                No services available for this category yet.
              </p>
              <button 
                onClick={() => setSelectedTypeId(null)}
                className="mt-4 text-amber-600 font-bold text-sm hover:underline"
              >
                Show all services
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}