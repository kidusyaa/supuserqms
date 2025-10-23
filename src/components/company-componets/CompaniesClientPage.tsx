// components/company-componets/CompaniesClientPage.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Clock, Filter, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Company, LocationOption, CompanyType, WorkingHoursForDay } from "@/type";
import DivCenter from "../divCenter";

interface CompaniesClientPageProps {
  initialCompanies: Company[];
  initialLocationOptions: LocationOption[];
  initialCompanyTypes: CompanyType[];
  initialCompanyTypeId?: string;
}

// Helper to format working hours from your JSONB structure
const formatWorkingHours = (hours: { [key: number]: WorkingHoursForDay[] } | null | undefined): string => {
  if (!hours || Object.keys(hours).length === 0) {
    return "Hours not available";
  }
  // Try to find Monday (day 1) or the first available day
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const weekOrder = [today, 1, 2, 3, 4, 5, 6, 0];
  let dayKey: number | undefined;

  for (const day of weekOrder) {
    if (hours[day]) {
      dayKey = day;
      break;
    }
  }

  if (dayKey === undefined) {
    dayKey = parseInt(Object.keys(hours)[0]);
  }
  
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayKey];
  const dayHours = hours[dayKey]?.[0];

  if (!dayHours) return "Hours not available";
  
  return `${dayName}: ${dayHours.start} - ${dayHours.end}`;
};


export default function CompaniesClientPage({
  initialCompanies,
  initialLocationOptions,
  initialCompanyTypes,
  initialCompanyTypeId, 
}: CompaniesClientPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyType, setSelectedCompanyType] = useState<string>(initialCompanyTypeId || "");

  const filteredCompanies = useMemo(() => {
    let filtered = initialCompanies;

    // Filter by search query (name, location, or company type name)
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(lower) ||
          (company.location_text && company.location_text.toLowerCase().includes(lower)) ||
          company.company_types?.some(type => type.name.toLowerCase().includes(lower))
      );
    }

    // Filter by selected company type
    if (selectedCompanyType) {
      filtered = filtered.filter((company) =>
        company.company_types?.some(type => type.id === selectedCompanyType)
      );
    }

    return filtered;
  }, [initialCompanies, searchTerm, selectedCompanyType]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
     <div className="  bg-tertiary mx-auto p-2 ">
      <div className="px-4 pt-6 pb-4 items-center ">
        <h1 className="text-2xl font-bold text-white  mb-2">Find Companies</h1>
        <p className="text-gray-200  ">Discover local businesses near you</p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center "></div>
      <div className=" px-4 pb-6 space-y-4 sticky top-0  dark:bg-gray-900/80 backdrop-blur-sm z-10 py-2">
        {/* Search Bar */}
        <div className="relative w-full max-w-[800px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search companies, types, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base rounded-full border-gray-500 bg-white"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <Button
            variant={selectedCompanyType === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCompanyType("")}
            className="whitespace-nowrap rounded-full"
          >
            All Types
          </Button>
          {initialCompanyTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedCompanyType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCompanyType(type.id)}
              className="whitespace-nowrap rounded-full"
            >
              {type.name}
            </Button>
          ))}
        </div>
      </div>
</div>
      {/* Results Count */}
      <div className="px-4 py-8">
        <p className="text-sm text-primary font-medium">
          {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"} found
        </p>
      </div>

      {/* Companies Grid */}
      <div className="px-4 pb-24 " >
        {filteredCompanies.length > 0 ? (
          <div className="grid xl:grid-cols-4  lg:grid-cols-3 grid-cols-1  gap-4">
            {filteredCompanies.map((company) => (
              <Link key={company.id} href={`/company/${company.slug}`}>
                <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-none shadow-md   ">
                  <CardContent className="">
                    <div className="flex gap-4 items-start">
                      {/* Company Logo */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                           {company.logo ? (
                            <Image
                              src={company.logo}
                              alt={`${company.name} logo`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building className="w-8 h-8 text-muted-foreground"/>
                          )}
                        </div>
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg leading-tight truncate">{company.name}</h3>
                        {/* Display the first company type as the category */}
                        <p className="text-sm text-muted-foreground truncate">
                          {company.company_types?.[0]?.name || 'Business'}
                        </p>
                        
                        {/* Rating and Reviews are omitted as data is not available */}

                        {/* Location and Hours */}
                        <div className="space-y-1.5 mt-2">
                          {company.location_text && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{company.location_text}</span>
                            </div>
                          )}
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{formatWorkingHours(company.working_hours)}</span>
                            </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          // No Results State
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No companies found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </main>
  );
}