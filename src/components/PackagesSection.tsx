"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { getAllPackages } from "@/lib/supabase-utils";
import type { Service } from "@/type";
import PackageCard from "./PackageCard";

export default function PackagesSection() {
  const [packages, setPackages] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        const data = await getAllPackages();
        setPackages(data);
      } catch (err) {
        console.error("Failed to load packages for homepage:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  if (!isLoading && packages.length === 0) {
    return null; // Don't render section if no packages available
  }

  return (
    <section className="py-10 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              Special Package Deals
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Save more with combined service packages
            </p>
          </div>

          <Link
            href="/packages"
            className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors group"
          >
            <span>See all</span>
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">&gt;</span>
          </Link>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-44 bg-slate-200/60 rounded-2xl animate-pulse"
              />
            ))
            : packages.slice(0, 6).map((pkg) => (
              <PackageCard key={pkg.id} service={pkg} />
            ))}
        </div>
      </div>
    </section>
  );
}
