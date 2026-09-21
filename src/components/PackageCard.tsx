"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import type { Service, PackageItem } from "@/type";
import { cn } from "@/lib/utils";
import { calculateItemPriceBreakdown } from "@/lib/supabase-utils";

interface PackageCardProps {
  service: Service;
  className?: string;
}

export default function PackageCard({ service, className = "" }: PackageCardProps) {
  // 1. Calculate sum of individual items if available
  const individualSum = useMemo(() => {
    let sum = 0;
    if (service.package_items && service.package_items.length > 0) {
      for (const item of service.package_items) {
        if (item.item_type === 'service') {
          const p = item.linked_variant?.price || item.linked_service?.price;
          if (p) sum += parseFloat(String(p)) || 0;
        }
      }
    } else if (service.included_services && service.included_services.length > 0) {
      for (const sub of service.included_services) {
        if (sub.price) sum += parseFloat(sub.price) || 0;
      }
    }
    return sum;
  }, [service.package_items, service.included_services]);

  // 2. Price and Discount calculations
  const priceBreakdown = useMemo(() => {
    return calculateItemPriceBreakdown(service);
  }, [service]);

  const isPriceVisible = !priceBreakdown.isCallForPrice;
  const originalPriceNum = priceBreakdown.originalPrice || individualSum || 0;
  const finalPriceNum = priceBreakdown.finalPrice ?? (originalPriceNum > 0 ? originalPriceNum : null);
  const hasDiscount = priceBreakdown.hasDiscount || (individualSum > 0 && finalPriceNum !== null && individualSum > finalPriceNum);

  // Struck-through sum (show individual services sum if higher than package price)
  const struckThroughPrice = useMemo(() => {
    if (individualSum > 0 && finalPriceNum !== null && individualSum > finalPriceNum) {
      return individualSum;
    }
    if (priceBreakdown.hasDiscount && priceBreakdown.originalPrice && finalPriceNum !== null && priceBreakdown.originalPrice > finalPriceNum) {
      return priceBreakdown.originalPrice;
    }
    return null;
  }, [individualSum, finalPriceNum, priceBreakdown]);

  // Discount Badge text: e.g. "Total 10% discount" or "Save 400 ETB"
  const discountBadgeText = useMemo(() => {
    if (service.discount_type === 'percentage' && service.discount_value) {
      return `Total ${Math.round(Number(service.discount_value))}% discount`;
    }
    if (service.discount_type === 'fixed' && service.discount_value) {
      return `Save ${service.discount_value} ETB`;
    }
    if (struckThroughPrice && finalPriceNum && struckThroughPrice > finalPriceNum) {
      const saved = Math.round(struckThroughPrice - finalPriceNum);
      return `Save ${saved} ETB`;
    }
    return null;
  }, [service.discount_type, service.discount_value, struckThroughPrice, finalPriceNum]);

  // 3. Inclusions checklist
  const inclusionsList = useMemo((): Array<{ text: string; subtext?: string }> => {
    // If curated package_items exist
    if (service.package_items && service.package_items.length > 0) {
      return service.package_items.map((item: PackageItem) => {
        if (item.item_type === 'custom' || !item.linked_service_id) {
          return { text: item.custom_name || "Special Amenity" };
        }
        const serviceName = item.linked_service?.name || item.custom_name || "Linked Service";
        const variantName = item.linked_variant?.name || item.service_variant?.name;
        const subtext = variantName ? `(${variantName})` : undefined;
        return { text: subtext ? `${serviceName} ${subtext}` : serviceName };
      });
    }

    // If description_points exist on the package
    if (service.description_points && service.description_points.length > 0) {
      return service.description_points.map((p) => ({ text: p }));
    }

    // Fallback to included_services
    if (service.included_services && service.included_services.length > 0) {
      return service.included_services.map((sub) => ({
        text: sub.name,
        subtext: sub.service_category?.name,
      }));
    }

    // Fallback to description breakdown
    if (service.description) {
      const parts = service.description
        .split(/[\n,+•]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && !s.toLowerCase().includes("package"));
      if (parts.length > 0) {
        return parts.map((p) => ({ text: p }));
      }
    }

    return [{ text: "Adona Refresh" }, { text: "Wash and Style / Hair cut" }, { text: "Seasonal fruit Juice" }];
  }, [service.package_items, service.description_points, service.included_services, service.description]);

  // 4. Combined categories text
  const packageCategoriesText = useMemo(() => {
    if (service.package_items && service.package_items.length > 0) {
      const catNames = service.package_items
        .map((pi) => pi.linked_service?.service_category?.name || pi.linked_service?.name || pi.custom_name)
        .filter(Boolean);
      if (catNames.length > 0) return Array.from(new Set(catNames)).join(" + ");
    }
    if (service.included_services && service.included_services.length > 0) {
      const catNames = service.included_services
        .map((s) => s.service_category?.name || s.name)
        .filter(Boolean);
      if (catNames.length > 0) return Array.from(new Set(catNames)).join(" + ");
    }
    if (service.service_category?.name) return service.service_category.name;
    return "Curated Experience";
  }, [service.package_items, service.included_services, service.service_category]);

  const packageBadgeText = inclusionsList.length > 1 ? `${inclusionsList.length}-in-1 package` : "Curated package";

  const ratingSummary = service.company?.rating_summary;
  const hasRatings = Boolean(ratingSummary && Number(ratingSummary.total_ratings) > 0);
  const averageStars = hasRatings ? Number(ratingSummary!.average_stars) : 1;
  const totalRatings = hasRatings ? Number(ratingSummary!.total_ratings) : 0;

  const locationText =
    service.company?.location_text?.split(",")?.[0]?.trim() ||
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
        {/* ── Top Header Row: Badge on Left, Discount Badge / Price on Right ── */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200/60 tracking-tight">
            {packageBadgeText}
          </span>

          {discountBadgeText && (
            <span className="bg-amber-500 text-white rounded-full text-[11px] font-bold px-2.5 py-0.5 shadow-xs">
              {discountBadgeText}
            </span>
          )}
        </div>

        {/* ── Package Title ── */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-amber-600 transition-colors font-serif">
          {service.name}
        </h3>

        {/* ── Service Categories (e.g. "Reflexology + Manicure") ── */}
        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
          {packageCategoriesText}
        </p>

        {/* ── Company Name & Rating ── */}
        <div className="flex items-center justify-between gap-2 mt-0.5 mb-2.5">
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-normal truncate">
            by {service.company?.name || "Verified Salon"}
          </p>
          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
            <Icon icon="solar:star-bold" className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{hasRatings ? averageStars.toFixed(1) : "1"}</span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal">
              ({hasRatings ? totalRatings : 1})
            </span>
          </div>
        </div>

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

        {/* ── Included Checklist (Curated Inclusions) ── */}
        <div className="my-3.5">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Package Inclusions
          </p>
          <ul className="space-y-2">
            {inclusionsList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                <Icon icon="akar-icons:check" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="truncate">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Price Summary & Action ── */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Package Total</span>
          <div className="flex items-baseline gap-2">
            {!isPriceVisible ? (
              <span className="text-sm font-bold text-amber-600">Contact for price</span>
            ) : (
              <>
                {struckThroughPrice && finalPriceNum && struckThroughPrice > finalPriceNum && (
                  <span className="line-through text-xs sm:text-sm text-slate-400 font-normal">
                    {struckThroughPrice.toFixed(0)} ETB
                  </span>
                )}
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Total {finalPriceNum?.toFixed(0)} ETB
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom Action: Full-width Book package Button ── */}
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

