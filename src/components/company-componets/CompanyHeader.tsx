// components/company-componets/CompanyHeader.tsx
"use client"

import React, { useState } from 'react';
import Image from "next/image";
import { Star, Share2, Heart, Globe, Facebook, Instagram, MapPin ,} from "lucide-react";
import { Company, WorkingHoursJsonb } from "@/type";
import { Button } from "@/components/ui/button";
import { getDay, format } from 'date-fns';
import { parseWorkingHours } from "@/lib/booking-utils";
import { Icon } from "@iconify/react";
import ShareDialog from "./ShareDialog";

interface CompanyHeaderProps {
  company: Company;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Logic for Working Hours
  const getWorkingStatus = () => {
    if (!company.working_hours) return null;
    try {
      const parsedHours = parseWorkingHours(company.working_hours as WorkingHoursJsonb);
      const today = new Date();
      const dayOfWeek = getDay(today);
      const rangesForToday = parsedHours[dayOfWeek];

      if (rangesForToday && rangesForToday.length > 0) {
        const timeStr = rangesForToday.map(r => `${format(r.start, "h:mm a")}`).join(', ');
        return { status: "Open", text: `until ${format(rangesForToday[0].end, "h:mm a")}`, color: "text-green-600" };
      }
      return { status: "Closed", text: "Today", color: "text-red-500" };
    } catch (e) {
      return null;
    }
  };

  const workingStatus = getWorkingStatus();

  // Get the current URL for sharing
  const companyUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `https://yourdomain.com/company/${company.slug || company.id}`;

  return (
    <>
    <div className="py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex items-center gap-4">
        {/* Company Logo */}
        {company.logo && (
          <div className="relative h-16 w-16 md:h-20 md:w-20 overflow-hidden rounded-xl border border-gray-100 shadow-sm flex-shrink-0">
            <Image 
              src={company.logo} 
              alt={company.name} 
              fill 
              className="object-cover"
            />
          </div>
        )}
        
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0f172a] tracking-tight mb-2">
            {company.name}
          </h1>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] font-medium text-gray-500">
            {/* Mock Rating */}
            <div className="flex items-center gap-1">
              <span className="font-bold text-black">4.7</span>
              <div className="flex text-amber-400">
                {[...Array(4)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                <Star className="h-4 w-4 text-gray-300 fill-gray-300" />
              </div>
              <span className="text-gray-400">(4,923)</span>
            </div>

            <span className="text-gray-300">•</span>

            {/* Working Hours Status */}
            {workingStatus && (
              <div className="flex items-center gap-1">
                <span className={`${workingStatus.color} font-bold`}>{workingStatus.status}</span>
                <span>{workingStatus.text}</span>
              </div>
            )}

            <span className="text-gray-300">•</span>

            {/* Location & Directions */}
            <div className="flex items-center gap-2">
              <span>{company.location_text || "Location available"}</span>
              {company.location_link && (
                <a 
                  href={company.location_link} 
                  target="_blank" 
                  className="text-orange-600 hover:underline font-bold"
                >
                  Get directions
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Social Media & Action Icons */}
      <div className="flex items-center gap-3">
         {company.socials?.website && (
           <a href={company.socials.website} target="_blank" className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
              <Globe className="h-5 w-5 text-gray-700" />
           </a>
        )}
        {company.socials?.instagram && (
           <a href={company.socials.instagram} target="_blank" className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
              <Instagram className="h-5 w-5 text-gray-700" />
           </a>
        )}
        {company.socials?.facebook && (
           <a href={company.socials.facebook} target="_blank" className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
              <Facebook className="h-5 w-5 text-gray-700" />
           </a>
        )}
        {company.socials?.tiktok && (
           <a href={company.socials.tiktok} target="_blank" className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
              <Icon icon="ic:baseline-tiktok" className="h-5 w-5 text-gray-700" />
           </a>
        )}
        <div className="w-[1px] h-8 bg-gray-200 mx-1 hidden md:block" />
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full h-11 w-11 border-gray-200"
          onClick={() => setShareDialogOpen(true)}
        >
          <Share2 className="h-5 w-5 text-gray-700" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-gray-200">
          <Heart className="h-5 w-5 text-gray-700" />
        </Button>
      </div>
    </div>
    
    {/* Share Dialog */}
    <ShareDialog
      open={shareDialogOpen}
      onOpenChange={setShareDialogOpen}
      companyUrl={companyUrl}
      companyName={company.name}
    />
    </>
  );
}