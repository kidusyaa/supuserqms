// components/FilterNav.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FilterState, LocationOption, Category, Location } from "@/type";
import { getCategories, getLocations } from "@/lib/api";
import { getCompanyOptions } from "@/lib/supabase-utils";
// UI Imports
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, MapPin, LayoutGrid, Users, X, Check } from "lucide-react";

interface FilterNavProps {
  // Now receives the current filters state as a prop
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isCategoryLocked?: boolean; // This tells the component to disable the category selector
}

const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null,
  companyIds: [],
};

export default function FilterNav({
  onFilterChange,
  filters,
  isCategoryLocked = false,
}: FilterNavProps) {
  // FilterNav no longer manages its own 'filters' state internally.
  // It uses the 'filters' prop directly and calls 'onFilterChange' to request updates.

  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<LocationOption[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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
          (location: Location) => ({
            id: location.id,
            value: `${location.place}, ${location.city}`,
            label: `${location.place}, ${location.city}`,
          })
        );

        setCategories(fetchedCategories);
        setLocationOptions(formattedLocations);
        setCompanyOptions(fetchedCompanyOptions);
      } catch (error) {
        console.error("Failed to load filter data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handlers now call onFilterChange directly
  const handleLocationToggle = (location: LocationOption) => {
    const isSelected = filters.locations.some((l) => l.value === location.value);
    const newLocations = isSelected
      ? filters.locations.filter((l) => l.value !== location.value)
      : [...filters.locations, location];
    onFilterChange({ ...filters, locations: newLocations }); // Corrected
  };

  const handleCompanyToggle = (companyId: string) => {
    const isSelected = filters.companyIds.includes(companyId);
    const newCompanyIds = isSelected
      ? filters.companyIds.filter((id) => id !== companyId)
      : [...filters.companyIds, companyId];
    onFilterChange({ ...filters, companyIds: newCompanyIds }); // Corrected
  };

  const handleRemoveFilter = (key: keyof FilterState, valueToRemove?: any) => {
    switch (key) {
      case "searchTerm":
        onFilterChange({ ...filters, searchTerm: "" });
        break;
      case "categoryId":
        onFilterChange({ ...filters, categoryId: null });
        break;
      case "companyIds":
        onFilterChange({
          ...filters,
          companyIds: filters.companyIds.filter((id) => id !== valueToRemove),
        });
        break;
      case "locations":
        onFilterChange({
          ...filters,
          locations: filters.locations.filter(
            (loc) => loc.value !== valueToRemove
          ),
        });
        break;
      default:
        break;
    }
  };

  const handleClearFilters = () => {
    onFilterChange(initialFilterState);
  };

 const activeFiltersForDisplay = useMemo(() => {
    const active = [];
    if (filters.searchTerm)
      active.push({
        type: "searchTerm",
        // Corrected template literal:
        label: `Search: "${filters.searchTerm}"`,
      });
    if (filters.categoryId) {
      const catName = categories.find((c) => c.id === filters.categoryId)?.name;
      if (catName)
        active.push({
          type: "categoryId",
          value: filters.categoryId,
          // Corrected template literal:
          label: `Category: ${catName}`,
        });
    }
    filters.companyIds.forEach((id) => {
      const compName = companyOptions.find((c) => c.value === id)?.label;
      if (compName)
        active.push({ type: "companyIds", value: id, label: compName });
    });
    filters.locations.forEach((loc) => {
      active.push({ type: "locations", value: loc.value, label: loc.label });
    });
    return active;
  }, [filters, categories, companyOptions]);  
  // const isCategorySelected = !!filters.categoryId;
  const isCategorySelected = true; // Always enable filters for now

  return (
<TooltipProvider>
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          {/* ... (Popover for Category) */}
          <Popover
            open={!isCategoryLocked && categoryPopoverOpen}
            onOpenChange={setCategoryPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 flex-shrink-0 w-full md:w-auto data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70"
                disabled={isCategoryLocked || dataLoading}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                {categories.find((c) => c.id === filters.categoryId)?.name ||
                  "Select Category"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandList>
                  {dataLoading ? (
                    <CommandItem>Loading...</CommandItem>
                  ) : (
                    <CommandGroup>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          onSelect={() => {
                            onFilterChange({
                              ...filters,
                              categoryId: cat.id,
                            });
                            setCategoryPopoverOpen(false);
                          }}
                        >
                          {/* Corrected template literal for className: */}
                          <Check className={`mr-2 h-4 w-4 ${filters.categoryId === cat.id ? "opacity-100" : "opacity-0"}`} />
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="relative  w-full  ">
            <Tooltip>
              <TooltipTrigger asChild className="w-full">
                <div>
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400`}
                  />
                  <Input
                    placeholder="Search services or companies..."
                    className="w-full pl-10 h-11"
                    value={filters.searchTerm}
                    onChange={(e) =>
                      onFilterChange({ // Corrected
                        ...filters,
                        searchTerm: e.target.value,
                      })
                    }
                  />
                </div>
              </TooltipTrigger>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full  ">
                  <Popover
                    open={locationPopoverOpen}
                    onOpenChange={setLocationPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 flex-shrink-0 w-full"
                        disabled={dataLoading}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Location{" "}
                        {filters.locations.length > 0 &&
                          `(${filters.locations.length})`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput placeholder="Search location..." />
                        <CommandList>
                          <CommandEmpty>No location found.</CommandEmpty>
                          {dataLoading ? (
                            <CommandItem>Loading locations...</CommandItem>
                          ) : (
                            <CommandGroup>
                              {locationOptions.map((loc) => (
                                <CommandItem
                                  key={loc.value}
                                  onSelect={() => handleLocationToggle(loc)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      filters.locations.some(
                                        (l) => l.value === loc.value
                                      )
                                        ? "opacity-100"
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
              </TooltipTrigger>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className=" w-full  ">
                  <Popover
                    open={companyPopoverOpen}
                    onOpenChange={setCompanyPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 flex-shrink-0 w-full"
                        disabled={dataLoading}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Company{" "}
                        {filters.companyIds.length > 0 &&
                          `(${filters.companyIds.length})`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput placeholder="Search company..." />
                        <CommandList>
                          {dataLoading ? (
                            <CommandItem>Loading...</CommandItem>
                          ) : (
                            <CommandGroup>
                              {companyOptions.map((company) => (
                                <CommandItem
                                  key={company.value}
                                  onSelect={() =>
                                    handleCompanyToggle(company.value)
                                  }
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      filters.companyIds.includes(company.value)
                                        ? "opacity-100"
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
              </TooltipTrigger>
            </Tooltip>
          </div>
        </div>

        {activeFiltersForDisplay.length > 0 && (
          <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600">
              Active Filters:
            </span>
            {activeFiltersForDisplay.map((filter) => (
              <div
                key={`${filter.type}-${filter.value}`}
                className="flex items-center gap-1 bg-slate-100 text-slate-700 text-sm rounded-full px-2 py-1"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() =>
                    handleRemoveFilter(
                      filter.type as keyof FilterState,
                      filter.value
                    )
                  }
                  className="hover:bg-slate-200 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="link"
              size="sm"
              onClick={handleClearFilters}
              className="text-red-600"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
