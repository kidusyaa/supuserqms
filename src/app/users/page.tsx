"use client";

import { useState, useMemo } from "react";
import MainDashboard from "@/components/maindashbord"; // Correct path if needed
import CategoryView from "@/components/category";     // Correct path if needed

// Import mock data
import { mockServices } from "@/components/data/services";
import { mockCompanies } from "@/components/data/company";
import { mockQueueItems } from "@/components/data/queueItem";

// Import your central types

import { mockCategories } from "@/components/data/categories";
import { ServiceWithDetails, Category } from "@/type";
export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // ✨ 1. ADD STATE FOR THE SEARCH QUERY IN THE PARENT COMPONENT
  const [searchQuery, setSearchQuery] = useState("");

  // Create the detailed data set (this logic is correct from previous steps)
  const servicesWithDetails: ServiceWithDetails[] = useMemo(() => {
    return mockServices.map((service) => {
      const company = mockCompanies.find((c) => c.id === service.companyId);
      const queueCount = mockQueueItems.filter(
        (q) => q.serviceId === service.id && q.status === "waiting"
      ).length;
      return { ...service, company, queueCount };
    });
  }, []);

  const featuredServicesWithDetails = useMemo(() => {
    return servicesWithDetails.filter((service) => service.featureEnabled === true);
  }, [servicesWithDetails]);
  
  // ✨ 2. CREATE A FILTERED LIST FOR THE CATEGORY VIEW
  // This list depends on both the selected category and the search query
  const filteredCategoryServices = useMemo(() => {
    if (!selectedCategory) return [];

    // Find the actual category object to get its type (e.g., 'Beauty')
    const categoryDetails = mockCategories.find(c => c.id === selectedCategory);
    if (!categoryDetails) return [];

    let filtered = servicesWithDetails.filter(s => s.type === categoryDetails.name);

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => 
          s.name.toLowerCase().includes(searchLower) ||
          s.company?.name.toLowerCase().includes(searchLower) ||
          s.code.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery, servicesWithDetails]);


  if (selectedCategory) {
    // ✨ 3. PASS THE MISSING PROPS TO CATEGORYVIEW
    return (
      <CategoryView
        categoryId={selectedCategory}
        services={filteredCategoryServices} // Pass the newly filtered list
        searchQuery={searchQuery}            // Pass the state
        onSearchChange={setSearchQuery}      // Pass the state setter
        onClearCategory={() => {
          setSelectedCategory(null);
          setSearchQuery(""); // Also clear search when leaving the category
        }}
      />
    );
  }

  return (
    <MainDashboard
      onSelectCategory={setSelectedCategory}
      featuredServices={featuredServicesWithDetails}
    />
  );
}