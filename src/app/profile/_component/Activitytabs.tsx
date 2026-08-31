"use client";

import React, { useState } from "react";
import { BookingCard } from "./Bookingcard";
import { QueueCard } from "./Queuecard";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { Booking, QueueItem } from "@/type";

interface Props {
  bookings: Booking[];
  queueEntries: QueueItem[];
  ratingsMap: Record<string, CompanyRating>;
  onRateClick: (
    sourceType: RatingSourceType,
    sourceId: string,
    companyId: string,
    companyName: string,
    existing: CompanyRating | null
  ) => void;
  onCancelBooking?: (bookingId: string) => void;
}

export function ActivityTabs({
  bookings,
  queueEntries,
  ratingsMap,
  onRateClick,
  onCancelBooking,
}: Props) {
  const [activeTab, setActiveTab] = useState<"bookings" | "queue">("bookings");

  return (
    <div>
      {/* ── My Activity Section Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
          My activity
        </h2>
        <span className="text-xs text-slate-400 font-medium">Bookings &amp; queue</span>
      </div>

      {/* ── Segmented Pill Tabs Switcher (Centered) ── */}
      <div className="bg-slate-100/90 dark:bg-slate-800/80 rounded-full p-1 flex items-center max-w-xs sm:max-w-sm mx-auto mb-6">
        {/* Bookings Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "bookings"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs scale-101"
              : "text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900"
          }`}
        >
          <span>Bookings</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === "bookings"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {bookings.length}
          </span>
        </button>

        {/* Queue Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "queue"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs scale-101"
              : "text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900"
          }`}
        >
          <span>Queue</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === "queue"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {queueEntries.length}
          </span>
        </button>
      </div>

      {/* ── Bookings Tab Content ── */}
      {activeTab === "bookings" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {bookings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-2xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No active bookings
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Your upcoming and past appointments will appear here.
              </p>
            </div>
          ) : (
            bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                rating={ratingsMap[`booking:${b.id}`] ?? null}
                onRateClick={onRateClick}
                onCancelClick={onCancelBooking}
              />
            ))
          )}
        </div>
      )}

      {/* ── Queue Tab Content ── */}
      {activeTab === "queue" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {queueEntries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-2xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No live queue tickets
              </p>
              <p className="text-xs text-slate-400 mt-1">
                When you join a queue, your live ticket will appear here.
              </p>
            </div>
          ) : (
            queueEntries.map((q) => (
              <QueueCard
                key={q.id}
                entry={q}
                rating={ratingsMap[`queue:${String(q.id)}`] ?? null}
                onRateClick={onRateClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}