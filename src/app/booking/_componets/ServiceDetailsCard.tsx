"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import type { Service, Company, ServiceVariant, PackageItem } from "@/type";
import { format, isToday } from "date-fns";
import { useEffect, useState, useRef, useMemo } from "react";
import ServiceVideoModal from "@/components/ServiceVideoModal";
import { cn } from "@/lib/utils";
import { calculateItemPriceBreakdown, calculateServiceStartingPrice } from "@/lib/supabase-utils";

interface ServiceDetailsCardProps {
  service: Service;
  company: Company;
  queueCount: number;
  estimatedQueueStartTime: Date | null;
  selectedProviderName?: string;
  selectedVariant?: ServiceVariant | null;
  onVariantSelect?: (variant: ServiceVariant) => void;
}

export default function ServiceDetailsCard({
  service,
  company,
  queueCount,
  estimatedQueueStartTime,
  selectedProviderName,
  selectedVariant,
  onVariantSelect,
}: ServiceDetailsCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Active variants
  const activeVariants = useMemo(() => {
    if (!service.has_variants || !service.service_variants) return [];
    return service.service_variants.filter((v) => v.is_active !== false);
  }, [service.has_variants, service.service_variants]);

  const hasVariants = activeVariants.length > 0;

  // Starting price information for unselected state
  const startingPriceInfo = useMemo(() => {
    return calculateServiceStartingPrice(service);
  }, [service]);

  // Current effective item (selected variant or service)
  const currentItem = selectedVariant || service;
  const priceBreakdown = useMemo(() => {
    return calculateItemPriceBreakdown(currentItem);
  }, [currentItem]);

  const isPriceVisible = !priceBreakdown.isCallForPrice;

  // Package individual sum
  const individualSum = useMemo(() => {
    if (!service.is_package) return 0;
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
  }, [service.is_package, service.package_items, service.included_services]);

  const struckThroughPrice = useMemo(() => {
    if (service.is_package && individualSum > 0 && priceBreakdown.finalPrice && individualSum > priceBreakdown.finalPrice) {
      return individualSum;
    }
    if (priceBreakdown.hasDiscount && priceBreakdown.originalPrice && priceBreakdown.finalPrice && priceBreakdown.originalPrice > priceBreakdown.finalPrice) {
      return priceBreakdown.originalPrice;
    }
    return null;
  }, [service.is_package, individualSum, priceBreakdown]);

  // Top discount badge text
  const discountLabel = useMemo(() => {
    if (service.is_package) {
      if (service.discount_type === 'percentage' && service.discount_value) {
        return `Total ${Math.round(Number(service.discount_value))}% OFF`;
      }
      if (service.discount_type === 'fixed' && service.discount_value) {
        return `Save ${service.discount_value} ETB`;
      }
      if (struckThroughPrice && priceBreakdown.finalPrice && struckThroughPrice > priceBreakdown.finalPrice) {
        const saved = Math.round(struckThroughPrice - priceBreakdown.finalPrice);
        return `Save ${saved} ETB`;
      }
    }
    if (priceBreakdown.hasDiscount && priceBreakdown.discountLabel) {
      return priceBreakdown.discountLabel;
    }
    return null;
  }, [service, priceBreakdown, struckThroughPrice]);

  // --- Images determination ---
  const imageUrls = new Set<string>();
  if (service.photo) imageUrls.add(service.photo);
  if (service.service_photos && service.service_photos.length > 0) {
    service.service_photos.forEach((p) => {
      if (p.url) imageUrls.add(p.url);
    });
  }
  if (service.is_package && service.included_services && service.included_services.length > 0) {
    service.included_services.forEach((sub) => {
      if (sub.photo) imageUrls.add(sub.photo);
      if (sub.service_photos && sub.service_photos.length > 0) {
        sub.service_photos.forEach((p) => {
          if (p.url) imageUrls.add(p.url);
        });
      }
    });
  }
  const uniqueImageUrls = Array.from(imageUrls);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % uniqueImageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + uniqueImageUrls.length) % uniqueImageUrls.length);
  };

  // Auto-slide
  useEffect(() => {
    if (uniqueImageUrls.length <= 1 || isAutoPlayPaused || selectedImage) return;
    const id = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % uniqueImageUrls.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [uniqueImageUrls.length, isAutoPlayPaused, selectedImage]);

  const currentDuration = selectedVariant?.duration_mins || service.estimated_wait_time_mins || 30;

  const phoneLink = company.phone ? `tel:${company.phone}` : null;
  const telegramLink = company.socials?.website?.includes("t.me") ? company.socials.website : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-none mb-6 sm:mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* ── Left Column: Media & Photos (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
              <DialogTrigger asChild>
                <div
                  className="relative h-64 sm:h-80 md:h-[340px] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group border border-slate-200/80 dark:border-slate-700"
                  onMouseEnter={() => setIsAutoPlayPaused(true)}
                  onMouseLeave={() => setIsAutoPlayPaused(false)}
                  onClick={() => {
                    const url = uniqueImageUrls[currentImageIndex];
                    if (url) setSelectedImage(url);
                  }}
                >
                  <Image
                    src={uniqueImageUrls[currentImageIndex] || "/placeholder-service.png"}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-300"
                    priority
                  />

                  {/* Discount Chip */}
                  {discountLabel && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 z-10">
                      <Icon icon="solar:tag-price-bold" className="w-3.5 h-3.5" />
                      <span>{discountLabel}</span>
                    </div>
                  )}

                  {/* Watch Video Pill on Image */}
                  {service.video_url && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVideoModalOpen(true);
                      }}
                      className="absolute bottom-3 left-3 z-10 bg-[#0f2937]/90 hover:bg-[#0f2937] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-white/20 backdrop-blur-sm"
                    >
                      <Icon icon="solar:play-bold" className="w-3.5 h-3.5 text-amber-400" />
                      <span>Watch Treatment Video</span>
                    </button>
                  )}

                  {/* Counter */}
                  {uniqueImageUrls.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-2.5 rounded-full">
                      {currentImageIndex + 1} / {uniqueImageUrls.length}
                    </div>
                  )}

                  {/* Nav Arrows */}
                  {uniqueImageUrls.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs transition-transform hover:scale-105 cursor-pointer"
                      >
                        <Icon icon="solar:alt-arrow-left-linear" className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs transition-transform hover:scale-105 cursor-pointer"
                      >
                        <Icon icon="solar:alt-arrow-right-linear" className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </DialogTrigger>

              {/* Fullscreen Modal */}
              <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
                <DialogTitle className="sr-only">{service.name} Gallery</DialogTitle>
                <DialogDescription className="sr-only">Full image view</DialogDescription>
                {selectedImage && (
                  <div className="relative w-full h-[70vh] flex items-center justify-center">
                    <Image
                      src={selectedImage}
                      alt="Enlarged service"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Thumbnail Strip */}
            {uniqueImageUrls.length > 1 && (
              <div
                ref={thumbnailRef}
                className="flex gap-2 overflow-x-auto no-scrollbar pt-2"
              >
                {uniqueImageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "relative w-16 h-14 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer",
                      idx === currentImageIndex
                        ? "border-[#0f2937] ring-2 ring-[#0f2937]/30"
                        : "border-slate-200 opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={url} alt="thumbnail" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Service Info & Meta (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header Row: Title & Price */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              {/* Category / Package Badge */}
              <div className="flex items-center gap-2 mb-1.5">
                {service.is_package ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                    <Icon icon="solar:box-minimalistic-bold" className="w-3.5 h-3.5" />
                    <span>Package Deal</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                    <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 text-teal-600" />
                    <span>Verified Service</span>
                  </span>
                )}
                {service.code && (
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    #{service.code}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {service.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                by <span className="font-semibold text-slate-800 dark:text-slate-200">{company.name}</span>
              </p>
            </div>

            {/* Price Block */}
            <div className="sm:text-right">
              {!isPriceVisible ? (
                <div className="flex flex-col sm:items-end gap-1.5">
                  <span className="text-base sm:text-lg font-bold text-amber-600">Contact for price</span>
                  {phoneLink && (
                    <a
                      href={phoneLink}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-full hover:bg-amber-600 transition-colors shadow-xs"
                    >
                      <Icon icon="solar:phone-calling-bold" className="w-3.5 h-3.5" />
                      <span>Contact Venue</span>
                    </a>
                  )}
                </div>
              ) : hasVariants && !selectedVariant ? (
                <div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 block uppercase tracking-wide">
                    Starting from
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {startingPriceInfo.minPrice?.toFixed(0) || priceBreakdown.originalPrice?.toFixed(0)} ETB
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Select an option below
                  </span>
                </div>
              ) : priceBreakdown.hasDiscount || (struckThroughPrice && priceBreakdown.finalPrice && struckThroughPrice > priceBreakdown.finalPrice) ? (
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {priceBreakdown.finalPrice?.toFixed(0)} ETB
                  </div>
                  {struckThroughPrice && (
                    <span className="line-through text-xs sm:text-sm text-slate-400">
                      {struckThroughPrice.toFixed(0)} ETB
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {priceBreakdown.originalPrice?.toFixed(0)} ETB
                </div>
              )}
            </div>
          </div>

          {/* ── Top Variant / Option Selector (Prominent at the Top if variants exist) ── */}
          {hasVariants && (
            <div
              id="booking-variant-selector"
              className={cn(
                "rounded-2xl p-4 sm:p-5 border transition-all duration-300",
                !selectedVariant
                  ? "bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800/70 shadow-xs ring-2 ring-amber-400/25"
                  : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      !selectedVariant ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                    )}
                  ></span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Select Option / Quantity
                  </h3>
                  {!selectedVariant && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold uppercase tracking-wide">
                      Select option to view price
                    </span>
                  )}
                </div>

                {selectedVariant ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    <span>Selected: {selectedVariant.name}</span>
                  </span>
                ) : (
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold italic">
                    Choose one to proceed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {activeVariants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const vBreakdown = calculateItemPriceBreakdown(variant);
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => onVariantSelect && onVariantSelect(variant)}
                      className={cn(
                        "relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                        isSelected
                          ? "border-amber-500 bg-white dark:bg-slate-900 ring-2 ring-amber-500/40 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 hover:border-slate-300 hover:bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              isSelected
                                ? "border-amber-500 bg-amber-500 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            )}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {variant.name}
                          </span>
                        </div>
                        {vBreakdown.hasDiscount && (
                          <span className="bg-amber-500 text-white rounded-full text-[9px] font-extrabold px-1.5 py-0.5 shrink-0">
                            Save {vBreakdown.discountAmount.toFixed(0)}
                          </span>
                        )}
                      </div>

                      {variant.duration_mins && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 pl-6">
                          <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 text-slate-400" />
                          <span>{variant.duration_mins} min</span>
                        </div>
                      )}

                      <div className="flex items-baseline justify-between mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 pl-6">
                        {vBreakdown.isCallForPrice ? (
                          <span className="text-xs font-bold text-amber-600">Contact for price</span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {vBreakdown.finalPrice?.toFixed(0)} ETB
                            </span>
                            {vBreakdown.hasDiscount && (
                              <span className="line-through text-[10px] text-slate-400">
                                {vBreakdown.originalPrice?.toFixed(0)}
                              </span>
                            )}
                          </div>
                        )}
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isSelected ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                          )}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── High-Visibility Service Description Box ── */}
          {service.description && (
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Icon icon="solar:document-text-bold" className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  About this Service &amp; Details
                </h4>
              </div>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                {service.description}
              </div>
            </div>
          )}

          {/* ── Included Amenities / Perks Chips (description_points) ── */}
          {service.description_points && service.description_points.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {service.description_points.map((perk, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/50 shadow-2xs"
                >
                  <Icon icon="akar-icons:check" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{perk}</span>
                </span>
              ))}
            </div>
          )}

          {/* Meta Specifications Grid (Clean 1px Border Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Duration */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-0.5">
                <Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5 text-slate-500" />
                <span>Duration</span>
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {currentDuration} mins
              </p>
            </div>

            {/* Location */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-0.5">
                <Icon icon="solar:map-point-linear" className="w-3.5 h-3.5 text-slate-500" />
                <span>Location</span>
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {company.location_text?.split(",")?.[0]?.trim() || "Bole, Addis Ababa"}
              </p>
            </div>

            {/* Selected Provider / Live Queue info */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-0.5">
                <Icon icon="solar:users-group-rounded-linear" className="w-3.5 h-3.5 text-slate-500" />
                <span>Queue Line</span>
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {queueCount} {queueCount === 1 ? "person" : "people"} waiting
              </p>
            </div>
          </div>

          {/* ── Curated Package Inclusions Breakdown (If package) ── */}
          {service.is_package && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Icon icon="solar:layers-minimalistic-bold" className="w-4 h-4 text-amber-600" />
                <span>Curated Package Inclusions:</span>
              </div>

              {service.package_items && service.package_items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {service.package_items.map((item, idx) => {
                    const isCustom = item.item_type === 'custom' || !item.linked_service_id;
                    const title = isCustom ? item.custom_name : (item.linked_service?.name || item.custom_name || "Service");
                    const variantName = item.linked_variant?.name || item.service_variant?.name;
                    return (
                      <div
                        key={item.id || idx}
                        className="flex items-center gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
                      >
                        <Icon icon="akar-icons:check" className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {title}
                          </p>
                          {variantName && (
                            <p className="text-[11px] text-amber-600 font-medium">
                              {variantName}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : service.included_services && service.included_services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {service.included_services.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="flex items-center gap-2.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <Image
                          src={sub.photo || "/placeholder-service.png"}
                          alt={sub.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {sub.name}
                        </p>
                        {sub.estimated_wait_time_mins && (
                          <p className="text-[11px] text-slate-400">
                            {sub.estimated_wait_time_mins} mins
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Icon icon="akar-icons:check" className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Adona Refresh</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="akar-icons:check" className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Wash and Style / Hair cut</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="akar-icons:check" className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Seasonal fruit Juice</span>
                  </li>
                </ul>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Video Modal */}
      {service.video_url && (
        <ServiceVideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoUrl={service.video_url}
          videoPlatform={service.video_platform}
          serviceName={service.name}
        />
      )}
    </div>
  );
}