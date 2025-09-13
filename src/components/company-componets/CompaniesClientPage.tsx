"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Company, LocationOption } from "@/type";
import DivCenter from "@/components/divCenter";

interface CompaniesClientPageProps {
  initialCompanies: Company[];
  initialLocationOptions: LocationOption[];
}

export default function CompaniesClientPage({
  initialCompanies,
  initialLocationOptions,
}: CompaniesClientPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const filteredCompanies = useMemo(() => {
    let filtered = initialCompanies;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((company) =>
        company.name.toLowerCase().includes(lower)
      );
    }

  if (selectedLocation) {
  filtered = filtered.filter(
    (company) =>
      company.location_text &&
      company.location_text.toLowerCase().includes(selectedLocation.toLowerCase())
  );
}


    return filtered;
  }, [initialCompanies, searchTerm, selectedLocation]);

  return (
<div>
    <div className="bg-tertiary flex items-center justify-center ">
        <DivCenter>
            <div className="my-10 py-5 bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6 md:p-8">
        <div className="text-center mb-8 text-white ">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary ">
              All Companies
            </h1>
            <p className="text-lg text-muted-primary max-w-2xl mx-auto">
              Browse all registered businesses on GizeBook.
            </p>
          </div>
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-10">
            {/* Search bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search company name..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Location filter dropdown */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">All Locations</option>
              {initialLocationOptions.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
          </div>
          </DivCenter>
    </div>
      <section className="py-8 lg:py-16 bg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          

          {/* 🔍 Search + Location Filter */}
          

          {/* Company Grid */}
          {filteredCompanies.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <p className="text-lg font-semibold">
                No companies found matching your search or location.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredCompanies.map((company) => (
                <Link
                  href={`/company/${company.id}`}
                  key={company.id}
                  className="group block bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 overflow-hidden"
                >
                  <div className="flex flex-col h-full">
                    <div className="relative w-full aspect-[4/3] flex items-center justify-center bg-muted/30">
                      {company.logo ? (
                        <Image
                          src={company.logo}
                          alt={`${company.name} Logo`}
                          fill
                          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xl font-bold">
                          {company.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-center flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors duration-200">
                          {company.name}
                        </h3>
                        {company.location_text && (
                          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 truncate">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            {company.location_text}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        className="mt-4 text-primary text-sm hover:underline"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
 </div>
  );
}
