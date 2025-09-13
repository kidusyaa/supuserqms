// src/components/CompanyFilterSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

import { LocationOption } from "@/type";

interface CompanyFilterSectionProps {
  allLocationOptions: LocationOption[];
}

export default function CompanyFilterSection({ allLocationOptions }: CompanyFilterSectionProps) {
  const router = useRouter();
  const currentUrlSearchParams = useSearchParams();

  // Local state for the search input field
  const [localSearchTerm, setLocalSearchTerm] = useState<string>("");
  const [selectedLocations, setSelectedLocations] = useState<LocationOption[]>([]);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);

  // Effect to synchronize local state with URL search params
  useEffect(() => {
    const urlSearchTerm = currentUrlSearchParams.get('searchTerm');
    setLocalSearchTerm(urlSearchTerm || "");

    const urlLocations = currentUrlSearchParams.get('locations');
    if (urlLocations) {
      const initialLocValues = urlLocations.split(';');
      const preselected = allLocationOptions.filter(loc =>
        initialLocValues.includes(loc.value)
      );
      setSelectedLocations(preselected);
    } else {
      setSelectedLocations([]);
    }
  }, [currentUrlSearchParams, allLocationOptions]);

  // Debounced function to update the URL for search term
  const debouncedApplySearch = useCallback(
    (newSearchTerm: string) => {
      const queryParams = new URLSearchParams(currentUrlSearchParams.toString());
      if (newSearchTerm) {
        queryParams.set('searchTerm', newSearchTerm);
      } else {
        queryParams.delete('searchTerm');
      }
      router.push(`/companies?${queryParams.toString()}`);
    },
    [router, currentUrlSearchParams]
  );

  // Effect for the debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only apply if the local search term differs from the URL's search term
      // This prevents applying on initial load if the term is already in the URL
      if (localSearchTerm !== (currentUrlSearchParams.get('searchTerm') || '')) {
         debouncedApplySearch(localSearchTerm);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchTerm, debouncedApplySearch, currentUrlSearchParams]);


  const handleLocationToggle = (location: LocationOption) => {
    setSelectedLocations((prev) => {
      const isSelected = prev.some((l) => l.value === location.value);
      if (isSelected) {
        return prev.filter((l) => l.value !== location.value);
      } else {
        return [...prev, location];
      }
    });
  };

  const applyLocationFilters = () => {
    const queryParams = new URLSearchParams(currentUrlSearchParams.toString());
    if (selectedLocations.length > 0) {
      queryParams.set('locations', selectedLocations.map(loc => loc.value).join(';'));
    } else {
      queryParams.delete('locations');
    }
    router.push(`/companies?${queryParams.toString()}`);
    setLocationPopoverOpen(false); // Close popover after applying
  };

  const clearAllFilters = () => {
    setLocalSearchTerm("");
    setSelectedLocations([]);
    router.push('/companies');
  };

  const activeFiltersCount = (localSearchTerm ? 1 : 0) + selectedLocations.length;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Search Term Input - Simplified for Instant Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search company name or description..."
            className="w-full pl-10 h-11 text-base border-border/50 focus:border-primary text-foreground"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>

        {/* Location Filter Popover */}
        <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-11 flex-shrink-0 w-full justify-start text-base border-border/50 focus:border-primary text-foreground"
            >
              <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
              Location ({selectedLocations.length})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0 bg-popover text-popover-foreground border-border shadow-lg">
            <Command className="[&_[cmdk-group]]:px-2 [&_[cmdk-group]_:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]_span]:ml-2 [&_[cmdk-item]_span]:flex-1 [&_[cmdk-item]_span]:text-sm">
              <CommandInput placeholder="Search location..." className="h-10 text-base placeholder-muted-foreground" />
              <CommandList>
                <CommandEmpty className="text-muted-foreground">No location found.</CommandEmpty>
                <CommandGroup>
                  {allLocationOptions.map((loc) => (
                    <CommandItem
                      key={loc.value}
                      onSelect={() => handleLocationToggle(loc)}
                      className="hover:bg-muted text-foreground"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedLocations.some((l) => l.value === loc.value)
                            ? "opacity-100 text-primary"
                            : "opacity-0"
                        }`}
                      />
                      {loc.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
             {/* Apply button for locations inside popover */}
             <div className="p-2 border-t border-border mt-2">
                <Button onClick={applyLocationFilters} className="w-full">Apply Location</Button>
             </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
        {activeFiltersCount > 0 ? (
          <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{activeFiltersCount} filter(s) active:</span>
            {localSearchTerm && (
              <Badge variant="secondary" className="pr-1">
                Search: "{localSearchTerm}"
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => setLocalSearchTerm("")}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedLocations.map(loc => (
              <Badge key={loc.value} variant="secondary" className="pr-1">
                {loc.label}
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => handleLocationToggle(loc)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button variant="link" size="sm" onClick={clearAllFilters} className="text-red-500 hover:text-red-600">
              Clear All
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No filters applied.</span>
        )}
      </div>
    </div>
  );
}   