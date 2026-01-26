// src/components/PartnersCarousel.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAllCompanies } from "@/lib/supabase-utils";
import { Company } from "@/type";
import { Icon } from "@iconify/react";
interface PartnersCarouselProps {
  scrollSpeed?: number; // seconds for one full loop
}

export default function PartnersCarousel({
  scrollSpeed = 40,
}: PartnersCarouselProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getAllCompanies();
        setCompanies(data.filter((c) => c.logo));
      } catch (err) {
        console.error("Failed to load companies", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  if (!isLoading && companies.length === 0) return null;

  const scrollStyle = {
    "--scroll-speed": `${scrollSpeed}s`,
  } as React.CSSProperties;

  return (
    <section className="w-full py-10 md:py-16 bg-gradient-to-b from-background to-background/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
           <div className="flex items-center justify-between md:mb-10 mb-4">
                    <h2 className="text-2xl font-bold text-tertiary flex items-center gap-2">
                      <Icon icon="mdi:partnership-outline" width="24" height="24" className="text-orange-500" />
                    Trusted by leading companies
                    </h2>
                </div>
       

        {/* Carousel */}
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />

          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="marquee" style={scrollStyle}>
              <div className="marquee-track">
                {[...companies, ...companies].map((company, index) => (
                  <LogoCard key={`${company.id}-${index}`} company={company} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Components -------------------------------- */

function LogoCard({ company }: { company: Company }) {
  return (
    <div className="logo-card">
      <Image
        src={company.logo!}
        alt={company.name}
        fill
        className="object-cover"
        sizes="128px"
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-6 py-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}
