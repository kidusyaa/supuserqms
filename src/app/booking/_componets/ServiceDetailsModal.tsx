"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Service, Company } from "@/type";
import ServiceVideoModal from "@/components/ServiceVideoModal";

interface ServiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  company: Company;
}

export default function ServiceDetailsModal({
  open,
  onOpenChange,
  service,
  company,
}: ServiceDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Gather unique photos
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
    if (uniqueImageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % uniqueImageUrls.length);
    }
  };

  const prevImage = () => {
    if (uniqueImageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + uniqueImageUrls.length) % uniqueImageUrls.length);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                {service.service_category?.name || "Service Details"}
              </span>
              {service.code && (
                <span className="text-[11px] font-mono text-slate-400">#{service.code}</span>
              )}
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
              {service.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Offered by <span className="font-semibold text-slate-700 dark:text-slate-300">{company.name}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Photo Gallery Carousel */}
          {uniqueImageUrls.length > 0 && (
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 my-2">
              <Image
                src={uniqueImageUrls[currentImageIndex]}
                alt={service.name}
                fill
                className="object-cover"
              />

              {/* Watch Video Button */}
              {service.video_url && (
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="absolute bottom-3 left-3 z-10 bg-[#0f2937]/90 hover:bg-[#0f2937] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-white/20 backdrop-blur-sm"
                >
                  <Icon icon="solar:play-bold" className="w-3.5 h-3.5 text-amber-400" />
                  <span>Watch Treatment Video</span>
                </button>
              )}

              {/* Image Counter */}
              {uniqueImageUrls.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-2.5 rounded-full">
                  {currentImageIndex + 1} / {uniqueImageUrls.length}
                </div>
              )}

              {/* Arrows */}
              {uniqueImageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    <Icon icon="solar:alt-arrow-left-linear" className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    <Icon icon="solar:alt-arrow-right-linear" className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Service Description Box */}
          {service.description && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 my-2 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Icon icon="solar:document-text-bold" className="w-4 h-4 text-amber-500" />
                <span>Description &amp; Procedure</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>
          )}

          {/* Included Perks / Amenities */}
          {service.description_points && service.description_points.length > 0 && (
            <div className="space-y-1.5 my-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Included Amenities:
              </h4>
              <div className="flex flex-wrap gap-2">
                {service.description_points.map((perk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/50"
                  >
                    <Icon icon="akar-icons:check" className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{perk}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Venue Location & Details */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Location</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {company.location_text || company.address || "Bole, Addis Ababa"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Duration</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {service.estimated_wait_time_mins ? `${service.estimated_wait_time_mins} mins` : "Varies by option"}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal if available */}
      {service.video_url && (
        <ServiceVideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoUrl={service.video_url}
          serviceName={service.name}
        />
      )}
    </>
  );
}
