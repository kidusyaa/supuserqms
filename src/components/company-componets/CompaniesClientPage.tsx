"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Search, X, Check, MapPin, Clock, Phone, Building2 } from "lucide-react";
import type { Company, LocationOption, CompanyType, WorkingHoursForDay } from "@/type";
import { DATABASE_CATEGORIES, getCategoryIconInfo } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";

interface CompaniesClientPageProps {
  initialCompanies: Company[];
  initialLocationOptions: LocationOption[];
  initialCompanyTypes: CompanyType[];
  initialCompanyTypeId?: string;
}

// Format working hours from JSONB
const formatWorkingHours = (
  hours: { [key: number]: WorkingHoursForDay[] } | null | undefined
): string => {
  if (!hours || Object.keys(hours).length === 0) {
    return "Hours on request";
  }
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const weekOrder = [today, 1, 2, 3, 4, 5, 6, 0].filter((v, i, a) => a.indexOf(v) === i);
  let dayKey: number | undefined;

  for (const day of weekOrder) {
    if (hours[day] && hours[day].length > 0) {
      dayKey = day;
      break;
    }
  }

  if (dayKey === undefined && Object.keys(hours).length > 0) {
    dayKey = parseInt(Object.keys(hours)[0]);
  }

  if (dayKey === undefined) return "Hours on request";

  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayKey];
  const dayHours = hours[dayKey]?.[0];

  if (!dayHours) return "Hours on request";

  return `${dayName}: ${dayHours.start} – ${dayHours.end}`;
};

export default function CompaniesClientPage({
  initialCompanies,
  initialLocationOptions,
  initialCompanyTypes,
  initialCompanyTypeId,
}: CompaniesClientPageProps) {
  // ── States ───────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryChip, setSelectedCategoryChip] = useState<string>(
    initialCompanyTypeId || "all"
  );
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [sortBy, setSortBy] = useState<"recommended" | "name_asc" | "name_desc">("recommended");

  // Dropdown Popover States
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Search inside popovers
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  const filterBarRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
        setLocationDropdownOpen(false);
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Filtering Logic ──────────────────────────────────────────────
  const filteredCompanies = useMemo(() => {
    let result = [...initialCompanies];

    // 1. Search filter (Name, phone, address, location, or type)
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((comp) => {
        const name = comp.name?.toLowerCase() || "";
        const loc = comp.location_text?.toLowerCase() || "";
        const addr = comp.address?.toLowerCase() || "";
        const types = (comp.company_types || []).map((t) => t.name.toLowerCase()).join(" ");
        return name.includes(lower) || loc.includes(lower) || addr.includes(lower) || types.includes(lower);
      });
    }

    // 2. Category / Company Type filter
    if (selectedCategoryChip && selectedCategoryChip !== "all") {
      result = result.filter((comp) => {
        const typeNames = (comp.company_types || []).map((t) => t.name).join(" ");
        const catInfo = getCategoryIconInfo("", "", typeNames || comp.name);
        const hasDirectId = (comp.company_types || []).some((t) => t.id === selectedCategoryChip);
        return catInfo.id === selectedCategoryChip || hasDirectId;
      });
    }

    // 3. Location filter
    if (selectedLocation) {
      const locLower = selectedLocation.toLowerCase();
      result = result.filter((comp) => {
        const fullLoc = `${comp.location_text || ""} ${comp.address || ""}`.toLowerCase();
        return fullLoc.includes(locLower);
      });
    }

    // 4. Sorting
    if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [initialCompanies, searchTerm, selectedCategoryChip, selectedLocation, sortBy]);

  // Selected Category Info
  const selectedCategoryObj = DATABASE_CATEGORIES.find((c) => c.id === selectedCategoryChip);

  // Filtered dropdown categories
  const filteredCategoriesList = DATABASE_CATEGORIES.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Filtered dropdown locations
  const filteredLocationsList = initialLocationOptions.filter((loc) =>
    loc.label.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategoryChip("all");
    setSelectedLocation("");
    setSortBy("recommended");
  };

  const hasActiveFilters =
    searchTerm || selectedCategoryChip !== "all" || selectedLocation;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* ── 1. Page Header ── */}
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-200/60 dark:border-amber-900/40">
            <Icon icon="solar:shop-2-bold" className="w-3.5 h-3.5 text-amber-600" />
            <span>Verified Salons &amp; Clinics</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Top beauty, salon &amp; wellness centers
          </h1>

          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl font-normal">
            Explore verified barbershops, nail studios, beauty salons, skincare clinics and wellness centers in Addis Ababa.
          </p>
        </div>

        {/* ── 2. Unified Search & Filter Card (Clean White, No Shadows, 1px Border) ── */}
        <div
          ref={filterBarRef}
          className="relative z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2.5 sm:p-3 overflow-visible"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2.5">
            {/* Search Input on the Left */}
            <div className="flex-1 flex items-center bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl px-4 py-2.5 border border-slate-200/80 dark:border-slate-700/60 focus-within:border-amber-400 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
              <input
                type="text"
                placeholder="Search salons, clinics, spas or areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills on the Right */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 overflow-visible">
              
              {/* Category Dropdown Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setLocationDropdownOpen(false);
                    setSortDropdownOpen(false);
                    setCategoryDropdownOpen(!categoryDropdownOpen);
                  }}
                  className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                    selectedCategoryChip !== "all"
                      ? "bg-[#0f2937] text-white border-[#0f2937]"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Icon icon="solar:widget-2-linear" className="w-4 h-4 text-amber-500" />
                  <span>
                    {selectedCategoryChip !== "all"
                      ? selectedCategoryObj?.name || "Category"
                      : "Category"}
                  </span>
                  <Icon icon="solar:alt-arrow-down-linear" className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* Category Dropdown Popover */}
                {categoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-2xl z-[999] animate-in fade-in zoom-in-95 duration-150 text-left">
                    {/* Search inside categories */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 mb-2 border border-slate-100 dark:border-slate-700">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search category..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryChip("all");
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                          selectedCategoryChip === "all"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>All Categories</span>
                        {selectedCategoryChip === "all" && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {filteredCategoriesList.map((cat) => {
                        const isSelected = selectedCategoryChip === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryChip(cat.id);
                              setCategoryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Icon icon={cat.icon} className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="truncate">{cat.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Location Dropdown Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryDropdownOpen(false);
                    setSortDropdownOpen(false);
                    setLocationDropdownOpen(!locationDropdownOpen);
                  }}
                  className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap",
                    selectedLocation
                      ? "bg-[#0f2937] text-white border-[#0f2937]"
                      : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  )}
                >
                  <Icon icon="solar:map-point-linear" className="w-4 h-4 text-amber-500" />
                  <span>{selectedLocation ? selectedLocation.split(",")[0] : "Location"}</span>
                  <Icon icon="solar:alt-arrow-down-linear" className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* Location Dropdown Popover */}
                {locationDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-2xl z-[999] animate-in fade-in zoom-in-95 duration-150 text-left">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 mb-2 border border-slate-100 dark:border-slate-700">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search area (e.g. Bole)..."
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLocation("");
                          setLocationDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                          !selectedLocation
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>All Locations</span>
                        {!selectedLocation && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {filteredLocationsList.map((loc) => {
                        const isSelected = selectedLocation === loc.value;
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setSelectedLocation(loc.value);
                              setLocationDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="truncate">{loc.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Filters Pill */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-3 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}

            </div>
          </div>
        </div>

        {/* ── 3. Category Types Chips Row (Matching Services Page) ── */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryChip("all")}
            className={cn(
              "px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all cursor-pointer shrink-0 shadow-2xs",
              selectedCategoryChip === "all"
                ? "bg-[#0f2937] text-white border-[#0f2937]"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            )}
          >
            All
          </button>

          {DATABASE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategoryChip === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryChip(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-2xs",
                  isSelected
                    ? "bg-[#0f2937] text-white border-[#0f2937]"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                )}
              >
                <Icon
                  icon={cat.icon}
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isSelected ? "text-amber-400" : "text-slate-600 dark:text-slate-400"
                  )}
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── 4. Stats & Sorting Header ── */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? "business" : "businesses"} found
          </p>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sort: {sortBy === "recommended" ? "Recommended" : sortBy === "name_asc" ? "Name (A–Z)" : "Name (Z–A)"}</span>
              <Icon icon="solar:alt-arrow-down-linear" className="w-3.5 h-3.5 opacity-60" />
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xl z-50 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("recommended");
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    sortBy === "recommended" ? "bg-amber-50 text-amber-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Recommended
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("name_asc");
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    sortBy === "name_asc" ? "bg-amber-50 text-amber-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Name (A–Z)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("name_desc");
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    sortBy === "name_desc" ? "bg-amber-50 text-amber-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Name (Z–A)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. Premium Businesses Grid (Clean White, No Shadows, 1-2px Border) ── */}
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredCompanies.map((company) => {
              const companySlugOrId = company.slug
                ? encodeURIComponent(company.slug.replace(/^\/+|\/+$/g, ""))
                : company.id;

              const companyTypeName = company.company_types?.[0]?.name || "Beauty Salon";
              const locationText =
                company.location_text?.split(",")?.[0]?.trim() ||
                company.address?.split(",")?.[0]?.trim() ||
                "Addis Ababa";
              const hoursText = formatWorkingHours(company.working_hours);

              const initials = company.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Link
                  key={company.id}
                  href={`/company/${companySlugOrId}`}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-none hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Logo & Category Squircle */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {/* Logo or Initials */}
                      <div className="relative w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-none group-hover:scale-102 transition-transform">
                        {company.logo ? (
                          <Image
                            src={company.logo}
                            alt={company.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <span className="text-lg font-serif font-black text-slate-800 dark:text-slate-200">
                            {initials}
                          </span>
                        )}
                      </div>

                      {/* Verified & Type Badge */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 text-teal-800 dark:text-teal-300 text-[10px] font-bold">
                          <Icon icon="solar:verified-check-bold" className="w-3 h-3 text-teal-600" />
                          <span>Verified</span>
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-tight">
                          {companyTypeName}
                        </span>
                      </div>
                    </div>

                    {/* Company Name */}
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1 leading-snug">
                      {company.name}
                    </h3>

                    {/* Meta Details: Location & Hours */}
                    <div className="space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:map-point-linear" className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{locationText}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon icon="solar:clock-circle-linear" className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{hoursText}</span>
                      </div>

                      {company.phone && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:phone-linear" className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{company.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors">
                      View Profile &amp; Services
                    </span>
                    <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#0f2937] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors">
                      <Icon icon="solar:arrow-right-linear" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* ── 6. Empty State ── */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-none">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-slate-800 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-2">
              No businesses found
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-6">
              Try adjusting your search terms, changing the category, or selecting another location in Addis Ababa.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black font-bold text-xs px-6 py-3 rounded-full transition-all cursor-pointer shadow-none border border-slate-900 dark:border-white"
            >
              Clear all filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
}