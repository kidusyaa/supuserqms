"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Company } from "@/type";
import { cn } from "@/lib/utils";

import { getCategoryIconInfo } from "@/lib/categoryIcons";

interface CompanyCardProps {
  company: Company;
  className?: string;
}

export default function CompanyCard({ company, className }: CompanyCardProps) {
  const companyTypeName = company.company_types?.[0]?.name || "Beauty & Wellness";
  const categoryIconInfo = getCategoryIconInfo("", "", companyTypeName);
  const locationText = company.location_text?.split(",")?.[0]?.trim() || 
                       company.address?.split(",")?.[0]?.trim() || 
                       "Bole";

  const companySlugOrId = company.slug
    ? encodeURIComponent(company.slug.replace(/^\/+|\/+$/g, ""))
    : company.id;

  const servicesCount = company.services?.length || 0;

  const coverImage =
    company.company_photos?.find((p) => p.type === "venue" || p.type === "gallery")?.url ||
    company.company_photos?.[0]?.url ||
    company.services?.find((s) => Boolean(s.photo))?.photo ||
    company.logo ||
    null;

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
        "group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between h-full p-4 sm:p-5",
        className
      )}
    >
      <div>
        {/* Top Cover Image Banner with Floating Badges & Logo */}
        <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3.5 shrink-0">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={company.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className={`w-full h-full ${categoryIconInfo.bg} flex items-center justify-center`}>
              <Icon icon={categoryIconInfo.icon} className="w-12 h-12 opacity-30 text-slate-800" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

          {/* Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              {companyTypeName}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-teal-200/50 text-teal-800 dark:text-teal-300 text-[10px] font-bold shadow-xs">
              <Icon icon="solar:verified-check-bold" className="w-3 h-3 text-teal-600" />
              <span>Verified</span>
            </span>
          </div>

          {/* Company Logo Squircle (Bottom-Left) */}
          <div className="absolute bottom-2.5 left-2.5 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden shrink-0">
            {company.logo ? (
              <Image
                src={company.logo}
                alt={company.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <span className="text-sm font-serif font-black text-slate-800 dark:text-slate-200">
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Company Name & Category */}
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1 leading-snug">
            {company.name}
          </h3>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
            {companyTypeName}
          </p>
        </div>

        {/* Location & Details */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 truncate">
            <Icon icon="solar:map-point-linear" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
          {servicesCount > 0 && (
            <span className="font-bold text-slate-900 dark:text-white shrink-0 ml-2">
              {servicesCount} {servicesCount === 1 ? "service" : "services"}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Action Footer (Hold current one) */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors">
          View Profile &amp; Services
        </span>
        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#0f2937] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
          <Icon icon="solar:arrow-right-linear" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}