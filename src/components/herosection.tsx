"use client"

import { useState,useEffect, useMemo } from "react"
import { Search, MapPin,LayoutGrid, Users, Check  } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null,
  companyIds: [],
};

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
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

  const handleSearch = () => {
    // In a real application, you would typically navigate to a search results page
    // or trigger a search function in a parent component, passing the 'filters' state.
    console.log("Searching with filters:", filters);
    // Example: router.push(`/search?${new URLSearchParams(filters).toString()}`);
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
       <TooltipProvider>
      <section className="relative overflow-hidden bg-gradient-to-br from-accent/5 via-background to-accent/10 py-20 lg:py-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(120,119,198,0.08),transparent_50%)]"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-accent/8 rounded-full blur-lg"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Find & Book Services
              <span className="text-accent block">Made Simple</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Connect with trusted service providers in your area. From home
              repairs to personal care, book quality services with confidence.
            </p>
          </div>

          {/* Enhanced Search Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card backdrop-blur-sm rounded-2xl shadow-xl border p-6 md:p-8">
            <div>
                 {/* Search Input */}
                <div className="relative md:col-span-1">
                  {" "}
                  {/* Adjusted to span 1 column, allowing 3 filters + search */}
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="What service do you need?"
                    value={filters.searchTerm}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        searchTerm: e.target.value,
                      }))
                    }
                    className="pl-10 h-12 text-base border-border/50 focus:border-accent"
                  />
                </div>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Select (using Popover/Command) */}
                <Popover
                  open={categoryPopoverOpen}
                  onOpenChange={setCategoryPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 flex-shrink-0 w-full justify-start text-base border-border/50 focus:border-accent"
                      disabled={dataLoading}
                    >
                      <LayoutGrid className="mr-2 h-5 w-5" />
                      {selectedCategoryLabel}
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
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    filters.categoryId === cat.id
                                      ? "opacity-100"
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
               </div>

                {/* Location Select (using Popover/Command) */}
                <Popover
                  open={locationPopoverOpen}
                  onOpenChange={setLocationPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 flex-shrink-0 w-full justify-start text-base border-border/50 focus:border-accent"
                      disabled={dataLoading}
                    >
                      <MapPin className="mr-2 h-5 w-5" />
                      Location{" "}
                      {selectedLocationCount > 0 && `(${selectedLocationCount})`}
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

                {/* Company Select (using Popover/Command) - Added from FilterNav */}
                <Popover
                  open={companyPopoverOpen}
                  onOpenChange={setCompanyPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 flex-shrink-0 w-full justify-start text-base border-border/50 focus:border-accent"
                      disabled={dataLoading}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Company{" "}
                      {selectedCompanyCount > 0 && `(${selectedCompanyCount})`}
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

              <Button
                size="lg"
                onClick={handleSearch}
                className="w-full mt-6 h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Search className="h-5 w-5 mr-2" />
                Find Services
              </Button>
            </div>
       </div>
      </section>
    </TooltipProvider>
  )
}
