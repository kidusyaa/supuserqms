"use client";

import React from "react";
import { X } from "lucide-react";

export type DateFilterType = "all" | "today" | "this_week" | "this_month" | "next_30_days" | "custom";
export type StatusFilterType = "any" | "upcoming" | "needs_payment" | "completed" | "cancelled";

interface Props {
  open: boolean;
  onClose: () => void;
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
  onReset: () => void;
}

export function MobileFilterSheet({
  open,
  onClose,
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
  onReset,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
            Filters
          </h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* 1. DATE */}
          <div>
            <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-2.5">
              DATE
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All time" },
                { id: "today", label: "Today" },
                { id: "this_week", label: "This week" },
                { id: "this_month", label: "This month" },
                { id: "next_30_days", label: "Next 30 days" },
              ].map((item) => {
                const isSelected = dateFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDateFilter(item.id as DateFilterType)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0B3B48] text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Inputs */}
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-medium text-slate-400 block mb-0.5">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setDateFilter("custom");
                  }}
                  className="w-full text-xs font-semibold bg-transparent border-0 p-0 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-medium text-slate-400 block mb-0.5">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setDateFilter("custom");
                  }}
                  className="w-full text-xs font-semibold bg-transparent border-0 p-0 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 2. SERVICE TYPE */}
          <div>
            <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-2.5">
              SERVICE TYPE
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === "all"
                    ? "bg-[#0B3B48] text-white shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400"
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
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize ${
                      isSelected
                        ? "bg-[#0B3B48] text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. STATUS */}
          <div>
            <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-2.5">
              STATUS
            </label>
            <div className="flex flex-wrap gap-2">
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
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0B3B48] text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#FBA819] hover:bg-amber-500 active:bg-amber-600 text-slate-950 py-3.5 rounded-full font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center"
          >
            Show {resultsCount} {resultsCount === 1 ? "result" : "results"}
          </button>
        </div>
      </div>
    </div>
  );
}
