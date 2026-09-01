"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import type { Service, Company } from "@/type";
import { format, isToday } from "date-fns";
import { useEffect, useState, useRef } from "react";
import ServiceVideoModal from "@/components/ServiceVideoModal";
import { cn } from "@/lib/utils";

interface ServiceDetailsCardProps {
  service: Service;
  company: Company;
  queueCount: number;
  estimatedQueueStartTime: Date | null;
  selectedProviderName?: string;
}

const calculateDiscountedPrice = (service: Service): string | null => {
  const originalPrice = parseFloat(service.price || "0");
  if (!service.discount_type || service.discount_value === null || originalPrice === 0) {
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

const formatDiscount = (service: Service): string => {
  if (!service.discount_type || service.discount_value === null) return "";
  if (service.discount_type === "percentage") {
    return `${service.discount_value}% OFF`;
  }
  if (service.discount_type === "fixed") {
    return `Save ${service.discount_value} ETB`;
  }
  return "";
};

export default function ServiceDetailsCard({
  service,
  company,
  queueCount,
  estimatedQueueStartTime,
  selectedProviderName,
}: ServiceDetailsCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const hasDiscount =
    service.discount_type &&
    service.discount_value !== null &&
    parseFloat(service.price || "0") > 0;

  const originalPriceValue = parseFloat(service.price || "0");
  const formattedOriginalPrice =
    originalPriceValue > 0 ? `${originalPriceValue.toFixed(0)} ETB` : null;

  const discountedPriceValue = hasDiscount
    ? parseFloat(calculateDiscountedPrice(service) || "0")
    : originalPriceValue;
  const formattedDiscountedPrice =
    discountedPriceValue > 0 ? `${discountedPriceValue.toFixed(0)} ETB` : null;

  const discountLabel = hasDiscount ? formatDiscount(service) : null;

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
                  {hasDiscount && discountLabel && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
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
              {service.price === null ? (
                <span className="text-sm font-bold text-amber-600">Call for price</span>
              ) : hasDiscount ? (
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formattedDiscountedPrice}
                  </div>
                  <span className="line-through text-xs sm:text-sm text-slate-400">
                    {formattedOriginalPrice}
                  </span>
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {service.price} ETB
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {service.description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {service.description}
            </p>
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
                {service.estimated_wait_time_mins || 30} mins
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

          {/* Included Package Sub-Services (If package) */}
          {service.is_package && service.included_services && service.included_services.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Icon icon="solar:layers-minimalistic-bold" className="w-4 h-4 text-purple-600" />
                <span>Included in this Package ({service.included_services.length} services):</span>
              </div>
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