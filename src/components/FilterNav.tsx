"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FilterState, LocationOption, Category } from "@/type";
import { getAllCategories, getCompanyLocations } from "@/lib/firebase-utils";

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
// --- NEW: Import Tooltip components for better UX on disabled items ---
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, MapPin, LayoutGrid, Users, X, Check } from "lucide-react";

interface FilterNavProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null,
  companyIds: [],
};

const staticLocations: LocationOption[] = [
  { value: "bole", label: "Bole" },
  { value: "4_kilo", label: "4 Kilo" },
  { value: "piassa", label: "Piassa" },
  { value: "cmc", label: "CMC" },
  { value: "megenagna", label: "Megenagna" },
  { value: "kazanchis", label: "Kazanchis" },
];

export default function FilterNav({
  onFilterChange,
  initialFilters,
}: FilterNavProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...initialFilterState,
    ...initialFilters,
  });

  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [companyOptions, setCompanyOptions] = useState<LocationOption[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [fetchedCategories, fetchedCompanies] = await Promise.all([
          getAllCategories(),
          getCompanyLocations(),
        ]);
        setCategories(fetchedCategories);
        setCompanyOptions(fetchedCompanies);
      } catch (error) {
        console.error("Failed to load filter data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

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

  // --- FIXED: This function now correctly handles removing the category ---
  const handleRemoveFilter = (key: keyof FilterState, valueToRemove?: any) => {
    setFilters((prev) => {
      switch (key) {
        case "searchTerm":
          return { ...prev, searchTerm: "" };
        case "categoryId":
          // This is the key fix: it sets the categoryId back to null
          return { ...prev, categoryId: null };
        case "companyIds":
          return {
            ...prev,
            companyIds: prev.companyIds.filter((id) => id !== valueToRemove),
          };
        case "locations":
          return {
            ...prev,
            locations: prev.locations.filter(
              (loc) => loc.value !== valueToRemove
            ),
          };
        default:
          return prev;
      }
    });
  };

  const handleClearFilters = () => {
    setFilters(initialFilterState);
  };

  const activeFiltersForDisplay = useMemo(() => {
    const active = [];
    if (filters.searchTerm)
      active.push({
        type: "searchTerm",
        label: `Search: "${filters.searchTerm}"`,
      });
    // --- FIXED: This now correctly sets the type so handleRemoveFilter works ---
    if (filters.categoryId) {
      const catName = categories.find((c) => c.id === filters.categoryId)?.name;
      if (catName)
        active.push({
          type: "categoryId",
          value: filters.categoryId,
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

  // --- NEW: A boolean to control when other filters are enabled ---
  const isCategorySelected = !!filters.categoryId;

  return (
    <TooltipProvider>
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          {/* --- CHANGE: Category filter moved to the front --- */}
          <Popover
            open={categoryPopoverOpen}
            onOpenChange={setCategoryPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 flex-shrink-0 w-full md:w-auto"
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
                            setFilters((prev) => ({
                              ...prev,
                              categoryId: cat.id,
                            }));
                            setCategoryPopoverOpen(false);
                          }}
                        >
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* --- CHANGE: Search input is now disabled until category is selected --- */}
          <div className="relative flex-grow  w-full md:w-auto">
            <Tooltip>
              <TooltipTrigger asChild className="w-full">
                <div>
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
                      isCategorySelected ? "text-slate-400" : "text-slate-300"
                    }`}
                  />
                  <Input
                    placeholder="Search services or companies..."
                    className="w-full pl-10 h-11"
                    value={filters.searchTerm}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        searchTerm: e.target.value,
                      }))
                    }
                    disabled={!isCategorySelected}
                  />
                </div>
              </TooltipTrigger>
              {!isCategorySelected && (
                <TooltipContent>
                  <p>Please select a category first</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {/* --- CHANGE: Location filter is disabled with a tooltip --- */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Popover
                    open={locationPopoverOpen}
                    onOpenChange={setLocationPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 flex-shrink-0"
                        disabled={!isCategorySelected}
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
                          <CommandGroup>
                            {staticLocations.map((loc) => (
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
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </TooltipTrigger>
              {!isCategorySelected && (
                <TooltipContent>
                  <p>Please select a category first</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* --- CHANGE: Company filter is disabled with a tooltip --- */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Popover
                    open={companyPopoverOpen}
                    onOpenChange={setCompanyPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 flex-shrink-0"
                        disabled={!isCategorySelected}
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
              {!isCategorySelected && (
                <TooltipContent>
                  <p>Please select a category first</p>
                </TooltipContent>
              )}
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
