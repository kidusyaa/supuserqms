// src/components/FeaturedServices.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, ArrowRight, Clock, Building } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

import { getFeaturedServices, getAllCategories } from "@/lib/supabase-utils";
import type { Service, Category } from "@/type";
import { Button } from "./ui/button";
import DivCenter from "./divCenter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const ServiceCardSkeleton = () => (
    <div className="h-[132px] w-full bg-white/80 backdrop-blur rounded-xl shadow-lg animate-pulse" />
);

const FeaturedServices = () => {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, Category>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const carouselRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [services, categories] = await Promise.all([
          getFeaturedServices(),
          getAllCategories(),
        ]);

        setFeaturedServices(services);
        const catMap = new Map(categories.map(cat => [cat.id, cat]));
        setCategoryMap(catMap);

      } catch (error) {
        console.error("Failed to load featured services or categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, { threshold: 0.6 });

    const currentRef = carouselRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  if (!isLoading && featuredServices.length === 0) {
    return null;
  }

  return (
    <div className="mb-10 py-20 bg-tertiary">
      <DivCenter>
        <div className="container">
          <div className="flex items-center justify-between md:mb-10 mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Featured Services
            </h2>
            <Link href="/services" passHref>
              <Button variant="ghost">
                <span className="inline-flex items-center text-sm font-semibold text-white hover:underline">
                  See all <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Button>
            </Link>
          </div>

          <div ref={carouselRef}>
            <Carousel opts={{ loop: true, align: "start" }} plugins={isInView ? [Autoplay({ delay: 2500, stopOnInteraction: true })] : []}>
              {/* FIX 1: Add negative margin to the content wrapper to create space for item padding */}
              <CarouselContent className="-ml-4">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <CarouselItem key={index} className="pl-4 basis-1/2 lg:basis-1/3">
                        <ServiceCardSkeleton />
                      </CarouselItem>
                    ))
                  : featuredServices.map((service) => {
                      const category = service.category_id ? categoryMap.get(service.category_id) : undefined;
                      return (
                        <CarouselItem 
                          key={service.id} 
                          // FIX 1: Add padding that matches the content's negative margin. This creates the gap and prevents overlap.
                          // FIX 2: Simplified responsive classes.
                          className="pl-4 basis-1/2 lg:basis-1/3"
                        >
                          {/* FIX 3: Make the entire Link a block with h-full to ensure consistent height */}
                          <Link href={`/company/${service.company?.slug}`} passHref className="block h-full">
                            <div className="flex h-full flex-col justify-between rounded-xl overflow-hidden backdrop-blur border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/80 p-3">
                              {/* Top Part of the Card */}
                              <div className="flex md:flex-row flex-col items-center md:gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden mb-2 md:mb-0">
                                  {service.photo ? (
                                    <Image src={service.photo} alt={service.name} width={48} height={48} className="w-full h-full object-cover"/>
                                  ) : service.company?.logo ? (
                                    <Image src={service.company.logo} alt={service.company.name || "Company logo"} width={48} height={48} className="w-full h-full object-cover"/>
                                  ) : category?.icon ? (
                                    <span className="text-3xl">{category.icon}</span>
                                  ) : (
                                    <Building className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                {/* FIX 4: Center text on mobile to match the icon, and left-align on desktop */}
                                <div className="flex-1 overflow-hidden text-center md:text-left">
                                  <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                                  <p className="text-sm text-gray-600 truncate">{service.company?.name || "—"}</p>
                                </div>
                              </div>
                              {/* Bottom Part of the Card */}
                              <div className="flex items-center justify-between pt-3 border-t mt-3">
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">{service.estimated_wait_time_mins} min</span>
                                  </div>
                                <div className="md:text-lg font-bold text-green-600">${service.price}</div>
                              </div>
                            </div>
                          </Link>
                        </CarouselItem>
                      );
                    })}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </DivCenter>
    </div>
  );
};

export default FeaturedServices;