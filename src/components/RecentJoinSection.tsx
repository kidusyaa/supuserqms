// src/components/RecentJoinSection.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { getRecentCompanies } from '@/lib/supabase-utils'; // Assuming this utility exists

import { MapPin, CalendarDays } from 'lucide-react'; // Added CalendarDays for joined date
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'; // Added Card component for consistency if you use shadcn Card
import { Handshake, ArrowRight, Clock,Building } from "lucide-react";
import DivCenter from './divCenter';
import { parseWorkingHours } from "@/lib/booking-utils"; 
import type { Company, DailyWorkingHours, WorkingHoursJsonb } from "@/type";
// Skeleton for a single company card
const CompanyCardSkeleton = () => (
  <Card className="group block bg-card border border-border rounded-xl shadow-sm overflow-hidden h-60 animate-pulse">
    <div className="relative w-full aspect-[4/3] flex items-center justify-center bg-muted/30">
      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
        <div className="h-8 w-8 rounded-full bg-gray-300" />
      </div>
    </div>
    <div className="p-4 text-center space-y-2">
      <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
      <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto" />
    </div>
  </Card>
);

const RecentJoinSection = () => {
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // Fetch up to 8 recent companies, or adjust as needed
        const companies = await getRecentCompanies(8); 
        setRecentCompanies(companies);
      } catch (err) {
        console.error("Failed to fetch recent companies:", err);
        setError("Failed to load recent companies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Meet Our Newest Partners</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the latest companies to join GizeBook, bringing you fresh services and opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, index) => ( // Render 4 skeletons
              <CompanyCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center text-destructive">
          <p>{error}</p>
          <Button onClick={() => setLoading(true)} className="mt-4">Retry</Button> {/* Add a retry button */}
        </div>
      </section>
    );
  }

  if (recentCompanies.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>No recently joined companies to display yet.</p>
        </div>
      </section>
    );
  }

  return (  
    <section className=" py-10  bg-background">
      <DivCenter>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex items-center justify-between md:my-10 my-4">
            <h2 className="text-2xl font-bold  flex items-center gap-2">
              <Handshake className="w-6 h-6 text-orange-500 " />
              Recently Joined Companies
            </h2>
            <Link href="/company" passHref>
              <Button variant="ghost">
                <span className="inline-flex items-center text-sm font-semibold  hover:underline">
                  See all <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Button>
            </Link>
          </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {recentCompanies.map((company) => (
            <Link
              href={`/company/${company.id}`}
              key={company.id}
              className="group block bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 overflow-hidden "
            >
              <div className='flex md:flex-row flex-col space-x-5'>
              <div className="relative md:block hidden w-full   items-center justify-center ">
                {/* --- FIX APPLIED HERE --- */}
                {company.logo ? (
                  <Image
                    src={company.logo} // This will always be a string due to the ternary check
                    alt={`${company.name} Logo`}
                    fill
                    className="object-cover "
                 
                    priority={false} // Only use priority for LCP images, usually just one
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xl font-bold rounded-t-xl p-2 text-center">
                    <Image
                    src={"/images/hairsalon.png"} // This will always be a string due to the ternary check
                    alt={`${company.name} Logo`}
                    fill
                    className="object-cover  group-hover:scale-105 transition-transform duration-300"
                 
                    priority={false} // Only use priority for LCP images, usually just one
                  />
                  </div>
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200 truncate mb-1">
                  {company.name}
                </h3>
                {company.location_text && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 truncate">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    {company.location_text}
                  </p>
                )}
                 {company.created_at && (
                       <p className="text-xs text-muted-foreground mt-2 opacity-80 flex items-center justify-center gap-1">
                          <CalendarDays className="h-3 w-3 flex-shrink-0" />
                          Joined: {new Date(company.created_at).toLocaleDateString()}
                       </p>
                     )}
              </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
      </DivCenter>
    </section>
  );
};

export default RecentJoinSection;