// src/components/StatsSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { getGlobalStats } from "@/lib/supabase-utils";

export default function StatsSection() {
  const [stats, setStats] = useState({
    providers: "420+",
    categories: "18",
    bookings: "9,600+",
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const s = await getGlobalStats();
        setStats({
          providers: s.companiesCount ? `${s.companiesCount}+` : "420+",
          categories: s.activeServicesCount ? `${Math.max(18, Math.round(s.activeServicesCount / 3))}` : "18",
          bookings: s.servicesCompletedCount ? `${s.servicesCompletedCount.toLocaleString()}+` : "9,600+",
        });
      } catch (error) {
        console.warn("Using default stats fallback:", error);
      }
    };
    loadStats();
  }, []);

  return (
    <section className="py-12 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* ── Top Row: 3 Minimal Stats ── */}
        <div className="bg-slate-50/60 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left sm:text-left">
            {/* Stat 1 */}
            <div>
              <div className="font-serif font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
                {stats.providers}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Providers listed
              </p>
            </div>

            {/* Stat 2 */}
            <div>
              <div className="font-serif font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
                {stats.categories}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Service categories
              </p>
            </div>

            {/* Stat 3 */}
            <div>
              <div className="font-serif font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
                {stats.bookings}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Bookings made
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom Row: "Own a beauty business?" Registration Banner ── */}
        <Link
          href="https://app.gizebook.com/registration/company"
          target="_blank"
          className="group block bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-amber-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              {/* Storefront Icon */}
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                <Icon icon="solar:shop-2-bold" width="24" height="24" />
              </div>

              {/* Text */}
              <div className="min-w-0">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                  Own a beauty business?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  List your services and start taking bookings on GizeBook.
                </p>
              </div>
            </div>

            {/* Arrow Chevron */}
            <div className="shrink-0 ml-4">
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all"
              />
            </div>
          </div>
        </Link>

      </div>
    </section>
  );
}