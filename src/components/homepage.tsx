"use client";
import React from 'react';
import HeroSection from './herosection';
import DiscountedServices from './discountedServices';
import PackagesSection from './PackagesSection';
import RecentlyJoinedCompanies from './RecentlyJoinedCompanies';
import TopRatedServices from './TopRatedServices';
import StatsSection from './StatsSection';

export default function Homepage() {
  return (
    <div className="space-y-2 bg-white dark:bg-slate-950">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Special Offers & Discounts */}
      <DiscountedServices />

      {/* 3. Package Deals */}
      <PackagesSection />

      {/* 4. New on Gize Book */}
      <RecentlyJoinedCompanies />

      {/* 5. Top Rated Services (9 Services Grid) */}
      <TopRatedServices />

      {/* 6. Stats & Register Beauty Salon CTA */}
      <StatsSection />
    </div>
  );
}