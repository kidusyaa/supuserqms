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
      <DiscountedServices />
      <PartnersCarousel />
      <RecentlyJoinedCompanies />
      <StatsSection />


    </div>
  );
}