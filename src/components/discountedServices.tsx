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
  return `-${service.discount_value} ETB OFF`;
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
    <section className="py-12 md:py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Modernized Section Header */}
        <div className="flex flex-col md:mb-10 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              Exclusive Deals
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <HandCoins className="w-7 h-7 text-primary" />
            Special Offers
          </h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-slate-400 mt-1.5">
            Enjoy premium wellness and beauty services at special discounted prices.
          </p>
        </div> 

        <Carousel
          opts={{ 
            align: "start",
            loop: true,
          }}
          plugins={[ Autoplay({ delay: 3000, stopOnInteraction: true }) ]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {isLoading 
              ? Array.from({ length: 4 }).map((_, index) => (
                  <CarouselItem key={index} className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
                    <DiscountCardSkeleton />
                  </CarouselItem>
                ))
              : services.map((service) => (
                <CarouselItem 
                  key={service.id} 
                  className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3"
                >
                  
                  {/* Premium Redesigned Card */}
                  <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                    <Link href={`/booking/${service.id}`} className="block relative overflow-hidden">
                      {/* Image container with overlay */}
                      <div className="relative overflow-hidden aspect-video w-full">
                        <Image
                          src={service.service_photos?.[0]?.url || "/placeholder.svg"}
                          alt={service.name}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-955/90 via-slate-950/40 to-transparent"></div>
                        
                        {/* Elegant Discount Badge */}
                        <div className="absolute top-3 left-3 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-md uppercase tracking-wider">
                          {formatDiscount(service)}
                        </div>

                        {/* Text on top of Overlay */}
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                          <h3 className="text-lg font-bold leading-tight drop-shadow-md group-hover:text-primary transition-colors">{service.name}</h3>
                          <p className="text-xs text-gray-300 drop-shadow-sm mt-0.5 font-medium">
                            by {service.company?.name || "Service Provider"}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Price and Button Section */}
                    <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900/80 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        {service.price === null ? (
                          <span className="text-base font-semibold text-amber-600">Call for prices</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-2xl font-black text-primary">
                              {calculateDiscountedPrice(service)} <span className="text-xs font-semibold">ETB</span>
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              {service.price} ETB
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-lg px-4 shadow-sm hover:shadow-md transition-all duration-300">
                        <Link href={`/booking/${service.id}`}>View Deal</Link>
                      </Button>
                    </div>
                  </div>

                </CarouselItem>
              ))
            }
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}