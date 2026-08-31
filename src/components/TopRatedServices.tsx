"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAllServices } from "@/lib/supabase-utils";
import type { Service } from "@/type";
import ServiceCard from "@/app/services/_componet/ServiceCard";

const ServiceCardSkeleton = () => (
  <div className="h-72 w-full rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
);

export default function TopRatedServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const all = await getAllServices();
        // Take top 9 individual services (excluding packages if needed or filtering active)
        const filtered = (all || [])
          .filter((s) => !s.is_package)
          .slice(0, 9);
        setServices(filtered);
      } catch (error) {
        console.error("Failed to load top rated services:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadServices();
  }, []);

  if (!isLoading && services.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4">
        {/* ── Section Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              Top Rated Services
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Discover customer favorite treatments and top-rated bookings
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors group"
          >
            <span>See all</span>
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">&gt;</span>
          </Link>
        </div>

        {/* ── 9 Services Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 9 }).map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))
            : services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
        </div>
      </div>
    </section>
  );
}
