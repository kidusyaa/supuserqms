// components/Filterherosection.tsx
"use client";
import React from 'react'
import { useState, useEffect, useMemo } from "react"
import { Search, MapPin, LayoutGrid, Users, Check, Building, House, LayoutDashboard } from "lucide-react" // Added Building icon
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from 'next/navigation';
import { FilterState, LocationOption, CompanyType, Location as AppLocation } from "@/type";
import { getLocations } from "@/lib/api"; // getCategories is no longer needed
import { getCompanyOptions, getAllCompanyTypes } from "@/lib/supabase-utils";

// --- FIX 1: Update FilterState to use companyTypeIds and remove categoryId ---
const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null,
  companyIds: [],
  companyTypeIds: [],
};


export default function Filterherosection() {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [dataLoading, setDataLoading] = useState(true);

  // Popover open states
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [companyTypePopoverOpen, setCompanyTypePopoverOpen] = useState(false); // Renamed for clarity

  // Data states
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]); // Renamed for clarity
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<LocationOption[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [fetchedCompanyTypes, fetchedLocations, fetchedCompanyOptions] =
          await Promise.all([
            getAllCompanyTypes(), // Correctly fetching company types
            getLocations(),
            getCompanyOptions(),
          ]);

        const formattedLocations: LocationOption[] = fetchedLocations.map(
          (location: AppLocation) => ({
            id: location.id,
            value: `${location.place}, ${location.city}`,
            label: `${location.place}, ${location.city}`,
          })
        );

        setCompanyTypes(fetchedCompanyTypes);
        setLocationOptions(formattedLocations);
        setCompanyOptions(fetchedCompanyOptions);
      } catch (error) {
        console.error("Failed to load filter data in HeroSection:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handlers for filter changes
  const handleLocationToggle = (location: LocationOption) => {
    setFilters((prev) => {
      const isSelected = prev.locations.some((l) => l.value === location.value);
      if (isSelected) {
        return {
          ...prev,
          locations: prev.locations.filter((l) => l.value !== location.value),
        };
      } else {
        return { ...prev, locations: [...prev.locations, location] };
      }
    });
  };

  const handleCompanyToggle = (companyId: string) => {
    setFilters((prev) => {
      const isSelected = prev.companyIds.includes(companyId);
      if (isSelected) {
        return {
          ...prev,
          companyIds: prev.companyIds.filter((id) => id !== companyId),
        };
      } else {
        return { ...prev, companyIds: [...prev.companyIds, companyId] };
      }
    });
  };
  const handleCompanyTypeToggle = (typeId: string) => {
    setFilters((prev) => {
      const newTypeIds = prev.companyTypeIds.includes(typeId)
        ? prev.companyTypeIds.filter((id) => id !== typeId) // Remove if already selected
        : [...prev.companyTypeIds, typeId]; // Add if not selected
      return { ...prev, companyTypeIds: newTypeIds };
    });
  };

  // --- MODIFIED: handleSearch function for navigation ---
  const handleSearch = () => {
    const queryParams = new URLSearchParams();

    if (filters.searchTerm) {
      queryParams.set('searchTerm', filters.searchTerm);
    }
    // --- FIX 3: Correctly handle the companyTypeIds array ---
    if (filters.companyTypeIds.length > 0) {
      // Join the array into a comma-separated string for the URL
      queryParams.set('companyTypeIds', filters.companyTypeIds.join(','));
    }
    if (filters.companyIds.length > 0) {
      queryParams.set('companyIds', filters.companyIds.join(','));
    }
    if (filters.locations.length > 0) {
      queryParams.set('locations', filters.locations.map(loc => loc.value).join(';'));
    }

    // Navigate to the services page with the encoded filters
    // This will now go to a URL like /services?companyTypeIds=type1,type2
    router.push(`/services?${queryParams.toString()}`);
  };

  // Helper to display selected items in buttons if needed
  const selectedTypeLabel = useMemo(() => {
    const count = filters.companyTypeIds.length;
    if (count === 0) return "Select Type";
    if (count === 1) {
      return companyTypes.find((c) => c.id === filters.companyTypeIds[0])?.name || "Select Type";
    }
    return `${count} Types Selected`;
  }, [filters.companyTypeIds, companyTypes]);

  const selectedLocationCount = filters.locations.length;
  const selectedCompanyCount = filters.companyIds.length;
  const selectedCompanyTypeCount = filters.companyTypeIds.length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl md:rounded-full shadow-2xl border border-gray-150 p-2 md:p-3 transition-all duration-300 hover:shadow-orange-500/5 focus-within:ring-2 focus-within:ring-primary/20">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search services or companies..."
              className="w-full pl-12 pr-4 h-12 text-base text-gray-900 placeholder-gray-400 bg-transparent border-none shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  searchTerm: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // prevent form submission or page reload
                  handleSearch();     // 🔑 trigger search
                }
              }}
              // --- This makes the phone keyboard show a "Search" button instead of just Enter ---
              type="search"
              inputMode="search"
            />
          </div>

          {/* Desktop Vertical Separator */}
          <div className="hidden md:block h-8 w-[1px] bg-gray-200 mx-3" />

          {/* Location Popover */}
          <div className="w-full md:w-auto">
            <Popover
              open={locationPopoverOpen}
              onOpenChange={setLocationPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-12 w-full md:w-auto justify-start md:justify-center text-base font-medium text-gray-700 hover:bg-gray-50 border-0 rounded-full px-4 gap-2 flex-shrink-0"
                  disabled={dataLoading}
                >
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="truncate">
                    {selectedLocationCount > 0 
                      ? `${selectedLocationCount} Location${selectedLocationCount > 1 ? 's' : ''}` 
                      : "Location"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[280px] p-0 bg-popover text-popover-foreground border-border shadow-lg"
              >
                <Command className="[&_[cmdk-group]]:px-2 [&_[cmdk-group]_:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]_span]:ml-2 [&_[cmdk-item]_span]:flex-1 [&_[cmdk-item]_span]:text-sm">
                  <CommandInput placeholder="Search location..." className="h-10 text-base placeholder-muted-foreground" />
                  <CommandList>
                    <CommandEmpty className="text-muted-foreground">No location found.</CommandEmpty>
                    {dataLoading ? (
                      <CommandItem className="text-muted-foreground">Loading locations...</CommandItem>
                    ) : (
                      <CommandGroup>
                        {locationOptions.map((loc) => (
                          <CommandItem
                            key={loc.value}
                            onSelect={() => handleLocationToggle(loc)}
                            className="hover:bg-muted text-foreground cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${filters.locations.some(
                                (l) => l.value === loc.value
                              )
                                  ? "opacity-100 text-primary"
                                  : "opacity-0"
                                }`}
                            />
                            {loc.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Desktop Spacer / Separator */}
          <div className="hidden md:block w-4" />

          {/* Submit Button */}
          <Button
            size="lg"
            onClick={handleSearch}
            className="w-full md:w-auto h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl md:rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
          >
            <Search className="h-5 w-5 md:mr-2" />
            <span className="md:inline">Find Services</span>
          </Button>

        </div>
      </div>
    </div>
  );
}
