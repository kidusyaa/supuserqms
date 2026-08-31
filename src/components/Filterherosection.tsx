"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  Scissors,
  Sparkles,
  HeartHandshake,
  Paintbrush,
  Smile,
  X,
  Search,
  Check,
} from "lucide-react";
import { getLocations } from "@/lib/api";
import { getAllCompanyTypes } from "@/lib/supabase-utils";
import type { CompanyType, Location as AppLocation } from "@/type";

export interface HeroLocationOption {
  id: string;
  label: string; // e.g. "Addis Ababa — Bole"
  value: string; // e.g. "Bole, Addis Ababa"
  neighborhood: string; // e.g. "Bole"
}

import { DATABASE_CATEGORIES } from "@/lib/categoryIcons";

// Price presets for quick selection
const pricePresets = [
  { id: "all", label: "Any price", min: "", max: "" },
  { id: "under_500", label: "Under 500 ETB", min: "0", max: "500" },
  { id: "500_1500", label: "500 – 1,500 ETB", min: "500", max: "1500" },
  { id: "1500_3000", label: "1,500 – 3,000 ETB", min: "1500", max: "3000" },
  { id: "3000_plus", label: "3,000+ ETB", min: "3000", max: "" },
];

export default function Filterherosection() {
  const router = useRouter();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<HeroLocationOption | null>(null);
  const [selectedCompanyTypeIds, setSelectedCompanyTypeIds] = useState<string[]>([]);
  const [selectedPricePreset, setSelectedPricePreset] = useState<string>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [displayMethod, setDisplayMethod] = useState<string>("all");

  // Modals / Drawers state
  const [locationOpen, setLocationOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Options fetched from DB
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
  const [locationOptions, setLocationOptions] = useState<HeroLocationOption[]>([]);

  // Desktop popover refs
  const locationRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch company types and locations
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [fetchedTypes, fetchedLocations] = await Promise.all([
          getAllCompanyTypes(),
          getLocations(),
        ]);

        setCompanyTypes(fetchedTypes || []);

        // Fallback default neighborhoods
        const defaultNeighborhoods = [
          "Bole",
          "Kazanchis",
          "CMC",
          "Sarbet",
          "Piassa",
          "Mexico",
          "Gerji",
          "Summit",
          "Megenagna",
          "22 Mazoria",
        ];

        let formatted: HeroLocationOption[] = [];
        if (fetchedLocations && fetchedLocations.length > 0) {
          const uniquePlaces = new Set<string>();
          fetchedLocations.forEach((loc: AppLocation) => {
            const neighborhood = (loc.place || loc.city || "").trim();
            if (neighborhood && !uniquePlaces.has(neighborhood.toLowerCase())) {
              uniquePlaces.add(neighborhood.toLowerCase());
              formatted.push({
                id: loc.id,
                label: `Addis Ababa — ${neighborhood}`,
                value: `${neighborhood}, Addis Ababa`,
                neighborhood,
              });
            }
          });
        }

        if (formatted.length === 0) {
          const defaultNeighborhoods = [
            "Bole",
            "Kazanchis",
            "CMC",
            "Sarbet",
            "Piassa",
            "Bethel",
            "Mexico",
            "Gerji",
            "Summit",
            "Megenagna",
          ];
          formatted = defaultNeighborhoods.map((name, idx) => ({
            id: `loc-${idx}`,
            label: `Addis Ababa — ${name}`,
            value: `${name}, Addis Ababa`,
            neighborhood: name,
          }));
        }

        // Add "Addis Ababa" as all areas option at the top
        formatted.unshift({
          id: "all-addis",
          label: "Addis Ababa",
          value: "Addis Ababa",
          neighborhood: "All areas",
        });

        setLocationOptions(formatted);
      } catch (error) {
        console.error("Failed to load filter data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  // Close desktop dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (locationRef.current && !locationRef.current.contains(target)) {
        // Only close if window width is desktop
        if (window.innerWidth >= 640) {
          setLocationOpen(false);
        }
      }
      if (filtersRef.current && !filtersRef.current.contains(target)) {
        if (window.innerWidth >= 640) {
          setFiltersOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    const isAnyMobileOpen = (locationOpen || filtersOpen) && window.innerWidth < 640;
    if (isAnyMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [locationOpen, filtersOpen]);

  // Handle Search Submission
  const handleSearchSubmit = (overrides?: {
    searchTerm?: string;
    location?: HeroLocationOption | null;
    companyTypeIds?: string[];
    minPrice?: string;
    maxPrice?: string;
    displayMethod?: string;
  }) => {
    const term = overrides?.searchTerm !== undefined ? overrides.searchTerm : searchTerm;
    const loc = overrides?.location !== undefined ? overrides.location : selectedLocation;
    const typeIds = overrides?.companyTypeIds !== undefined ? overrides.companyTypeIds : selectedCompanyTypeIds;
    const minP = overrides?.minPrice !== undefined ? overrides.minPrice : minPrice;
    const maxP = overrides?.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
    const method = overrides?.displayMethod !== undefined ? overrides.displayMethod : displayMethod;

    const queryParams = new URLSearchParams();

    if (term.trim()) {
      queryParams.set("searchTerm", term.trim());
    }
    if (loc && loc.value !== "Addis Ababa") {
      queryParams.set("locations", loc.value);
    }
    if (typeIds.length > 0) {
      queryParams.set("companyTypeIds", typeIds.join(","));
    }
    if (minP) {
      queryParams.set("minPrice", minP);
    }
    if (maxP) {
      queryParams.set("maxPrice", maxP);
    }
    if (method && method !== "all") {
      queryParams.set("displayMethod", method);
    }

    setLocationOpen(false);
    setFiltersOpen(false);
    router.push(`/services?${queryParams.toString()}`);
  };

  // Select location handler
  const handleLocationSelect = (loc: HeroLocationOption) => {
    setSelectedLocation(loc.value === "Addis Ababa" ? null : loc);
    setLocationOpen(false);
  };

  // Toggle company type
  const handleTypeToggle = (typeId: string) => {
    setSelectedCompanyTypeIds((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  // Price preset change
  const handlePricePresetSelect = (preset: typeof pricePresets[0]) => {
    setSelectedPricePreset(preset.id);
    setMinPrice(preset.min);
    setMaxPrice(preset.max);
  };

  // Category quick click
  const handleCategoryClick = (cat: typeof DATABASE_CATEGORIES[0]) => {
    const matchedType = companyTypes.find(
      (ct) =>
        ct.id === cat.id ||
        ct.name.toLowerCase().includes(cat.search.toLowerCase()) ||
        cat.name.toLowerCase().includes(ct.name.toLowerCase())
    );
    if (matchedType) {
      handleSearchSubmit({ companyTypeIds: [matchedType.id] });
    } else {
      handleSearchSubmit({ searchTerm: cat.name });
    }
  };

  // Filtered locations based on drawer search input
  const filteredLocations = locationOptions.filter((loc) =>
    loc.label.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    loc.neighborhood.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const activeFiltersCount =
    (selectedLocation ? 1 : 0) +
    selectedCompanyTypeIds.length +
    (selectedPricePreset !== "all" || minPrice || maxPrice ? 1 : 0) +
    (displayMethod !== "all" ? 1 : 0);

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* ── SEARCH CARD CONTAINER ── */}
      <div className="max-w-xl mx-auto space-y-3">

        {/* 1. Large Rounded Search Bar */}
        <div className="relative flex items-center bg-white rounded-full px-4 py-3 sm:py-3.5 shadow-xl border border-slate-200 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/15 transition-all">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="search"
            inputMode="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchSubmit();
              }
            }}
            placeholder="Search services or businesses"
            className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 text-sm sm:text-base font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Two Pills Row: Location Pill + Filters Pill */}
        <div className="flex items-center gap-2.5">

          {/* 📍 Location Pill */}
          <div className="relative flex-1" ref={locationRef}>
            <button
              type="button"
              onClick={() => {
                setFiltersOpen(false);
                setLocationOpen(!locationOpen);
              }}
              className="w-full bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-full py-2.5 px-4 text-white text-xs sm:text-sm font-semibold flex items-center justify-between transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Icon icon="solar:map-point-bold" className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">
                  {selectedLocation ? selectedLocation.neighborhood : "Addis Ababa"}
                </span>
              </div>
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-white transition-all shrink-0 ml-1.5"
              />
            </button>

            {/* Desktop Location Popover Dropdown */}
            {locationOpen && (
              <div className="hidden sm:block absolute top-full left-0 mt-2.5 w-80 bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-slate-200 p-4.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <h4 className="font-serif font-bold text-slate-900 text-sm">Choose location</h4>
                  <button
                    onClick={() => setLocationOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search input inside popover */}
                <div className="relative flex items-center bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200 mb-3">
                  <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    placeholder="Search a neighborhood..."
                    className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
                  />
                  {locationSearchQuery && (
                    <button onClick={() => setLocationSearchQuery("")} className="cursor-pointer">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Popular areas
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {filteredLocations.map((loc) => {
                    const isSelected =
                      (selectedLocation === null && loc.value === "Addis Ababa") ||
                      selectedLocation?.id === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleLocationSelect(loc)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${isSelected
                            ? "bg-amber-50 text-amber-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon
                            icon="solar:map-point-linear"
                            className={`w-4 h-4 ${isSelected ? "text-amber-500" : "text-slate-400"}`}
                          />
                          <span className="truncate">{loc.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 🎛 Filters Pill */}
          <div className="relative shrink-0" ref={filtersRef}>
            <button
              type="button"
              onClick={() => {
                setLocationOpen(false);
                setFiltersOpen(!filtersOpen);
              }}
              className={`bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-full py-2.5 px-4 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${filtersOpen || activeFiltersCount > 0 ? "ring-2 ring-amber-400/50" : ""
                }`}
            >
              <Icon icon="solar:tuning-2-linear" className="w-4 h-4 text-amber-400" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Desktop Filters Popover Dropdown */}
            {filtersOpen && (
              <div className="hidden sm:block absolute top-full right-0 mt-2.5 w-96 bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-slate-200 p-5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:tuning-2-bold" className="w-4 h-4 text-amber-500" />
                    <h4 className="font-serif font-bold text-slate-900 text-sm">Filter Services</h4>
                  </div>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {/* Categories */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Categories
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {companyTypes.map((type) => {
                        const isSelected = selectedCompanyTypeIds.includes(type.id);
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => handleTypeToggle(type.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isSelected
                                ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                          >
                            {type.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Range Presets */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Price Range
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {pricePresets.map((preset) => {
                        const isSelected = selectedPricePreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePricePresetSelect(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${isSelected
                                ? "bg-slate-900 border-slate-900 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Min / Max Inputs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-200">
                        <span className="text-slate-400 text-xs mr-1.5">Min</span>
                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) => {
                            setMinPrice(e.target.value);
                            setSelectedPricePreset("custom");
                          }}
                          placeholder="0"
                          className="w-full bg-transparent text-xs text-slate-800 outline-none"
                        />
                        <span className="text-slate-400 text-[10px]">ETB</span>
                      </div>
                      <div className="flex items-center bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-200">
                        <span className="text-slate-400 text-xs mr-1.5">Max</span>
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => {
                            setMaxPrice(e.target.value);
                            setSelectedPricePreset("custom");
                          }}
                          placeholder="5000"
                          className="w-full bg-transparent text-xs text-slate-800 outline-none"
                        />
                        <span className="text-slate-400 text-[10px]">ETB</span>
                      </div>
                    </div>
                  </div>

                  {/* Sort / Display By */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Sort By
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "all", label: "All" },
                        { id: "popular", label: "Popular" },
                        { id: "discounted", label: "Discounts" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDisplayMethod(item.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${displayMethod === item.id
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompanyTypeIds([]);
                      setSelectedPricePreset("all");
                      setMinPrice("");
                      setMaxPrice("");
                      setDisplayMethod("all");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-full font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Apply Filters</span>
                    <Icon icon="solar:arrow-right-linear" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── MOBILE: LOCATION BOTTOM SHEET DRAWER (Slides up from bottom) ── */}
      {locationOpen && mounted && createPortal(
        <div className="sm:hidden fixed inset-0 z-[99999] flex flex-col justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setLocationOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl z-10 max-h-[82vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Drag handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="font-serif font-bold text-xl text-slate-900 tracking-tight">
                Choose location
              </h3>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search a neighborhood Input */}
            <div className="relative flex items-center bg-white rounded-2xl px-3.5 py-3 border border-slate-200 mb-4 shadow-2xs">
              <Search className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                placeholder="Search a neighborhood"
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
              />
              {locationSearchQuery && (
                <button onClick={() => setLocationSearchQuery("")}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Location List Header */}
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">
              Popular areas
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-left">
              {filteredLocations.map((loc) => {
                const isSelected =
                  (selectedLocation === null && loc.value === "Addis Ababa") ||
                  selectedLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleLocationSelect(loc)}
                    className="w-full py-3.5 flex items-center justify-between text-left transition-colors active:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        icon="solar:map-point-linear"
                        className={`w-5 h-5 ${isSelected ? "text-amber-600" : "text-slate-400"}`}
                      />
                      <span className={`text-sm ${isSelected ? "text-amber-600 font-bold" : "text-slate-800 font-medium"}`}>
                        {loc.label}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MOBILE: FILTERS BOTTOM SHEET DRAWER (Slides up from bottom) ── */}
      {filtersOpen && mounted && createPortal(
        <div className="sm:hidden fixed inset-0 z-[99999] flex flex-col justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setFiltersOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Drag handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="font-serif font-bold text-xl text-slate-900 tracking-tight">
                Filters
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompanyTypeIds([]);
                    setSelectedPricePreset("all");
                    setMinPrice("");
                    setMaxPrice("");
                    setDisplayMethod("all");
                  }}
                  className="text-xs font-bold text-amber-600 hover:underline px-2 py-1"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Content */}
            <div className="flex-1 overflow-y-auto space-y-5 text-left py-2">

              {/* Business Categories */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">
                  Service Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {companyTypes.map((type) => {
                    const isSelected = selectedCompanyTypeIds.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleTypeToggle(type.id)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${isSelected
                            ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Price Range
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {pricePresets.map((preset) => {
                    const isSelected = selectedPricePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePricePresetSelect(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isSelected
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                    <span className="text-slate-400 text-xs mr-2">Min</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setSelectedPricePreset("custom");
                      }}
                      placeholder="0"
                      className="w-full bg-transparent text-sm text-slate-800 outline-none"
                    />
                    <span className="text-slate-400 text-xs">ETB</span>
                  </div>
                  <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                    <span className="text-slate-400 text-xs mr-2">Max</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setSelectedPricePreset("custom");
                      }}
                      placeholder="5000"
                      className="w-full bg-transparent text-sm text-slate-800 outline-none"
                    />
                    <span className="text-slate-400 text-xs">ETB</span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Sort By
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "all", label: "All Services" },
                    { id: "popular", label: "Popular" },
                    { id: "discounted", label: "Discounts" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDisplayMethod(item.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${displayMethod === item.id
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Apply Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-3.5 rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Apply Filters</span>
                <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 6 DATABASE CATEGORY ICONS UNDERNEATH ── */}
      <div className="mt-8 sm:mt-10">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 max-w-4xl mx-auto">
          {DATABASE_CATEGORIES.map((cat) => {
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className="group flex flex-col items-center justify-center p-1 transition-all duration-200 focus:outline-none cursor-pointer"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/95 hover:bg-amber-500 text-amber-600 hover:text-white shadow-md border border-white/30 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:shadow-lg transition-all duration-200">
                  <Icon
                    icon={cat.icon}
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-amber-600 group-hover:text-white transition-colors"
                  />
                </div>
                <span className="text-[11px] sm:text-xs md:text-sm font-bold text-white drop-shadow-md group-hover:text-amber-300 text-center mt-2 transition-colors whitespace-nowrap">
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