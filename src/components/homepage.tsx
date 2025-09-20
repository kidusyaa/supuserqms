"use client";
import React, { useEffect,useState } from 'react'; // Import useState
import Link from 'next/link';
import DivCenter from './divCenter';
import { Button } from './ui/button';

import ServiceCategoriesPage from './ServiceCategoriesPage';
import NavSection from './navsection';
import StatsSection from './StatsSection';
import FeaturedServices from './Featuredservice';
import Footer from './footer';
import HeroSection from './herosection';
import RecentJoinSection from './RecentJoinSection';
import CompanyTypesPage from './company-types';
import DiscountedServices from './discountedServices';
export default function Homepage() {
  const SERVICES_SECTION_ID = "services-list";
  // State to store the height of the HeroSection
  const [heroSectionHeight, setHeroSectionHeight] = useState(0);

  return (
    <div>
      {/* NavSection should be rendered here, outside of HeroSection */}
      {/* Pass the heroSectionHeight to NavSection */}
      {/* HeroSection will now report its height */}
      <HeroSection />
       <StatsSection/>
       <DiscountedServices/>
      <FeaturedServices/>

      <RecentJoinSection/>
      <CompanyTypesPage/>
      <Footer/>
    </div>
  );
}