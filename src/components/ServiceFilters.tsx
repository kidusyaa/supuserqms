"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, ListFilter } from "lucide-react";

// Define the shape of the filters
export interface Filters {
  searchTerm: string;
  sortBy: string;
  location: string;
}

interface ServiceFiltersProps {
  locations: string[];
  onFilterChange: (filters: Filters) => void;
}

export default function ServiceFilters({
  locations,
  onFilterChange,
}: ServiceFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    sortBy: "default",
    location: "all",
  });

  // When any filter changes, call the parent's callback function
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleSelectChange = (name: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
      {/* Search Input */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input
          placeholder="Search services..."
          value={filters.searchTerm}
          onChange={handleInputChange}
          className="w-full h-12 pl-10 text-base"
        />
      </div>

      <div className="grid grid-cols-2 md:flex md:items-center gap-4">
        {/* Location Filter */}
        <div className="flex items-center gap-2">
           <MapPin className="w-5 h-5 text-slate-500" />
          <Select
            value={filters.location}
            onValueChange={(value) => handleSelectChange("location", value)}
          >
            <SelectTrigger className="w-full md:w-[180px] h-12">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By Filter */}
        <div className="flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-slate-500" />
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleSelectChange("sortBy", value)}
            >
              <SelectTrigger className="w-full md:w-[180px] h-12">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Popularity</SelectItem>
                <SelectItem value="wait-time">Shortest Wait</SelectItem>
                <SelectItem value="queue-size">Less Busy</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>
    </div>
  );
}