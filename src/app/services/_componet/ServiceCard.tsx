// src/app/services/_componet/ServiceCard.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Service, Category, ServiceVariant } from "@/type";
import PackageCard from "@/components/PackageCard";
import { cn } from "@/lib/utils";
import {
  calculateServiceStartingPrice,
  calculateItemPriceBreakdown,
} from "@/lib/supabase-utils";
import { getCategoryIconInfo } from "@/lib/categoryIcons";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // If service has active variants
  const activeVariants = useMemo(() => {
    if (!service.has_variants || !service.service_variants) return [];
    return service.service_variants.filter((v) => v.is_active !== false);
  }, [service.has_variants, service.service_variants]);

  const hasMultipleVariants = activeVariants.length > 0;

  // Selected variant state (defaults to first variant if multi-variant)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasMultipleVariants ? activeVariants[0].id : null
  );

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null;
    return activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0] || null;
  }, [selectedVariantId, activeVariants]);

  // Pricing calculations
  const startingPriceInfo = useMemo(() => {
    return calculateServiceStartingPrice(service);
  }, [service]);

  // Current selected item breakdown (either selected variant or base service)
  const currentPriceBreakdown = useMemo(() => {
    if (selectedVariant) {
      return calculateItemPriceBreakdown(selectedVariant);
    }
    return calculateItemPriceBreakdown(service);
  }, [selectedVariant, service]);

  const categoryName = getCategoryName(service, category);
  const iconInfo = getCategoryIconInfo(
    service.name,
    categoryName,
    service.company?.company_types?.[0]?.name
  );
  const defaultIcon = iconInfo.icon;

  const locationText =
    service.company?.location_text?.split(",")?.[0]?.trim() ||
    service.company?.address?.split(",")?.[0]?.trim() ||
    "Bole";

  const durationText = useMemo(() => {
    if (selectedVariant?.duration_mins) {
      return `${selectedVariant.duration_mins} min`;
    }
    if (service.estimated_wait_time_mins) {
      return `${service.estimated_wait_time_mins} min`;
    }
    return "30 min";
  }, [selectedVariant, service.estimated_wait_time_mins]);

  // Active service components (phases & add-ons)
  const activeComponents = useMemo(() => {
    const comps = service.components || service.service_components || [];
    return comps.filter((c) => c.is_active !== false);
  }, [service.components, service.service_components]);

  const addonCount = useMemo(() => {
    return activeComponents.filter((c) => c.component_type === "addon").length;
  }, [activeComponents]);

  const phaseCount = useMemo(() => {
    return activeComponents.filter((c) => c.component_type === "phase").length;
  }, [activeComponents]);

  const primaryPhoto = service.photo || service.service_photos?.[0]?.url || null;

  const ratingSummary = service.company?.rating_summary;
  const hasRatings = Boolean(ratingSummary && Number(ratingSummary.total_ratings) > 0);
  const averageStars = hasRatings ? Number(ratingSummary!.average_stars) : 1;
  const totalRatings = hasRatings ? Number(ratingSummary!.total_ratings) : 0;

  if (service.is_package) {
    return <PackageCard service={service} className={className} />;
  }

  const queryParams = new URLSearchParams();
  if (service.company_id) queryParams.set("companyId", service.company_id);
  if (selectedVariantId) queryParams.set("variantId", selectedVariantId);
  const queryString = queryParams.toString();
  const bookingHref = `/booking/${service.id}${queryString ? `?${queryString}` : ""}`;

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

  const handleVariantClick = (e: React.MouseEvent, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariantId(variantId);
  };

  // Top Badge text (Discount or Starting Price badge)
  const topBadgeText = useMemo(() => {
    if (currentPriceBreakdown.hasDiscount && currentPriceBreakdown.discountLabel) {
      return currentPriceBreakdown.discountLabel;
    }
    if (startingPriceInfo.hasDiscount) {
      return "Discounted";
    }
    return null;
  }, [currentPriceBreakdown, startingPriceInfo]);

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer",
        className
      )}
    >
      <Link href={bookingHref} className="flex flex-col flex-1">
        {/* ── Top Thumbnail Container ── */}
        {showImage && (
          <div className="relative w-full h-44 sm:h-48 bg-slate-50 dark:bg-slate-800/60 shrink-0 overflow-hidden flex items-center justify-center">
            {primaryPhoto ? (
              <Image
                src={primaryPhoto}
                alt={service.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform duration-300">
                <Icon icon={defaultIcon} width="44" height="44" />
              </div>
            )}

            {/* Discount Badge on Top-Left Corner */}
            {topBadgeText && (
              <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full shadow-sm tracking-tight z-10">
                {topBadgeText}
              </div>
            )}

            {/* Top-Right Action Row */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              {/* Zoom Preview Button */}
              {primaryPhoto && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsPreviewOpen(true);
                  }}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer shadow-xs active:scale-90 opacity-90 sm:opacity-0 group-hover:opacity-100"
                  title="Zoom in photo"
                  aria-label="Zoom in photo"
                >
                  <Icon icon="solar:magnifer-zoom-in-linear" className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Save/Favorite Heart Button */}
              <button
                type="button"
                onClick={handleFavoriteClick}
                className="w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer shadow-xs active:scale-90"
                title={isFavorited ? "Saved" : "Save service"}
              >
                <Icon
                  icon={isFavorited ? "solar:heart-bold" : "solar:heart-linear"}
                  className={`w-4 h-4 transition-colors ${isFavorited ? "text-rose-500" : "text-white"}`}
                />
              </button>
            </div>
          </div>
        )}

        {/* ── Content & Info Section ── */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div>
            {/* Category / Type & Rating */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-500 tracking-tight truncate">
                {categoryName}
              </span>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
                <Icon icon="solar:star-bold" className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{hasRatings ? averageStars.toFixed(1) : "1"}</span>
                <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal">
                  ({hasRatings ? totalRatings : 1})
                </span>
              </div>
            </div>

            {/* Service Title */}
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-1 tracking-tight leading-snug">
              {service.name}
            </h3>

            {/* Company Name */}
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-normal truncate mt-0.5 mb-2">
              {service.company?.name || "Verified Salon"}
            </p>

            {/* Meta Row: Duration & Location */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
              <div className="flex items-center gap-1">
                <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 text-slate-400" />
                <span>{durationText}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon icon="solar:map-point-linear" className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[120px]">{locationText}</span>
              </div>
            </div>

            {/* Service Components Badge (Phases & Add-ons) */}
            {activeComponents.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {phaseCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
                    <Icon icon="solar:layers-minimalistic-bold" className="w-3 h-3 text-emerald-600" />
                    <span>{phaseCount} {phaseCount === 1 ? "Phase" : "Phases"}</span>
                  </span>
                )}
                {addonCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40">
                    <Icon icon="solar:magic-stick-3-bold" className="w-3 h-3 text-amber-600" />
                    <span>+{addonCount} Add-on{addonCount === 1 ? "" : "s"}</span>
                  </span>
                )}
              </div>
            )}

            {/* ── Included Amenities / Perks Chips (description_points) ── */}
            {service.description_points && service.description_points.length > 0 && (
              <div className="flex flex-wrap gap-1.5 my-2.5">
                {service.description_points.slice(0, 3).map((perk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40"
                  >
                    <Icon icon="akar-icons:check" className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[130px]">{perk}</span>
                  </span>
                ))}
                {service.description_points.length > 3 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{service.description_points.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* ── Duration / Option Selector Pills (Reference Design) ── */}
            {hasMultipleVariants && (
              <div className="my-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Options
                </p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {activeVariants.map((variant) => {
                    const isSelected = variant.id === selectedVariantId;
                    const vBreakdown = calculateItemPriceBreakdown(variant);
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={(e) => handleVariantClick(e, variant.id)}
                        className={cn(
                          "relative shrink-0 flex flex-col items-start px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer min-w-[90px]",
                          isSelected
                            ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-1 ring-amber-500/40 text-slate-900 dark:text-white"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between w-full gap-1">
                          <span className="text-xs font-bold truncate">{variant.name}</span>
                          {vBreakdown.hasDiscount && (
                            <span className="bg-amber-500 text-white rounded-full text-[9px] font-extrabold px-1.5 py-0.2 shrink-0">
                              Save {vBreakdown.discountAmount.toFixed(0)}
                            </span>
                          )}
                        </div>
                        {variant.duration_mins && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {variant.duration_mins} min
                          </span>
                        )}
                        <div className="flex items-baseline gap-1 mt-0.5">
                          {vBreakdown.isCallForPrice ? (
                            <span className="text-[11px] font-bold text-amber-600">Inquire</span>
                          ) : (
                            <>
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {vBreakdown.finalPrice?.toFixed(0)} ETB
                              </span>
                              {vBreakdown.hasDiscount && (
                                <span className="line-through text-[10px] text-slate-400">
                                  {vBreakdown.originalPrice?.toFixed(0)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Price Row & Bottom Right Action ── */}
          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {/* If service price is not visible or variant is call for price */}
              {currentPriceBreakdown.isCallForPrice ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-600">Contact for price</span>
                </div>
              ) : hasMultipleVariants && !selectedVariantId ? (
                /* Starting from X ETB calculation for multi-variant service */
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Starting from</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {startingPriceInfo.minPrice?.toFixed(0)} ETB
                  </span>
                </div>
              ) : currentPriceBreakdown.hasDiscount ? (
                /* Discounted Price Display */
                <div className="flex items-baseline gap-1.5">
                  {hasMultipleVariants && (
                    <span className="text-[11px] text-slate-400 font-normal">Starting from</span>
                  )}
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {currentPriceBreakdown.finalPrice?.toFixed(0)} ETB
                  </span>
                  <span className="line-through text-xs sm:text-sm text-slate-400 font-normal">
                    {currentPriceBreakdown.originalPrice?.toFixed(0)} ETB
                  </span>
                </div>
              ) : (
                /* Standard Price Display */
                <div className="flex items-baseline gap-1.5">
                  {hasMultipleVariants && (
                    <span className="text-[11px] text-slate-400 font-normal">Starting from</span>
                  )}
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {currentPriceBreakdown.originalPrice?.toFixed(0)} ETB
                  </span>
                </div>
              )}
            </div>

            <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#0f2937] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
              <Icon
                icon="solar:arrow-right-linear"
                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Enlarged Photo Dialog / Lightbox - Only mount when preview is requested */}
      {primaryPhoto && isPreviewOpen && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
            <DialogTitle className="sr-only">{service.name} Image</DialogTitle>
            <DialogDescription className="sr-only">Full size view of {service.name}</DialogDescription>
            <div className="relative w-full h-[65vh] sm:h-[75vh] flex items-center justify-center">
              <Image
                src={primaryPhoto}
                alt={service.name}
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}