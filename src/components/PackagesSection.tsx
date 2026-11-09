"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Package, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { getAllPackages } from "@/lib/supabase-utils";
import type { Service } from "@/type";
import PackageCard from "./PackageCard";

export default function PackagesSection() {
  const [packages, setPackages] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        const data = await getAllPackages(10);
        setPackages(data);
      } catch (err) {
        console.error("Failed to load packages for homepage:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const updateScrollButtons = useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, packages]);

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const cardWidth = 380; // approximate card width with gap
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!isLoading && packages.length === 0) {
    return null; // Don't render section if no packages available
  }

  return (
    <section className="py-12 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bundles &amp; Deals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              Special Package Deals
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Save more with combined all-in-one service packages
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* View All Link */}
            <Link
              href="/packages"
              className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors group mr-1"
            >
              <span>See all packages</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Slider Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Previous packages"
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Next packages"
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Packages Horizontal Slider */}
        <div
          ref={sliderRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="shrink-0 snap-start w-[85vw] sm:w-[360px] md:w-[380px] h-[320px] bg-slate-100 dark:bg-slate-800/60 rounded-3xl animate-pulse"
              />
            ))
          ) : (
            <>
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="shrink-0 snap-start w-[85vw] sm:w-[360px] md:w-[380px]"
                >
                  <PackageCard service={pkg} className="h-full" />
                </div>
              ))}

              {/* End Card: View All CTA */}
              <div className="shrink-0 snap-start w-[240px] sm:w-[260px] flex items-center">
                <Link
                  href="/packages"
                  className="w-full h-[85%] border-2 border-dashed border-amber-300/80 dark:border-amber-700/60 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    View All Packages
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                    Explore more curated deals &amp; combos
                  </p>
                  <span className="inline-flex items-center text-xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform">
                    Browse all &rarr;
                  </span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
