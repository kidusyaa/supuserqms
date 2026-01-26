// src/components/StatsSection.tsx
"use client";

import { useState, useEffect } from 'react';
import { getGlobalStats } from '@/lib/supabase-utils';
import { Building2, ClipboardList, BadgeCheck, Users, TrendingUp } from 'lucide-react';
import React from 'react';

interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
 loading:boolean
}

const StatCardSkeleton = () => (
  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-4">
        <div className="h-6 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-12 w-12 rounded-xl bg-gray-200"></div>
    </div>
    <div className="mt-6 h-4 w-32 bg-gray-200 rounded-lg"></div>
  </div>
);

const StatsSection = () => {
  const [stats, setStats] = useState<StatItem[]>([
    { 
      icon: <Building2 size={24} />, 
      label: 'Companies Registered', 
     value: '—', 
      loading: true,
    },
    { 
      icon: <ClipboardList size={24} />, 
      label: 'Active Services', 
     value: '—', 
      loading: true,
    },
    { 
      icon: <BadgeCheck size={24} />, 
      label: 'Services Completed', 
      value: '—', 
      loading: true,
      
    },
    { 
      icon: <Users size={24} />, 
      label: 'Registered Users', 
      value: '—', 
      loading: true,
      
    },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const s = await getGlobalStats();
        setStats([
          { 
            icon: <Building2 size={24} className="text-orange-500" />, 
            label: 'Companies Registered', 
            value: s.companiesCount.toLocaleString(), 
            loading: false,
         
          },
          { 
            icon: <ClipboardList size={24} className="text-blue-500" />, 
            label: 'Active Services', 
            value: s.activeServicesCount.toLocaleString(), 
            loading: false,
           
          },
          { 
            icon: <BadgeCheck size={24} className="text-green-500" />, 
            label: 'Services Completed', 
            value: s.servicesCompletedCount.toLocaleString(), 
            loading: false,
           
          },
          { 
            icon: <Users size={24} className="text-purple-500" />, 
            label: 'Registered Users', 
            value: s.usersCount.toLocaleString(), 
            loading: false,
            
          },
        ]);
      } catch (error) {
        console.error("Failed to load global stats:", error);
        setStats(prevStats => prevStats.map(stat => ({ ...stat, value: '0', loading: false })));
      }
    };
    loadStats();
  }, []);

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Footer Stats */}
        <div className="mt-12 bg-gradient-to-r from-orange-50 to-gray-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">99%</div>
              <p className="text-gray-600 font-medium">Customer Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <p className="text-gray-600 font-medium">Service Availability</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">50+</div>
              <p className="text-gray-600 font-medium">Service Categories</p>
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="mt-12 text-center">
          <p className="text-gray-700 text-lg font-medium italic">
            "Trusted by businesses for seamless service management"
          </p>  
        </div>
      </div>
    </div>
  );
};

export default StatsSection;