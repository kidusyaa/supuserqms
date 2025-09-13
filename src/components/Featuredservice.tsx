// src/components/FeaturedServices.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Flame, ArrowRight, Clock,Building } from "lucide-react";
// --- THE FIX: Import the new Supabase functions ---
import { getFeaturedServices, getAllCategories } from "@/lib/supabase-utils";
import type { Service, Category } from "@/type";
import Image from "next/image";
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
    <div className=" my-10 py-20 bg-tertiary">
      <DivCenter>
        <div className="container ">
          <div className="flex items-center justify-between md:mb-10 mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500 " />
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
            <Carousel opts={{ loop: true }} plugins={isInView ? [Autoplay({ delay: 2000, stopOnInteraction: true })] : []}>
              <CarouselContent>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <CarouselItem key={index} className="basis-1/2 md:basis-1/2 lg:basis-1/3">
                        <ServiceCardSkeleton />
                      </CarouselItem>
                    ))
                  : featuredServices.map((service) => {
                      // --- THE FIX: Use snake_case property `category_id` ---
                      const category = service.category_id ? categoryMap.get(service.category_id) : undefined;

                      return (
                        <CarouselItem key={service.id} className="basis-1/3 lg:basis-1/3 flex items-center justify-center">
                          {/* --- THE FIX: Use snake_case property `company_id` --- */}
                          <Link href={`/company/${service.company_id}`} passHref>
                            <div className="rounded-xl overflow-hidden md:min-w-[320px]  w-full backdrop-blur border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/80">
                              <div className="p-2">
                                <div className="flex  md:flex-row flex-col items-center  md:gap-3 mb-3">
                                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {/* --- FIX APPLIED HERE --- */}
                                    {service?.company?.logo ? (
                                        <Image
                                          src={service.company.logo} // Use the correct property
                                          alt={service.company.name || "Company logo"}
                                          width={48}
                                          height={48}
                                          className="w-full h-full object-cover"
                                        />
                                    ) : category?.icon ? (
                                        // If no company image, display category icon as text
                                        <span className="text-3xl">{category.icon}</span>
                                    ) : (
                                        // Fallback to a generic Lucide icon
                                        <Building className="w-6 h-6 text-gray-400" />
                                    )}
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
                                    <div className="md:text-lg  font-bold text-green-600">${service.price}</div>
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