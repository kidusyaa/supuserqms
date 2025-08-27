// src/components/FeaturedServices.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Flame, ArrowRight, Clock } from "lucide-react";
// --- THE FIX: Import the new Supabase functions ---
import { getFeaturedServices, getAllCategories } from "@/lib/supabase-utils";
import type { Service, Category } from "@/type";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "./ui/button";
import DivCenter from "./divCenter";

const ServiceCardSkeleton = () => (
    <div className="h-[124px] bg-white rounded-xl shadow-lg animate-pulse" />
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
        // This now calls our new Supabase functions!
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

  // Intersection observer logic remains the same
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
    <div className="py-8 sm:py-12 bg-amber-500/15">
      <DivCenter>
        <div className="container">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Featured Services
            </h2>
            <Link href="/services" passHref>
              <Button variant="secondary">
                <span className="inline-flex items-center text-sm font-semibold">
                  See all <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Button>
            </Link>
          </div>

          <div ref={carouselRef}>
            <Carousel opts={{ loop: true }} plugins={isInView ? [Autoplay({ delay: 2000, stopOnInteraction: true })] : []}>
              <CarouselContent>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3">
                        <ServiceCardSkeleton />
                      </CarouselItem>
                    ))
                  : featuredServices.map((service) => {
                      // --- THE FIX: Use snake_case property `category_id` ---
                      const category = service.category_id ? categoryMap.get(service.category_id) : undefined;

                      return (
                        <CarouselItem key={service.id} className="basis-full md:basis-1/2 lg:basis-1/3 flex items-center justify-center">
                          {/* --- THE FIX: Use snake_case property `company_id` --- */}
                          <Link href={`/services/${service.id}?companyId=${service.company_id}`} passHref>
                            <div className="rounded-xl overflow-hidden min-w-[320px] backdrop-blur border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/80">
                              <div className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-3xl">
                                    {/* Using category.icon from your Category type */}
                                    {category ? category.icon : '✨'}
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                                    <p className="text-sm text-gray-600 truncate">{service.company?.name || "—"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t mt-2">
                                   <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1 text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        {/* --- THE FIX: Use snake_case property `estimated_wait_time_mins` --- */}
                                        <span className="text-sm">{service.estimated_wait_time_mins} min</span>
                                      </div>
                                    </div>
                                    <div className="text-lg font-bold text-green-600">${service.price}</div>
                                </div>
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