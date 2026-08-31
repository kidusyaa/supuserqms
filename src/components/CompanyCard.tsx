"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Company } from "@/type";
import { cn } from "@/lib/utils";

interface CompanyCardProps {
  company: Company;
  className?: string;
}

export default function CompanyCard({ company, className }: CompanyCardProps) {
  const companyTypeName = company.company_types?.[0]?.name || "Beauty & Wellness";
  const locationText = company.location_text?.split(",")?.[0]?.trim() || 
                       company.address?.split(",")?.[0]?.trim() || 
                       "Bole";

  const companySlugOrId = company.slug
    ? encodeURIComponent(company.slug.replace(/^\/+|\/+$/g, ""))
    : company.id;

  const initials = company.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      href={`/company/${companySlugOrId}`}
      className={cn(
        "group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full p-5 sm:p-6",
        className
      )}
    >
      <div>
        {/* Top Section: Logo & Category */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative w-14 h-14 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
            {company.logo ? (
              <Image
                src={company.logo}
                alt={company.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <span className="text-base font-black text-amber-700 dark:text-amber-400">
                {initials}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-block text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
              {companyTypeName}
            </span>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate group-hover:text-amber-600 transition-colors">
              {company.name}
            </h3>
          </div>
        </div>

        {/* Location & Details */}
        <div className="space-y-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:map-point-linear" className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>

          {company.phone && (
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:phone-linear" className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{company.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 transition-colors">
          View Profile & Services
        </span>
        <Icon
          icon="solar:arrow-right-linear"
          className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all"
        />
      </div>
    </Link>
  );
}