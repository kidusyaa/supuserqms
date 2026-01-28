// src/components/DiscountedServices.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HandCoins } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

import { getDiscountedServices } from "@/lib/supabase-utils";
import type { Service } from "@/type";
import { Button } from "./ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// --- Helper functions for discount logic (Unchanged) ---
const calculateDiscountedPrice = (service: Service): string | null => {
  const originalPrice = parseFloat(service.price || '0');
  if (!service.discount_type || !service.discount_value || originalPrice === 0) return service.price;
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
  if (service.discount_type === 'percentage') return `${service.discount_value}% OFF`;
  return `-$${service.discount_value} OFF`;
};

// +++ NEW: A skeleton loader that matches the new overlay card design +++
const DiscountCardSkeleton = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-md animate-pulse">
    <div className="aspect-video w-full bg-gray-300" />
    <div className="p-4">
      <div className="mb-4 flex items-baseline gap-2">
        <div className="h-7 w-1/3 rounded bg-gray-300"></div>
        <div className="h-5 w-1/4 rounded bg-gray-200"></div>
      </div>
      <div className="h-10 w-full rounded bg-gray-400"></div>
    </div>
  </div>
);


// --- Main Component ---
export default function DiscountedServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const discounted = await getDiscountedServices();
        setServices(discounted);
      } catch (error) {
        console.error("Failed to load discounted services:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (!isLoading && services.length === 0) {
    return null;
  }

  return (
    <section className="py-6   overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between md:mb-10 mb-4">
            <h2 className="text-2xl font-bold text-tertiary flex items-center gap-2">
              <HandCoins className="w-6 h-6 text-orange-500" />
              Special Offers
            </h2>
        </div> 

        <Carousel
          opts={{ 
            align: "start", // This is key for the partial view
            loop: true,
          }}
          plugins={[ Autoplay({ delay: 3000, stopOnInteraction: true }) ]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {isLoading 
              ? Array.from({ length: 4 }).map((_, index) => (
                  // Responsive sizing for the skeleton
                  <CarouselItem key={index} className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
                    <DiscountCardSkeleton />
                  </CarouselItem>
                ))
              : services.map((service) => (
                <CarouselItem 
                  key={service.id} 
                  // +++ KEY CHANGE: Responsive basis for partial view +++
                  className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3"
                >
                  
                  {/* +++ THE NEW OVERLAY CARD DESIGN +++ */}
                  <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-md transition-shadow duration-300 hover:shadow-xl">
                    <Link href={`/booking/${service.id}`} className="block">
                      {/* Image container with overlay */}
                      <div className="relative">
                        <Image
                          src={service.service_photos?.[0]?.url || "/placeholder.svg"}
                          alt={service.name}
                          width={400}
                          height={225}
                          className="aspect-video w-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent"></div>
                        
                        {/* Discount Badge */}
                        <div className="absolute top-3 left-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                          {formatDiscount(service)}
                        </div>

                        {/* Text on top of Overlay */}
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                          <h3 className="text-lg font-bold leading-tight drop-shadow-md">{service.name}</h3>
                          <p className="text-sm text-gray-200 drop-shadow-sm">
                            by {service.company?.name || "Service Provider"}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Price and Button Section (below the image) */}
                    <div className=" flex flex-row justify-between p-4 bg-gray-50">
                      <div className="flex items-baseline gap-2 mb-3">
                        {service.price === null ? (
                          <span className="text-lg font-medium text-amber-600">Call for prices</span>
                        ) : (
                          <>
                            <span className="text-2xl font-extrabold text-primary">
                              ${calculateDiscountedPrice(service)}
                            </span>
                            <span className="text-base text-gray-400 line-through">
                              ${service.price}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <Button asChild  variant="outline">
                        <Link href={`/booking/${service.id}`}>View Deal</Link>
                      </Button>
                    </div>
                  </div>

                </CarouselItem>
              ))
            }
          </CarouselContent>
          
          {/* Hide nav buttons on mobile where swipe is natural */}
          {/* <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex" /> */}

        </Carousel>
      </div>
    </section>
  );
}