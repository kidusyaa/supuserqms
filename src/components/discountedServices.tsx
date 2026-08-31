// src/components/DiscountedServices.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HandCoins, ArrowRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { getDiscountedServices } from "@/lib/supabase-utils";
import type { Service } from "@/type";
import ServiceCard from "@/app/services/_componet/ServiceCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const DiscountCardSkeleton = () => (
  <div className="h-72 w-full rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
);

export default function DiscountedServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const discounted = await getDiscountedServices();
        setServices(discounted.filter((s) => !s.is_package));
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
    <section className="py-10 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              Special Offers &amp; Discounts
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Limited-time offers
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors group"
          >
            <span>See all</span>
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">&gt;</span>
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[Autoplay({ delay: 3500, stopOnInteraction: true })]}
          className="w-full"
        >
          <CarouselContent className="-ml-4 py-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <DiscountCardSkeleton />
                </CarouselItem>
              ))
              : services.map((service) => (
                <CarouselItem
                  key={service.id}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <ServiceCard service={service} />
                </CarouselItem>
              ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}