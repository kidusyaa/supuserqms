// components/company-componets/CompanyHeader.tsx
"use client"

import React, { useState } from 'react';
import Image from "next/image";
import { Star, Share2, Heart, Globe, Facebook, Instagram } from "lucide-react";
import { Company, WorkingHoursJsonb } from "@/type";
import { Button } from "@/components/ui/button";
import { getDay, format } from 'date-fns';
import { parseWorkingHours } from "@/lib/booking-utils";
import { Icon } from "@iconify/react";
import ShareDialog from "./ShareDialog";

interface CompanyHeaderProps {
  company: Company;
}

// ── Reusable star display ──────────────────────────────────────────
function RatingStars({ average }: { average: number }) {
  return (
    <div className="flex text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled  = average >= star;
        const partial = !filled && average >= star - 0.5;
        return (
          <span key={star} className="relative h-4 w-4">
            {/* Base (empty) */}
            <Star className="h-4 w-4 fill-gray-200 text-gray-200 absolute inset-0" />
            {/* Filled or half-filled */}
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : "50%" }}
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // ── Working hours ────────────────────────────────────────────────
  const getWorkingStatus = () => {
    if (!company.working_hours) return null;
    try {
      const parsedHours = parseWorkingHours(company.working_hours as WorkingHoursJsonb);
      const dayOfWeek   = getDay(new Date());
      const rangesForToday = parsedHours[dayOfWeek];

      if (rangesForToday && rangesForToday.length > 0) {
        return {
          status: "Open",
          text:   `until ${format(rangesForToday[0].end, "h:mm a")}`,
          color:  "text-green-600",
        };
      }
      return { status: "Closed", text: "Today", color: "text-red-500" };
    } catch {
      return null;
    }
  };

  const workingStatus = getWorkingStatus();

  // ── Rating data ──────────────────────────────────────────────────
  const ratingSummary  = (company as any).rating_summary as
    | { average_stars: number; total_ratings: number }
    | null;
  const hasRatings     = ratingSummary && ratingSummary.total_ratings > 0;
  const averageStars   = hasRatings ? Number(ratingSummary!.average_stars) : 0;
  const totalRatings   = hasRatings ? ratingSummary!.total_ratings : 0;

  // ── Share URL ────────────────────────────────────────────────────
  const companyUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://yourdomain.com/company/${company.slug || company.id}`;

  return (
    <>
      <div className="py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {/* Logo */}
          {company.logo && (
            <div className="relative h-16 w-16 md:h-20 md:w-20 overflow-hidden rounded-xl border border-gray-100 shadow-sm flex-shrink-0">
              <Image src={company.logo} alt={company.name} fill className="object-cover" />
            </div>
          )}

          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0f172a] tracking-tight mb-2">
              {company.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] font-medium text-gray-500">
              {/* ── Real rating ── */}
              {hasRatings ? (
                <div className="flex items-center gap-1">
                  <span className="font-bold text-black">
                    {averageStars.toFixed(1)}
                  </span>
                  <RatingStars average={averageStars} />
                  <span className="text-gray-400">
                    ({totalRatings.toLocaleString()})
                  </span>
                </div>
              ) : (
                /* No ratings yet */
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-gray-200 text-gray-200" />
                    ))}
                  </div>
                  <span>No reviews yet</span>
                </div>
              )}

              <span className="text-gray-300">•</span>

              {/* Working hours */}
              {workingStatus && (
                <div className="flex items-center gap-1">
                  <span className={`${workingStatus.color} font-bold`}>
                    {workingStatus.status}
                  </span>
                  <span>{workingStatus.text}</span>
                </div>
              )}

              <span className="text-gray-300">•</span>

              {/* Location */}
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

        {/* Social + action icons */}
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

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        companyUrl={companyUrl}
        companyName={company.name}
      />
    </>
  );
}