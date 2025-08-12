// src/components/StatsSection.tsx

"use client"; // We need this to use the useEffect hook for fetching data.

import { useState, useEffect } from 'react';
import { getGlobalStats } from '@/lib/firebase-utils';

// --- Step 1: Define the structure for a single stat ---
interface StatItem {
      // Emoji or SVG icon
  value: string;      // The number or text to display (e.g., "1,234")
  label: string;      // The description (e.g., "Active Services")
  loading: boolean;   // To show a loading state while fetching
}

// --- Step 2: Create the StatsSection Component ---
const StatsSection = () => {
  // --- Step 3: Set up the initial state for our stats ---
  const [stats, setStats] = useState<StatItem[]>([
    { value: '—', label: 'Companies Registered', loading: true },
    { value: '—', label: 'Active Services', loading: true },
    { value: '—', label: 'Users', loading: true },
    { value: '—', label: 'Served Today', loading: true },
  ]);

  // Load stats from Firestore on mount
  useEffect(() => {
    const load = async () => {
      try {
        const s = await getGlobalStats();
        setStats([
          { value: s.companies.toString(), label: 'Companies Registered', loading: false },
          { value: s.activeServices.toString(), label: 'Active Services', loading: false },
          { value: s.users.toString(), label: 'Users', loading: false },
          { value: s.servedToday.toString(), label: 'Served Today', loading: false },
        ]);
      } catch {
        setStats([
          { value: '0', label: 'Companies Registered', loading: false },
          { value: '0', label: 'Active Services', loading: false },
          { value: '0', label: 'Users', loading: false },
          { value: '0', label: 'Served Today', loading: false },
        ]);
      }
    };
    load();
  }, []);

  // --- Step 5: Render the component with the stats data ---
  return (
    <div className="bg-gray-50 py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Our Platform at a Glance
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
                Join a growing ecosystem of trusted service providers and satisfied customers.
            </p>
        </div>
        
        {/* The Grid Layout for the stat cards */}
        <div className="grid grid-cols-1 md:gap-6 grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center justify-center md:rounded-lg bg-white p-6 md:shadow-md text-center border-[1px] border-gray-100">
              {stat.loading ? (
                // Simple loading animation
                <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
              ) : (
                // The actual stat value
                <p className="text-4xl font-bold tracking-tight text-blue-600">
                  {stat.value}
                </p>
              )}
              <p className="mt-2 text-base font-medium text-gray-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsSection;