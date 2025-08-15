// src/components/StatsSection.tsx

"use client";

import { useState, useEffect } from 'react';
// Make sure the path to your firebase-utils is correct
import { getGlobalStats } from '@/lib/firebase-utils';
// Import the icons we'll use
import { Building2, ClipboardList, BadgeCheck, Users } from 'lucide-react';
import React from 'react';

// Define the structure for a single stat, including the icon
interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  loading: boolean;
}

// A reusable loading skeleton component for a clean UI
const StatCardSkeleton = () => (
    <div className="flex flex-col items-center justify-center gap-4 bg-white p-6 text-center border-[1px] border-gray-100 rounded-lg shadow-md">
        <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
    </div>
);

const StatsSection = () => {
  // Set up the initial state with the correct order and new icons
  const [stats, setStats] = useState<StatItem[]>([
    { icon: <Building2 size={32} />, label: 'Companies Registered', value: '—', loading: true },
    { icon: <ClipboardList size={32} />, label: 'Active Services', value: '—', loading: true },
    { icon: <BadgeCheck size={32} />, label: 'Services Completed', value: '—', loading: true },
    { icon: <Users size={32} />, label: 'Registered Users', value: '—', loading: true },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch stats using our new, optimized function
        const s = await getGlobalStats();
        
        // Update the state with the fetched data in the correct order
        setStats([
          { icon: <Building2 size={32} className="text-orange-600" />, label: 'Companies Registered', value: s.companiesCount.toLocaleString(), loading: false },
          { icon: <ClipboardList size={32} className="text-orange-600" />, label: 'Active Services', value: s.activeServicesCount.toLocaleString(), loading: false },
          { icon: <BadgeCheck size={32} className="text-orange-600" />, label: 'Services Completed', value: s.servicesCompletedCount.toLocaleString(), loading: false },
          { icon: <Users size={32} className="text-orange-600" />, label: 'Registered Users', value: s.usersCount.toLocaleString(), loading: false },
        ]);
      } catch (error) {
        console.error("Failed to load global stats:", error);
        // On error, show 0s but stop the loading animation
        setStats(prevStats => prevStats.map(stat => ({ ...stat, value: '0', loading: false })));
      }
    };
    loadStats();
  }, []);

  return (
    <div className="bg-gray-50 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Our Platform at a Glance
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
                Join a growing ecosystem of trusted service providers and satisfied customers.
            </p>
        </div>
        
        <div className="grid md:gap-6 grid-cols-2 lg:grid-cols-4 ">
          {stats.map((stat, index) => (
            <div key={index}>
              {stat.loading ? (
                <StatCardSkeleton />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 bg-white md:p-6 p-2 text-center border-[1px] border-gray-100 md:rounded-lg shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl ">
                  {/* Icon with a themed background */}
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-orange-100">
                    {stat.icon}
                  </div>
                  
                  {/* The stat value */}
                  <p className="text-4xl font-extrabold tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                  
                  {/* The stat label */}
                  <p className="text-base font-medium text-gray-500">
                    {stat.label}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsSection;