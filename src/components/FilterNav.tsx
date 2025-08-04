"use client";

import React, { useState, useEffect } from 'react';
import { FilterState,LocationOption } from '@/type';
import { mockCategories } from '@/components/data/categories';
import { mockLocations } from './data/location';
// UI Imports
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, MapPin, LayoutGrid, Users, Heart, X, Check } from 'lucide-react';

interface FilterNavProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

const initialFilterState: FilterState = {
  searchTerm: '',
  location: null,
  categoryId: null,
  showNoQueue: false,
  isFavorite: false,
};

export default function FilterNav({ onFilterChange, initialFilters }: FilterNavProps) {
  const [filters, setFilters] = useState<FilterState>({ ...initialFilterState, ...initialFilters });
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  // Notify parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleUpdateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleUseMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleUpdateFilter('location', {
          value: 'my_location',
          label: 'Near Me',
          coordinates: { lat: latitude, lon: longitude },
        });
        setLocationPopoverOpen(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not get your location. Please enable location services in your browser.");
        setLocationPopoverOpen(false);
      }
    );
  };
  
  return (
    <div className="bg-white p-2 rounded-lg shadow-sm border">
      <div className="flex flex-col md:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search services..."
            className="w-full pl-10 h-11"
            value={filters.searchTerm}
            onChange={(e) => handleUpdateFilter('searchTerm', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {/* Location Filter */}
          <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 flex-shrink-0">
                <MapPin className="mr-2 h-4 w-4" />
                {filters.location ? filters.location.label : "Location"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search location..." />
                <CommandList>
                  <CommandEmpty>No location found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={handleUseMyLocation}>Use my current location</CommandItem>
                    {mockLocations.map((loc) => (
                      <CommandItem key={loc.value} onSelect={() => {
                        handleUpdateFilter('location', loc);
                        setLocationPopoverOpen(false);
                      }}>
                        {loc.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Category Filter */}
          <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 flex-shrink-0">
                <LayoutGrid className="mr-2 h-4 w-4" />
                {filters.categoryId ? mockCategories.find(c => c.id === filters.categoryId)?.name : "Category"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandList>
                    <CommandGroup>
                         <CommandItem onSelect={() => {
                            handleUpdateFilter('categoryId', null);
                            setCategoryPopoverOpen(false);
                        }}>All Categories</CommandItem>
                        {mockCategories.map((cat) => (
                        <CommandItem key={cat.id} onSelect={() => {
                            handleUpdateFilter('categoryId', cat.id);
                            setCategoryPopoverOpen(false);
                        }}>
                            {cat.name}
                        </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* No Queue Filter */}
          <Button
            variant={filters.showNoQueue ? "secondary" : "outline"}
            className="h-11 flex-shrink-0"
            onClick={() => handleUpdateFilter('showNoQueue', !filters.showNoQueue)}
          >
            <Users className="mr-2 h-4 w-4" />
            No Queue
            {filters.showNoQueue && <Check className="ml-2 h-4 w-4" />}
          </Button>

           {/* Favorites Filter */}
           <Button
            variant={filters.isFavorite ? "secondary" : "outline"}
            className="h-11 flex-shrink-0"
            onClick={() => handleUpdateFilter('isFavorite', !filters.isFavorite)}
          >
            <Heart className="mr-2 h-4 w-4" />
            Favorites
            {filters.isFavorite && <Check className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}