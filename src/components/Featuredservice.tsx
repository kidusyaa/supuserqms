// src/components/FeaturedServices.tsx

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {Flame , ArrowRight, Star, Clock } from 'lucide-react';

import { getFeaturedServices } from '@/lib/firebase-utils';
import type { Service } from '@/type';

// --- Step 3: Create the main component ---
const FeaturedServices = () => {
  // We use state to hold the services, making it easy to swap sample data for real data later.
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const services = await getFeaturedServices();
        setFeaturedServices(services);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  if (!isLoading && featuredServices.length === 0) {
    return null;
  }

  return (
    <div className="py-8 sm:py-12 bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {featuredServices.length > 0 && (
              <div className="flex items-center justify-between mb-4 scrollbar-hide ">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Flame className="w-6 h-6 text-orange-500" />
                      Featured Services
                  </h2>
                  <Link href="/services" passHref>
                      <span className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
                          See all
                          <ArrowRight className="w-4 h-4 ml-1" />
                      </span>
                  </Link>
              </div>
            )}

            {/* Horizontal Scrolling Container */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {isLoading ? (
                // --- Step 4: Add Loading Skeletons ---
                Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="min-w-[280px] h-[124px] bg-white rounded-xl shadow-lg animate-pulse "></div>
                ))
              ) : featuredServices.length === 0 ? (
                <div className="w-full text-center text-gray-500">No featured services right now.</div>
              ) : (
                // --- Step 5: Render the actual service cards ---
                featuredServices.map((service) => (
                    <Link key={service.id} href={`/services/${service.id}?companyId=${service.companyId}`} passHref>
                        <div className="min-w-[280px] rounded-xl overflow-hidden bg-white/80 backdrop-blur border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-3 scrollbar-hide">
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-2xl">✨</div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                                        <p className="text-sm text-gray-600 truncate">{service.company?.name || '—'}</p>
                                    </div>
                                    <div className="text-xs font-bold text-white px-2 py-1 rounded-full bg-orange-500">Featured</div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-medium text-gray-800">{service.providers?.length ?? 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">{service.estimatedWaitTime} min</span>
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-green-600">${service.price}</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))
              )}
            </div>
        </div>
    </div>
  );
};

export default FeaturedServices;