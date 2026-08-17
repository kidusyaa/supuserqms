"use client";

import Link from "next/link";
import type { Service } from "@/type";
import { formatPackageCategories } from "@/lib/supabase-utils";

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

  // Discount badge text
  let discountLabel = "";
  if (hasDiscount) {
    if (service.discount_type === 'percentage') {
      discountLabel = `${Math.round(service.discount_value!)}% OFF`;
    } else if (service.discount_type === 'fixed') {
      discountLabel = `-$${service.discount_value} OFF`;
    }
  }

  // Subtitle formatted as "Haircut + Beard Trim + Wash"
  const categoriesSubtitle = formatPackageCategories(service);

  return (
    <div
      className={`bg-[#f4f7fc] border border-slate-200/90 rounded-2xl p-5 sm:p-6 relative flex flex-col justify-between hover:shadow-md transition-all duration-300 ${className}`}
    >
      {/* Top Section: Badge and Title */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug line-clamp-1 pr-16">
            {service.name}
          </h3>

          {/* Discount Badge at Top Right */}
          {hasDiscount && discountLabel && (
            <span className="absolute top-5 right-5 sm:top-6 sm:right-6 bg-amber-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-md shadow-xs tracking-wide">
              {discountLabel}
            </span>
          )}
        </div>

        {/* Categories / Included Services Subtitle */}
        {categoriesSubtitle && (
          <p className="text-slate-600 font-medium text-sm sm:text-base line-clamp-1 mt-0.5">
            {categoriesSubtitle}
          </p>
        )}

        {/* Company Name if present */}
        {service.company?.name && (
          <p className="text-xs text-slate-400 font-normal mt-1 truncate">
            by {service.company.name}
          </p>
        )}
      </div>

      {/* Bottom Section: Price & Book Button */}
      <div className="flex items-center justify-between mt-6 pt-2">
        <div className="flex items-baseline">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            ${discountedPriceNum.toFixed(0)}
          </span>
          {hasDiscount && originalPriceNum > discountedPriceNum && (
            <span className="line-through text-slate-400 text-sm sm:text-base font-normal ml-2">
              ${originalPriceNum.toFixed(0)}
            </span>
          )}
        </div>

        <Link
          href={`/packages/${service.id}`}
          className="border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-1.5 sm:py-2 rounded-xl transition-colors duration-200 inline-flex items-center justify-center"
        >
          Book
        </Link>
      </div>
    </div>
  );
}
