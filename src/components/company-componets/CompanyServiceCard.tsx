"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Tag, Package, Video, Play } from "lucide-react";
import { Service } from "@/type";
import PackageCard from "@/components/PackageCard";
import ServiceVideoModal from "@/components/ServiceVideoModal";

interface ServiceCardProps {
  service: Service;
}

// Helper functions
const calculateDiscountedPrice = (service: Service): string | null => {
  const originalPrice = parseFloat(service.price || '0');
  if (!service.discount_type || service.discount_value === null || originalPrice === 0) {
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
  if (!service.discount_type || service.discount_value === null) return "";
  if (service.discount_type === 'percentage') {
    return `${service.discount_value}% OFF`;
  }
  if (service.discount_type === 'fixed') {
    return `Save ${service.discount_value} ETB`;
  }
  return "";
};

export default function CompanyServiceCard({ service }: ServiceCardProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const isAvailable = service.status === 'active';

  // Discount calculations
  const hasDiscount = service.discount_type && service.discount_value !== null && parseFloat(service.price || '0') > 0;
  const originalPriceValue = parseFloat(service.price || '0');
  const formattedOriginalPrice = originalPriceValue > 0 ? `${originalPriceValue.toFixed(2)} ETB` : null;
  const discountedPriceValue = hasDiscount ? parseFloat(calculateDiscountedPrice(service) || '0') : originalPriceValue;
  const formattedDiscountedPrice = discountedPriceValue > 0 ? `${discountedPriceValue.toFixed(2)} ETB` : null;
  const discountLabel = hasDiscount ? formatDiscount(service) : null;

  // --- UNIQUE CARD FOR PACKAGE DEALS ---
  if (service.is_package) {
    return <PackageCard service={service} />;
  }

  // --- STANDARD CARD FOR REGULAR SERVICES ---
  const primaryPhoto = (service.photo && service.photo.trim().length > 0)
    ? service.photo
    : service.service_photos?.[0]?.url || "/placeholder.svg";

  return (
    <>
      <div className="bg-card border text-card-foreground rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg group flex flex-col h-full w-full">
        <div className="aspect-video relative overflow-hidden bg-slate-900">
          <Image
            src={primaryPhoto}
            alt={service.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {hasDiscount && discountLabel && (
            <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground z-10">
              <Tag className="h-3 w-3 mr-1" /> {discountLabel}
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
              className="absolute bottom-3 left-3 z-10 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 transition-all"
              title="Watch treatment video"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch Video</span>
            </button>
          )}

          {service.service_category?.name && (
            <Badge className="absolute top-3 right-3 bg-primary/80 backdrop-blur-sm text-primary-foreground z-10">
              {service.service_category.name}
            </Badge>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 flex flex-col flex-grow space-y-3">
          <div className="flex flex-row items-start justify-between">
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{service.name}</CardTitle>
            {formattedOriginalPrice ? (
              <div className="flex flex-col items-end flex-shrink-0 ml-2">
                <span className="text-xl font-semibold text-foreground">
                  {formattedDiscountedPrice}
                </span>
                {hasDiscount && (
                  <span className="line-through text-sm text-muted-foreground -mt-1">
                    {formattedOriginalPrice}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Call for prices
              </div>
            )}
          </div>

          {service.description && (
            <CardDescription className="line-clamp-2 text-muted-foreground">{service.description}</CardDescription>
          )}

          <div className="mt-auto space-y-4 pt-2">
            <div className="flex items-center justify-between text-sm">
              {service.estimated_wait_time_mins != null && service.estimated_wait_time_mins > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>~{service.estimated_wait_time_mins} mins</span>
                </div>
              )}
              <Badge variant={isAvailable ? "default" : "secondary"} className={isAvailable ? "bg-green-600/20 text-green-500 border-green-600/30" : ""}>
                {isAvailable ? "Available" : "Not Available"}
              </Badge>
            </div>
            
            <Button 
              asChild 
              className="w-full"
              variant="default"
              disabled={!isAvailable}
            >
              <Link href={`/booking/${service.id}`}>
                <Zap className="mr-2 h-4 w-4" />
                {isAvailable ? 'Book Now' : 'Currently Unavailable'}
              </Link>
            </Button>
          </div>
        </div>
      </div>

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