"use client";
import React, { useEffect, useState } from 'react'; // Import useState
import Link from 'next/link';
import DivCenter from './divCenter';
import { Button } from './ui/button';
import NavSection from './navsection';
import FeaturedServices from './Featuredservice';
import Footer from './footer';
import HeroSection from './herosection';
import StatsSection from './StatsSection';
import CompanyTypesPage from './company-types';
import DiscountedServices from './discountedServices';
import PartnersCarousel from './PartnersCarousel';
import RecentlyJoinedCompanies from './RecentlyJoinedCompanies';
export default function Homepage() {
  const SERVICES_SECTION_ID = "services-list";
  // State to store the height of the HeroSection
  const [heroSectionHeight, setHeroSectionHeight] = useState(0);

  return (
    <div>

      <HeroSection />
      
      {/* Categories Explorer Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900/25 border-y border-gray-100 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Explore by Category
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mb-10 max-w-md mx-auto">
            Discover and book the best local service providers in your category
          </p>
          <CompanyTypesPage />
        </div>
      </section>

      <DiscountedServices />
      <PartnersCarousel />
      <RecentlyJoinedCompanies />
      <StatsSection />


    </div>
  );
}