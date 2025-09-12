// src/components/StatsSection.tsx
"use client";

import { useState, useEffect } from 'react';
import { getGlobalStats } from '@/lib/supabase-utils';
import { Building2, ClipboardList, BadgeCheck, Users } from 'lucide-react';
import React from 'react';

interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  loading: boolean;
}

const StatCardSkeleton = () => (
  <div className="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-lg animate-pulse">
    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
    <div className="h-7 w-20 bg-gray-200 rounded-md"></div>
    <div className="h-4 w-28 bg-gray-200 rounded-md"></div>
  </div>
);

const StatsSection = () => {
  const [stats, setStats] = useState<StatItem[]>([
    { icon: <Building2 size={32} />, label: 'Companies Registered', value: '—', loading: true },
    { icon: <ClipboardList size={32} />, label: 'Active Services', value: '—', loading: true },
    { icon: <BadgeCheck size={32} />, label: 'Services Completed', value: '—', loading: true },
    { icon: <Users size={32} />, label: 'Registered Users', value: '—', loading: true },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const s = await getGlobalStats();
        setStats([
          { icon: <Building2 size={32} className="text-orange-600" />, label: 'Companies Registered', value: s.companiesCount.toLocaleString(), loading: false },
          { icon: <ClipboardList size={32} className="text-orange-600" />, label: 'Active Services', value: s.activeServicesCount.toLocaleString(), loading: false },
          { icon: <BadgeCheck size={32} className="text-orange-600" />, label: 'Services Completed', value: s.servicesCompletedCount.toLocaleString(), loading: false },
          { icon: <Users size={32} className="text-orange-600" />, label: 'Registered Users', value: s.usersCount.toLocaleString(), loading: false },
        ]);
      } catch (error) {
        console.error("Failed to load global stats:", error);
        setStats(prevStats => prevStats.map(stat => ({ ...stat, value: '0', loading: false })));
      }
    };
    loadStats();
  }, []);

  return (
    <div className="">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 grid-cols-2 gap-y-8 gap-x-6">
          {stats.map((stat, index) => (
            <div key={index}>
              {stat.loading ? (
                <StatCardSkeleton />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-lg">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-tertiary/20">
                    {stat.icon}
                  </div>
                  <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base font-medium text-gray-500">
                    {stat.label}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Tagline */}
        <div className="mt-10 text-center">
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Join our network of businesses and users who rely on us for seamless service booking and reliable professionals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
