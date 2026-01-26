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
  Building
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
    <section className="py-16 bg-gradient-to-t from-tertiary/90 to-tertiary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Recently Joined Companies
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Discover our newest partners providing quality services in your area
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {companies.map((company) => (
           <Link
  key={company.id}
  href={`/company/${company.slug ? encodeURIComponent(company.slug.replace(/^\/+|\/+$/g, '')) : company.id}`}
  className="group"
>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-white hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col overflow-hidden">
                {/* Logo Section */}
                <div className="p-6 pb-4">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
                      {company.logo ? (
                        <Image
                          src={company.logo}
                          alt={company.name}
                          width={64}
                          height={64}
                          className="w-20 h-20 object-cover rounded-full "
                        />
                      ) : (
                        <span className="text-primary text-2xl font-bold">
                          {getInitials(company.name)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Company Name */}
                  <h3 className="text-lg font-semibold text-white text-center group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {company.name}
                  </h3>
                </div>

                {/* Company Details */}
                <div className="px-6  flex-1">
                  {/* Category */}
                  <div className="">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {getCompanyTypeName(company)}
                      </span>
                    </div>
                    
                    {/* Active Status */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-300">Active now</span>
                    </div>
                  </div>

                  {/* Location */}
                  {company.location_text && (
                    <div className="flex items-start gap-2 mb-4 p-2 bg-gray-900/30 rounded-lg w-full mt-4 ">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-sm text-gray-200 line-clamp-2">
                          {company.location_text}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-3">
                    {company.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-lg">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Phone</p>
                          <p className="text-sm text-gray-200 truncate">
                            {company.phone}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {company.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-lg">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Email</p>
                          <p className="text-sm text-gray-200 truncate">
                            {company.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Button */}
                <div className="px-6 pb-6 pt-2">
                  <div className="text-center">
                    <span className="text-primary text-sm font-medium group-hover:underline">
                      View Services →
                    </span>
                  </div>
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