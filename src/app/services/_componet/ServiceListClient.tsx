"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import { Search, X, Check } from "lucide-react";
import { Service, Category, LocationOption } from "@/type";
import ServiceCard from "./ServiceCard";
import PackageCard from "@/components/PackageCard";

interface ServiceListClientProps {
  initialServices: Service[];
  allCategories: Category[];
  allLocationOptions: LocationOption[];
  allCompanyOptions: LocationOption[];
  allCompanyTypeOptions: LocationOption[];
  serverSearchParams: { [key: string]: string | string[] | undefined };
}

import { getCategoryIconInfo } from "@/lib/categoryIcons";

// 6 Database Categories with Exact System Icons
const coreCategoryChips = [
  { id: "all", name: "All", icon: null },
  { id: "ctyp_156b471c64d6f6b623c8", name: "Massage & Spa", icon: "arcticons:inci-beauty" },
  { id: "ctyp_53db2f13758e8f8902a3", name: "Barbershop", icon: "solar:scissors-linear" },
  { id: "ctyp_87d2396dc140f2a0ac79", name: "Skincare Clinic", icon: "wpf:facial-recognition-scan" },
  { id: "ctyp_974b4c1e55d1287e6e61", name: "Nail Studio", icon: "icon-park-outline:mascara" },
  { id: "ctyp_df467f8e523cb5d2ce49", name: "Makeup Artist", icon: "icon-park-outline:cosmetic-brush" },
  { id: "ctyp_bac74dcb5e1ea9d4cdac", name: "Beauty Salon", icon: "game-icons:hair-strands" },
];

export default function ServiceListClient({
  initialServices,
  allCategories,
  allLocationOptions,
  allCompanyOptions,
  allCompanyTypeOptions,
  serverSearchParams,
}: ServiceListClientProps) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>(
    (serverSearchParams.searchTerm as string) || ""
  );
  const [selectedCategoryChip, setSelectedCategoryChip] = useState<string>(
    (serverSearchParams.companyTypeIds as string) || "all"
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    (serverSearchParams.categoryId as string) || null
  );
  const [selectedLocation, setSelectedLocation] = useState<string>(
    (serverSearchParams.locations as string) || ""
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    (serverSearchParams.companyIds as string) || ""
  );
  const [selectedCompanyTypeId, setSelectedCompanyTypeId] = useState<string>(
    (serverSearchParams.companyTypeIds as string) || ""
  );
  // "services" (default standalone services), "packages" (special packages), "all" (both)
  const [activeTab, setActiveTab] = useState<"all" | "services" | "packages">("services");
  const [sortBy, setSortBy] = useState<"recommended" | "price_asc" | "price_desc" | "popular" | "discount">("recommended");

  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [serviceTypeDropdownOpen, setServiceTypeDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Search queries inside popovers
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");

  const filterBarRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
        setLocationDropdownOpen(false);
        setCompanyDropdownOpen(false);
        setServiceTypeDropdownOpen(false);
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter and Sort Services
  const filteredServices = useMemo(() => {
    let result = [...initialServices];

    // 1. Separate Packages vs Standalone Services vs All
    if (activeTab === "services") {
      result = result.filter((s) => !s.is_package);
    } else if (activeTab === "packages") {
      result = result.filter((s) => s.is_package);
    }

    // 2. Search Term Filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(lower) ||
          s.description?.toLowerCase().includes(lower) ||
          s.company?.name?.toLowerCase().includes(lower) ||
          s.service_category?.name?.toLowerCase().includes(lower)
      );
    }

    // 3. Category Chip Filter (Direct matching via getCategoryIconInfo and company types)
    if (selectedCategoryChip && selectedCategoryChip !== "all") {
      result = result.filter((s) => {
        const compTypes = (s.company?.company_types || []).map((ct: any) => ct.name).join(" ");
        const catInfo = getCategoryIconInfo(s.name, s.service_category?.name, compTypes);
        const hasDirectType = (s.company?.company_types || []).some((ct: any) => ct.id === selectedCategoryChip);
        return catInfo.id === selectedCategoryChip || hasDirectType;
      });
    }

    // 4. Specific Category Dropdown Filter
    if (selectedCategoryId) {
      result = result.filter((s) => s.category_id === selectedCategoryId);
    }

    // 5. Company Type Filter (from dropdown)
    if (selectedCompanyTypeId && selectedCompanyTypeId !== selectedCategoryChip) {
      result = result.filter((s) => {
        const types = s.company?.company_types || [];
        return types.some((t: any) => t.id === selectedCompanyTypeId);
      });
    }

    // 6. Location Filter
    if (selectedLocation) {
      const locQuery = selectedLocation.toLowerCase();
      result = result.filter((s) => {
        const compLoc = (s.company?.location_text || s.company?.address || "").toLowerCase();
        return compLoc.includes(locQuery);
      });
    }

    // 7. Company Filter
    if (selectedCompanyId) {
      result = result.filter((s) => s.company_id === selectedCompanyId);
    }

    // 8. Sort
    if (sortBy === "price_asc") {
      result.sort((a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0"));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => parseFloat(b.price || "0") - parseFloat(a.price || "0"));
    } else if (sortBy === "discount") {
      result.sort((a, b) => (b.discount_value || 0) - (a.discount_value || 0));
    }

    return result;
  }, [
    initialServices,
    activeTab,
    searchTerm,
    selectedCategoryChip,
    selectedCategoryId,
    selectedCompanyTypeId,
    selectedLocation,
    selectedCompanyId,
    sortBy,
  ]);

  // Labels for dropdown pills
  const selectedCategoryObj = allCategories.find((c) => c.id === selectedCategoryId);
  const selectedCompanyObj = allCompanyOptions.find((c) => c.value === selectedCompanyId);
  const selectedLocationObj = allLocationOptions.find((l) => l.value === selectedLocation);

  const filteredCategoriesList = allCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const filteredLocationsList = allLocationOptions.filter((loc) =>
    loc.label.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const filteredCompaniesList = allCompanyOptions.filter((comp) =>
    comp.label.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* ── 1. Page Header (Wide Layout Matching Screenshot) ── */}
      <div className="mb-8 text-left">
        {/* Explore Badge */}
        <div className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider mb-2">
          <Icon icon="solar:widget-add-bold" className="w-4 h-4 text-amber-500" />
          <span>Explore</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight">
          All services near you
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed font-normal">
          Browse every service, package and provider on GizeBook &mdash; filter by category, location or price to find the right fit.
        </p>
      </div>

      {/* ── 2. Top Row: Single Unified Border Card with Search on Left & Pills on Right (Matching Screenshot) ── */}
      <div
        ref={filterBarRef}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-full p-2 sm:p-2.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 mb-5 relative z-30 overflow-visible"
      >
        {/* Left: Search Bar Input */}
        <div className="flex-1 flex items-center w-full pl-3 pr-2">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search services or companies..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 outline-none border-none font-normal"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Filter Dropdown Pills Group (overflow-visible to prevent clipping) */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto shrink-0 pr-1 relative z-40 overflow-visible">
          
          {/* 1. ⊞ Category Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setLocationDropdownOpen(false);
                setCompanyDropdownOpen(false);
                setServiceTypeDropdownOpen(false);
                setCategoryDropdownOpen(!categoryDropdownOpen);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCategoryId || categoryDropdownOpen
                  ? "bg-[#0f2937] text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon
                icon="solar:widget-add-linear"
                className={`w-4 h-4 ${selectedCategoryId || categoryDropdownOpen ? "text-amber-400" : "text-slate-500"}`}
              />
              <span>{selectedCategoryObj ? selectedCategoryObj.name : "Category"}</span>
              <Icon icon="solar:alt-arrow-down-linear" className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {categoryDropdownOpen && (
              <div className="absolute top-full right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-800 p-3 z-[999] animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                {/* Search category input */}
                <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 mb-2 border border-slate-200 dark:border-slate-700">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Search category..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                  {categorySearchQuery && (
                    <button onClick={() => setCategorySearchQuery("")} className="p-0.5">
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-left cursor-pointer ${
                      selectedCategoryId === null
                        ? "bg-amber-50 text-amber-700 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>All Categories</span>
                    {selectedCategoryId === null && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                  {filteredCategoriesList.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-left cursor-pointer ${
                        selectedCategoryId === cat.id
                          ? "bg-amber-50 text-amber-700 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {selectedCategoryId === cat.id && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. 📍 Location Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setCategoryDropdownOpen(false);
                setCompanyDropdownOpen(false);
                setServiceTypeDropdownOpen(false);
                setLocationDropdownOpen(!locationDropdownOpen);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                selectedLocation || locationDropdownOpen
                  ? "bg-[#0f2937] text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon
                icon="solar:map-point-linear"
                className={`w-4 h-4 ${selectedLocation || locationDropdownOpen ? "text-amber-400" : "text-slate-500"}`}
              />
              <span className="truncate max-w-[120px]">
                {selectedLocationObj ? selectedLocationObj.label.split(",")[0] : selectedLocation || "Location"}
              </span>
              <Icon icon="solar:alt-arrow-down-linear" className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {locationDropdownOpen && (
              <div className="absolute top-full right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-800 p-3 z-[999] animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 mb-2 border border-slate-200 dark:border-slate-700">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    placeholder="Search area..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocation("");
                      setLocationDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-left cursor-pointer ${
                      !selectedLocation ? "bg-amber-50 text-amber-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>All Locations</span>
                    {!selectedLocation && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                  {filteredLocationsList.map((loc) => (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(loc.value);
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm text-left cursor-pointer ${
                        selectedLocation === loc.value
                          ? "bg-amber-50 text-amber-700 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{loc.label}</span>
                      {selectedLocation === loc.value && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. 🏪 Company Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setCategoryDropdownOpen(false);
                setLocationDropdownOpen(false);
                setServiceTypeDropdownOpen(false);
                setCompanyDropdownOpen(!companyDropdownOpen);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCompanyId || companyDropdownOpen
                  ? "bg-[#0f2937] text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon
                icon="solar:shop-linear"
                className={`w-4 h-4 ${selectedCompanyId || companyDropdownOpen ? "text-amber-400" : "text-slate-500"}`}
              />
              <span className="truncate max-w-[120px]">
                {selectedCompanyObj ? selectedCompanyObj.label : "Company"}
              </span>
              <Icon icon="solar:alt-arrow-down-linear" className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {companyDropdownOpen && (
              <div className="absolute top-full right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-800 p-3 z-[999] animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 mb-2 border border-slate-200 dark:border-slate-700">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    placeholder="Search company..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompanyId("");
                      setCompanyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-left cursor-pointer ${
                      !selectedCompanyId ? "bg-amber-50 text-amber-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>All Companies</span>
                    {!selectedCompanyId && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                  {filteredCompaniesList.map((comp) => (
                    <button
                      key={comp.value}
                      type="button"
                      onClick={() => {
                        setSelectedCompanyId(comp.value);
                        setCompanyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm text-left cursor-pointer ${
                        selectedCompanyId === comp.value
                          ? "bg-amber-50 text-amber-700 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{comp.label}</span>
                      {selectedCompanyId === comp.value && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. ⇄ Offers & Packages Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setCategoryDropdownOpen(false);
                setLocationDropdownOpen(false);
                setCompanyDropdownOpen(false);
                setServiceTypeDropdownOpen(!serviceTypeDropdownOpen);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab !== "services" || serviceTypeDropdownOpen
                  ? "bg-[#0f2937] text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon
                icon="solar:gift-linear"
                className={`w-4 h-4 ${activeTab !== "services" || serviceTypeDropdownOpen ? "text-amber-400" : "text-slate-500"}`}
              />
              <span>
                {activeTab === "packages"
                  ? "Combo Packages"
                  : activeTab === "all"
                  ? "All Types"
                  : "Offers & Packages"}
              </span>
              <Icon icon="solar:alt-arrow-down-linear" className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {serviceTypeDropdownOpen && (
              <div className="absolute top-full right-0 mt-2.5 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-800 p-2 z-[999] animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("services");
                    setServiceTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-left cursor-pointer ${
                    activeTab === "services"
                      ? "bg-amber-50 text-amber-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div>Single Services</div>
                    <div className="text-[11px] text-slate-400 font-normal">Individual salon & spa treatments</div>
                  </div>
                  {activeTab === "services" && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("packages");
                    setServiceTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-left cursor-pointer ${
                    activeTab === "packages"
                      ? "bg-amber-50 text-amber-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div>Combo Packages</div>
                    <div className="text-[11px] text-slate-400 font-normal">Multi-service discounted bundles</div>
                  </div>
                  {activeTab === "packages" && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("all");
                    setServiceTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-left cursor-pointer ${
                    activeTab === "all"
                      ? "bg-amber-50 text-amber-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div>All Treatments</div>
                    <div className="text-[11px] text-slate-400 font-normal">Both single services & packages</div>
                  </div>
                  {activeTab === "all" && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── 3. Horizontal Category Chips Row (Starts with "All", Matching Screenshot) ── */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none mb-6 text-left">
        {coreCategoryChips.map((chip) => {
          const isSelected = selectedCategoryChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedCategoryChip(chip.id)}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-2xs ${
                isSelected
                  ? "bg-[#0f2937] text-white border border-[#0f2937] shadow-xs scale-102"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {chip.icon && (
                <Icon
                  icon={chip.icon}
                  className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-slate-500"}`}
                />
              )}
              <span>{chip.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 4. Results Count & Sorting Row ── */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        {/* Count */}
        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          {filteredServices.length} {activeTab === "packages" ? "packages" : "services"} found
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span>
              Sort:{" "}
              {sortBy === "recommended"
                ? "Recommended"
                : sortBy === "price_asc"
                ? "Price: Low to High"
                : sortBy === "price_desc"
                ? "Price: High to Low"
                : sortBy === "popular"
                ? "Most Popular"
                : "Special Discounts"}
            </span>
            <Icon icon="solar:alt-arrow-down-linear" className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {sortDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
              {[
                { id: "recommended", label: "Recommended" },
                { id: "popular", label: "Most Popular" },
                { id: "discount", label: "Special Discounts" },
                { id: "price_asc", label: "Price: Low to High" },
                { id: "price_desc", label: "Price: High to Low" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.id as any);
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left ${
                    sortBy === opt.id
                      ? "bg-amber-50 text-amber-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Services Grid (Wide Responsive Grid) ── */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 mb-4">
            <Icon icon="solar:magnifer-linear" width="28" height="28" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white mb-1">
            No {activeTab === "packages" ? "packages" : "services"} found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Try adjusting your search keywords, location or category filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategoryChip("all");
              setSelectedCategoryId(null);
              setSelectedLocation("");
              setSelectedCompanyId("");
              setSortBy("recommended");
            }}
            className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredServices.map((service) => {
            if (service.is_package) {
              return <PackageCard key={service.id} service={service} />;
            }
            const category = allCategories.find((cat) => cat.id === service.category_id);
            return (
              <ServiceCard
                key={service.id}
                service={service}
                category={category}
              />
            );
          })}
        </div>
      )}

    </div>
  );
}