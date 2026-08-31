"use client";

import React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface Props {
  name: string;
  email: string | null;
  createdAt?: string | null;
  avatarUrl: string | null;
  totalBookings: number;
  totalQueue: number;
  totalRatings: number;
  onEditClick: () => void;
}

export function ProfileHero({
  name,
  email,
  createdAt,
  avatarUrl,
  totalBookings,
  totalQueue,
  totalRatings,
  onEditClick,
}: Props) {
  // Initials
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  // Member join date formatted
  const memberSince = createdAt
    ? `Member since ${new Date(createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
    : "Member since Jan 2026";

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#0B3B48] shadow-lg p-5 sm:p-7 text-white">
      {/* Decorative subtle background overlay shapes */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#06242D] via-[#0B3B48] to-[#124D5E] pointer-events-none" />
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top Row: Avatar, Name/Info & Edit Button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar Squircle */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#FBA819] flex items-center justify-center shadow-md">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="font-serif font-black text-2xl sm:text-3xl text-slate-950">
                    {initials}
                  </span>
                )}
              </div>
              {/* Edit Icon Badge */}
              <button
                type="button"
                onClick={onEditClick}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FBA819] hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs border-2 border-[#0B3B48] transition-transform active:scale-95 cursor-pointer"
                title="Change avatar"
              >
                <Icon icon="solar:pen-2-bold" className="w-3 h-3 text-slate-950" />
              </button>
            </div>

            {/* Name & Subtitle */}
            <div>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight leading-snug">
                {name || email?.split("@")[0] || "User Profile"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
                {memberSince}
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
          >
            <Icon icon="solar:pen-linear" className="w-3.5 h-3.5 text-white" />
            <span>Edit</span>
          </button>
        </div>

        {/* Bottom Row: 3 Stats Cards (Bookings, In queue, Reviews) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-6">
          {/* Bookings */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center border border-white/10">
            <p className="font-serif font-extrabold text-xl sm:text-2xl text-[#FBA819] leading-none">
              {totalBookings}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-1">Bookings</p>
          </div>

          {/* In queue */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center border border-white/10">
            <p className="font-serif font-extrabold text-xl sm:text-2xl text-[#FBA819] leading-none">
              {totalQueue}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-1">In queue</p>
          </div>

          {/* Reviews */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center border border-white/10">
            <p className="font-serif font-extrabold text-xl sm:text-2xl text-[#FBA819] leading-none">
              {totalRatings}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-1">Reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
}