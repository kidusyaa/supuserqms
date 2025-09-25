// src/components/DiscountedServices.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Clock, MapPin, Tag, HandCoins } from "lucide-react";
import { getDiscountedServices } from "@/lib/supabase-utils";
import type { Service } from "@/type";
import { Button } from "./ui/button";

// --- Helper functions for discount logic (re-used from your previous version) ---
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
    return `${service.discount_value}% OFF`;
  }
  return `-$${service.discount_value} OFF`;
};

// --- Main Component ---
export default function DiscountedServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
  
  // Auto-play functionality from the template
  useEffect(() => {
    if (!isAutoPlaying || services.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, services.length]);

  const nextSlide = () => {
    if (services.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % services.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    if (services.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };
  
  if (!isLoading && services.length === 0) {
    return null; // Don't render if there's nothing to show
  }

  return (
    <section className="py-12 px-4 bg-gray-50 shadow-xl ">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between md:mb-10 mb-4">
            {/* --- MODIFIED: Added animation classes here --- */}
            <h2 className="text-2xl font-bold text-tertiary flex items-center gap-2 animate-special-offer">
              <HandCoins className="w-6 h-6 text-orange-500 animate-icon-pulse" /> {/* Added icon animation */}
              SPECIAL OFFER
            </h2>
          </div> 
        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {isLoading ? (
                // Skeleton Loader
                <div className="w-full flex-shrink-0">
                   <div className="bg-card rounded-2xl shadow-lg overflow-hidden mx-2 h-80 animate-pulse"></div>
                </div>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="w-full flex-shrink-0">
                    <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden mx-2">
                      <div className="md:flex">
                        <div className="md:w-1/2 relative">
                          <img
                            src={service.service_photos?.[0]?.url || "/placeholder.svg"}
                            alt={service.name}
                            className="w-full h-64 md:h-80 object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                            <Tag className="w-4 h-4"/>
                            {formatDiscount(service)}
                          </div>
                          {service.service_category?.name && (
                            <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs">
                              {service.service_category.name}
                            </div>
                          )}
                        </div>
                        <div className="md:w-1/2 p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{service.name}</h3>
                            <p className="text-muted-foreground mb-4">at {service.company?.name || "Unknown Company"}</p>
                            
                            {/* NOTE: Rating/Reviews are not in your data, so they are omitted. */}

                            <div className="space-y-2 mb-6">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{service.estimated_wait_time_mins} mins</span>
                              </div>
                              {service.company?.location_text && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span className="text-sm">{service.company.location_text}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground line-through">${service.price}</span>
                                <span className="text-2xl font-bold text-primary">${calculateDiscountedPrice(service)}</span>
                            </div>
                            <Link href={`/booking/${service.id}`}>
                              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Book Now</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          {/* Re-added navigation arrows, commented out in your code, but usually useful for carousels */}
          {/* {services.length > 1 && ( // Only show if there's more than one service
            <>
              <button onClick={prevSlide} className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all duration-200 z-10">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={nextSlide} className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background border border-border rounded-full p-2 shadow-lg transition-all duration-200 z-10">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </>
          )} */}

          {/* Dots Indicator */}
          {!isLoading && services.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {services.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex ? "bg-primary scale-110" : "bg-muted hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}