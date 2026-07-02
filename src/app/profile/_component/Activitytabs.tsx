// profile/_components/ActivityTabs.tsx
"use client";
import { useState } from "react";
import { BookingCard } from "./Bookingcard";
import { QueueCard } from "./Queuecard";
import type { CompanyRating, RatingSourceType } from "../hook/Useratings";
import type { Booking, QueueItem } from "@/type";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Ticket } from "lucide-react";

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
  activeSection: string;
  setActiveSection: (s: string) => void;
}

function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
        <Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{title}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">{sub}</p>
    </motion.div>
  );
}

export function ActivityTabs({
  bookings,
  queueEntries,
  ratingsMap,
  onRateClick,
  activeSection,
  setActiveSection,
}: Props) {
  const tabs = [
    { id: "bookings", label: "Appointments", icon: Calendar, count: bookings.length },
    { id: "queue", label: "Live Queues", icon: Ticket, count: queueEntries.length },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Slide Tab Selector */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl relative border border-slate-200/40 dark:border-slate-800/40">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 relative flex items-center justify-center gap-2 py-3 text-sm font-semibold tracking-tight transition-all duration-300 cursor-pointer ${
                isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              {/* Sliding Pill Background */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-md shadow-slate-200/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-500" : "text-slate-400"}`} />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                      isActive
                        ? "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeSection === "bookings" ? (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {bookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No bookings recorded"
                  sub="You don't have any upcoming or past bookings at the moment."
                />
              ) : (
                bookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    rating={ratingsMap[`booking:${b.id}`] ?? null}
                    onRateClick={onRateClick}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {queueEntries.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No live queues found"
                  sub="You are not currently waiting in any queues across the GizeBook network."
                />
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}