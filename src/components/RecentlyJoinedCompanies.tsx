"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import Autoplay from "embla-carousel-autoplay";
import { getRecentCompanies } from "@/lib/supabase-utils";
import type { Company } from "@/type";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import { getCategoryIconInfo } from "@/lib/categoryIcons";

const RecentlyJoinedCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentCompanies = async () => {
      try {
        const recentCompanies = await getRecentCompanies(12);
        setCompanies(recentCompanies);
      } catch (error) {
        console.error("Error fetching recent companies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentCompanies();
  }, []);

  const getCompanyTypeName = (company: Company) => {
    return company.company_types?.[0]?.name || "Hair Salon";
  };

  if (isLoading) {
    return (
      <section className="py-10 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-4 w-60 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-slate-100 rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 bg-slate-50 border border-slate-100 rounded-3xl p-5 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4">
        {/* ── Section Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              New on Gize Book
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Recently joined, ready for you
            </p>
          </div>

          <Link
            href="/company"
            className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors group"
          >
            <span>See all</span>
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">&gt;</span>
          </Link>
        </div>

        {/* ── Companies Slider / Carousel ── */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[Autoplay({ delay: 3500, stopOnInteraction: true })]}
          className="w-full"
        >
          <CarouselContent className="-ml-4 py-2">
            {companies.map((company) => {
              const companyTypeName = getCompanyTypeName(company);
              const fallbackIcon = getCategoryIconInfo("", "", companyTypeName).icon;
              const locationText = company.location_text?.split(",")?.[0]?.trim() ||
                company.address?.split(",")?.[0]?.trim() ||
                "Bole";

              const companyHref = `/company/${company.slug ? encodeURIComponent(company.slug.replace(/^\/+|\/+$/g, '')) : company.id}`;

              return (
                <CarouselItem
                  key={company.id}
                  className="pl-4 basis-[78%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <Link
                    href={companyHref}
                    className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer"
                  >
                    <div>
                      {/* Top: Circular Avatar / Logo with "NEW" Badge */}
                      <div className="relative w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4 shrink-0 group-hover:scale-105 transition-transform">
                        {/* "NEW" Badge */}
                        <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs tracking-wider z-10">
                          NEW
                        </span>

                        {/* Logo or Category Icon */}
                        {company.logo ? (
                          <Image
                            src={company.logo}
                            alt={company.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain rounded-full"
                          />
                        ) : (
                          <Icon icon={fallbackIcon} width="28" height="28" className="text-slate-600 dark:text-slate-400" />
                        )}
                      </div>

                      {/* Company Name */}
                      <h2 className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-1 mb-1 tracking-tight leading-snug group-hover:text-amber-600 transition-colors">
                        {company.name}
                      </h2>

                      {/* Category Type */}
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 mb-2">
                        {companyTypeName}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 pt-2">
                      <Icon icon="solar:map-point-linear" className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{locationText}</span>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default RecentlyJoinedCompanies;