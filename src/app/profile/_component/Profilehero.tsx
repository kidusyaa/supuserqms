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
    : "AT";

  // Member join date formatted
  const memberSince = createdAt
    ? `Member since ${new Date(createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
    : "Member since Jan 2026";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
      {/* ── Top Row: Avatar + Name/Email + Mobile Edit Button ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {/* Avatar with Pen/Badge */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#FBA819] flex items-center justify-center shadow-xs">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || "Avatar"}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="font-serif font-black text-xl sm:text-2xl text-slate-950">
                  {initials}
                </span>
              )}
            </div>

            {/* Edit Icon Badge */}
            <button
              type="button"
              onClick={onEditClick}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FBA819] hover:bg-amber-400 text-slate-950 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Change avatar"
            >
              <Icon icon="solar:pen-2-bold" className="w-2.5 h-2.5 text-slate-950" />
            </button>
          </div>

          {/* User Name & Info */}
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
              {name || (email ? email.split("@")[0] : "User Profile")}
            </h1>
            {email && (
              <p className="text-xs text-slate-400 dark:text-slate-400 font-normal truncate mt-0.5">
                {email}
              </p>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {memberSince}
            </p>
          </div>
        </div>

        {/* Mobile-only Edit Pill Button (top-right) */}
        <button
          type="button"
          onClick={onEditClick}
          className="md:hidden inline-flex items-center px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-2xs hover:bg-amber-100 transition-all cursor-pointer"
        >
          Edit
        </button>
      </div>

      {/* ── 3 Stats Grid ── */}
      <div className="grid grid-cols-3 gap-2.5 mt-5">
        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-2.5 sm:p-3 text-center border border-slate-100 dark:border-slate-800/80">
          <p className="font-black text-lg sm:text-xl text-[#0B3B48] dark:text-teal-400 leading-none">
            {totalBookings}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Bookings</p>
        </div>

        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-2.5 sm:p-3 text-center border border-slate-100 dark:border-slate-800/80">
          <p className="font-black text-lg sm:text-xl text-[#0B3B48] dark:text-teal-400 leading-none">
            {totalQueue}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">In Queue</p>
        </div>

        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-2.5 sm:p-3 text-center border border-slate-100 dark:border-slate-800/80">
          <p className="font-black text-lg sm:text-xl text-[#0B3B48] dark:text-teal-400 leading-none">
            {totalRatings}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Reviews</p>
        </div>
      </div>

      {/* ── Desktop-only Edit Profile Button ── */}
      <div className="hidden md:block mt-4">
        <button
          type="button"
          onClick={onEditClick}
          className="w-full bg-[#FBA819] hover:bg-amber-500 active:bg-amber-600 text-slate-950 py-3 rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Edit profile</span>
        </button>
      </div>
    </div>
  );
}