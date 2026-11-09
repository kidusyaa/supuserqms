"use client";

import React, { useMemo, useState } from "react";
import { BookingCard } from "./Bookingcard";
import { QueueCard } from "./Queuecard";
import { ActivityFilters } from "./ActivityFilters";
import { MobileFilterSheet, type DateFilterType, type StatusFilterType } from "./MobileFilterSheet";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { Booking, QueueItem } from "@/type";
import { getEthiopianDate } from "@/lib/ethiopian-calendar";
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";

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
  onCancelBooking?: (booking: Booking) => void;
  onLeaveQueue?: (entry: QueueItem) => void;
  onReuploadProof?: (booking: Booking) => void;
}

function getDateGroupLabel(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const eth = getEthiopianDate(date);
  const ethStr = `${eth.monthNameAm} ${eth.day}`;

  if (isSameDay(date, now)) {
    return `TODAY · ${ethStr}`;
  }
  if (isSameDay(date, tomorrow)) {
    return `TOMORROW · ${ethStr}`;
  }
  if (isSameDay(date, yesterday)) {
    return `YESTERDAY · ${ethStr}`;
  }

  const isCurrentMonth =
    date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

  if (isCurrentMonth) {
    if (date.getTime() < now.getTime()) {
      return "EARLIER THIS MONTH";
    }
    return "LATER THIS MONTH";
  }

  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}

export function ActivityTabs({
  bookings,
  queueEntries,
  ratingsMap,
  onRateClick,
  onCancelBooking,
  onLeaveQueue,
  onReuploadProof,
}: Props) {
  const [activeTab, setActiveTab] = useState<"bookings" | "queue">("bookings");

  // Filters State
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("any");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Extract available service types
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      const cat = (b.service as any)?.service_category?.name || (b.service as any)?.category?.name;
      if (cat) set.add(cat);
      const cType = b.company?.company_types?.[0]?.name;
      if (cType) set.add(cType);
    });
    queueEntries.forEach((q) => {
      const qAny = q as any;
      const cat = qAny.service?.service_category?.name || qAny.service?.category?.name;
      if (cat) set.add(cat);
      const cType = qAny.company?.company_types?.[0]?.name;
      if (cType) set.add(cType);
    });

    // Provide default fallback categories if none exist yet
    if (set.size === 0) {
      return ["Beauty", "Health", "Home", "Auto"];
    }
    return Array.from(set).slice(0, 6);
  }, [bookings, queueEntries]);

  // Reset Filters
  const handleResetFilters = () => {
    setDateFilter("all");
    setFromDate("");
    setToDate("");
    setTypeFilter("all");
    setStatusFilter("any");
  };

  // ── Filter Bookings ───────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    const now = new Date();

    return bookings.filter((b) => {
      const bDate = new Date(b.start_time || Date.now());

      // 1. Date Filter
      if (dateFilter === "today") {
        const isToday =
          bDate.getDate() === now.getDate() &&
          bDate.getMonth() === now.getMonth() &&
          bDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (dateFilter === "this_week") {
        const start = startOfWeek(now);
        const end = endOfWeek(now);
        if (!isWithinInterval(bDate, { start, end })) return false;
      } else if (dateFilter === "this_month") {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        if (!isWithinInterval(bDate, { start, end })) return false;
      } else if (dateFilter === "next_30_days") {
        const end = addDays(now, 30);
        if (bDate < now || bDate > end) return false;
      } else if (dateFilter === "custom") {
        if (fromDate && bDate < new Date(fromDate)) return false;
        if (toDate && bDate > new Date(toDate + "T23:59:59")) return false;
      }

      // 2. Type Filter
      if (typeFilter !== "all") {
        const cat = ((b.service as any)?.service_category?.name || (b.service as any)?.category?.name || "").toLowerCase();
        const cType = (b.company?.company_types?.[0]?.name || "").toLowerCase();
        const sName = (b.service?.name || "").toLowerCase();
        const qType = typeFilter.toLowerCase();
        const match = cat.includes(qType) || cType.includes(qType) || sName.includes(qType);
        if (!match) return false;
      }

      // 3. Status Filter
      if (statusFilter !== "any") {
        const st = (b.status || "confirmed").toLowerCase();
        const isPayPending = b.payment_status === "pending" || b.payment_status === "rejected";

        if (statusFilter === "upcoming") {
          if (st === "completed" || st === "served" || st === "cancelled") return false;
        } else if (statusFilter === "needs_payment") {
          if (!isPayPending) return false;
        } else if (statusFilter === "completed") {
          if (st !== "completed" && st !== "served") return false;
        } else if (statusFilter === "cancelled") {
          if (st !== "cancelled") return false;
        }
      }

      return true;
    });
  }, [bookings, dateFilter, fromDate, toDate, typeFilter, statusFilter]);

  // ── Filter Queue Entries ──────────────────────────────────────────
  const filteredQueueEntries = useMemo(() => {
    const now = new Date();

    return queueEntries.filter((q) => {
      const qDate = new Date(q.joined_at || Date.now());

      // 1. Date Filter
      if (dateFilter === "today") {
        const isToday =
          qDate.getDate() === now.getDate() &&
          qDate.getMonth() === now.getMonth() &&
          qDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (dateFilter === "this_week") {
        const start = startOfWeek(now);
        const end = endOfWeek(now);
        if (!isWithinInterval(qDate, { start, end })) return false;
      } else if (dateFilter === "this_month") {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        if (!isWithinInterval(qDate, { start, end })) return false;
      } else if (dateFilter === "next_30_days") {
        const end = addDays(now, 30);
        if (qDate < now || qDate > end) return false;
      } else if (dateFilter === "custom") {
        if (fromDate && qDate < new Date(fromDate)) return false;
        if (toDate && qDate > new Date(toDate + "T23:59:59")) return false;
      }

      // 2. Type Filter
      if (typeFilter !== "all") {
        const qAny = q as any;
        const cat = (qAny.service?.service_category?.name || qAny.service?.category?.name || "").toLowerCase();
        const cType = (qAny.company?.company_types?.[0]?.name || "").toLowerCase();
        const sName = (qAny.service?.name || "").toLowerCase();
        const matchType = typeFilter.toLowerCase();
        if (!cat.includes(matchType) && !cType.includes(matchType) && !sName.includes(matchType)) return false;
      }

      // 3. Status Filter
      if (statusFilter !== "any") {
        const st = (q.status || "waiting").toLowerCase();
        if (statusFilter === "upcoming") {
          if (st !== "waiting" && st !== "serving") return false;
        } else if (statusFilter === "needs_payment") {
          return false; // Queue has no prepayment
        } else if (statusFilter === "completed") {
          if (st !== "served" && st !== "completed") return false;
        } else if (statusFilter === "cancelled") {
          if (st !== "cancelled" && st !== "noshow" && st !== "left") return false;
        }
      }

      return true;
    });
  }, [queueEntries, dateFilter, fromDate, toDate, typeFilter, statusFilter]);

  const activeResultsCount = activeTab === "bookings" ? filteredBookings.length : filteredQueueEntries.length;

  // ── Grouped Bookings by Date Section ──────────────────────────────
  const groupedBookings = useMemo(() => {
    const groups: { [label: string]: Booking[] } = {};
    filteredBookings.forEach((b) => {
      const label = getDateGroupLabel(b.start_time || Date.now());
      if (!groups[label]) groups[label] = [];
      groups[label].push(b);
    });
    return groups;
  }, [filteredBookings]);

  // ── Grouped Queue by Date Section ─────────────────────────────────
  const groupedQueue = useMemo(() => {
    const groups: { [label: string]: QueueItem[] } = {};
    filteredQueueEntries.forEach((q) => {
      const label = getDateGroupLabel(q.joined_at || Date.now());
      if (!groups[label]) groups[label] = [];
      groups[label].push(q);
    });
    return groups;
  }, [filteredQueueEntries]);

  return (
    <div className="space-y-6">
      {/* ── Top Header & Tab Pill Switcher ── */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
          My activity
        </h2>

        {/* Segmented Pill Tabs Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "bookings"
                ? "bg-[#0B3B48] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-[#0B3B48] dark:hover:text-teal-300"
            }`}
          >
            <span>Bookings</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === "bookings"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "queue"
                ? "bg-[#0B3B48] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-[#0B3B48] dark:hover:text-teal-300"
            }`}
          >
            <span>Queue</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === "queue"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {queueEntries.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Filters Section ── */}
      <ActivityFilters
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        availableTypes={availableTypes}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        resultsCount={activeResultsCount}
        onOpenMobileSheet={() => setMobileSheetOpen(true)}
        onReset={handleResetFilters}
      />

      {/* ── Bookings Tab Content ── */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-2xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No bookings found
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                No appointments matched your selected filter criteria.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            Object.entries(groupedBookings).map(([groupLabel, items]) => (
              <div key={groupLabel} className="space-y-3">
                {/* Section Header */}
                <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-1">
                  {groupLabel}
                </h4>

                {/* Cards */}
                <div className="space-y-3">
                  {items.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      rating={ratingsMap[`booking:${b.id}`] ?? null}
                      onRateClick={onRateClick}
                      onCancelClick={onCancelBooking}
                      onReuploadProof={onReuploadProof}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Queue Tab Content ── */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          {filteredQueueEntries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-2xs">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No live queue tickets
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                No walk-in queue tickets matched your selected filter criteria.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            Object.entries(groupedQueue).map(([groupLabel, items]) => (
              <div key={groupLabel} className="space-y-3">
                {/* Section Header */}
                <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-1">
                  {groupLabel}
                </h4>

                {/* Cards */}
                <div className="space-y-3">
                  {items.map((q) => (
                    <QueueCard
                      key={q.id}
                      entry={q}
                      rating={ratingsMap[`queue:${String(q.id)}`] ?? null}
                      onRateClick={onRateClick}
                      onLeaveQueue={onLeaveQueue}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Mobile Filters Bottom Sheet ── */}
      <MobileFilterSheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        availableTypes={availableTypes}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        resultsCount={activeResultsCount}
        onReset={handleResetFilters}
      />
    </div>
  );
}