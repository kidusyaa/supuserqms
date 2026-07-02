"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Users,
  Building,
  ArrowRight
} from "lucide-react";
import { getRecentCompanies } from "@/lib/supabase-utils";
import { Company } from "@/type";


const RecentlyJoinedCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentCompanies = async () => {
      try {
        const recentCompanies = await getRecentCompanies(5);
        setCompanies(recentCompanies);
      } catch (error) {
        console.error("Error fetching recent companies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentCompanies();
  }, []);

  const getCompanyTypeName = (company: Company) => {
    return company.company_types?.[0]?.name || "Business";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate stats
  const totalCompanies = companies.length;
  
  const totalCategories = new Set(
    companies.flatMap(c => c.company_types?.map(t => t.id) || [])
  ).size;
  
  const totalLocations = new Set(
    companies
      .map(c => c.location_text?.split(',')[0]?.trim())
      .filter(Boolean)
  ).size;

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-b from-tertiary/90 to-tertiary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="h-8 w-64 bg-gray-800 rounded mb-4 animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-800 rounded animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-800 rounded-lg mb-4"></div>
                <div className="h-5 bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 bg-slate-900 dark:bg-slate-950/60 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modern Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full">
              New Partners
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
            Recently Joined Businesses
          </h2>
          <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto">
            Discover our newest partners providing quality beauty and wellness services in your city
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/company/${company.slug ? encodeURIComponent(company.slug.replace(/^\/+|\/+$/g, '')) : company.id}`}
              className="group h-full"
            >
              <div className="bg-slate-800/40 hover:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-800 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col overflow-hidden p-5">
                
                {/* Logo Section */}
                <div className="text-center mb-4 flex-grow-0">
                  <div className="relative w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center p-1 border border-slate-700/50 shadow-md group-hover:border-primary/50 transition-all duration-300 overflow-hidden">
                    {company.logo ? (
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={88}
                        height={88}
                        className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-primary text-2xl font-black">
                        {getInitials(company.name)}
                      </span>
                    )}
                  </div>

                  {/* Business Type Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    <Building2 className="h-3.5 w-3.5" />
                    {getCompanyTypeName(company)}
                  </span>
                  
                  {/* Company Name */}
                  <h3 className="text-base font-bold text-white mt-3 line-clamp-1 group-hover:text-primary transition-colors">
                    {company.name}
                  </h3>

                  {/* Pulsing Active indicator */}
                  <div className="flex items-center justify-center gap-2 mt-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-gray-400">Active Now</span>
                  </div>
                </div>

                {/* Company Details (Collapsed & Simplified) */}
                <div className="flex-grow flex flex-col justify-end">
                  
                  {/* Location Info */}
                  {company.location_text && (
                    <div className="flex items-start gap-1.5 py-2 px-2.5 mt-4 rounded-xl bg-slate-900/40 text-gray-400 text-xs w-full">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1 leading-normal">
                        {company.location_text}
                      </span>
                    </div>
                  )}
                  
                  {/* Contact Info (Simplified) */}
                  <div className="flex justify-center gap-3 mt-3 text-gray-400">
                    {company.phone && (
                      <span className="flex items-center gap-1 text-xs" title={company.phone}>
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate max-w-[80px]">{company.phone}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Explore Button */}
                <div className="mt-5">
                  <span className="w-full py-2.5 px-4 bg-slate-800/80 group-hover:bg-primary text-white text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 border border-slate-700/50 group-hover:border-primary/20">
                    Explore Services
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>

              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyJoinedCompanies;