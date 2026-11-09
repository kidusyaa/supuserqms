"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Calendar, Filter, X } from "lucide-react";
import type { DateFilterType, StatusFilterType } from "./MobileFilterSheet";

interface Props {
  dateFilter: DateFilterType;
  setDateFilter: (v: DateFilterType) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  availableTypes: string[];
  statusFilter: StatusFilterType;
  setStatusFilter: (v: StatusFilterType) => void;
  resultsCount: number;
  onOpenMobileSheet: () => void;
  onReset: () => void;
}

export function ActivityFilters({
  dateFilter,
  setDateFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  typeFilter,
  setTypeFilter,
  availableTypes,
  statusFilter,
  setStatusFilter,
  resultsCount,
  onOpenMobileSheet,
  onReset,
}: Props) {
  const [showDatePickerPopover, setShowDatePickerPopover] = useState(false);

  const isFiltered =
    dateFilter !== "all" ||
    typeFilter !== "all" ||
    statusFilter !== "any" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const activeFiltersCount =
    (dateFilter !== "all" ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (statusFilter !== "any" ? 1 : 0);

  // Month label for the summary
  const currentMonthYear = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* ── MOBILE: Horizontal Scrollable Filter Bar ── */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* Open Sheet Trigger Button */}
        <button
          type="button"
          onClick={onOpenMobileSheet}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
            activeFiltersCount > 0
              ? "bg-[#0B3B48] text-white shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#FBA819] text-slate-950 text-[10px] flex items-center justify-center font-black">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Quick Date Pills */}
        {[
          { id: "today", label: "Today" },
          { id: "this_week", label: "This week" },
          { id: "this_month", label: "This month" },
        ].map((item) => {
          const isSelected = dateFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setDateFilter(isSelected ? "all" : (item.id as DateFilterType))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#0B3B48] text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ── DESKTOP: Clean 3-Row Filter Card ── */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
        {/* ROW 1: DATE */}
        <div className="flex items-center gap-4">
          <span className="w-16 text-[11px] font-bold tracking-wider text-slate-400 uppercase shrink-0">
            DATE
          </span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {[
              { id: "all", label: "All time" },
              { id: "today", label: "Today" },
              { id: "this_week", label: "This week" },
              { id: "this_month", label: "This month" },
            ].map((item) => {
              const isSelected = dateFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDateFilter(item.id as DateFilterType)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0B3B48] text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:border-amber-400"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Pick Dates Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePickerPopover((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  dateFilter === "custom"
                    ? "bg-[#0B3B48] text-white shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:border-amber-400"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {dateFilter === "custom" && fromDate
                    ? `${fromDate} → ${toDate || "now"}`
                    : "Pick dates"}
                </span>
              </button>

              {/* Date Picker Popover */}
              {showDatePickerPopover && (
                <div className="absolute left-0 top-full mt-2 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-xl w-64 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Custom Range</span>
                    <button
                      type="button"
                      onClick={() => setShowDatePickerPopover(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setDateFilter("custom");
                      }}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setDateFilter("custom");
                      }}
                      className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: TYPE */}
        <div className="flex items-center gap-4">
          <span className="w-16 text-[11px] font-bold tracking-wider text-slate-400 uppercase shrink-0">
            TYPE
          </span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === "all"
                  ? "bg-[#0B3B48] text-white shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:border-amber-400"
              }`}
            >
              All types
            </button>
            {availableTypes.map((type) => {
              const isSelected = typeFilter.toLowerCase() === type.toLowerCase();
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(isSelected ? "all" : type)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize ${
                    isSelected
                      ? "bg-[#0B3B48] text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:border-amber-400"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 3: STATUS */}
        <div className="flex items-center gap-4">
          <span className="w-16 text-[11px] font-bold tracking-wider text-slate-400 uppercase shrink-0">
            STATUS
          </span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {[
              { id: "any", label: "Any" },
              { id: "upcoming", label: "Upcoming" },
              { id: "needs_payment", label: "Needs payment" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
            ].map((item) => {
              const isSelected = statusFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id as StatusFilterType)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0B3B48] text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:border-amber-400"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Results Summary Bar ── */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <p className="font-medium">
          <span className="font-bold text-[#0B3B48] dark:text-teal-300">{resultsCount}</span>{" "}
          {resultsCount === 1 ? "result" : "results"} · {currentMonthYear} · newest first
        </p>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
