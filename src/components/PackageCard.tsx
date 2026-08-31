"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import type { Service } from "@/type";
import { cn } from "@/lib/utils";

interface PackageCardProps {
  service: Service;
  className?: string;
}

export default function PackageCard({ service, className = "" }: PackageCardProps) {
  // Discount calculations
  const originalPriceNum = parseFloat(service.price || '0');
  const hasDiscount = !!(service.discount_type && service.discount_value && originalPriceNum > 0);

  let discountedPriceNum = originalPriceNum;
  if (hasDiscount) {
    if (service.discount_type === 'percentage') {
      discountedPriceNum = originalPriceNum * (1 - service.discount_value! / 100);
    } else if (service.discount_type === 'fixed') {
      discountedPriceNum = Math.max(0, originalPriceNum - service.discount_value!);
    }
  }

  // 1. Combined category string: e.g. "Reflexology + Manicure"
  const getPackageCategoriesText = (): string => {
    if (service.included_services && service.included_services.length > 0) {
      const catNames = service.included_services
        .map(s => s.service_category?.name || s.name)
        .filter(Boolean);
      if (catNames.length > 0) {
        return Array.from(new Set(catNames)).join(" + ");
      }
    }
    if (service.service_category?.name) {
      return service.service_category.name;
    }
    if (service.description) {
      const parts = service.description
        .split(/[\n,+•]+/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && !s.toLowerCase().includes("package"));
      if (parts.length > 0) return parts.join(" + ");
    }
    return "Reflexology + Manicure";
  };

  // 2. Included category items for checklist
  const getIncludedServices = (): string[] => {
    if (service.included_services && service.included_services.length > 0) {
      return service.included_services
        .map(s => s.service_category?.name || s.name || "Treatment")
        .filter(Boolean);
    }
    if (service.description) {
      const parts = service.description
        .split(/[\n,+•]+/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && !s.toLowerCase().includes("package"));
      if (parts.length > 0) return parts;
    }
    const combined = getPackageCategoriesText();
    if (combined && combined.includes("+")) {
      return combined.split("+").map(s => s.trim()).filter(Boolean);
    }
    return ["Haircut", "Beard Trim", "Hot Towel Shave"];
  };

  const packageCategoriesText = getPackageCategoriesText();
  const includedList = getIncludedServices();
  const packageBadgeText = includedList.length > 1 ? `${includedList.length}-in-1 package` : "Special package";

  const locationText = service.company?.location_text?.split(",")?.[0]?.trim() ||
    service.company?.address?.split(",")?.[0]?.trim() ||
    "Bole";

  const durationText = service.estimated_wait_time_mins
    ? `${service.estimated_wait_time_mins} min`
    : "75 min";

  const bookingHref = `/booking/${service.id}${service.company_id ? `?companyId=${service.company_id}` : ''}`;

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full",
        className
      )}
    >
      <div>
        {/* ── Top Header Row: Badge on Left, Price on Right ── */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200/60 tracking-tight">
            {packageBadgeText}
          </span>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            {service.price === null ? (
              <span className="text-sm font-bold text-amber-600">Call for price</span>
            ) : hasDiscount ? (
              <>
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {discountedPriceNum.toFixed(0)} ETB
                </span>
                <span className="line-through text-xs sm:text-sm text-slate-400 font-normal">
                  {originalPriceNum.toFixed(0)} ETB
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {originalPriceNum.toFixed(0)} ETB
              </span>
            )}
          </div>
        </div>

        {/* ── Package Title ── */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-amber-600 transition-colors font-serif">
          {service.name}
        </h3>

        {/* ── Service Categories (e.g. "Reflexology + Manicure") ── */}
        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
          {packageCategoriesText}
        </p>

        {/* ── Company Name (e.g. "by Bety Nail and Spa") ── */}
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5 mb-2.5">
          by {service.company?.name || "Verified Salon"}
        </p>

        {/* ── Meta Row: Duration & Location ── */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pb-3 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 text-slate-400" />
            <span>{durationText}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon icon="solar:map-point-linear" className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[120px]">{locationText}</span>
          </div>
        </div>

        {/* ── Included Services / Categories List with Orange Checkmarks ── */}
        <ul className="space-y-2.5 my-4">
          {includedList.map((categoryItem, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Icon icon="akar-icons:check" className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{categoryItem}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Bottom Action: Full-width Dark Tertiary/Navy Book package Button ── */}
      <div className="pt-2">
        <Link
          href={bookingHref}
          className="w-full py-3 px-4 rounded-2xl bg-tertiary hover:bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          Book package
        </Link>
      </div>
    </div>
  );
}

