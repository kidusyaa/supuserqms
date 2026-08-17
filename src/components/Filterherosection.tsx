// components/Filterherosection.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Check,
  Building,
  Scissors,
  Sparkles,
  HeartHandshake,
  Paintbrush,
  Smile,
  X,
  LayoutGrid,
  Filter,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FilterState, LocationOption, CompanyType, Location as AppLocation } from "@/type";
import { getLocations } from "@/lib/api";
import { getCompanyOptions, getAllCompanyTypes } from "@/lib/supabase-utils";

const initialFilterState: FilterState = {
  searchTerm: "",
  locations: [],
  categoryId: null,
  companyIds: [],
  companyTypeIds: [],
};

// 5 Main Categories
const mainCategories = [
  {
    id: "barber",
    name: "Barber",
    typeSearch: "barber",
    icon: Scissors,
  },
  {
    id: "hair_salon",
    name: "Hair Salon",
    typeSearch: "beauty",
    icon: Sparkles,
  },
  {
    id: "massage",
    name: "Massage",
    typeSearch: "massage",
    icon: HeartHandshake,
  },
  {
    id: "nail",
    name: "Nails",
    typeSearch: "nail",
    icon: Paintbrush,
  },
  {
    id: "skincare",
    name: "Skincare",
    typeSearch: "skin",
    icon: Smile,
  },
];

export default function Filterherosection() {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [dataLoading, setDataLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayMethod, setDisplayMethod] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobilePortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close desktop/mobile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      if (mobilePortalRef.current && mobilePortalRef.current.contains(target)) {
        return;
      }
      setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent background scrolling when mobile full screen filter is open
  useEffect(() => {
    if (dropdownOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [dropdownOpen]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [fetchedCompanyTypes, fetchedLocations] = await Promise.all([
          getAllCompanyTypes(),
          getLocations(),
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
      } catch (error) {
        console.error("Failed to load filter data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const handleCompanyTypeToggle = (typeId: string) => {
    setFilters((prev) => {
      const newTypeIds = prev.companyTypeIds.includes(typeId)
        ? prev.companyTypeIds.filter((id) => id !== typeId)
        : [...prev.companyTypeIds, typeId];
      return { ...prev, companyTypeIds: newTypeIds };
    });
  };

  const handleSearch = (overrides?: Partial<FilterState>) => {
    const activeFilters = { ...filters, ...overrides };
    const queryParams = new URLSearchParams();

    if (activeFilters.searchTerm) {
      queryParams.set("searchTerm", activeFilters.searchTerm);
    }
    if (activeFilters.companyTypeIds.length > 0) {
      queryParams.set("companyTypeIds", activeFilters.companyTypeIds.join(","));
    }
    if (activeFilters.companyIds.length > 0) {
      queryParams.set("companyIds", activeFilters.companyIds.join(","));
    }
    if (activeFilters.locations.length > 0) {
      queryParams.set(
        "locations",
        activeFilters.locations.map((loc) => loc.value).join(";")
      );
    }
    if (displayMethod && displayMethod !== "all") {
      queryParams.set("displayMethod", displayMethod);
    }

    setDropdownOpen(false);
    router.push(`/services?${queryParams.toString()}`);
  };

  const handleCategoryClick = (cat: typeof mainCategories[0]) => {
    const matchedType = companyTypes.find((ct) =>
      ct.name.toLowerCase().includes(cat.typeSearch.toLowerCase())
    );

    if (matchedType) {
      handleSearch({ companyTypeIds: [matchedType.id] });
    } else {
      handleSearch({ searchTerm: cat.name });
    }
  };

  const activeFilterCount =
    filters.locations.length +
    filters.companyTypeIds.length +
    (filters.searchTerm ? 1 : 0) +
    (displayMethod !== "all" ? 1 : 0);

  const FilterBodyContent = () => (
    <div className="space-y-6">
      {/* Location Filter */}
      <div>
        <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-500" />
          Select Location
        </label>
        {dataLoading ? (
          <p className="text-xs text-slate-400 py-2">Loading locations...</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
            {locationOptions.map((loc) => {
              const isSelected = filters.locations.some((l) => l.value === loc.value);
              return (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => handleLocationToggle(loc)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-amber-50 border-amber-500 text-amber-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  {loc.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Business Category Types Filter */}
      <div>
        <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Building className="w-4 h-4 text-amber-500" />
          Business Category
        </label>
        <div className="flex flex-wrap gap-2">
          {companyTypes.map((type) => {
            const isSelected = filters.companyTypeIds.includes(type.id);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleCompanyTypeToggle(type.id)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                {type.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Method of Displaying Services */}
      <div>
        <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4 text-amber-500" />
          Display Services By
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "all", label: "All Services" },
            { id: "popular", label: "Most Popular" },
            { id: "discounted", label: "Special Offers / Discounts" },
            { id: "nearest", label: "Nearest to Me" },
          ].map((method) => {
            const isSelected = displayMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setDisplayMethod(method.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{method.label}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4" ref={dropdownRef}>
      {/* Unified Search Bar */}
      <div className="relative z-30">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl md:rounded-full p-2 flex items-center gap-2 transition-all hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
          <div className="pl-3 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="search"
            inputMode="search"
            value={filters.searchTerm}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search services, businesses, or location..."
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-sm sm:text-base py-2.5 px-2"
          />
          {filters.searchTerm && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchTerm: "" }))}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`p-3 rounded-xl md:rounded-full transition-all flex items-center justify-center relative cursor-pointer ${
              dropdownOpen || activeFilterCount > 0
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-amber-500 hover:text-white"
            }`}
            title="Filter services"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && !dropdownOpen && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* 1. DESKTOP FILTER POPOVER (Hidden on Mobile) */}
        {dropdownOpen && (
          <div className="hidden sm:block absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Filter Services</h3>
              </div>
              <button
                onClick={() => setDropdownOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterBodyContent />

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setFilters(initialFilterState);
                  setDisplayMethod("all");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
              >
                Clear all filters
              </button>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Go & Filter Services
              </button>
            </div>
          </div>
        )}

        {/* 2. MOBILE FULL SCREEN FILTER OVERLAY (Portaled directly to body with z-[99999]) */}
        {dropdownOpen && mounted && createPortal(
          <div ref={mobilePortalRef} className="fixed inset-0 z-[99999] bg-white flex flex-col justify-between overflow-hidden sm:hidden animate-in fade-in duration-200">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
              <button
                type="button"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 text-slate-900 font-bold text-base hover:text-amber-600 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-6 h-6 text-amber-500" />
                <span>Back</span>
              </button>
              <span className="font-extrabold text-slate-900 text-base">Filter Services</span>
              <button
                type="button"
                onClick={() => {
                  setFilters(initialFilterState);
                  setDisplayMethod("all");
                }}
                className="text-xs font-bold text-amber-600 hover:underline px-2 py-1"
              >
                Reset
              </button>
            </div>

            {/* Search Input Bar Inside Mobile Filter View */}
            <div className="px-4 pt-3 pb-2 bg-slate-50/80 border-b border-slate-100">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block text-left">
                Search Keyword
              </label>
              <div className="relative flex items-center bg-white rounded-full px-3.5 py-2.5 border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all shadow-xs">
                <Search className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" />
                <input
                  type="search"
                  inputMode="search"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Search services, businesses, or location..."
                  className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none border-none font-medium"
                />
                {filters.searchTerm && (
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, searchTerm: "" }))}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Filter Options Body */}
            <div className="flex-1 overflow-y-auto p-4 text-left">
              <FilterBodyContent />
            </div>

            {/* Bottom Action Bar with "Go & Filter Services" Button */}
            <div className="p-4 border-t border-slate-200 bg-white shadow-2xl sticky bottom-0 z-20">
              <button
                type="button"
                onClick={() => handleSearch()}
                className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-3.5 px-6 rounded-full font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Go & Filter Services</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* 5 Main Category Icons with Tertiary Background Opacity & Bottom Radius */}
      <div className="mt-8 sm:mt-10">
        <div className="grid grid-cols-5 gap-2 sm:gap-4 max-w-2xl mx-auto">
          {mainCategories.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className="group flex flex-col items-center justify-center p-1.5 transition-all duration-200 focus:outline-none"
              >
                {/* Icon container with tertiary opacity background and bottom radius */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-tertiary/10 text-tertiary hover:bg-amber-100 hover:text-amber-700 shadow-xs border border-tertiary/10 rounded-b-2xl rounded-t-lg flex items-center justify-center group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
                  <CatIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-tertiary group-hover:text-amber-700 transition-colors" />
                </div>
                {/* Centered label below icon */}
                <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-amber-600 text-center mt-2 transition-colors line-clamp-1">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}