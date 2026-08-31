// src/app/services/_componet/ServiceCard.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Service, Category } from "@/type";
import PackageCard from "@/components/PackageCard";
import { cn } from "@/lib/utils";

// --- Helper Functions ---
const calculateDiscountedPrice = (service: Service): string | null => {
  const originalPrice = parseFloat(service.price || "0");
  if (!service.discount_type || !service.discount_value || originalPrice === 0) {
    return service.price;
  }
  let finalPrice = originalPrice;
  if (service.discount_type === "percentage") {
    finalPrice = originalPrice * (1 - service.discount_value / 100);
  } else if (service.discount_type === "fixed") {
    finalPrice = originalPrice - service.discount_value;
  }
  return (finalPrice > 0 ? finalPrice : 0).toFixed(0);
};

const formatDiscountBadge = (service: Service): string => {
  if (!service.discount_type || !service.discount_value) return "";
  if (service.discount_type === "percentage") {
    return `${Math.round(Number(service.discount_value))}% off`;
  }
  return `${service.discount_value} ETB off`;
};

import { getCategoryIconInfo } from "@/lib/categoryIcons";

const getCategoryName = (service: Service, category?: Category): string => {
  if (category?.name) return category.name;
  if (service.service_category?.name) return service.service_category.name;
  if (service.company?.company_types?.[0]?.name) return service.company.company_types[0].name;
  return "Beauty Salon";
};

interface ServiceCardProps {
  service: Service;
  category?: Category;
  showImage?: boolean;
  className?: string;
}

export default function ServiceCard({
  service,
  category,
  showImage = true,
  className,
}: ServiceCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const hasDiscount = !!(service.discount_type && service.discount_value);
  const discountedPrice = calculateDiscountedPrice(service);
  const originalPrice = service.price ? parseFloat(service.price).toFixed(0) : null;
  const categoryName = getCategoryName(service, category);
  const iconInfo = getCategoryIconInfo(
    service.name,
    categoryName,
    service.company?.company_types?.[0]?.name
  );
  const defaultIcon = iconInfo.icon;
  
  const locationText = service.company?.location_text?.split(",")?.[0]?.trim() || 
                       service.company?.address?.split(",")?.[0]?.trim() || 
                       "Bole";

  const durationText = service.estimated_wait_time_mins 
    ? `${service.estimated_wait_time_mins} min` 
    : "30 min";

  const primaryPhoto = service.photo || service.service_photos?.[0]?.url || null;

  if (service.is_package) {
    return <PackageCard service={service} className={className} />;
  }

  const bookingHref = `/booking/${service.id}${service.company_id ? `?companyId=${service.company_id}` : ''}`;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { toggleServiceFavorite } = await import("@/lib/supabase-utils");
      const res = await toggleServiceFavorite(service.id);
      setIsFavorited(res.isFavorited);
    } catch (err: any) {
      console.warn("Favorite toggle:", err.message);
    }
  };

  return (
    <Link
      href={bookingHref}
      className={cn(
        "group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-row sm:flex-col cursor-pointer",
        className
      )}
    >
      {/* ── Top Thumbnail Container (Flex on mobile, column on desktop) ── */}
      {showImage && (
        <div className="relative w-32 xs:w-36 h-36 xs:h-40 sm:w-full sm:h-48 bg-slate-50 dark:bg-slate-800/60 shrink-0 overflow-hidden flex items-center justify-center">
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={service.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 150px, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform duration-300">
              <Icon icon={defaultIcon} width="44" height="44" />
            </div>
          )}

          {/* Discount Badge on Top-Left Corner */}
          {hasDiscount && (
            <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full shadow-sm tracking-tight z-10">
              {formatDiscountBadge(service)}
            </div>
          )}

          {/* Save/Favorite Heart Button on Top-Right Corner */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md flex items-center justify-center text-white transition-all z-10 cursor-pointer shadow-xs active:scale-90"
            title={isFavorited ? "Saved" : "Save service"}
          >
            <Icon
              icon={isFavorited ? "solar:heart-bold" : "solar:heart-linear"}
              className={`w-4 h-4 transition-colors ${isFavorited ? "text-rose-500" : "text-white"}`}
            />
          </button>
        </div>
      )}

      {/* ── Content & Info Section ── */}
      <div className="flex-1 p-3.5 sm:p-5 flex flex-col justify-between min-w-0">
        <div>
          {/* Category / Type */}
          <div className="text-xs font-bold text-amber-600 dark:text-amber-500 tracking-tight mb-1">
            {categoryName}
          </div>

          {/* Service Title */}
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1 tracking-tight leading-snug">
            {service.name}
          </h3>

          {/* Company Name */}
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-normal truncate mt-0.5 mb-2.5">
            {service.company?.name || "Verified Salon"}
          </p>

          {/* Meta Row: Duration & Location */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 text-slate-400" />
              <span>{durationText}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="solar:map-point-linear" className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[100px] sm:max-w-[120px]">{locationText}</span>
            </div>
          </div>
        </div>

        {/* ── Price Row & Bottom Right Arrow ── */}
        <div className="pt-2 sm:pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {service.price === null ? (
              <span className="text-sm font-bold text-amber-600">Call for price</span>
            ) : hasDiscount ? (
              <>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {discountedPrice} ETB
                </span>
                <span className="line-through text-xs sm:text-sm text-slate-400 font-normal">
                  {originalPrice} ETB
                </span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {service.price} ETB
              </span>
            )}
          </div>

          <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#0f2937] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <Icon icon="solar:arrow-right-linear" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}