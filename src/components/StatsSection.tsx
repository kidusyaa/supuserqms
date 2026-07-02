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
    loading: boolean;
    cardClass: string;
    iconClass: string;
    subText: string;
  }

  const StatCardSkeleton = () => (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-800/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    </div>
  );

  const StatsSection = () => {
    const [stats, setStats] = useState<StatItem[]>([
      { 
        icon: <Building2 size={24} />, 
        label: 'Companies Registered', 
        value: '—', 
        loading: true,
        cardClass: 'bg-gradient-to-br from-orange-50/80 via-white to-orange-50/30 dark:from-orange-950/20 dark:via-slate-900 dark:to-slate-950 border border-orange-100/80 dark:border-orange-900/30 shadow-lg shadow-orange-500/5',
        iconClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
        subText: 'Verified partners'
      },
      { 
        icon: <ClipboardList size={24} />, 
        label: 'Active Services', 
        value: '—', 
        loading: true,
        cardClass: 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-950 border border-blue-100/80 dark:border-blue-900/30 shadow-lg shadow-blue-500/5',
        iconClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
        subText: 'Available bookings'
      },
      { 
        icon: <BadgeCheck size={24} />, 
        label: 'Services Completed', 
        value: '—', 
        loading: true,
        cardClass: 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-950 border border-emerald-100/80 dark:border-emerald-900/30 shadow-lg shadow-emerald-500/5',
        iconClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
        subText: 'Smooth checkouts'
      },
      { 
        icon: <Users size={24} />, 
        label: 'Registered Users', 
        value: '—', 
        loading: true,
        cardClass: 'bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-950 border border-purple-100/80 dark:border-purple-900/30 shadow-lg shadow-purple-500/5',
        iconClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
        subText: 'Connected accounts'
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
              cardClass: 'bg-gradient-to-br from-orange-50/80 via-white to-orange-50/30 dark:from-orange-950/20 dark:via-slate-900 dark:to-slate-950 border border-orange-100/80 dark:border-orange-900/30 shadow-lg shadow-orange-500/5',
              iconClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
              subText: 'Verified partners'
            },
            { 
              icon: <ClipboardList size={24} className="text-blue-500" />, 
              label: 'Active Services', 
              value: s.activeServicesCount.toLocaleString(), 
              loading: false,
              cardClass: 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-950 border border-blue-100/80 dark:border-blue-900/30 shadow-lg shadow-blue-500/5',
              iconClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
              subText: 'Available bookings'
            },
            { 
              icon: <BadgeCheck size={24} className="text-green-500" />, 
              label: 'Services Completed', 
              value: s.servicesCompletedCount.toLocaleString(), 
              loading: false,
              cardClass: 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-950 border border-emerald-100/80 dark:border-emerald-900/30 shadow-lg shadow-emerald-500/5',
              iconClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
              subText: 'Smooth checkouts'
            },
            { 
              icon: <Users size={24} className="text-purple-500" />, 
              label: 'Registered Users', 
              value: s.usersCount.toLocaleString(), 
              loading: false,
              cardClass: 'bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-950 border border-purple-100/80 dark:border-purple-900/30 shadow-lg shadow-purple-500/5',
              iconClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
              subText: 'Connected accounts'
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
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              if (stat.loading) {
                return <StatCardSkeleton key={index} />;
              }
              return (
                <div 
                  key={index} 
                  className={`${stat.cardClass} rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {stat.label}
                      </p>
                      <h3 className="text-3xl font-black text-slate-800 dark:text-slate-150 tracking-tight">
                        {stat.value}
                      </h3>
                    </div>
                    <div className={`${stat.iconClass} w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:rotate-6`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {stat.subText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Stats / Availability Info */}
          <div className="mt-12 bg-gradient-to-br from-slate-50 via-white to-orange-50/20 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-tertiary/20 rounded-2xl p-8 border border-slate-100 dark:border-slate-800/60 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center px-4">
                <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
                  99%
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-bold text-base mb-1">Customer Satisfaction</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Based on user reviews and post-service feedback</p>
              </div>
              <div className="text-center px-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/60 pt-6 md:pt-0">
                <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-bold text-base mb-1">Service Availability</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Instantly browse and queue for appointments anytime</p>
              </div>
              <div className="text-center px-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/60 pt-6 md:pt-0">
                <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
                  50+
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-bold text-base mb-1">Service Categories</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">From barber shops to car detailing and beyond</p>
              </div>
            </div>
          </div>

          {/* Bottom Tagline */}
          <div className="mt-16 text-center max-w-lg mx-auto">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-500 mb-3">
              <TrendingUp size={16} />
            </div>
            <p className="text-slate-600 dark:text-slate-350 text-lg font-medium italic">
              "Trusted by businesses for seamless service management"
            </p>  
          </div>
        </div>
      </div>
    );
  };

  export default StatsSection;