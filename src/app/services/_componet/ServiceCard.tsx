// src/components/ServiceCard.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Building, Tag, Percent, Package, Video, Play } from "lucide-react";
import type { Service, Category } from "@/type";
import PackageCard from "@/components/PackageCard";
import ServiceVideoModal from "@/components/ServiceVideoModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Helper Functions for Discounts (reusable logic) ---
const calculateDiscountedPrice = (service: Service): string | null => {
  const originalPrice = parseFloat(service.price || '0');
  if (!service.discount_type || !service.discount_value || originalPrice === 0) {
    return service.price;
  }
  let finalPrice = originalPrice;
  if (service.discount_type === 'percentage') {
    finalPrice = originalPrice * (1 - service.discount_value / 100);
  } else if (service.discount_type === 'fixed') {
    finalPrice = originalPrice - service.discount_value;
  }
  return (finalPrice > 0 ? finalPrice : 0).toFixed(2);
};

const formatDiscount = (service: Service): string => {
  if (!service.discount_type || !service.discount_value) return "";
  if (service.discount_type === 'percentage') {
    return `${Math.round(Number(service.discount_value))}% OFF`;
  }
  return `-$${service.discount_value} OFF`;
};

interface ServiceCardProps {
  service: Service;
  category?: Category;
  showImage?: boolean;
  showCompanyInfo?: boolean;
  showDetails?: boolean;
  showDiscountBadge?: boolean;
  className?: string;
}

export default function ServiceCard({
  service,
  category,
  showImage = true,
  showCompanyInfo = true,
  showDetails = true,
  showDiscountBadge = true,
  className,
}: ServiceCardProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const hasDiscount = !!(service.discount_type && service.discount_value);
  const newPrice = calculateDiscountedPrice(service);
  const companyTypeIcon = service.company?.company_types?.[0]?.icon;

  if (service.is_package) {
    return <PackageCard service={service} className={className} />;
  }

  return (
    <>
      <Link
        href={`/booking/${service.id}`}
        className={cn("group block h-full", className)}
      >
        <div className="flex flex-col h-full bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border hover:border-primary/20">
          {/* 1. Optional Image Section */}
          {showImage && (
            <div className="relative h-44 bg-muted/50 overflow-hidden">
              <Image
                src={service.photo || "/placeholder.svg"}
                alt={service.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {service.featureEnabled && (
                <Badge className="absolute top-2 left-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Featured
                </Badge>
              )}

              {/* Treatment Video Badge Button */}
              {service.video_url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsVideoOpen(true);
                  }}
                  className="absolute bottom-2 left-2 z-10 bg-amber-500/90 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 transition-all"
                  title="Watch treatment video"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Watch Video</span>
                </button>
              )}

              <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-sm font-semibold text-card-foreground shadow">
                {service.price === null ? (
                  <span>Call for prices</span>
                ) : hasDiscount ? (
                  <div className="flex items-center gap-1.5">
                    <span className="line-through text-muted-foreground">${service.price}</span>
                    <span className="text-emerald-600">${newPrice}</span>
                  </div>
                ) : (
                  <span>${service.price}</span>
                )}
              </div>
            </div>
          )}

        {/* 2. Service Info Section */}
        <div className=" p-2 flex flex-col flex-grow">
            <div className="flex items-center text-sm text-right  justify-end text-tertiary/50 mt-1  space-x-2" >
                <p ><Tag className="w-4 h-4"/></p>
                <p className="">
                 {category?.name || service.company?.company_types?.[0]?.id || ''}
              </p>
              </div>
       <div className="flex items-start justify-between mb-3 p-2 ">
        
            <div className="flex-1">
              <h3 className=" text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                {service.name}
              </h3>
              <p className="     text-gray-600 mt-1 line-clamp-2">{service.description}</p>
             
            </div>
            
          </div>
          
          <div className="py-3 border-t">
            {/* 3. Optional Company Info */}
            {showCompanyInfo && (
              <div className="flex items-center gap-2 mb-2">
                {service.company?.logo ? (
                  <Image
                    src={service.company.logo}
                    alt={service.company.name || ''}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <Building className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium text-muted-foreground truncate">{service.company?.name}</span>
              </div>
            )}

            {/* 4. Optional Details Section */}
            {showDetails && (
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{service.estimated_wait_time_mins != null ? `${service.estimated_wait_time_mins} min` : '—'}</span>
                </div>
                {service.company?.location_text && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{service.company.location_text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>

    <ServiceVideoModal
      isOpen={isVideoOpen}
      onClose={() => setIsVideoOpen(false)}
      videoUrl={service.video_url}
      videoPlatform={service.video_platform}
      serviceName={service.name}
    />
  </>
  );
}