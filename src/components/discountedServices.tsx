// src/components/DiscountedServices.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tag, ArrowRight, Percent } from "lucide-react";
import { getDiscountedServices } from "@/lib/supabase-utils";
import type { Service } from "@/type";

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import DivCenter from "./divCenter";

// Helper function to calculate the new price
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

// Helper function to format the discount badge
const formatDiscount = (service: Service): string => {
  if (!service.discount_type || !service.discount_value) return "";
  if (service.discount_type === 'percentage') {
    return `${service.discount_value}% OFF`;
  }
  return `-$${service.discount_value} OFF`;
};


// Skeleton for loading state
const ServiceCardSkeleton = () => <div className="h-[110px] bg-white rounded-xl shadow animate-pulse" />;

const DiscountedServices = () => {
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

  // Don't render the section if there are no discounted services to show
  if (!isLoading && services.length === 0) {
    return null;
  }

  return (
    <div className="py-8 sm:py-12 bg-emerald-500/10">
      <DivCenter>
        <div className="container">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-6 h-6 text-emerald-600" />
              Special Offers
            </h2>
            <Link href="/services" passHref>
              <Button variant="secondary">
                <span className="inline-flex items-center text-sm font-semibold">
                  See all <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Button>
            </Link>
          </div>

          <div>
            <Carousel opts={{ align: "start", loop: services.length > 3 }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                        <ServiceCardSkeleton />
                      </CarouselItem>
                    ))
                  : services.map((service) => (
                      <CarouselItem
                        key={service.id}
                        className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                      >
                        <Link href={`/booking/${service.id}`} passHref className="block h-full">
                          <div className="h-full flex flex-col justify-between rounded-xl p-4 min-w-[300px] border bg-white/80 backdrop-blur shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900 pr-2">{service.name}</h3>
                                <Badge variant="destructive" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                  <Percent className="w-3 h-3 mr-1" />
                                  {formatDiscount(service)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 truncate">{service.company?.name || "—"}</p>
                            </div>
                            <div className="flex items-end justify-between pt-2 border-t mt-3">
                              <span className="text-sm text-gray-500 line-through">
                                ${service.price}
                              </span>
                              <span className="text-xl font-bold text-emerald-700">
                                ${calculateDiscountedPrice(service)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </DivCenter>
    </div>
  );
};

export default DiscountedServices;