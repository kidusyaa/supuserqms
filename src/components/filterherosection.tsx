// components/Filterherosection.tsx
"use client";
import React from 'react'
import { useState, useEffect, useMemo } from "react"
import { Search, MapPin, LayoutGrid, Users, Check } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { FilterState, LocationOption, Category, Location as AppLocation } from "@/type";
import { getCategories, getLocations } from "@/lib/api";
import { getCompanyOptions } from "@/lib/supabase-utils";

// --- NEW: Import useRouter ---
import { useRouter } from 'next/navigation';

const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null,
  companyIds: [],
};

export default function Filterherosection() {
  // --- NEW: Initialize useRouter ---
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [dataLoading, setDataLoading] = useState(true);

  // Popover open states
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<LocationOption[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [fetchedCategories, fetchedLocations, fetchedCompanyOptions] =
          await Promise.all([
            getCategories(),
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

        setCategories(fetchedCategories);
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

  // --- MODIFIED: handleSearch function for navigation ---
  const handleSearch = () => {
    const queryParams = new URLSearchParams();

    if (filters.searchTerm) {
      queryParams.set('searchTerm', filters.searchTerm);
    }
    if (filters.categoryId) {
      queryParams.set('categoryId', filters.categoryId);
    }
    if (filters.companyIds.length > 0) {
      queryParams.set('companyIds', filters.companyIds.join(',')); // Join array with commas
    }
    if (filters.locations.length > 0) {
      // For locations, join by semicolon as location names might contain commas
      queryParams.set('locations', filters.locations.map(loc => loc.value).join(';'));
    }

    // Navigate to the services page with the encoded filters
    router.push(`/services?${queryParams.toString()}`);
  };

  // Helper to display selected items in buttons if needed
  const selectedCategoryLabel = useMemo(() => {
    return (
      categories.find((c) => c.id === filters.categoryId)?.name ||
      "Select Category"
    );
  }, [filters.categoryId, categories]);

  const selectedLocationCount = filters.locations.length;
  const selectedCompanyCount = filters.companyIds.length;

  return (
    <div>
      <div className="max-w-4xl mx-auto ">
        <div className="bg-card backdrop-blur-sm rounded-2xl shadow-xl border border-border p-4 md:p-8">
          {/* --- NEW: Search input field outside the grid, for a full-width appearance --- */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search services or companies..."
              className="w-full pl-12 h-12 text-base border-border/50 focus:border-accent text-foreground hover:bg-muted"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  searchTerm: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Popover
              open={categoryPopoverOpen}
              onOpenChange={setCategoryPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 flex-shrink-0 w-full justify-start text-base border-border/50 focus:border-accent text-foreground hover:bg-muted"
                  disabled={dataLoading}
                >
                  <LayoutGrid className="mr-2 h-5 w-5 text-muted-foreground" />
                  {selectedCategoryLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[250px] p-0 bg-popover text-popover-foreground border-border shadow-lg"
              >
                <Command className="[&_[cmdk-group]]:px-2 [&_[cmdk-group]_:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]_span]:ml-2 [&_[cmdk-item]_span]:flex-1 [&_[cmdk-item]_span]:text-sm">
                  <CommandInput placeholder="Search category..." className="h-10 text-base placeholder-muted-foreground" />
                  <CommandList>
                    {dataLoading ? (
                      <CommandItem className="text-muted-foreground">Loading...</CommandItem>
                    ) : (
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            onSelect={() => {
                              setFilters((prev) => ({
                                ...prev,
                                categoryId: cat.id,
                              }));
                              setCategoryPopoverOpen(false);
                            }}
                            className="hover:bg-muted text-foreground"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                filters.categoryId === cat.id
                                  ? "opacity-100 text-primary"
                                  : "opacity-0"
                              }`}
                            />
                            {cat.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Popover
              open={locationPopoverOpen}
              onOpenChange={setLocationPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 flex-shrink-0 w-full justify-start text-base border-border/50 focus:border-accent text-foreground hover:bg-muted"
                  disabled={dataLoading}
                >
                  <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                  Location{" "}
                  {selectedLocationCount > 0 && `(${selectedLocationCount})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[250px] p-0 bg-popover text-popover-foreground border-border shadow-lg"
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
                            className="hover:bg-muted text-foreground"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                filters.locations.some(
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

            <Popover
              open={companyPopoverOpen}
              onOpenChange={setCompanyPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 flex-shrink-0 w-full justify-start text-base border-border/50 focus:border-accent text-foreground hover:bg-muted"
                  disabled={dataLoading}
                >
                  <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                  Company{" "}
                  {selectedCompanyCount > 0 && `(${selectedCompanyCount})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[250px] p-0 bg-popover text-popover-foreground border-border shadow-lg"
              >
                <Command className="[&_[cmdk-group]]:px-2 [&_[cmdk-group]_:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]_span]:ml-2 [&_[cmdk-item]_span]:flex-1 [&_[cmdk-item]_span]:text-sm">
                  <CommandInput placeholder="Search company..." className="h-10 text-base placeholder-muted-foreground" />
                  <CommandList>
                    {dataLoading ? (
                      <CommandItem className="text-muted-foreground">Loading...</CommandItem>
                    ) : (
                      <CommandGroup>
                        {companyOptions.map((company) => (
                          <CommandItem
                            key={company.value}
                            onSelect={() =>
                              handleCompanyToggle(company.value)
                            }
                            className="hover:bg-muted text-foreground"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                filters.companyIds.includes(company.value)
                                  ? "opacity-100 text-primary"
                                  : "opacity-0"
                              }`}
                            />
                            {company.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="lg"
            onClick={handleSearch}
            className="w-full mt-6 h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl focus-visible:outline-ring"
          >
            <Search className="h-5 w-5 mr-2" />
            Find Services
          </Button>
        </div>
      </div>
    </div>
  )
}